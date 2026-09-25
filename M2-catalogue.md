# M2

## M2.1 Les années 2000

Afficher les films sortis **entre 2000 et 2010 inclus**, du plus ancien au plus récent.

Réponse :

```sql
SELECT titre, annee, genre
FROM films
WHERE annee BETWEEN 2000 AND 2010
ORDER BY annee, titre;
```
</details>

## M2.2 La filmographie de Kevin Bacon

Afficher les films dans lesquels **Kevin Bacon a joué**, par ordre chronologique.

Réponse :

```sql
SELECT f.titre, f.annee
FROM casting c
JOIN personnes p ON p.id = c.personne_id
JOIN films f ON f.id = c.film_id
WHERE p.nom = 'Kevin Bacon' AND c.role = 'acteur'
ORDER BY f.annee;
```
</details>

## M2.3 Les réalisateurs prolifiques

Afficher les réalisateurs ayant **au moins 2 films** dans le catalogue, avec leur nombre de films.

Réponse :

```sql
SELECT p.nom AS realisateur, COUNT(*) AS nb_films
FROM casting c
JOIN personnes p ON p.id = c.personne_id
WHERE c.role = 'realisateur'
GROUP BY p.nom
HAVING COUNT(*) >= 2
ORDER BY nb_films DESC, p.nom;
```
</details>

## M2.4 Les mieux notés

Afficher les **5 films les mieux notés** parmi ceux qui ont reçu **au moins 5 notes**, avec leur moyenne arrondie à 2 décimales et le nombre de notes.

Réponse :

```sql
SELECT f.titre, ROUND(AVG(n.note), 2) AS moyenne, COUNT(*) AS nb_notes
FROM notes n
JOIN films f ON f.id = n.film_id
GROUP BY f.titre
HAVING COUNT(*) >= 5
ORDER BY moyenne DESC, f.titre
LIMIT 5;
```
</details>

## M2.5 Les membres les plus actifs

Pour chaque membre, afficher le nombre de visionnages et le **nombre de films différents** vus, du plus actif au moins actif.

réponse

```sql
SELECT u.pseudo, COUNT(*) AS nb_visionnages, COUNT(DISTINCT j.film_id) AS nb_films_distincts
FROM journal j
JOIN utilisateurs u ON u.id = j.utilisateur_id
GROUP BY u.pseudo
ORDER BY nb_visionnages DESC, u.pseudo;
```
</details>