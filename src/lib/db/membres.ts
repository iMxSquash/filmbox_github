import 'server-only'
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
