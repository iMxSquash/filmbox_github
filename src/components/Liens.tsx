import Link from 'next/link'

// Seule source de vérité des URL de fiches, y compris l'encodage du pseudo.
export const urlMembre = (pseudo: string) => `/membres/${encodeURIComponent(pseudo)}`

export function LienFilm({ id, titre }: { id: number; titre: string }) {
  return <Link href={`/films/${id}`}>{titre}</Link>
}

export function LienPersonne({ id, nom }: { id: number; nom: string }) {
  return <Link href={`/personnes/${id}`}>{nom}</Link>
}

export function LienMembre({ pseudo }: { pseudo: string }) {
  return <Link href={urlMembre(pseudo)}>{pseudo}</Link>
}
