import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Tableau } from '@/components/Tableau'
import { filmographie, nombreDeBacon, personne } from '@/lib/db/personnes'
import { identifiant } from '@/lib/params'
import { LienFilm } from '@/components/Liens'

type Props = { params: Promise<{ id: string }> }

const charger = cache(personne)

function libelleBacon(degre: number | null): string {
  if (degre === null) return 'plus de 4 degrés de Kevin Bacon'
  return degre === 0 ? 'c’est Kevin Bacon lui-même' : String(degre)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = identifiant((await params).id)
  const p = id ? await charger(id) : null
  return { title: p?.nom ?? 'Personne introuvable' }
}

export default async function PagePersonne({ params }: Props) {
  const id = identifiant((await params).id)
  const p = id ? await charger(id) : null
  if (!id || !p) notFound()

  const [films, bacon] = await Promise.all([filmographie(id), nombreDeBacon(id)])
  const estActeur = films.some((f) => f.role === 'acteur')

  return (
    <>
      <h1>{p.nom}</h1>
      {estActeur && (
        <p>
          <strong>Nombre de Bacon :</strong>{' '}
          {libelleBacon(bacon)}.{' '}
          <Link href="/kevin-bacon">Comprendre le nombre de Bacon</Link>
        </p>
      )}
      <Tableau
        legende="Filmographie, par ordre chronologique"
        lignes={films}
        cle={(l) => `${l.id}-${l.role}`}
        colonnes={[
          { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
          { titre: 'Année', numerique: true, cellule: (l) => l.annee },
          { titre: 'Rôle', cellule: (l) => (l.role === 'acteur' ? 'Acteur' : 'Réalisation') },
        ]}
      />
    </>
  )
}
