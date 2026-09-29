'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { creerCompte } from '@/lib/db/membres'
import { messageUtilisateur } from '@/lib/erreurs'
import { ouvrirSession } from '@/lib/session'

export type EtatInscription = { erreur?: string; pseudo?: string }

// Lettres (accents compris), chiffres, point, tiret et tiret bas : un pseudo sert dans les URL
const saisie = z
  .object({
    pseudo: z
      .string()
      .trim()
      .regex(/^[\p{L}\p{N}._-]{3,30}$/u),
    motDePasse: z.string().min(8).refine((v) => Buffer.byteLength(v) <= 72),
    confirmation: z.string(),
  })
  .refine((v) => v.motDePasse === v.confirmation, { path: ['confirmation'] })

export async function sInscrire(_: EtatInscription, formulaire: FormData): Promise<EtatInscription> {
  const pseudo = String(formulaire.get('pseudo') ?? '').trim()
  const lu = saisie.safeParse({
    pseudo,
    motDePasse: formulaire.get('mot_de_passe'),
    confirmation: formulaire.get('confirmation'),
  })
  if (!lu.success) {
    const champ = lu.error.issues[0]?.path[0]
    const erreur =
      champ === 'pseudo'
        ? 'Le pseudo doit contenir de 3 à 30 lettres, chiffres, points, tirets ou tirets bas.'
        : champ === 'confirmation'
          ? 'Les deux mots de passe ne sont pas identiques.'
          : 'Le mot de passe doit contenir de 8 à 72 caractères.'
    return { pseudo, erreur }
  }

  try {
    await ouvrirSession(await creerCompte(lu.data.pseudo, lu.data.motDePasse))
  } catch (erreur) {
    return { pseudo, erreur: messageUtilisateur(erreur) }
  }
  redirect('/')
}
