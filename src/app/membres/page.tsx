import type { Metadata } from 'next'
import { Tableau } from '@/components/Tableau'
import { plusActifs } from '@/lib/db/membres'
import { date } from '@/lib/format'
import { getSession } from '@/lib/session'
import { LienFilm, LienMembre } from '@/components/Liens'

export const metadata: Metadata = { title: 'Membres' }

export default async function PageMembres() {
  const session = await getSession()
  const membres = await plusActifs(session?.membreId ?? null)

  return (
    <>
      <h1>Membres</h1>
      <Tableau
        legende="Les 20 membres les plus actifs et leurs 2 derniers visionnages"
        lignes={membres}
        cle={(l) => l.id}
        colonnes={[
          {
            titre: 'Membre',
            cellule: (l) => <LienMembre pseudo={l.pseudo} />,
          },
          { titre: 'Visionnages', numerique: true, cellule: (l) => l.nb_visionnages },
          { titre: 'Films différents', numerique: true, cellule: (l) => l.nb_films_distincts },
          {
            titre: 'Derniers visionnages',
            cellule: (l) => (
              <ul className="liste-nue">
                {l.derniers.map((d) => (
                  <li key={`${d.film_id}-${d.date}`}>
                    <LienFilm id={d.film_id} titre={d.titre} />{' '}
                    <span className="aide">le {date(d.date)}</span>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </>
  )
}
