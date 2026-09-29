import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Tableau } from '@/components/Tableau'
import { aVoir, LIMITE_A_VOIR } from '@/lib/db/journal'
import { getSession } from '@/lib/session'
import { LienFilm } from '@/components/Liens'

export const metadata: Metadata = { title: 'À voir' }

export default async function PageAVoir() {
  const session = await getSession()
  if (!session) redirect('/connexion')
  const films = await aVoir(session.membreId)

  return (
    <>
      <h1>À voir</h1>
      <p className="intro">Les films que vous n’avez pas encore vus, du plus récent au plus ancien.</p>
      <Tableau
        legende={`Films restant à voir (${LIMITE_A_VOIR} plus récents)`}
        lignes={films}
        cle={(l) => l.id}
        vide="Vous avez vu tous les films du catalogue."
        colonnes={[
          { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
          { titre: 'Année', numerique: true, cellule: (l) => l.annee },
        ]}
      />
    </>
  )
}
