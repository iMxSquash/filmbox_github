// Formats français : virgule décimale, dates longues. Les dates arrivent de la base en texte
// (`::text`) : évite tout décalage de fuseau d'un objet Date.

export function nombre(valeur: number): string {
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

export function date(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'UTC' })
}

// Jour courant au format ISO (AAAA-MM-JJ), pour borner les dates saisies.
export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10)
}

export function pluriel(n: number, singulier: string, plur = `${singulier}s`): string {
  return `${n} ${n > 1 ? plur : singulier}`
}
