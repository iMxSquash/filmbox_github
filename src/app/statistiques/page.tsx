import type { Metadata } from 'next'
import { Tableau } from '@/components/Tableau'
import { parGenre, parGenreEtTrimestre, scienceFictionParMembre } from '@/lib/db/statistiques'
import { nombre } from '@/lib/format'
import { getSession } from '@/lib/session'
import { LienMembre } from '@/components/Liens'

export const metadata: Metadata = { title: 'Statistiques' }

export default async function PageStatistiques() {
  const session = await getSession()
  const [genres, sf, trimestres] = await Promise.all([
    parGenre(),
    scienceFictionParMembre(),
    parGenreEtTrimestre(session?.membreId ?? null),
  ])

  return (
    <>
      <h1>Statistiques</h1>

      <section aria-labelledby="s-genres">
        <h2 id="s-genres">Coups de cœur et déceptions par genre</h2>
        <Tableau
          legende="Notes par genre : coups de cœur (4,5 et plus) et déceptions (2,5 et moins)"
          lignes={genres}
          cle={(l) => l.genre}
          colonnes={[
            { titre: 'Genre', cellule: (l) => l.genre },
            { titre: 'Notes', numerique: true, cellule: (l) => l.nb_notes },
            { titre: 'Coups de cœur', numerique: true, cellule: (l) => l.coups_de_coeur },
            { titre: 'Déceptions', numerique: true, cellule: (l) => l.deceptions },
          ]}
        />
      </section>

      <section aria-labelledby="s-sf">
        <h2 id="s-sf">La science-fiction vue par chaque membre</h2>
        <Tableau
          legende="Note moyenne en science-fiction comparée à la moyenne tous genres"
          lignes={sf}
          cle={(l) => l.pseudo}
          colonnes={[
            {
              titre: 'Membre',
              cellule: (l) => <LienMembre pseudo={l.pseudo} />,
            },
            {
              titre: 'Science-fiction',
              numerique: true,
              cellule: (l) => (l.moyenne_sf === null ? 'aucune note' : nombre(l.moyenne_sf)),
            },
            { titre: 'Tous genres', numerique: true, cellule: (l) => nombre(l.moyenne_globale) },
          ]}
        />
      </section>

      <section aria-labelledby="s-trimestres">
        <h2 id="s-trimestres">Visionnages 2026 par genre et par trimestre</h2>
        <Tableau
          legende="Visionnages par genre et trimestre, avec sous-totaux par genre et total général"
          lignes={trimestres}
          cle={(l) => `${l.genre}-${l.trimestre}`}
          total={(l) => l.genre === 'TOTAL' || l.trimestre === 'Année'}
          colonnes={[
            { titre: 'Genre', cellule: (l) => (l.genre === 'TOTAL' ? 'Total général' : l.genre) },
            { titre: 'Trimestre', cellule: (l) => (l.trimestre === 'Année' ? 'Total' : l.trimestre) },
            { titre: 'Visionnages', numerique: true, cellule: (l) => l.visionnages },
          ]}
        />
      </section>
    </>
  )
}
