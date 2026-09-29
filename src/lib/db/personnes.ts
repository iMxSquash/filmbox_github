import 'server-only'
import { lire } from '@/lib/db/lire'

export async function personne(id: number) {
  const rows = await lire<{ id: number; nom: string }>(null, 'SELECT id, nom FROM personnes WHERE id = $1', [id])
  return rows[0] ?? null
}

// M2.2 — filmographie, par ordre chronologique, avec le rôle
export function filmographie(personneId: number) {
  return lire<{ id: number; titre: string; annee: number; role: 'acteur' | 'realisateur' }>(
    null,
    `SELECT f.id, f.titre, f.annee, c.role
     FROM casting c JOIN films f ON f.id = c.film_id
     WHERE c.personne_id = $1
     ORDER BY f.annee, f.titre`,
    [personneId],
  )
}

// Chaîne de collaborations depuis Kevin Bacon, limitée à 4 degrés (M4.3)
const CHAINE = `WITH RECURSIVE chaine AS (
        SELECT p.id AS personne_id, 0 AS degre, ARRAY[p.id] AS chemin
        FROM personnes p
        WHERE p.nom = 'Kevin Bacon'
        UNION ALL
        SELECT c2.personne_id, ch.degre + 1, ch.chemin || c2.personne_id
        FROM chaine ch
        JOIN casting c1 ON c1.personne_id = ch.personne_id AND c1.role = 'acteur'
        JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur' AND c2.personne_id <> ALL(ch.chemin)
        WHERE ch.degre < 4
    )`

// M4.3 — nombre de Bacon d'une personne (null = hors de portée dans les 4 degrés)
export async function nombreDeBacon(personneId: number): Promise<number | null> {
  const rows = await lire<{ degre: number | null }>(
    null,
    `${CHAINE}
     SELECT MIN(degre)::int AS degre FROM chaine WHERE personne_id = $1`,
    [personneId],
  )
  return rows[0]?.degre ?? null
}

// M4.3 — les acteurs les plus éloignés
export function plusEloignes() {
  return lire<{ id: number; nom: string; nombre_de_bacon: number }>(
    null,
    `${CHAINE}
     SELECT p.id, p.nom, MIN(ch.degre)::int AS nombre_de_bacon
     FROM chaine ch JOIN personnes p ON p.id = ch.personne_id
     GROUP BY p.id, p.nom
     ORDER BY nombre_de_bacon DESC, p.nom
     LIMIT 8`,
  )
}

export function acteurs() {
  return lire<{ id: number; nom: string }>(
    null,
    `SELECT DISTINCT p.id, p.nom
     FROM casting c JOIN personnes p ON p.id = c.personne_id
     WHERE c.role = 'acteur'
     ORDER BY p.nom`,
  )
}

// M4.4 — chemin le plus court entre Kevin Bacon et un acteur, avec les films qui les relient
export async function chemin(versId: number) {
  const rows = await lire<{ degre: number; chemin: string }>(
    null,
    `WITH RECURSIVE chaine AS (
         SELECT p.id AS personne_id, 0 AS degre, ARRAY[p.id] AS ids, p.nom::TEXT AS chemin
         FROM personnes p
         WHERE p.nom = 'Kevin Bacon'
         UNION ALL
         SELECT c2.personne_id, ch.degre + 1, ch.ids || c2.personne_id,
                ch.chemin || ' - ' || f.titre || ' - ' || p2.nom
         FROM chaine ch
         JOIN casting c1 ON c1.personne_id = ch.personne_id AND c1.role = 'acteur'
         JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur' AND c2.personne_id <> ALL(ch.ids)
         JOIN films f ON f.id = c1.film_id
         JOIN personnes p2 ON p2.id = c2.personne_id
         WHERE ch.degre < 3
     )
     SELECT degre, chemin FROM chaine
     WHERE personne_id = $1
     ORDER BY degre, chemin
     LIMIT 1`,
    [versId],
  )
  return rows[0] ?? null
}

// M4.5 — acteurs reliés à Kevin Bacon par aucun chemin (UNION empêche de tourner en rond)
export function inaccessibles() {
  return lire<{ id: number; nom: string }>(
    null,
    `WITH RECURSIVE atteints AS (
         SELECT id AS personne_id FROM personnes WHERE nom = 'Kevin Bacon'
         UNION
         SELECT c2.personne_id
         FROM atteints a
         JOIN casting c1 ON c1.personne_id = a.personne_id AND c1.role = 'acteur'
         JOIN casting c2 ON c2.film_id = c1.film_id AND c2.role = 'acteur'
     )
     SELECT DISTINCT p.id, p.nom
     FROM casting c
     JOIN personnes p ON p.id = c.personne_id
     WHERE c.role = 'acteur'
       AND c.personne_id NOT IN (SELECT personne_id FROM atteints)
     ORDER BY p.nom`,
  )
}
