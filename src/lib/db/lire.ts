import 'server-only'
import type { QueryResultRow } from 'pg'
import { enTransaction, requete } from '@/lib/db/pool'

// Lecture en une requête. `membreId` vient de la session (null = visiteur) et alimente la RLS :
// un visiteur n'a pas besoin de transaction, un membre en a une pour poser app.membre_id.
export function lire<T extends QueryResultRow>(
  membreId: number | null,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (membreId === null) return requete<T>(sql, params)
  return enTransaction(membreId, async (client) => (await client.query<T>(sql, params)).rows)
}
