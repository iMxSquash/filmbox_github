import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { env } from '@/lib/env'

export type Session = { membreId: number; pseudo: string }

const NOM_COOKIE = 'filmbox_session'
const DUREE_SECONDES = 60 * 60 * 24 * 7

type Contenu = Session & { exp: number }

function signer(donnees: string): string {
  return createHmac('sha256', env().SESSION_SECRET).update(donnees).digest('base64url')
}

export function creerJeton(session: Session, maintenant = Date.now()): string {
  const contenu: Contenu = { ...session, exp: Math.floor(maintenant / 1000) + DUREE_SECONDES }
  const donnees = Buffer.from(JSON.stringify(contenu)).toString('base64url')
  return `${donnees}.${signer(donnees)}`
}

export function lireJeton(jeton: string, maintenant = Date.now()): Session | null {
  const [donnees, signature, reste] = jeton.split('.')
  if (!donnees || !signature || reste !== undefined) return null

  const attendue = Buffer.from(signer(donnees))
  const recue = Buffer.from(signature)
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null

  try {
    const contenu = JSON.parse(Buffer.from(donnees, 'base64url').toString()) as Contenu
    if (
      !Number.isInteger(contenu.membreId) ||
      typeof contenu.pseudo !== 'string' ||
      contenu.exp * 1000 < maintenant
    ) {
      return null
    }
    return { membreId: contenu.membreId, pseudo: contenu.pseudo }
  } catch {
    return null
  }
}

// Mémoïsée pour la durée d'une requête : l'en-tête et la page ne vérifient le jeton qu'une fois.
export const getSession = cache(async (): Promise<Session | null> => {
  const jeton = (await cookies()).get(NOM_COOKIE)?.value
  return jeton ? lireJeton(jeton) : null
})

export async function ouvrirSession(session: Session): Promise<void> {
  ;(await cookies()).set(NOM_COOKIE, creerJeton(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env().NODE_ENV === 'production',
    path: '/',
    maxAge: DUREE_SECONDES,
  })
}

export async function fermerSession(): Promise<void> {
  ;(await cookies()).delete(NOM_COOKIE)
}
