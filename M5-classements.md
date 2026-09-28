# M5

## M5.1 Top 3 par genre

Pour chaque genre, afficher les **3 films les mieux notés** (au moins 3 notes).

Réponse :

```sql
WITH moyennes AS (
    SELECT f.genre, f.titre, ROUND(AVG(n.note), 2) AS moyenne
    FROM notes n
    JOIN films f ON f.id = n.film_id
    GROUP BY f.genre, f.titre
    HAVING COUNT(*) >= 3
),
classes AS (
    SELECT genre, titre, moyenne, ROW_NUMBER() OVER (PARTITION BY genre ORDER BY moyenne DESC, titre) AS rang
    FROM moyennes
)
SELECT genre, rang, titre, moyenne
FROM classes
WHERE rang <= 3
ORDER BY genre, rang;
```
</details>

## M5.2 Le classement des réalisateurs

Classer les réalisateurs selon la **note moyenne de l'ensemble de leurs films**, avec `DENSE_RANK`.

Réponse :

```sql
WITH moyennes AS (
    SELECT p.nom AS realisateur, ROUND(AVG(n.note), 2) AS moyenne, COUNT(*) AS nb_notes
    FROM casting c
    JOIN personnes p ON p.id = c.personne_id
    JOIN notes n     ON n.film_id = c.film_id
    WHERE c.role = 'realisateur'
    GROUP BY p.nom
)
SELECT DENSE_RANK() OVER (ORDER BY moyenne DESC) AS rang, realisateur, moyenne, nb_notes
FROM moyennes
ORDER BY rang, realisateur
LIMIT 10;
```
</details>

## M5.3 Le coup de cœur de chacun

Pour chaque membre, afficher son **film le mieux noté** (le plus ancien en cas d'égalité).

Réponse :

```sql
SELECT pseudo, titre, note, note_le
FROM (
    SELECT u.pseudo, f.titre, n.note, n.note_le, ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY n.note DESC, n.note_le) AS rn
    FROM notes n
    JOIN utilisateurs u ON u.id = n.utilisateur_id
    JOIN films f ON f.id = n.film_id
) t
WHERE rn = 1
ORDER BY pseudo;
```
</details>

## M5.4 Le meilleur épisode

Au sein de chaque saga, classer les épisodes selon leur note moyenne.

Réponse :

```sql
SELECT s.nom AS saga, f.titre, ROUND(AVG(n.note), 2) AS moyenne, RANK() OVER (PARTITION BY s.id ORDER BY AVG(n.note) DESC) AS rang_dans_saga
FROM films f
JOIN sagas s ON s.id = f.saga_id
JOIN notes n ON n.film_id = f.id
GROUP BY s.id, s.nom, f.titre
ORDER BY saga, rang_dans_saga;
```
</details>
