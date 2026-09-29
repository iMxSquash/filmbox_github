# M11

*« Page profil : combien de lignes lues pour en garder 50 ? Montre-moi la ligne du plan qui le dit. » :*
1 000 208 lignes lues pour n'en garder que 50.

La ligne du plan qui le dit :
->  Parallel Seq Scan on journal j  (cost=0.00..10616.42 rows=20 width=8) (actual time=2.983..19.378 rows=16.67 loops=3)
      Filter: (utilisateur_id = (InitPlan 1).col1)
      Rows Removed by Filter: 333386
      Buffers: shared hit=847 read=4560

chez moi PostgreSQL a paralléllisé le Seq Scan sur 2 workers, donc les chiffres sont divisés par 3 dans le plan, mais le total reste ~1M de lignes scannées pour n'en garder que 50.

## M11.1 La page profil

La page profil affiche les 20 derniers visionnages d'un membre. Mesurez la requête pour `membre_4242` et relevez le mode de lecture de `journal` et le nombre de lignes écartées.

Réponse :

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.date_visionnage, f.titre
FROM journal j
JOIN films f ON f.id = j.film_id
WHERE j.utilisateur_id = (SELECT id FROM utilisateurs WHERE pseudo = 'membre_4242')
ORDER BY j.date_visionnage DESC
LIMIT 20;
```

## M11.2 La page « Tendances »

La page « Tendances » affiche les 5 films les plus vus en août 2026. La requête actuelle filtre avec `TO_CHAR(date_visionnage, 'YYYY-MM') = '2026-08'`. Mesurez-la.

Réponse :

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.film_id, COUNT(*) AS vues
FROM journal j
WHERE TO_CHAR(j.date_visionnage, 'YYYY-MM') = '2026-08'
GROUP BY j.film_id
ORDER BY vues DESC
LIMIT 5;
```

## M11.3 L'estimation du planificateur

Combien de films de science-fiction le planificateur pense-t-il trouver, et combien y en a-t-il ? Consultez aussi la fréquence de ce genre dans `pg_stats`.

Réponse :

```sql
EXPLAIN ANALYZE
SELECT COUNT(*) FROM films WHERE genre = 'Science-fiction';
```

```sql
SELECT most_common_vals, most_common_freqs
FROM pg_stats
WHERE tablename = 'films' AND attname = 'genre';
```
