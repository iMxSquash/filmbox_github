// Limitation des tentatives de connexion, au mieux : en mémoire, donc valable pour une seule
// instance (rechargée au redémarrage). Une limitation partagée relèverait de la base.

const MAX_ECHECS = 5
const FENETRE_MS = 15 * 60 * 1000

const echecs = new Map<string, { nombre: number; debut: number }>()

function etatCourant(cle: string, maintenant: number) {
  const etat = echecs.get(cle)
  if (etat && maintenant - etat.debut > FENETRE_MS) {
    echecs.delete(cle)
    return undefined
  }
  return etat
}

export function tentativesAutorisees(cle: string, maintenant = Date.now()): boolean {
  return (etatCourant(cle, maintenant)?.nombre ?? 0) < MAX_ECHECS
}

const TAILLE_MAX = 1000

export function enregistrerEchec(cle: string, maintenant = Date.now()): void {
  // Purge des entrées expirées pour que des pseudos aléatoires ne fassent pas grossir la Map
  if (echecs.size >= TAILLE_MAX) {
    for (const k of echecs.keys()) etatCourant(k, maintenant)
  }
  const etat = etatCourant(cle, maintenant)
  if (etat) etat.nombre += 1
  else echecs.set(cle, { nombre: 1, debut: maintenant })
}

export function reinitialiser(cle: string): void {
  echecs.delete(cle)
}
