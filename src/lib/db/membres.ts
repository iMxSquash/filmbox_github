import 'server-only'
import { lire } from '@/lib/db/lire'
import { enTransaction } from '@/lib/db/pool'
import type { Session } from '@/lib/session'

// Migration 014 : connexion() est la seule porte, l'empreinte n'est jamais lue par l'application.
export async function verifierConnexion(pseudo: string, motDePasse: string): Promise<Session | null> {
  return enTransaction(null, async (client) => {
    const { rows } = await client.query<Session>(
      'SELECT id AS "membreId", pseudo FROM connexion($1, $2)',
      [pseudo, motDePasse],
    )
    return rows[0] ?? null
  })
}

export type Activite = {
  id: number
  pseudo: string
  nb_visionnages: number
  nb_films_distincts: number
  derniers: { film_id: number; titre: string; date: string }[]
}

// M2.5 (membres les plus actifs) + M8.4 (leurs 2 derniers visionnages, LATERAL).
// La RLS masque les entrées privées des autres membres.
export function plusActifs(membreId: number | null) {
  return lire<Activite>(
    membreId,
    `WITH actifs AS (
         SELECT u.id, u.pseudo, COUNT(*)::int AS nb_visionnages,
                COUNT(DISTINCT j.film_id)::int AS nb_films_distincts
         FROM journal j JOIN utilisateurs u ON u.id = j.utilisateur_id
         GROUP BY u.id, u.pseudo
         ORDER BY nb_visionnages DESC, u.pseudo
         LIMIT 20
     )
     SELECT a.id, a.pseudo, a.nb_visionnages, a.nb_films_distincts, d.derniers
     FROM actifs a
     CROSS JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object('film_id', x.film_id, 'titre', x.titre, 'date', x.date)
                          ORDER BY x.date DESC, x.jid DESC) AS derniers
         FROM (
             SELECT f.id AS film_id, f.titre, j.date_visionnage::text AS date, j.id AS jid
             FROM journal j JOIN films f ON f.id = j.film_id
             WHERE j.utilisateur_id = a.id
             ORDER BY j.date_visionnage DESC, j.id DESC
             LIMIT 2
         ) x
     ) d
     ORDER BY a.nb_visionnages DESC, a.pseudo`,
  )
}

export type Carte = {
  pseudo: string
  inscrit_le: string
  nb_films_notes: number
  note_moyenne: number | null
  genre_prefere: string | null
  coup_de_coeur_id: number | null
  coup_de_coeur: string | null
}

// M3.1 — carte de profil : une CTE par information (le coup de cœur est aussi le M5.3 d'un membre).
// LEFT JOIN : un membre sans note a quand même une carte.
export async function carte(membreId: number | null, pseudo: string): Promise<Carte | null> {
  const rows = await lire<Carte>(
    membreId,
    `WITH membre AS (
         SELECT id, pseudo, inscrit_le FROM utilisateurs WHERE pseudo = $1
     ),
     stats AS (
         SELECT COUNT(*)::int AS nb_films_notes, ROUND(AVG(n.note), 2)::float8 AS note_moyenne
         FROM notes n JOIN membre m ON m.id = n.utilisateur_id
     ),
     genre_prefere AS (
         SELECT f.genre
         FROM notes n JOIN membre m ON m.id = n.utilisateur_id JOIN films f ON f.id = n.film_id
         GROUP BY f.genre
         ORDER BY COUNT(*) DESC, f.genre
         LIMIT 1
     ),
     coup_de_coeur AS (
         SELECT f.id, f.titre
         FROM notes n JOIN membre m ON m.id = n.utilisateur_id JOIN films f ON f.id = n.film_id
         ORDER BY n.note DESC, n.note_le
         LIMIT 1
     )
     SELECT m.pseudo, m.inscrit_le::text AS inscrit_le, s.nb_films_notes, s.note_moyenne,
            g.genre AS genre_prefere, c.id AS coup_de_coeur_id, c.titre AS coup_de_coeur
     FROM membre m
     CROSS JOIN stats s
     LEFT JOIN genre_prefere g ON true
     LEFT JOIN coup_de_coeur c ON true`,
    [pseudo],
  )
  return rows[0] ?? null
}

