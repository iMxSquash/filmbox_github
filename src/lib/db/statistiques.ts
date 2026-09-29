import 'server-only'
import { lire } from '@/lib/db/lire'

// M7.1 — nombre de notes, coups de cœur (≥ 4,5) et déceptions (≤ 2,5) par genre
export function parGenre() {
  return lire<{ genre: string; nb_notes: number; coups_de_coeur: number; deceptions: number }>(
    null,
    `SELECT f.genre,
            COUNT(*)::int AS nb_notes,
            (COUNT(*) FILTER (WHERE n.note >= 4.5))::int AS coups_de_coeur,
            (COUNT(*) FILTER (WHERE n.note <= 2.5))::int AS deceptions
     FROM notes n JOIN films f ON f.id = n.film_id
     GROUP BY f.genre
     ORDER BY nb_notes DESC, f.genre`,
  )
}

// M7.2 — note moyenne en science-fiction comparée à la moyenne tous genres, par membre
export function scienceFictionParMembre() {
  return lire<{ pseudo: string; moyenne_sf: number | null; moyenne_globale: number }>(
    null,
    `SELECT u.pseudo,
            ROUND(AVG(n.note) FILTER (WHERE f.genre = 'Science-fiction'), 2)::float8 AS moyenne_sf,
            ROUND(AVG(n.note), 2)::float8 AS moyenne_globale
     FROM notes n
     JOIN films f ON f.id = n.film_id
     JOIN utilisateurs u ON u.id = n.utilisateur_id
     GROUP BY u.pseudo
     ORDER BY moyenne_sf DESC NULLS LAST, u.pseudo
     LIMIT 20`,
  )
}

// M7.3 — visionnages 2026 par genre et par trimestre, sous-totaux et total (ROLLUP).
// Le filtre en plage de dates réalise « 2026 » de l'énoncé.
export function parGenreEtTrimestre(membreId: number | null) {
  return lire<{ genre: string; trimestre: string; visionnages: number }>(
    membreId,
    `SELECT CASE WHEN GROUPING(genre) = 1 THEN 'TOTAL' ELSE genre END AS genre,
            CASE WHEN GROUPING(trimestre) = 1 THEN 'Année' ELSE trimestre END AS trimestre,
            COUNT(*)::int AS visionnages
     FROM (
         SELECT f.genre, 'T' || EXTRACT(QUARTER FROM j.date_visionnage) AS trimestre
         FROM journal j
         JOIN films f ON f.id = j.film_id
         WHERE j.date_visionnage >= DATE '2026-01-01' AND j.date_visionnage < DATE '2027-01-01'
     ) t
     GROUP BY ROLLUP (genre, trimestre)
     ORDER BY GROUPING(genre), genre, GROUPING(trimestre), trimestre`,
  )
}
