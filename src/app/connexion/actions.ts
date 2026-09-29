'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { verifierConnexion } from '@/lib/db/membres'
import { messageUtilisateur } from '@/lib/erreurs'
import { enregistrerEchec, reinitialiser, tentativesAutorisees } from '@/lib/limitation'
import { fermerSession, ouvrirSession } from '@/lib/session'

export type EtatConnexion = { erreur?: string; pseudo?: string }

const saisie = z.object({
  pseudo: z.string().trim().min(1).max(30),
  motDePasse: z.string().min(1).max(200),
})

// Message unique : on ne révèle jamais si c'est le pseudo ou le mot de passe qui est faux.
const REFUS = 'Pseudo ou mot de passe incorrect.'

export async function connecter(_: EtatConnexion, formulaire: FormData): Promise<EtatConnexion> {
  const lu = saisie.safeParse({
    pseudo: formulaire.get('pseudo'),
    motDePasse: formulaire.get('mot_de_passe'),
  })
  if (!lu.success) return { erreur: 'Renseignez votre pseudo et votre mot de passe.' }
  const { pseudo, motDePasse } = lu.data

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const cle = `${ip}|${pseudo.toLowerCase()}`
  if (!tentativesAutorisees(cle)) {
    return { pseudo, erreur: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  try {
    const membre = await verifierConnexion(pseudo, motDePasse)
    if (!membre) {
      enregistrerEchec(cle)
      return { pseudo, erreur: REFUS }
    }
    reinitialiser(cle)
    await ouvrirSession(membre)
  } catch (erreur) {
    return { pseudo, erreur: messageUtilisateur(erreur) }
  }
  redirect('/')
}

export async function deconnecter(): Promise<void> {
  await fermerSession()
  redirect('/')
}
