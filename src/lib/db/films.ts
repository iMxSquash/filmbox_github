import 'server-only'
import { cache } from 'react'
import { enTransaction } from '@/lib/db/pool'
import { lire } from '@/lib/db/lire'

export const TAILLE_PAGE = 20

type FilmResume = { id: number; titre: string; annee: number; genre: string }
type FilmClasse = { id: number; titre: string; moyenne: number; nb_notes: number }

// Tri choisi par l'utilisateur : liste blanche, jamais collé tel quel dans le SQL (N41)
const TRIS = {
  annee: 'annee, titre, id',
  titre: 'titre, annee, id',
} as const
type Tri = keyof typeof TRIS

type Filtres = { anneeMin?: number; anneeMax?: number; genre?: string; tri: Tri; page: number }

const FILTRE = `WHERE ($1::int IS NULL OR annee >= $1)
                  AND ($2::int IS NULL OR annee <= $2)
                  AND ($3::text IS NULL OR genre = $3)`

// M2.1 — films d'une période (BETWEEN), par genre, paginés
export async function catalogue(f: Filtres) {
  const params = [f.anneeMin ?? null, f.anneeMax ?? null, f.genre || null]
  const [films, total] = await Promise.all([
    lire<FilmResume>(
      null,
      `SELECT id, titre, annee, genre FROM films ${FILTRE}
       ORDER BY ${TRIS[f.tri]} LIMIT ${TAILLE_PAGE} OFFSET $4`,
      [...params, (f.page - 1) * TAILLE_PAGE],
    ),
    lire<{ n: number }>(null, `SELECT COUNT(*)::int AS n FROM films ${FILTRE}`, params),
  ])
  return { films, total: total[0]?.n ?? 0 }
}

export function genres() {
  return lire<{ genre: string }>(null, 'SELECT DISTINCT genre FROM films ORDER BY genre')
}

type Fiche = {
  id: number
  titre: string
  annee: number
  genre: string
  realisateurs: string | null
  duree: string | null
  nb_notes: number
  moyenne: number | null
  note_ponderee: number | null
  nb_vues: number
  saga_id: number | null
  details: { pays?: string[]; langue?: string; tags?: string[]; oscar_meilleur_film?: boolean }
}

// M9.1 (v_fiche_film) + M10.1 (duree_texte) + M10.2 (note_ponderee, seulement si le film a des notes)
export const fiche = cache(async (id: number): Promise<Fiche | null> => {
  const rows = await lire<Fiche>(
    null,
    `SELECT v.id, v.titre, v.annee, v.genre, v.realisateurs,
            CASE WHEN v.duree_min IS NOT NULL THEN duree_texte(v.duree_min) END AS duree,
            v.nb_notes::int AS nb_notes, v.moyenne::float8 AS moyenne,
            CASE WHEN v.nb_notes > 0 THEN note_ponderee(v.id)::float8 END AS note_ponderee,
            f.nb_vues, f.saga_id, f.details
     FROM v_fiche_film v
     JOIN films f ON f.id = v.id
     WHERE v.id = $1`,
    [id],
  )
  return rows[0] ?? null
})

type Personne = { id: number; nom: string; role: 'acteur' | 'realisateur' }

export function distribution(filmId: number) {
  return lire<Personne>(
    null,
    `SELECT p.id, p.nom, c.role
     FROM casting c JOIN personnes p ON p.id = c.personne_id
     WHERE c.film_id = $1
     ORDER BY c.role = 'acteur', p.nom`,
    [filmId],
  )
}

type NoteCumulee = { note_le: string; pseudo: string; note: number; moyenne_cumulee: number }

// M6.2 — chaque note reçue et la moyenne cumulée (égalités de date départagées par le pseudo)
export function evolutionNotes(filmId: number) {
  return lire<NoteCumulee>(
    null,
    `SELECT n.note_le::text AS note_le, u.pseudo, n.note::float8 AS note,
            ROUND(AVG(n.note) OVER (
                ORDER BY n.note_le, u.pseudo
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ), 2)::float8 AS moyenne_cumulee
     FROM notes n
     JOIN utilisateurs u ON u.id = n.utilisateur_id
     WHERE n.film_id = $1
     ORDER BY n.note_le, u.pseudo`,
    [filmId],
  )
}

export async function noteDuMembre(membreId: number, filmId: number): Promise<number | null> {
  const rows = await lire<{ note: number }>(
    membreId,
    'SELECT note::float8 AS note FROM notes WHERE utilisateur_id = $1 AND film_id = $2',
    [membreId, filmId],
  )
  return rows[0]?.note ?? null
}

export async function titreDuFilm(id: number): Promise<string | null> {
  const rows = await lire<{ titre: string }>(null, 'SELECT titre FROM films WHERE id = $1', [id])
  return rows[0]?.titre ?? null
}

// M13.1 — la procédure vérifie, enregistre (ou remplace) la note, journalise et renvoie la moyenne.
// Le pseudo vient de la session, jamais du formulaire.
export function noter(membreId: number, pseudo: string, titre: string, note: number) {
  return enTransaction(membreId, async (client) => {
    const { rows } = await client.query<{ p_moyenne: string }>('CALL noter($1, $2, $3)', [pseudo, titre, note])
    return Number(rows[0]?.p_moyenne)
  })
}

// M15.2 — le calcul est dans l'UPDATE : deux visiteurs simultanés sont comptés tous les deux
export function compterUneVue(filmId: number) {
  return lire(null, 'UPDATE films SET nb_vues = nb_vues + 1 WHERE id = $1', [filmId])
}

// M16.3 — recherche en SQL statique (index trigramme M12.3)
export function rechercher(texte: string) {
  return lire<{ id: number; titre: string; annee: number }>(
    null,
    'SELECT id, titre, annee FROM rechercher_films($1)',
    [texte],
  )
}

// M11.2 / M12.2 — les plus vus du mois, en plage de dates (jamais TO_CHAR)
export function tendances() {
  return lire<{ id: number; titre: string; vues: number }>(
    null,
    `SELECT f.id, f.titre, COUNT(*)::int AS vues
     FROM journal j
     JOIN films f ON f.id = j.film_id
     WHERE j.date_visionnage >= date_trunc('month', CURRENT_DATE)::date
       AND j.date_visionnage <  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date
     GROUP BY f.id, f.titre
     ORDER BY vues DESC, f.titre
     LIMIT 5`,
  )
}

// M2.4 — les 5 mieux notés parmi ceux qui ont au moins 5 notes
export function mieuxNotes() {
  return lire<FilmClasse>(
    null,
    `SELECT f.id, f.titre, ROUND(AVG(n.note), 2)::float8 AS moyenne, COUNT(*)::int AS nb_notes
     FROM notes n JOIN films f ON f.id = n.film_id
     GROUP BY f.id, f.titre
     HAVING COUNT(*) >= 5
     ORDER BY moyenne DESC, f.titre
     LIMIT 5`,
  )
}
