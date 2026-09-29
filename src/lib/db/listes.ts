import 'server-only'
import { lire } from '@/lib/db/lire'

// M1.4 — une liste et ses films dans l'ordre ; la RLS masque les listes privées d'autrui (N39)
export async function liste(membreId: number | null, id: number) {
  const entete = await lire<{ id: number; titre: string; pseudo: string; publique: boolean; creee_le: string }>(
    membreId,
    `SELECT l.id, l.titre, u.pseudo, l.publique, l.creee_le::text AS creee_le
     FROM listes l JOIN utilisateurs u ON u.id = l.utilisateur_id
     WHERE l.id = $1`,
    [id],
  )
  if (!entete[0]) return null
  const films = await lire<{ position: number; id: number; titre: string }>(
    membreId,
    `SELECT lf.position, f.id, f.titre
     FROM liste_films lf JOIN films f ON f.id = lf.film_id
     WHERE lf.liste_id = $1
     ORDER BY lf.position`,
    [id],
  )
  return { ...entete[0], films }
}
