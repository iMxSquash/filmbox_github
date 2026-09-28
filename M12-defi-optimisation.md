# M12

Pour chaque requête lente : `EXPLAIN (ANALYZE, BUFFERS)` avant, structure de la table (`\d`), soumission du plan à une IA, création de l'index proposé, remesure. Je ne garde que les propositions dont le gain est effectivement mesuré.

## M12.1 Accélérer la page profil

Avant, `journal` n'a que sa clé primaire : la recherche par `utilisateur_id` force un Seq Scan (parallélisé chez moi) sur les 2 millions de lignes du journal, suivi d'un tri, pour n'en garder que 20.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.date_visionnage, f.titre
FROM journal j
JOIN films f ON f.id = j.film_id
WHERE j.utilisateur_id = (SELECT id FROM utilisateurs WHERE pseudo = 'membre_4242')
ORDER BY j.date_visionnage DESC
LIMIT 20;
```

```
Limit  (cost=11625.47..11788.98 rows=20 width=28) (actual time=27.581..30.447 rows=20 loops=1)
  Buffers: shared hit=607 read=4879
  ->  Nested Loop
        ->  Gather Merge
              ->  Sort
                    Sort Key: j.date_visionnage DESC
                    ->  Parallel Seq Scan on journal j
                          Filter: (utilisateur_id = (InitPlan 1).col1)
                          Rows Removed by Filter: 333386
        ->  Index Scan using films_pkey on films f
Execution Time: 30.522 ms
```

**Consultation IA** : j'ai transmis cette requête, ce plan et le `\d journal` à une IA. Elle a identifié que la clause `WHERE utilisateur_id = ...` (égalité) suivie du `ORDER BY date_visionnage DESC` (tri) est le cas d'école d'un index composite : l'égalité en tête, puis la colonne de tri dans le même ordre que la requête (`DESC`), pour que PostgreSQL lise l'index déjà trié sans Sort séparé. Elle a ajouté `INCLUDE (film_id)` pour que la jointure avec `films` puisse se faire sans retourner lire la table `journal` (Index Only Scan).

```sql
CREATE INDEX idx_journal_profil ON journal (utilisateur_id, date_visionnage DESC) INCLUDE (film_id);
```

Remesure :

```
Limit  (cost=9.02..172.19 rows=20 width=28) (actual time=0.083..0.203 rows=20 loops=1)
  Buffers: shared hit=64 read=3
  ->  Nested Loop
        ->  Index Only Scan using idx_journal_profil on journal j
              Index Cond: (utilisateur_id = (InitPlan 1).col1)
              Heap Fetches: 0
        ->  Index Scan using films_pkey on films f
Execution Time: 0.232 ms
```

**Verdict** : gain mesuré et conforme à la proposition de l'IA : plus de Seq Scan ni de Sort, `Index Only Scan` qui s'arrête à 20 lignes. **30,5 ms → 0,23 ms** (~130x). Index conservé.

## M12.2 Accélérer les tendances

Avant, le filtre `TO_CHAR(date_visionnage, 'YYYY-MM') = '2026-08'` applique une fonction sur chaque ligne : aucun index classique ne peut servir cette condition, PostgreSQL doit tout scanner.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.film_id, COUNT(*) AS vues
FROM journal j
WHERE TO_CHAR(j.date_visionnage, 'YYYY-MM') = '2026-08'
GROUP BY j.film_id
ORDER BY vues DESC
LIMIT 5;
```

```
Limit  (cost=14355.41..14355.42 rows=5 width=12) (actual time=102.629..102.645 rows=5 loops=1)
  ->  Sort
        ->  HashAggregate
              ->  Gather
                    ->  Parallel Seq Scan on journal j
                          Filter: (to_char(date_visionnage, 'YYYY-MM') = '2026-08')
                          Rows Removed by Filter: 318579
Execution Time: 102.761 ms
```

