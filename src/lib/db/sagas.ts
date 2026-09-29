import 'server-only'
import { lire } from '@/lib/db/lire'

type Episode = {
  saga_id: number
  saga: string
  episode: number
  film_id: number
  titre: string
  annee: number
  parcours: string
  moyenne: number | null
  rang: number
}

// M4.1 / M4.2 — épisodes dans l'ordre (CTE récursive sur film_precedent_id) et parcours complet ;
// M5.4 — rang de chaque épisode dans sa saga. `sagaId` absent = toutes les sagas.
export function episodes(sagaId?: number) {
  return lire<Episode>(
    null,
    `WITH RECURSIVE ordre AS (
         SELECT f.id, f.saga_id, 1 AS episode, f.titre::TEXT AS parcours
         FROM films f
         WHERE f.saga_id IS NOT NULL AND f.film_precedent_id IS NULL
           AND ($1::int IS NULL OR f.saga_id = $1)
         UNION ALL
         SELECT f.id, f.saga_id, o.episode + 1, o.parcours || ' -> ' || f.titre
         FROM films f
         JOIN ordre o ON f.film_precedent_id = o.id
     ),
     moyennes AS (
         SELECT o.saga_id, o.episode, o.parcours, f.id AS film_id, f.titre, f.annee,
                ROUND(AVG(n.note), 2) AS moyenne
         FROM ordre o
         JOIN films f ON f.id = o.id
         LEFT JOIN notes n ON n.film_id = f.id
         GROUP BY o.saga_id, o.episode, o.parcours, f.id, f.titre, f.annee
     )
     SELECT s.id AS saga_id, s.nom AS saga, m.episode, m.film_id, m.titre, m.annee, m.parcours,
            m.moyenne::float8 AS moyenne,
            RANK() OVER (PARTITION BY s.id ORDER BY m.moyenne DESC NULLS LAST)::int AS rang
     FROM moyennes m
     JOIN sagas s ON s.id = m.saga_id
     ORDER BY s.nom, m.episode`,
    [sagaId ?? null],
  )
}
