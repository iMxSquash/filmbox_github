# M4

## M4.1 Dans l'ordre, s'il vous plaît

Afficher les épisodes de la saga « Retour vers le futur » **dans l'ordre**, en suivant la colonne `film_precedent_id`.

Réponse :

```sql
WITH RECURSIVE episodes AS (
    SELECT f.id, f.titre, f.annee, 1 AS episode
    FROM films f
    JOIN sagas s ON s.id = f.saga_id
    WHERE s.nom = 'Retour vers le futur'
      AND f.film_precedent_id IS NULL
    UNION ALL
    SELECT f.id, f.titre, f.annee, e.episode + 1
    FROM films f
    JOIN episodes e ON f.film_precedent_id = e.id
)
SELECT episode, titre, annee FROM episodes ORDER BY episode;
```

## M4.2 Toutes les sagas

Pour **toutes les sagas à la fois**, afficher chaque épisode avec son numéro et le **parcours complet** depuis le premier film.

Réponse :

```sql
WITH RECURSIVE episodes AS (
    SELECT f.id, f.saga_id, 1 AS episode, f.titre::TEXT AS parcours
    FROM films f
    WHERE f.saga_id IS NOT NULL AND f.film_precedent_id IS NULL
    UNION ALL
    SELECT f.id, f.saga_id, e.episode + 1, e.parcours || ' -> ' || f.titre
    FROM films f
    JOIN episodes e ON f.film_precedent_id = e.id
)
SELECT s.nom AS saga, e.episode, e.parcours
FROM episodes e
JOIN sagas s ON s.id = e.saga_id
ORDER BY s.nom, e.episode;
```

## M4.3 Le nombre de Kevin Bacon

Calculer le « **nombre de Bacon** » de chaque acteur : 1 s'il a joué avec Kevin Bacon, 2 s'il a joué avec quelqu'un qui a joué avec lui, etc. **Limiter la recherche à 4 degrés** et afficher les acteurs les plus éloignés.

Réponse :

```sql
WITH RECURSIVE chaine AS (
    SELECT p.id AS personne_id, 0 AS degre, ARRAY[p.id] AS chemin
    FROM personnes p
    WHERE p.nom = 'Kevin Bacon'
    UNION ALL
    SELECT c2.personne_id, ch.degre + 1, ch.chemin || c2.personne_id
    FROM chaine ch
    JOIN casting c1 ON c1.personne_id = ch.personne_id AND c1.role = 'acteur'
    JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur' AND c2.personne_id <> ALL(ch.chemin)
    WHERE ch.degre < 4
)
SELECT p.nom, MIN(ch.degre) AS nombre_de_bacon
FROM chaine ch
JOIN personnes p ON p.id = ch.personne_id
GROUP BY p.nom
ORDER BY nombre_de_bacon DESC, p.nom
LIMIT 8;
```

## M4.4 D'Omar Sy à Kevin Bacon

Afficher le **chemin le plus court** entre Kevin Bacon et Omar Sy, avec les films qui les relient.

Réponse :

```sql
WITH RECURSIVE chaine AS (
    SELECT p.id AS personne_id, 0 AS degre, ARRAY[p.id] AS ids, p.nom::TEXT AS chemin
    FROM personnes p
    WHERE p.nom = 'Kevin Bacon'
    UNION ALL
    SELECT c2.personne_id, ch.degre + 1, ch.ids || c2.personne_id, ch.chemin || ' - ' || f.titre || ' - ' || p2.nom
    FROM chaine ch
    JOIN casting c1 ON c1.personne_id = ch.personne_id AND c1.role = 'acteur'
    JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur' AND c2.personne_id <> ALL(ch.ids)
    JOIN films f ON f.id = c1.film_id
    JOIN personnes p2 ON p2.id = c2.personne_id
    WHERE ch.degre < 3
)
SELECT degre, chemin
FROM chaine
WHERE personne_id = (SELECT id FROM personnes WHERE nom = 'Omar Sy')
ORDER BY degre, chemin
LIMIT 1;
```

## M4.5 Les inaccessibles

Quels acteurs ne sont reliés à Kevin Bacon **par aucun chemin, quelle que soit la distance** ? Astuce : sans limite de profondeur, il faut empêcher la requête de tourner en rond.

Réponse :

```sql
WITH RECURSIVE atteints AS (
    SELECT id AS personne_id FROM personnes WHERE nom = 'Kevin Bacon'
    UNION
    SELECT c2.personne_id
    FROM atteints a
    JOIN casting c1 ON c1.personne_id = a.personne_id AND c1.role = 'acteur'
    JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur'
)
SELECT DISTINCT p.nom
FROM casting c
JOIN personnes p ON p.id = c.personne_id
WHERE c.role = 'acteur'
  AND c.personne_id NOT IN (SELECT personne_id FROM atteints)
ORDER BY p.nom;
```
