import 'server-only'
import { lire } from '@/lib/db/lire'

// M10.2 — 5 premiers selon la moyenne brute et selon la note pondérée (films sans note exclus :
// note_ponderee() lève une exception s'ils n'en ont aucune)
export function brutContrePondere() {
  return lire<{
    id: number
    titre: string
    nb_notes: number
    moyenne: number
    rang_brut: number
    note_ponderee: number
    rang_pondere: number
  }>(
    null,
    `SELECT id, titre, nb_notes::int AS nb_notes, moyenne::float8 AS moyenne,
            RANK() OVER (ORDER BY moyenne DESC)::int AS rang_brut,
            np::float8 AS note_ponderee,
            RANK() OVER (ORDER BY np DESC)::int AS rang_pondere
     FROM (SELECT v.*, note_ponderee(v.id) AS np FROM v_fiche_film v WHERE v.nb_notes > 0) t
     ORDER BY rang_pondere, titre
     LIMIT 5`,
  )
}

// M5.1 — top 3 par genre (au moins 3 notes)
export function topParGenre() {
  return lire<{ genre: string; rang: number; id: number; titre: string; moyenne: number }>(
    null,
    `WITH moyennes AS (
         SELECT f.genre, f.id, f.titre, ROUND(AVG(n.note), 2) AS moyenne
         FROM notes n JOIN films f ON f.id = n.film_id
         GROUP BY f.genre, f.id, f.titre
         HAVING COUNT(*) >= 3
     ),
     classes AS (
         SELECT genre, id, titre, moyenne,
                ROW_NUMBER() OVER (PARTITION BY genre ORDER BY moyenne DESC, titre) AS rang
         FROM moyennes
     )
     SELECT genre, rang::int AS rang, id, titre, moyenne::float8 AS moyenne
     FROM classes
     WHERE rang <= 3
     ORDER BY genre, rang`,
  )
}

// M5.2 — classement des réalisateurs (DENSE_RANK sur la moyenne de l'ensemble de leurs films)
export function realisateursClasses() {
  return lire<{ rang: number; id: number; realisateur: string; moyenne: number; nb_notes: number }>(
    null,
    `WITH moyennes AS (
         SELECT p.id, p.nom AS realisateur, ROUND(AVG(n.note), 2) AS moyenne, COUNT(*) AS nb_notes
         FROM casting c
         JOIN personnes p ON p.id = c.personne_id
         JOIN notes n ON n.film_id = c.film_id
         WHERE c.role = 'realisateur'
         GROUP BY p.id, p.nom
     )
     SELECT DENSE_RANK() OVER (ORDER BY moyenne DESC)::int AS rang, id, realisateur,
            moyenne::float8 AS moyenne, nb_notes::int AS nb_notes
     FROM moyennes
     ORDER BY rang, realisateur
     LIMIT 10`,
  )
}

// M2.3 — réalisateurs ayant au moins 2 films au catalogue
export function prolifiques() {
  return lire<{ id: number; realisateur: string; nb_films: number }>(
    null,
    `SELECT p.id, p.nom AS realisateur, COUNT(*)::int AS nb_films
     FROM casting c JOIN personnes p ON p.id = c.personne_id
     WHERE c.role = 'realisateur'
     GROUP BY p.id, p.nom
     HAVING COUNT(*) >= 2
     ORDER BY nb_films DESC, p.nom`,
  )
}

// M3.3 — les 5 films les plus clivants (écart entre meilleure et pire note)
export function clivants() {
  return lire<{ id: number; titre: string; pire: number; meilleure: number; ecart: number }>(
    null,
    `WITH ecarts AS (
         SELECT film_id, MIN(note) AS pire, MAX(note) AS meilleure, MAX(note) - MIN(note) AS ecart
         FROM notes
         GROUP BY film_id
     )
     SELECT f.id, f.titre, e.pire::float8 AS pire, e.meilleure::float8 AS meilleure, e.ecart::float8 AS ecart
     FROM ecarts e JOIN films f ON f.id = e.film_id
     ORDER BY e.ecart DESC, f.titre
     LIMIT 5`,
  )
}

// M8.1 — films de plus de 2 h 30
export function longsMetrages() {
  return lire<{ id: number; titre: string; duree_min: number; duree: string }>(
    null,
    `SELECT id, titre, (details ->> 'duree')::INTEGER AS duree_min,
            duree_texte((details ->> 'duree')::INTEGER) AS duree
     FROM films
     WHERE (details ->> 'duree')::INTEGER > 150
     ORDER BY duree_min DESC, titre
     LIMIT 20`,
  )
}

// M8.2 — Oscars du meilleur film, avec réalisateur et année
export function oscars() {
  return lire<{ id: number; titre: string; annee: number; realisateur: string }>(
    null,
    `SELECT f.id, f.titre, f.annee, p.nom AS realisateur
     FROM films f
     JOIN casting c ON c.film_id = f.id AND c.role = 'realisateur'
     JOIN personnes p ON p.id = c.personne_id
     WHERE f.details @> '{"oscar_meilleur_film": true}'
     ORDER BY f.annee, f.titre`,
  )
}

// M8.3 — les 5 tags les plus utilisés
export function topTags() {
  return lire<{ tag: string; nb_films: number }>(
    null,
    `SELECT t.tag, COUNT(*)::int AS nb_films
     FROM films f
     CROSS JOIN LATERAL jsonb_array_elements_text(f.details -> 'tags') AS t(tag)
     GROUP BY t.tag
     ORDER BY nb_films DESC, t.tag
     LIMIT 5`,
  )
}
