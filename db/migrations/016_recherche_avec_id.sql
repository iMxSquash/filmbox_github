-- =====================================================================
--  016 — rechercher_films() renvoie aussi l'identifiant du film
--  Source : M16.3 (même requête : SQL statique, 5 premiers résultats, saisie jamais
--  collée dans le code). L'id est nécessaire pour ouvrir la fiche depuis un résultat :
--  le titre seul n'identifie pas un film.
-- =====================================================================

DROP FUNCTION rechercher_films(TEXT);

CREATE FUNCTION rechercher_films(p_texte TEXT)
RETURNS TABLE (id INTEGER, titre VARCHAR, annee INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT f.id, f.titre, f.annee
    FROM films f
    WHERE f.titre ILIKE '%' || p_texte || '%'
    ORDER BY f.annee, f.id
    LIMIT 5;
$$;
