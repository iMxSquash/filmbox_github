'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { noter, titreDuFilm } from '@/lib/db/films'
import { messageUtilisateur } from '@/lib/erreurs'
import { nombre } from '@/lib/format'
import { getSession } from '@/lib/session'

export type EtatNote = { succes?: string; erreur?: string }

const saisie = z.object({
  filmId: z.coerce.number().int().positive(),
  note: z.coerce.number().min(0.5).max(5).multipleOf(0.5),
})

export async function noterFilm(_: EtatNote, formulaire: FormData): Promise<EtatNote> {
  const session = await getSession()
  if (!session) return { erreur: 'Connectez-vous pour noter un film.' }

  const lu = saisie.safeParse({ filmId: formulaire.get('film_id'), note: formulaire.get('note') })
  if (!lu.success) return { erreur: 'Choisissez une note de 0,5 à 5, par demi-point.' }

  try {
    const titre = await titreDuFilm(lu.data.filmId)
    if (!titre) return { erreur: 'Ce film est introuvable.' }
    // Le pseudo vient de la session, jamais du formulaire (la RLS bloque aussi tout écart)
    const moyenne = await noter(session.membreId, session.pseudo, titre, lu.data.note)
    revalidatePath(`/films/${lu.data.filmId}`)
    return { succes: `Note enregistrée. Nouvelle moyenne du film : ${nombre(moyenne)} / 5.` }
  } catch (erreur) {
    return { erreur: messageUtilisateur(erreur) }
  }
}
