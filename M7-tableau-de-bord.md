# M7

*« FILTER ou WHERE : quelle différence dans ton M7.1 ? Et que veut dire un NULL dans un résultat de ROLLUP ? » :*

FILTER vs WHERE : WHERE filtrerait les lignes avant l'agrégation : 
un WHERE n.note >= 4.5 exclurait aussi les autres notes de nb_notes, on ne pourrais avoir qu'un seul compteur par requête. 

FILTER (WHERE ...) s'applique à l'intérieur de chaque COUNT, sur le groupe complet : 
nb_notes compte toutes les lignes du genre, pendant que coups_de_coeur et deceptions comptent chacun un sous-ensemble différent, dans la même requête, sans sous-requêtes ni CASE WHEN empilés.

Le NULL d'un ROLLUP marque une ligne de total : 
la colonne est vide parce qu'elle représente « toutes les valeurs regroupées » (ex. tous les genres confondus), pas une vraie absence de donnée. Pour la repérer sans se tromper, on utilise GROUPING(colonne), qui vaut 1 sur cette ligne de total et 0 partout ailleurs.

## M7.1 Coups de cœur et déceptions par genre

Pour chaque genre, affichez le nombre de notes, le nombre de « coups de cœur » (note ≥ 4,5) et de « déceptions » (note ≤ 2,5).

Réponse :

```sql
SELECT f.genre,
       COUNT(*) AS nb_notes,
       COUNT(*) FILTER (WHERE n.note >= 4.5) AS coups_de_coeur,
       COUNT(*) FILTER (WHERE n.note <= 2.5) AS deceptions
FROM notes n
JOIN films f ON f.id = n.film_id
GROUP BY f.genre
ORDER BY nb_notes DESC, f.genre;
```

## M7.2 La SF vue par chaque membre

Pour chaque membre, comparez sa note moyenne en science-fiction à sa note moyenne tous genres confondus.

Réponse :

```sql
SELECT u.pseudo,
       ROUND(AVG(n.note) FILTER (WHERE f.genre = 'Science-fiction'), 2) AS moyenne_sf,
       ROUND(AVG(n.note), 2) AS moyenne_globale
FROM notes n
JOIN films f ON f.id = n.film_id
JOIN utilisateurs u ON u.id = n.utilisateur_id
GROUP BY u.pseudo
ORDER BY moyenne_sf DESC NULLS LAST, u.pseudo;
```


## M7.3 Visionnages par genre et par trimestre

Affichez le nombre de visionnages par genre et par trimestre 2026, avec un sous-total par genre et le total général.

Réponse :

```sql
SELECT CASE WHEN GROUPING(genre) = 1 THEN 'TOTAL' ELSE genre END AS genre,
       CASE WHEN GROUPING(trimestre) = 1 THEN 'Année' ELSE trimestre END AS trimestre,
       COUNT(*) AS visionnages
FROM (
    SELECT f.genre, 'T' || EXTRACT(QUARTER FROM j.date_visionnage) AS trimestre
    FROM journal j
    JOIN films f ON f.id = j.film_id
) t
GROUP BY ROLLUP (genre, trimestre)
ORDER BY GROUPING(genre), genre, GROUPING(trimestre), trimestre;
```