**Consultation IA** : je lui ai demandé pourquoi `TO_CHAR` empêche l'usage d'un index. Réponse : une fonction appliquée à la colonne rend la condition non-sargable pour un index simple (il faudrait un index sur `TO_CHAR(date_visionnage, ...)`, plus fragile et moins réutilisable). Sa proposition : réécrire la condition en plage de dates équivalente (`>= '2026-08-01' AND < '2026-09-01'`), sémantiquement identique mais compatible avec un B-tree classique, puis indexer `date_visionnage` avec `INCLUDE (film_id)` pour éviter de retourner à la table.

```sql
CREATE INDEX idx_journal_date ON journal (date_visionnage) INCLUDE (film_id);
```

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.film_id, COUNT(*) AS vues
FROM journal j
WHERE j.date_visionnage >= '2026-08-01' AND j.date_visionnage < '2026-09-01'
GROUP BY j.film_id
ORDER BY vues DESC
LIMIT 5;
```

```
Limit  (cost=2575.96..2575.98 rows=5 width=12) (actual time=7.817..7.818 rows=5 loops=1)
  ->  Sort
        ->  HashAggregate
              ->  Index Only Scan using idx_journal_date on journal j
                    Index Cond: ((date_visionnage >= '2026-08-01') AND (date_visionnage < '2026-09-01'))
                    Heap Fetches: 0
Execution Time: 7.969 ms
```

Vérification que la réécriture ne change pas le résultat :

```sql
SELECT (SELECT COUNT(*) FROM journal WHERE TO_CHAR(date_visionnage, 'YYYY-MM') = '2026-08') AS version_origine,
       (SELECT COUNT(*) FROM journal WHERE date_visionnage >= '2026-08-01' AND date_visionnage < '2026-09-01') AS version_optimisee;
```

| version_origine | version_optimisee |
|---|---|
| 44470 | 44470 |

**Verdict** : gain mesuré, comptages identiques. **102,8 ms → 8,0 ms** (~13x). Index et réécriture conservés.

## M12.3 Accélérer la recherche de titre

Avant, `WHERE titre ILIKE '%labyrinthe%'` fait un Seq Scan sur les 100 030 films.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM films WHERE titre ILIKE '%labyrinthe%';
```

```
Aggregate  (cost=2920.11..2920.12 rows=1 width=8) (actual time=39.830..39.831 rows=1 loops=1)
  ->  Seq Scan on films
        Filter: ((titre)::text ~~* '%labyrinthe%'::text)
        Rows Removed by Filter: 95030
Execution Time: 39.901 ms
```

**Consultation IA** : j'ai demandé un premier avis avant de préciser le motif de recherche (`%...%`), sans lui donner le détail du `\d films`. Deux pistes sont revenues.

**Idée jetée  B-tree simple sur `titre`** : proposition la plus immédiate (« indexer la colonne filtrée »). Testée quand même, pour vérifier plutôt que supposer :

```sql
CREATE INDEX idx_films_titre_btree ON films (titre);
```

```
Aggregate  (cost=2920.11..2920.12 rows=1 width=8) (actual time=18.213..18.214 rows=1.00 loops=1)
  ->  Seq Scan on films  (cost=0.00..2897.38 rows=9094 width=0) (actual time=0.028..18.113 rows=5000 loops=1)
        Filter: ((titre)::text ~~* '%labyrinthe%'::text)
        Rows Removed by Filter: 95030
        Buffers: shared hit=1647
Execution Time: 18.239 ms
```

**La mesure qui a tranché** : Seq Scan strictement inchangé, l'index n'apparaît même pas dans le plan : un B-tree trie par préfixe, et `%labyrinthe%` n'a pas de préfixe fixe (le `%` de tête empêche toute recherche par plage). PostgreSQL ne peut pas s'en servir, donc il l'ignore et continue de tout scanner. Idée rejetée et index supprimé (`DROP INDEX idx_films_titre_btree`) : le garder n'aurait fait qu'ajouter du poids à l'écriture sans aucun bénéfice en lecture.

