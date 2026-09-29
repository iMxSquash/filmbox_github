// Nécessite la base Docker (docker compose up -d --wait) et le compte filmbox_web.
import type { PoolClient } from 'pg'
import { afterAll, describe, expect, it } from 'vitest'
import { messageUtilisateur } from '@/lib/erreurs'
import { enTransaction, fermerPool } from '@/lib/db/pool'
import { verifierConnexion } from '@/lib/db/membres'

afterAll(fermerPool)

const compterJournal5 = (c: PoolClient) =>
  c.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM journal WHERE utilisateur_id = 5')

const membrePrive = (client: PoolClient) =>
  client.query<{ mes: string; autres: string }>(`
    SELECT COUNT(*) FILTER (WHERE prive AND utilisateur_id = 5)  AS mes,
           COUNT(*) FILTER (WHERE prive AND utilisateur_id <> 5) AS autres
    FROM journal`)

describe('enTransaction et RLS (M16.2)', () => {
  it('le membre voit ses entrées privées et jamais celles des autres', async () => {
    const { rows } = await enTransaction(5, membrePrive)
    expect(Number(rows[0]!.mes)).toBeGreaterThan(0)
    expect(Number(rows[0]!.autres)).toBe(0)
  })

  it('un visiteur ne voit aucune entrée privée', async () => {
    const { rows } = await enTransaction(null, membrePrive)
    expect(Number(rows[0]!.mes)).toBe(0)
    expect(Number(rows[0]!.autres)).toBe(0)
  })

  it("l'identité ne fuit pas vers la requête suivante qui réutilise la connexion", async () => {
    await enTransaction(5, async () => undefined)
    const { rows } = await enTransaction(null, (c) =>
      c.query<{ v: string | null }>("SELECT current_setting('app.membre_id', true) AS v"),
    )
    expect(rows[0]!.v).toBe('')
  })

  it('annule tout en cas d\'erreur (tout ou rien, N34)', async () => {
    const avant = await enTransaction(5, compterJournal5)
    await expect(
      enTransaction(5, async (c) => {
        await c.query("INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25')")
        await c.query("INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 2000000000, '2026-09-25')")
      }),
    ).rejects.toMatchObject({ code: '23503' })
    const apres = await enTransaction(5, compterJournal5)
    expect(apres.rows[0]!.n).toBe(avant.rows[0]!.n)
  })

  it("refuse d'écrire au nom d'un autre membre (RLS) avec un message clair", async () => {
    const erreur = await enTransaction(3, (c) =>
      c.query("INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25')"),
    ).catch((e: unknown) => e)
    expect(messageUtilisateur(erreur)).toBe("Vous n'avez pas le droit d'effectuer cette action.")
  })

  it('noter() : messages M13.2 repris tels quels', async () => {
    const erreur = await enTransaction(5, (c) =>
      c.query("CALL noter('lea.reel', 'Avatar', 4)"),
    ).catch((e: unknown) => e)
    expect(messageUtilisateur(erreur)).toBe('Film inconnu : Avatar')
  })
})

describe('journal : pas de visionnage dans le futur (migration 020)', () => {
  it('refuse une date future, même pour son propre journal', async () => {
    const erreur = await enTransaction(5, (c) =>
      c.query("INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, CURRENT_DATE + 1)"),
    ).catch((e: unknown) => e)
    expect(erreur).toMatchObject({ code: '42501' })
  })
})

describe('RLS sur les notes (migration 019)', () => {
  it("refuse d'écrire ou de modifier la note d'un autre membre, même hors noter()", async () => {
    const insertion = await enTransaction(3, (c) =>
      c.query("INSERT INTO notes (utilisateur_id, film_id, note, note_le) VALUES (5, 1, 1, '2026-09-25') ON CONFLICT DO NOTHING"),
    ).catch((e: unknown) => e)
    expect(insertion).toMatchObject({ code: '42501' })

    const modification = await enTransaction(3, (c) =>
      c.query('UPDATE notes SET note = 0.5 WHERE utilisateur_id = 5'),
    )
    expect(modification.rowCount).toBe(0) // les lignes des autres sont invisibles pour l'UPDATE
  })

  it('les notes restent lisibles par tous, visiteur compris', async () => {
    const { rows } = await enTransaction(null, (c) => c.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM notes'))
    expect(rows[0]!.n).toBeGreaterThan(0)
  })
})

// Exécute fn dans une transaction toujours annulée : aucun compte de test ne reste en base
async function sansTrace(fn: (c: PoolClient) => Promise<void>) {
  await enTransaction(null, async (c) => {
    await fn(c)
    throw new Error('annulation')
  }).catch((e: unknown) => {
    if ((e as Error).message !== 'annulation') throw e
  })
}

describe('inscription() (migration 021)', () => {
  it('crée le membre, qui peut ensuite se connecter', async () => {
    await sansTrace(async (c) => {
      const cree = await c.query('SELECT id, pseudo FROM inscription($1, $2)', ['Test.Inscription', 'motdepasse1'])
      expect(cree.rows[0]).toMatchObject({ pseudo: 'Test.Inscription' })
      const connexion = await c.query('SELECT pseudo FROM connexion($1, $2)', ['Test.Inscription', 'motdepasse1'])
      expect(connexion.rows).toHaveLength(1)
      const mauvais = await c.query('SELECT pseudo FROM connexion($1, $2)', ['Test.Inscription', 'autre-mot-de-passe'])
      expect(mauvais.rows).toHaveLength(0)
    })
  })

  it.each([
    ['LEA.REEL', 'motdepasse1', 'Ce pseudo est déjà pris.'],
    ['ab', 'motdepasse1', 'Le pseudo doit contenir de 3 à 30 caractères, sans espace.'],
    ['avec espace', 'motdepasse1', 'Le pseudo doit contenir de 3 à 30 caractères, sans espace.'],
    ['assez.long', 'court', 'Le mot de passe doit contenir de 8 à 72 caractères.'],
    ['assez.long', 'é'.repeat(40), 'Le mot de passe doit contenir de 8 à 72 caractères.'],
  ])('refuse %s / %s', async (pseudo, mdp, message) => {
    const erreur = await sansTrace((c) => c.query('SELECT * FROM inscription($1, $2)', [pseudo, mdp]).then(() => undefined)).catch(
      (e: unknown) => e,
    )
    expect(messageUtilisateur(erreur)).toBe(message)
  })

  it("l'application ne peut pas créer un membre en écrivant directement dans utilisateurs", async () => {
    const erreur = await enTransaction(null, (c) =>
      c.query("INSERT INTO utilisateurs (pseudo, inscrit_le) VALUES ('direct', CURRENT_DATE)"),
    ).catch((e: unknown) => e)
    expect(erreur).toMatchObject({ code: '42501' })
  })
})

describe('connexion() (migration 014)', () => {
  it('accepte le bon mot de passe', async () => {
    expect(await verifierConnexion('lea.reel', 'filmbox-demo')).toEqual({ membreId: 5, pseudo: 'lea.reel' })
  })

  it('refuse un mauvais mot de passe, un pseudo inconnu et une injection', async () => {
    expect(await verifierConnexion('lea.reel', 'faux')).toBeNull()
    expect(await verifierConnexion('inconnu', 'filmbox-demo')).toBeNull()
    expect(await verifierConnexion("x' OR '1'='1", "x' OR '1'='1")).toBeNull()
  })
})
