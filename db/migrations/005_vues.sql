-- =====================================================================
--  005 — Vues et cache
--  Source : M9-vues-et-cache.md (M9.1, M9.2, M9.3)
-- =====================================================================

-- M9.1 — la fiche film complète (vue simple : toujours à jour)
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

-- M9.2 — le cache des statistiques (rafraîchissable sans blocage)
CREATE MATERIALIZED VIEW mv_stats_films AS
SELECT film_id, COUNT(*) AS nb_notes, ROUND(AVG(note), 2) AS moyenne
FROM notes
GROUP BY film_id;

CREATE UNIQUE INDEX ON mv_stats_films (film_id);

-- M9.3 — vue modifiable limitée à la science-fiction
CREATE OR REPLACE VIEW v_films_sf AS
SELECT id, titre, annee, genre
FROM films
WHERE genre = 'Science-fiction'
WITH CHECK OPTION;
