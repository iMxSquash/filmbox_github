# M8

*« Pourquoi LATERAL dans « Le dernier match » ? Et que renvoient -> et ->> sur le même champ ? » :*
Pourquoi LATERAL : 
parce qu'on veut un résultat différent pour chaque équipe (son dernier match à elle), pas un seul résultat global. Sans LATERAL, PostgreSQL ne peut pas recalculer la sous-requête équipe par équipe.

-> vs ->> : -> garde du JSON (pour le retraiter), ->> donne du texte (pour l'afficher ou le comparer).

## M8.1 Les films de plus de 2h30

Affichez les films de plus de 2 h 30, avec leur durée en minutes, du plus long au plus court.

Réponse :

```sql
SELECT titre, (details ->> 'duree')::INTEGER AS duree_min
FROM films
WHERE (details ->> 'duree')::INTEGER > 150
ORDER BY duree_min DESC;
```

## M8.2 Les Oscars du meilleur film

Affichez les films qui ont reçu l'Oscar du meilleur film, avec leur réalisateur et leur année.

Réponse :

```sql
SELECT f.titre, f.annee, p.nom AS realisateur
FROM films f
JOIN casting c ON c.film_id = f.id AND c.role = 'realisateur'
JOIN personnes p ON p.id = c.personne_id
WHERE f.details @> '{"oscar_meilleur_film": true}'
ORDER BY f.annee;
```

## M8.3 Le top 5 des tags

Affichez les 5 tags les plus utilisés dans le catalogue, avec le nombre de films concernés.

Réponse :

```sql
SELECT t.tag, COUNT(*) AS nb_films
FROM films f
CROSS JOIN LATERAL jsonb_array_elements_text(f.details -> 'tags') AS t(tag)
GROUP BY t.tag
ORDER BY nb_films DESC, t.tag
LIMIT 5;
```

## M8.4 Les 2 derniers visionnages de chaque membre

Pour chaque membre, affichez ses 2 derniers visionnages (film et date).

Réponse :

```sql
SELECT u.pseudo, d.titre, d.date_visionnage
FROM utilisateurs u
CROSS JOIN LATERAL (
    SELECT f.titre, j.date_visionnage
    FROM journal j
    JOIN films f ON f.id = j.film_id
    WHERE j.utilisateur_id = u.id
    ORDER BY j.date_visionnage DESC, j.id DESC
    LIMIT 2
) d
ORDER BY u.pseudo, d.date_visionnage DESC;
```
