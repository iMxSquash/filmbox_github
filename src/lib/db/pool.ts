import 'server-only'
import { Pool, type PoolClient } from 'pg'
import { env } from '@/lib/env'

// Un seul pool, conservé entre les rechargements à chaud du mode dev.
const globaux = globalThis as { __filmboxPool?: Pool }

function pool(): Pool {
  globaux.__filmboxPool ??= new Pool({ connectionString: env().DATABASE_URL, max: 10 })
  return globaux.__filmboxPool
}

/**
 * Toute requête passe par ici : une transaction (N34) dans laquelle `app.membre_id`
 * est posé pour la RLS (N39). `set_config(..., true)` le rend local à la transaction :
 * indispensable avec un pool, sinon l'identité fuiterait vers la requête suivante
 * qui réutilise la connexion.
 *
 * `membreId` vient toujours de la session serveur, jamais du client. `null` = visiteur.
 */
export async function enTransaction<T>(
  membreId: number | null,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.membre_id', $1, true)", [
      membreId === null ? '' : String(membreId),
    ])
    const resultat = await fn(client)
    await client.query('COMMIT')
    return resultat
  } catch (erreur) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw erreur
  } finally {
    client.release()
  }
}

export async function fermerPool(): Promise<void> {
  await globaux.__filmboxPool?.end()
  globaux.__filmboxPool = undefined
}
