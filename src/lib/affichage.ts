import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export type Affichage = 'tableau' | 'diagramme'

const NOM_COOKIE = 'filmbox_affichage'

// Préférence d'affichage (tableaux ou diagrammes) : un cookie lu côté serveur, donc aucun clignotement.
export async function lireAffichage(): Promise<Affichage> {
  return (await cookies()).get(NOM_COOKIE)?.value === 'diagramme' ? 'diagramme' : 'tableau'
}

export async function ecrireAffichage(mode: Affichage): Promise<void> {
  ;(await cookies()).set(NOM_COOKIE, mode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env().NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
}
