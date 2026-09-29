import 'server-only'
import { lire } from '@/lib/db/lire'
import { enTransaction } from '@/lib/db/pool'

export const LIMITE_A_VOIR = 50

// M3.2 — films que le membre n'a pas encore vus, du plus récent au plus ancien
export function aVoir(membreId: number) {
  return lire<{ id: number; titre: string; annee: number }>(
    membreId,
    `WITH deja_vus AS (
         SELECT j.film_id FROM journal j WHERE j.utilisateur_id = $1
     )
     SELECT f.id, f.titre, f.annee
     FROM films f
     LEFT JOIN deja_vus v ON v.film_id = f.id
     WHERE v.film_id IS NULL
     ORDER BY f.annee DESC, f.titre
     LIMIT ${LIMITE_A_VOIR}`,
    [membreId],
  )
}

// M15.3 — la soirée est enregistrée entièrement ou pas du tout : une seule transaction,
// la première erreur (film inexistant, RLS) annule tout
export function enregistrerSoiree(membreId: number, filmIds: number[], jour: string, prive: boolean) {
  return enTransaction(membreId, async (client) => {
    for (const filmId of filmIds) {
      await client.query(
        'INSERT INTO journal (utilisateur_id, film_id, date_visionnage, prive) VALUES ($1, $2, $3, $4)',
        [membreId, filmId, jour, prive],
      )
    }
  })
}
