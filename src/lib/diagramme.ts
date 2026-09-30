// Largeur d'une barre en pourcentage de la piste, bornée à [0, 100].
export function largeur(valeur: number, max: number): number {
  if (max <= 0 || valeur <= 0) return 0
  return Math.min(100, (valeur / max) * 100)
}
