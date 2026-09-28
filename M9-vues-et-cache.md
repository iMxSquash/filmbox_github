# M9

*« Vue ou vue matérialisée : laquelle pour M9.1, laquelle pour M9.2, et pourquoi ? Qu’exige REFRESH … CONCURRENTLY ? » :*
Vue simple pour M9.1 : 
v_fiche_film lit toujours des données à jour (notes, casting…) et n'a rien de coûteux à recalculer à chaque appel donc une vue classique suffit, pas besoin de stocker un résultat figé.

Vue matérialisée pour M9.2 : 
mv_stats_films sert de cache, on a un résultat calculé une fois puis stocké, pour éviter de refaire l'agrégat à chaque lecture par contre les chiffres restent figés tant qu'on ne rafraîchit pas.

REFRESH ... CONCURRENTLY exige un index UNIQUE sur la vue matérialisée, sans ça PostgreSQL refuse. Cet index sert de repère pour recalculer ligne par ligne sans bloquer les lectures en cours (contrairement à un REFRESH classique, qui verrouille la vue pendant le calcul).

## M9.1 La fiche film complète

Créez la vue `v_fiche_film` : titre, année, genre, réalisateur(s), durée, nombre de notes et moyenne. Affichez ensuite les fiches des films de science-fiction.

Réponse :

```sql
CREATE OR REPLACE VIEW v_fiche_film AS
SELECT f.id, f.titre, f.annee, f.genre,
       r.realisateurs,
       (f.details ->> 'duree')::INTEGER AS duree_min,
       s.nb_notes, s.moyenne
FROM films f
LEFT JOIN LATERAL (
    SELECT STRING_AGG(p.nom, ', ' ORDER BY p.nom) AS realisateurs
    FROM casting c JOIN personnes p ON p.id = c.personne_id
    WHERE c.film_id = f.id AND c.role = 'realisateur'
) r ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) AS nb_notes, ROUND(AVG(n.note), 2) AS moyenne
    FROM notes n WHERE n.film_id = f.id
) s ON true;
```

```sql
SELECT titre, annee, realisateurs, duree_min, nb_notes, moyenne
FROM v_fiche_film
WHERE genre = 'Science-fiction'
ORDER BY moyenne DESC;
```
</details>

## M9.2 Le cache des statistiques

Créez la vue matérialisée `mv_stats_films` (film, nombre de notes, moyenne) rafraîchissable sans blocage. Puis `sofa_critic` donne 2/5 à Inception : montrez que la vue n'a pas changé, rafraîchissez-la, et vérifiez.

Réponse :

```sql
CREATE MATERIALIZED VIEW mv_stats_films AS
SELECT film_id, COUNT(*) AS nb_notes, ROUND(AVG(note), 2) AS moyenne
FROM notes
GROUP BY film_id;

CREATE UNIQUE INDEX ON mv_stats_films (film_id);
```

```sql
INSERT INTO notes (utilisateur_id, film_id, note, note_le)
SELECT u.id, f.id, 2.0, '2026-09-21'
FROM utilisateurs u, films f
WHERE u.pseudo = 'sofa_critic' AND f.titre = 'Inception';
```

```sql
SELECT f.titre, s.nb_notes, s.moyenne
FROM mv_stats_films s JOIN films f ON f.id = s.film_id
WHERE f.titre = 'Inception';
```

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_films;
```

```sql
SELECT f.titre, s.nb_notes, s.moyenne
FROM mv_stats_films s JOIN films f ON f.id = s.film_id
WHERE f.titre = 'Inception';
```
</details>

## M9.3 Une vue modifiable limitée à la science-fiction

Créez une vue modifiable `v_films_sf` limitée aux films de science-fiction, qui refuse toute modification les faisant sortir de ce genre. Testez en tentant de reclasser Inception en « Action » à travers la vue.

Réponse :

```sql
CREATE OR REPLACE VIEW v_films_sf AS
SELECT id, titre, annee, genre
FROM films
WHERE genre = 'Science-fiction'
WITH CHECK OPTION;
```

```sql
UPDATE v_films_sf
SET genre = 'Action'
WHERE titre = 'Inception';
```
</details>
