'use server'

import { z } from 'zod'
import { ecrireAffichage } from '@/lib/affichage'

// Le mode demandé est envoyé explicitement : deux clics rapides ne s'annulent pas par erreur.
export async function basculerAffichage(formulaire: FormData): Promise<void> {
  const mode = z.enum(['tableau', 'diagramme']).safeParse(formulaire.get('mode'))
  if (mode.success) await ecrireAffichage(mode.data)
}
