import type { Metadata } from 'next'
import { Note } from '@/components/Note'
import { Tableau } from '@/components/Tableau'
import { episodes } from '@/lib/db/sagas'
import { LienFilm } from '@/components/Liens'

export const metadata: Metadata = { title: 'Sagas' }

export default async function PageSagas() {
  const tous = await episodes()
  const parSaga = Map.groupBy(tous, (e) => e.saga)

  return (
    <>
      <h1>Sagas</h1>
      {[...parSaga].map(([saga, liste]) => (
        <section key={saga} aria-labelledby={`saga-${liste[0]?.saga_id}`}>
          <h2 id={`saga-${liste[0]?.saga_id}`}>{saga}</h2>
          <Tableau
            legende={`Épisodes de « ${saga} » dans l'ordre`}
            lignes={liste}
            cle={(l) => l.film_id}
            colonnes={[
              { titre: 'Épisode', numerique: true, cellule: (l) => l.episode },
              { titre: 'Film', cellule: (l) => <LienFilm id={l.film_id} titre={l.titre} /> },
              { titre: 'Année', numerique: true, cellule: (l) => l.annee },
              { titre: 'Moyenne', numerique: true, cellule: (l) => <Note valeur={l.moyenne} /> },
              { titre: 'Rang dans la saga', numerique: true, cellule: (l) => l.rang },
              { titre: 'Parcours', cellule: (l) => l.parcours },
            ]}
          />
        </section>
      ))}
    </>
  )
}
