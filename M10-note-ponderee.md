# M10

*« Pourquoi ta note pondérée est-elle STABLE et pas IMMUTABLE ? Que se passerait-il si tu te trompais ? » :*
Pourquoi STABLE, pas IMMUTABLE : la fonction elle renvoie toujours le même résultat pour les mêmes arguments, on pourrait confondre car elle lit la table notes (COUNT, AVG) donc pour un même film_id, le résultat peut changer dès qu'une nouvelle note est ajoutée.

Si on mettait IMMUTABLE par erreur, on dirait à PostgreSQL : « ce résultat ne changera jamais, tu peux le garder en mémoire et ne plus jamais le recalculer ». PostgreSQL nous croit sur parole. Ce qui impliquerait qu'a un nouvel appel sur le même film PostgreSQL nous renverrais un résultat périmé si de nouvelles notes ont été ajouté entre temps.

## M10.1 Une durée lisible

Écrivez une fonction SQL `duree_texte(minutes)` qui renvoie une durée du type « 2 h 28 », puis utilisez-la sur les 3 films les plus longs.

Réponse :

```sql
CREATE OR REPLACE FUNCTION duree_texte(p_minutes INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (p_minutes / 60) || ' h ' || LPAD((p_minutes % 60)::TEXT, 2, '0');
$$;
```

```sql
SELECT titre, duree_texte((details ->> 'duree')::INTEGER) AS duree
FROM films
ORDER BY (details ->> 'duree')::INTEGER DESC
LIMIT 3;
```
</details>

## M10.2 La note pondérée façon IMDb

Un film noté 5/5 par une seule personne ne doit pas dépasser un film noté 4,6 par vingt membres. Écrivez en PL/pgSQL `note_ponderee(film_id, m)` selon la formule du Top 250 d'IMDb : `(v / (v + m)) × R + (m / (v + m)) × C`, où `v` est le nombre de notes du film, `R` sa moyenne, `m` le seuil de votes (5 par défaut) et `C` la moyenne de toutes les notes. Levez une erreur si le film n'a aucune note. Comparez ensuite les 5 premiers selon la moyenne brute et selon la note pondérée.

Réponse :

```sql
CREATE OR REPLACE FUNCTION note_ponderee(p_film_id INTEGER, p_m INTEGER DEFAULT 5)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_nb INTEGER;
    v_moyenne NUMERIC;
    v_globale NUMERIC;
BEGIN
    SELECT COUNT(*), AVG(note) INTO v_nb, v_moyenne
    FROM notes WHERE film_id = p_film_id;

    IF v_nb = 0 THEN
        RAISE EXCEPTION 'Le film % n''a encore aucune note', p_film_id;
    END IF;

    SELECT AVG(note) INTO v_globale FROM notes;

    RETURN ROUND((v_nb::NUMERIC / (v_nb + p_m)) * v_moyenne + (p_m::NUMERIC / (v_nb + p_m)) * v_globale, 2);
END;
$$;
```

```sql
SELECT titre, nb_notes, moyenne,
       RANK() OVER (ORDER BY moyenne DESC) AS rang_brut,
       note_ponderee(id) AS note_ponderee,
       RANK() OVER (ORDER BY note_ponderee(id) DESC) AS rang_pondere
FROM v_fiche_film
ORDER BY rang_pondere
LIMIT 5;
```
</details>

## M10.3 La compatibilité entre deux membres

Écrivez une fonction SQL `compatibilite(pseudo_a, pseudo_b)` qui renvoie les films notés par les deux membres, avec les deux notes et leur écart. Utilisez-la ensuite pour calculer, en une requête, le nombre de films communs et l'écart moyen entre `cinephile_92` et `nolanfan`.

Réponse :

```sql
CREATE OR REPLACE FUNCTION compatibilite(p_a TEXT, p_b TEXT)
RETURNS TABLE (titre VARCHAR, note_a NUMERIC, note_b NUMERIC, ecart NUMERIC)
LANGUAGE sql
STABLE
AS $$
    SELECT f.titre, na.note, nb.note, ABS(na.note - nb.note)
    FROM notes na
    JOIN utilisateurs ua ON ua.id = na.utilisateur_id AND ua.pseudo = p_a
    JOIN notes nb ON nb.film_id = na.film_id
    JOIN utilisateurs ub ON ub.id = nb.utilisateur_id AND ub.pseudo = p_b
    JOIN films f ON f.id = na.film_id
    ORDER BY ABS(na.note - nb.note) DESC, f.titre;
$$;
```

```sql
SELECT * FROM compatibilite('cinephile_92', 'nolanfan') LIMIT 5;
```

```sql
SELECT COUNT(*) AS films_communs, ROUND(AVG(ecart), 2) AS ecart_moyen
FROM compatibilite('cinephile_92', 'nolanfan');
```
</details>