export type Visionnage = {
  film_id: number
  titre: string
  date: string
  prive: boolean
  jours_depuis_precedent: number | null
}

// M11.1 (20 derniers visionnages, index idx_journal_profil) + M6.4 (jours depuis le précédent)
export function derniersVisionnages(membreId: number | null, pseudo: string) {
  return lire<Visionnage>(
    membreId,
    `SELECT film_id, titre, date, prive, jours_depuis_precedent
     FROM (
         SELECT j.id, f.id AS film_id, f.titre, j.date_visionnage::text AS date, j.prive,
                (j.date_visionnage - LAG(j.date_visionnage) OVER (ORDER BY j.date_visionnage, j.id))::int
                    AS jours_depuis_precedent
         FROM journal j JOIN films f ON f.id = j.film_id
         WHERE j.utilisateur_id = (SELECT id FROM utilisateurs WHERE pseudo = $1)
     ) t
     ORDER BY date DESC, id DESC
     LIMIT 20`,
    [pseudo],
  )
}

// M6.1 — visionnages par mois et cumul
export function visionnagesParMois(membreId: number | null, pseudo: string) {
  return lire<{ mois: string; nb: number; cumul: number }>(
    membreId,
    `WITH par_mois AS (
         SELECT DATE_TRUNC('month', j.date_visionnage)::DATE AS mois, COUNT(*) AS nb
         FROM journal j JOIN utilisateurs u ON u.id = j.utilisateur_id
         WHERE u.pseudo = $1
         GROUP BY 1
     )
     SELECT TO_CHAR(mois, 'YYYY-MM') AS mois, nb::int AS nb, (SUM(nb) OVER (ORDER BY mois))::int AS cumul
     FROM par_mois
     ORDER BY mois`,
    [pseudo],
  )
}

// M6.3 — chaque note du membre, moyenne du film (tous membres) et écart
export function ecartsALaMoyenne(pseudo: string) {
  return lire<{ film_id: number; titre: string; note: number; moyenne_film: number; ecart: number }>(
    null,
    `SELECT f.id AS film_id, f.titre, n.note::float8 AS note, m.moyenne::float8 AS moyenne_film,
            (n.note - m.moyenne)::float8 AS ecart
     FROM notes n
     JOIN utilisateurs u ON u.id = n.utilisateur_id
     JOIN films f ON f.id = n.film_id
     JOIN LATERAL (SELECT ROUND(AVG(n2.note), 2) AS moyenne FROM notes n2 WHERE n2.film_id = n.film_id) m ON true
     WHERE u.pseudo = $1
     ORDER BY ecart DESC, f.titre`,
    [pseudo],
  )
}

// M10.3 — compatibilité avec un autre membre : films communs, écart moyen, 5 plus gros écarts
export async function compatibilite(pseudoA: string, pseudoB: string) {
  const rows = await lire<{
    titre: string
    note_a: number
    note_b: number
    ecart: number
    films_communs: number
    ecart_moyen: number
  }>(
    null,
    `SELECT titre, note_a::float8 AS note_a, note_b::float8 AS note_b, ecart::float8 AS ecart,
            (COUNT(*) OVER ())::int AS films_communs,
            (ROUND(AVG(ecart) OVER (), 2))::float8 AS ecart_moyen
     FROM compatibilite($1, $2)
     LIMIT 5`,
    [pseudoA, pseudoB],
  )
  return {
    films_communs: rows[0]?.films_communs ?? 0,
    ecart_moyen: rows[0]?.ecart_moyen ?? null,
    ecarts: rows,
  }
}

// M1.4 — listes du membre (la RLS ne laisse voir que les publiques, ou les siennes)
export function listesDuMembre(membreId: number | null, pseudo: string) {
  return lire<{ id: number; titre: string; publique: boolean; creee_le: string }>(
    membreId,
    `SELECT l.id, l.titre, l.publique, l.creee_le::text AS creee_le
     FROM listes l JOIN utilisateurs u ON u.id = l.utilisateur_id
     WHERE u.pseudo = $1
     ORDER BY l.creee_le DESC, l.id`,
    [pseudo],
  )
}
