import { Note } from '@/components/Note'
import { Tableau } from '@/components/Tableau'
import { mieuxNotes, tendances } from '@/lib/db/films'
import { getSession } from '@/lib/session'
import { LienFilm } from '@/components/Liens'

export default async function Accueil() {
  const [session, plusVus, meilleurs] = await Promise.all([getSession(), tendances(), mieuxNotes()])
  const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <>
      <h1>FilmBox</h1>
      <p className="intro">
        {session ? `Bienvenue ${session.pseudo}. ` : ''}
        Le catalogue, les notes et le journal des cinéphiles.
      </p>

      <div className="deux-colonnes">
        <section aria-labelledby="titre-tendances">
          <h2 id="titre-tendances">Tendances</h2>
          <Tableau
            legende={`Les 5 films les plus vus en ${mois}`}
            lignes={plusVus}
            cle={(l) => l.id}
            vide="Aucun visionnage ce mois-ci."
            colonnes={[
              { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
              { titre: 'Visionnages', numerique: true, cellule: (l) => l.vues },
            ]}
          />
        </section>

        <section aria-labelledby="titre-meilleurs">
          <h2 id="titre-meilleurs">Les mieux notés</h2>
          <Tableau
            legende="5 films les mieux notés (au moins 5 notes)"
            lignes={meilleurs}
            cle={(l) => l.id}
            vide="Pas encore assez de notes."
            colonnes={[
              { titre: 'Film', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
              { titre: 'Moyenne', numerique: true, cellule: (l) => <Note valeur={l.moyenne} nb={l.nb_notes} /> },
            ]}
          />
        </section>
      </div>
    </>
  )
}
