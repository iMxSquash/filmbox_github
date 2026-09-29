# M6

## M6.1 Visionnages cumulés

Pour `cinephile_92`, afficher le **nombre de visionnages par mois** et leur **cumul** depuis janvier.

Réponse : 

```sql
WITH par_mois AS (
    SELECT DATE_TRUNC('month', j.date_visionnage)::DATE AS mois, COUNT(*) AS nb
    FROM journal j
    JOIN utilisateurs u ON u.id = j.utilisateur_id
    WHERE u.pseudo = 'cinephile_92'
    GROUP BY 1
)
SELECT TO_CHAR(mois, 'YYYY-MM') AS mois, nb, SUM(nb) OVER (ORDER BY mois) AS cumul
FROM par_mois
ORDER BY mois;
```

## M6.2 La note d'*Inception* au fil du temps

Afficher chaque note reçue par *Inception* dans l'ordre chronologique, avec la **moyenne cumulée** après chaque nouvelle note.

Réponse :

```sql
SELECT n.note_le, u.pseudo, n.note,
       ROUND(AVG(n.note) OVER (
           ORDER BY n.note_le
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ), 2) AS moyenne_cumulee
FROM notes n
JOIN films f ON f.id = n.film_id
JOIN utilisateurs u ON u.id = n.utilisateur_id
WHERE f.titre = 'Inception'
ORDER BY n.note_le;
```

## M6.3 Plus sévère que la moyenne ?

Pour chaque note de `nolanfan`, afficher la **moyenne du film** (tous membres confondus) et l'**écart** entre sa note et cette moyenne.

Réponse :

```sql
SELECT pseudo, titre, note, moyenne_film, note - moyenne_film AS ecart
FROM (
    SELECT u.pseudo, f.titre, n.note, ROUND(AVG(n.note) OVER (PARTITION BY n.film_id), 2) AS moyenne_film
    FROM notes n
    JOIN films f ON f.id = n.film_id
    JOIN utilisateurs u ON u.id = n.utilisateur_id
) t
WHERE pseudo = 'nolanfan'
ORDER BY ecart DESC, titre;
```

## M6.4 Le rythme de visionnage

Pour `cinephile_92`, afficher chaque visionnage et le **nombre de jours écoulés depuis le précédent**.

Réponse :

```sql
SELECT j.date_visionnage, f.titre,
       j.date_visionnage - LAG(j.date_visionnage) OVER (ORDER BY j.date_visionnage, j.id) AS jours_depuis_precedent
FROM journal j
JOIN utilisateurs u ON u.id = j.utilisateur_id
JOIN films f ON f.id = j.film_id
WHERE u.pseudo = 'cinephile_92'
ORDER BY j.date_visionnage, j.id;
```