**Idée gardée : index trigramme (`pg_trgm`, GIN)** : découpe le titre en séquences de 3 caractères, ce qui permet de retrouver un motif même au milieu d'une chaîne, insensible à la casse (`ILIKE`).

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_films_titre_trgm ON films USING GIN (titre gin_trgm_ops);
```

```
Aggregate  (cost=1917.11..1917.12 rows=1 width=8) (actual time=2.099..2.100 rows=1 loops=1)
  ->  Bitmap Heap Scan on films
        Recheck Cond: ((titre)::text ~~* '%labyrinthe%'::text)
        Heap Blocks: exact=581
        ->  Bitmap Index Scan on idx_films_titre_trgm
              Index Cond: ((titre)::text ~~* '%labyrinthe%'::text)
Execution Time: 2.138 ms
```

**Verdict** : gain mesuré et conforme : Seq Scan remplacé par Bitmap Index Scan sur l'index trigramme. **39,9 ms → 2,1 ms** (~19x). Index conservé.

**En résumé** : même origine (l'IA), deux idées, un seul juge : le chronomètre et le plan. Le B-tree « paraissait » raisonnable (indexer la colonne filtrée est le réflexe standard) mais la mesure a montré 0 % de gain ; il a été jeté sans hésitation. Le trigramme a été gardé parce que le plan a changé de forme (Seq Scan → Bitmap Index Scan) et le temps a été divisé par ~19.

## M12.4 Le rapport d'optimisation

```sql
SELECT relname AS table_cible, indexrelname AS index,
       pg_size_pretty(pg_relation_size(indexrelid)) AS taille_index,
       pg_size_pretty(pg_relation_size(relid))      AS taille_table
FROM pg_stat_user_indexes
WHERE relname IN ('journal', 'films')
ORDER BY relname, indexrelname;
```

| table_cible | index | taille_index | taille_table |
|---|---|---|---|
| films | films_pkey | 2208 kB | 13 MB |
| films | idx_films_titre_trgm | 4192 kB | 13 MB |
| journal | idx_journal_date | 21 MB | 42 MB |
| journal | idx_journal_profil | 30 MB | 42 MB |
| journal | journal_pkey | 21 MB | 42 MB |

**Synthèse pour l'équipe**

| Requête | Proposition de l'IA | Gain mesuré | Coût |
|---|---|---|---|
| M12.1 Page profil | Index composite `(utilisateur_id, date_visionnage DESC) INCLUDE (film_id)` | 30,5 ms → 0,23 ms (~130x) | 30 MB |
| M12.2 Tendances | Réécrire `TO_CHAR(...)` en plage de dates + index `(date_visionnage) INCLUDE (film_id)` | 102,8 ms → 8,0 ms (~13x) | 21 MB |
| M12.3 Recherche de titre | Index trigramme GIN `pg_trgm` | 39,9 ms → 2,1 ms (~19x) | 4,2 MB |

Chaque proposition a été vérifiée par mesure avant/après plutôt qu'acceptée sur la théorie, et pour M12.2 le résultat a en plus été vérifié identique à la version d'origine avant de considérer la réécriture comme valide.

- **Idée gardée** : l'index trigramme GIN pour M12.3 (Seq Scan → Bitmap Index Scan, 39,9 ms → 2,1 ms).
- **Idée jetée** : le B-tree simple sur `titre`, proposé pour la même requête M12.3. Mesure qui a tranché : le plan restait un Seq Scan identique (18,2 ms, aucun gain, index totalement ignoré par le planificateur) : un B-tree ne peut pas servir un motif `%...%` sans préfixe fixe. Index supprimé après mesure.

Le principe suivi pour les trois missions : sans gain mesuré (ou en cas de résultat différent, cf. M12.2), l'index ou la réécriture n'aurait pas été conservé. Le coût en espace disque (surtout `idx_journal_profil`, 30 MB, plus gros que certains index existants) est le compromis à surveiller si `journal` continue de grossir.
