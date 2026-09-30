import type { Metadata } from 'next'
import { LienFilm, LienPersonne } from '@/components/Liens'
import { Note } from '@/components/Note'
import { Tableau } from '@/components/Tableau'
import {
  brutContrePondere,
  clivants,
  longsMetrages,
  oscars,
  prolifiques,
  realisateursClasses,
  topParGenre,
  topTags,
} from '@/lib/db/classements'
import { mieuxNotes } from '@/lib/db/films'
import { entier, nombre, pluriel, surCinq } from '@/lib/format'

export const metadata: Metadata = { title: 'Classements' }


export default async function PageClassements() {
  const [meilleurs, ponderes, parGenre, realisateurs, prolif, divisent, longs, oscarises, tags] = await Promise.all([
    mieuxNotes(),
    brutContrePondere(),
    topParGenre(),
    realisateursClasses(),
    prolifiques(),
    clivants(),
    longsMetrages(),
    oscars(),
    topTags(),
  ])

  return (
    <>
      <h1>Classements</h1>

      <section aria-labelledby="c-notes">
        <h2 id="c-notes">Les films les mieux notés</h2>
        <Tableau
          legende="5 films les mieux notés (au moins 5 notes)"
          diagramme={{ valeur: (l) => l.moyenne, max: 5, format: surCinq }}
          lignes={meilleurs}
          cle={(l) => l.id}
          vide="Pas encore assez de notes."
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Moyenne', numerique: true, cellule: (l) => <Note valeur={l.moyenne} nb={l.nb_notes} /> },
          ]}
        />
        <Tableau
          legende="Moyenne brute contre note pondérée (un 5/5 isolé ne dépasse pas un 4,6 sur vingt notes)"
          lignes={ponderes}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Notes', numerique: true, cellule: (l) => l.nb_notes },
            { titre: 'Moyenne', numerique: true, cellule: (l) => nombre(l.moyenne) },
            { titre: 'Rang brut', numerique: true, cellule: (l) => l.rang_brut },
            { titre: 'Note pondérée', numerique: true, cellule: (l) => nombre(l.note_ponderee) },
            { titre: 'Rang pondéré', numerique: true, cellule: (l) => l.rang_pondere },
          ]}
        />
      </section>

      <section aria-labelledby="c-genres">
        <h2 id="c-genres">Le top 3 de chaque genre</h2>
        <Tableau
          legende="Les 3 films les mieux notés par genre (au moins 3 notes)"
          diagramme={{
            valeur: (l) => l.moyenne,
            max: 5,
            format: surCinq,
            libelle: (l) => (
              <>
                {l.genre} — <LienFilm id={l.id} titre={l.titre} />
              </>
            ),
          }}
          lignes={parGenre}
          cle={(l) => `${l.genre}-${l.rang}`}
          colonnes={[
            { titre: 'Genre', cellule: (l) => l.genre },
            { titre: 'Rang', numerique: true, cellule: (l) => l.rang },
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Moyenne', numerique: true, cellule: (l) => nombre(l.moyenne) },
          ]}
        />
      </section>

      <section aria-labelledby="c-realisateurs">
        <h2 id="c-realisateurs">Les réalisateurs</h2>
        <Tableau
          legende="Réalisateurs classés selon la note moyenne de l'ensemble de leurs films"
          diagramme={{
            valeur: (l) => l.moyenne,
            max: 5,
            format: surCinq,
            libelle: (l) => (
              <>
                {l.rang}. <LienPersonne id={l.id} nom={l.realisateur} />
              </>
            ),
          }}
          lignes={realisateurs}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Rang', numerique: true, cellule: (l) => l.rang },
            { titre: 'Réalisateur', cellule: (l) => <LienPersonne id={l.id} nom={l.realisateur} /> },
            { titre: 'Moyenne', numerique: true, cellule: (l) => nombre(l.moyenne) },
            { titre: 'Notes', numerique: true, cellule: (l) => l.nb_notes },
          ]}
        />
        <Tableau
          legende="Réalisateurs ayant au moins 2 films au catalogue"
          diagramme={{ valeur: (l) => l.nb_films, format: (n) => pluriel(n, 'film') }}
          lignes={prolif}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Réalisateur', cellule: (l) => <LienPersonne id={l.id} nom={l.realisateur} /> },
            { titre: 'Films', numerique: true, cellule: (l) => l.nb_films },
          ]}
        />
      </section>

      <section aria-labelledby="c-divisent">
        <h2 id="c-divisent">Les films qui divisent</h2>
        <Tableau
          legende="Les 5 films dont l'écart entre la meilleure et la pire note est le plus grand"
          diagramme={{ valeur: (l) => l.ecart, max: 4.5, format: (n) => `${nombre(n)} point${n > 1 ? 's' : ''}` }}
          lignes={divisent}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Pire note', numerique: true, cellule: (l) => nombre(l.pire) },
            { titre: 'Meilleure note', numerique: true, cellule: (l) => nombre(l.meilleure) },
            { titre: 'Écart', numerique: true, cellule: (l) => nombre(l.ecart) },
          ]}
        />
      </section>

      <section aria-labelledby="c-catalogue">
        <h2 id="c-catalogue">Dans le catalogue</h2>
        <Tableau
          legende="Films de plus de 2 h 30, du plus long au plus court"
          diagramme={{ valeur: (l) => l.duree_min, format: (n) => `${entier(n)} min` }}
          lignes={longs}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Durée', numerique: true, cellule: (l) => l.duree },
          ]}
        />
        <Tableau
          legende="Oscars du meilleur film"
          lignes={oscarises}
          cle={(l) => l.id}
          vide="Aucun Oscar du meilleur film dans le catalogue."
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
            { titre: 'Année', numerique: true, cellule: (l) => l.annee },
            { titre: 'Réalisateur', cellule: (l) => l.realisateur },
          ]}
        />
        <Tableau
          legende="Les 5 tags les plus utilisés"
          diagramme={{ valeur: (l) => l.nb_films, format: (n) => pluriel(n, 'film') }}
          lignes={tags}
          cle={(l) => l.tag}
          colonnes={[
            { titre: 'Tag', cellule: (l) => l.tag },
            { titre: 'Films', numerique: true, cellule: (l) => l.nb_films },
          ]}
        />
      </section>
    </>
  )
}
