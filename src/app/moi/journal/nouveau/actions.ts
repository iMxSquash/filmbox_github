'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { urlMembre } from '@/components/Liens'
import { enregistrerSoiree } from '@/lib/db/journal'
import { messageUtilisateur } from '@/lib/erreurs'
import { aujourdhui } from '@/lib/format'
import { getSession } from '@/lib/session'

export type EtatSoiree = { erreur?: string }

const saisie = z.object({
  films: z.array(z.coerce.number().int().positive()).min(1).max(10),
  jour: z.iso.date(),
})

export async function ajouterSoiree(_: EtatSoiree, formulaire: FormData): Promise<EtatSoiree> {
  const session = await getSession()
  if (!session) return { erreur: 'Connectez-vous pour enregistrer une soirée.' }

  const lu = saisie.safeParse({
    films: formulaire.getAll('film').filter((v) => v !== ''),
    jour: formulaire.get('jour'),
  })
  if (!lu.success) return { erreur: 'Choisissez au moins un film et une date valide.' }
  if (lu.data.jour > aujourdhui()) {
    return { erreur: 'La date ne peut pas être dans le futur.' }
  }

  try {
    await enregistrerSoiree(session.membreId, lu.data.films, lu.data.jour, formulaire.get('prive') === 'on')
  } catch (erreur) {
    return { erreur: messageUtilisateur(erreur) }
  }
  redirect(urlMembre(session.pseudo))
}
