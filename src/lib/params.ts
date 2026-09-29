import { z } from 'zod'

const entier = z.coerce.number().int().positive()

// Identifiant d'URL ou de formulaire : entier strictement positif, sinon null.
export function identifiant(valeur: unknown): number | null {
  const lu = entier.safeParse(valeur)
  return lu.success ? lu.data : null
}
