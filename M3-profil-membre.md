# M3

## M3.1 La carte de profil

Pour `cinephile_92`, afficher **en une ligne** : le nombre de films notés, la note moyenne, son genre le plus noté et son coup de cœur (sa meilleure note, la plus ancienne en cas d'égalité). **Une CTE par information.**

Réponse :

```sql
WITH membre AS (
    SELECT id, pseudo FROM utilisateurs WHERE pseudo = 'cinephile_92'
),
stats AS (
    SELECT COUNT(*) AS nb_films_notes, ROUND(AVG(n.note), 2) AS note_moyenne
    FROM notes n JOIN membre m ON m.id = n.utilisateur_id
),
genre_prefere AS (
    SELECT f.genre
    FROM notes n
    JOIN membre m ON m.id = n.utilisateur_id
    JOIN films f  ON f.id = n.film_id
    GROUP BY f.genre
    ORDER BY COUNT(*) DESC, f.genre
    LIMIT 1
),
coup_de_coeur AS (
    SELECT f.titre
    FROM notes n
    JOIN membre m ON m.id = n.utilisateur_id
    JOIN films f  ON f.id = n.film_id
    ORDER BY n.note DESC, n.note_le
    LIMIT 1
)
SELECT m.pseudo, s.nb_films_notes, s.note_moyenne, g.genre AS genre_prefere, c.titre AS coup_de_coeur
FROM membre m, stats s, genre_prefere g, coup_de_coeur c;
```
</details>

## M3.2 À voir ensuite

Lister les films que `cinephile_92` **n'a pas encore vus**, du plus récent au plus ancien.

Réponse :

```sql
WITH deja_vus AS (
    SELECT j.film_id
    FROM journal j
    JOIN utilisateurs u ON u.id = j.utilisateur_id
    WHERE u.pseudo = 'cinephile_92'
)
SELECT f.titre, f.annee
FROM films f
LEFT JOIN deja_vus v ON v.film_id = f.id
WHERE v.film_id IS NULL
ORDER BY f.annee DESC;
```
</details>

## M3.3 Les films qui divisent

Trouver les **5 films les plus clivants** : ceux dont l'écart entre la meilleure et la pire note est le plus grand.

Réponse :

```sql
WITH ecarts AS (
    SELECT film_id, MIN(note) AS pire, MAX(note) AS meilleure,
           MAX(note) - MIN(note) AS ecart
    FROM notes
    GROUP BY film_id
)
SELECT f.titre, e.pire, e.meilleure, e.ecart
FROM ecarts e
JOIN films f ON f.id = e.film_id
ORDER BY e.ecart DESC, f.titre
LIMIT 5;
```
</details>
