import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { FormulaireNote } from '@/app/films/[id]/FormulaireNote'
import { Note } from '@/components/Note'
import { Tableau } from '@/components/Tableau'
import { compterUneVue, distribution, evolutionNotes, fiche, noteDuMembre } from '@/lib/db/films'
import { episodes } from '@/lib/db/sagas'
import { date, nombre, pluriel, surCinq } from '@/lib/format'
import { identifiant } from '@/lib/params'
import { getSession } from '@/lib/session'
import { LienFilm, LienMembre, LienPersonne } from '@/components/Liens'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = identifiant((await params).id)
  const f = id ? await fiche(id) : null
  return { title: f ? `${f.titre} (${f.annee})` : 'Film introuvable' }
}

export default async function PageFilm({ params }: Props) {
  const filmId = identifiant((await params).id)
  const f = filmId ? await fiche(filmId) : null
  if (!filmId || !f) notFound()

  // M15.2 : une vue de plus, comptée après l'envoi de la page.
  // Le rendu qui suit une action (noter le film) n'est pas une consultation.
  if (!(await headers()).has('next-action')) after(() => compterUneVue(filmId))

  const session = await getSession()
  const [equipe, evolution, saga, noteActuelle] = await Promise.all([
    distribution(filmId),
    evolutionNotes(filmId),
    f.saga_id ? episodes(f.saga_id) : Promise.resolve([]),
    session ? noteDuMembre(session.membreId, filmId) : Promise.resolve(null),
  ])
  const acteurs = equipe.filter((p) => p.role === 'acteur')
  const realisateurs = equipe.filter((p) => p.role === 'realisateur')

  return (
    <>
      <h1>{f.titre}</h1>
      <dl className="fiche">
        <dt>Année</dt>
        <dd>{f.annee}</dd>
        <dt>Genre</dt>
        <dd>{f.genre}</dd>
        {f.duree && (
          <>
            <dt>Durée</dt>
            <dd>{f.duree}</dd>
          </>
        )}
        {f.details.pays && (
          <>
            <dt>Pays</dt>
            <dd>{f.details.pays.join(', ')}</dd>
          </>
        )}
        {f.details.langue && (
          <>
            <dt>Langue</dt>
            <dd>{f.details.langue}</dd>
          </>
        )}
        {f.details.tags && (
          <>
            <dt>Tags</dt>
            <dd>{f.details.tags.join(', ')}</dd>
          </>
        )}
        {f.details.oscar_meilleur_film && (
          <>
            <dt>Distinction</dt>
            <dd>Oscar du meilleur film</dd>
          </>
        )}
        <dt>Note moyenne</dt>
        <dd>
          <Note valeur={f.moyenne} nb={f.nb_notes} />
        </dd>
        {f.note_ponderee !== null && (
          <>
            <dt>Note pondérée</dt>
            <dd>
              {nombre(f.note_ponderee)} / 5 <span className="aide">(tient compte du nombre de notes)</span>
            </dd>
          </>
        )}
        <dt>Consultations</dt>
        <dd>{pluriel(f.nb_vues, 'vue')}</dd>
      </dl>

      <section aria-labelledby="titre-equipe">
        <h2 id="titre-equipe">Réalisation et distribution</h2>
        <p>
          <strong>Réalisation :</strong>{' '}
          {realisateurs.length === 0
            ? 'non renseignée'
            : realisateurs.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <LienPersonne id={p.id} nom={p.nom} />
                </span>
              ))}
        </p>
        <p>
          <strong>Avec :</strong>{' '}
          {acteurs.length === 0
            ? 'non renseignée'
            : acteurs.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ', '}
                  <LienPersonne id={p.id} nom={p.nom} />
                </span>
              ))}
        </p>
      </section>

      {saga.length > 0 && (
        <section aria-labelledby="titre-saga">
          <h2 id="titre-saga">La saga « {saga[0]?.saga} »</h2>
          <Tableau
            legende="Épisodes dans l'ordre, classés par note moyenne"
            lignes={saga}
            cle={(l) => l.film_id}
            colonnes={[
              { titre: 'Épisode', numerique: true, cellule: (l) => l.episode },
              {
                titre: 'Film',
                cellule: (l) =>
                  l.film_id === filmId ? (
                    <strong>{l.titre} (ce film)</strong>
                  ) : (
                    <LienFilm id={l.film_id} titre={l.titre} />
                  ),
              },
              { titre: 'Année', numerique: true, cellule: (l) => l.annee },
              { titre: 'Moyenne', numerique: true, cellule: (l) => <Note valeur={l.moyenne} /> },
              { titre: 'Rang dans la saga', numerique: true, cellule: (l) => l.rang },
            ]}
          />
        </section>
      )}

      <section aria-labelledby="titre-noter">
        <h2 id="titre-noter">Noter ce film</h2>
        {session ? (
          <FormulaireNote filmId={filmId} noteActuelle={noteActuelle} />
        ) : (
          <p>
            <Link href="/connexion">Connectez-vous</Link> pour noter ce film.
          </p>
        )}
      </section>

      <section aria-labelledby="titre-evolution">
        <h2 id="titre-evolution">Évolution de la note</h2>
        <Tableau
          legende="Chaque note reçue et la moyenne cumulée après cette note"
          diagramme={{
            valeur: (l) => l.moyenne_cumulee,
            max: 5,
            format: surCinq,
            legende: 'Moyenne cumulée après chaque note',
            libelle: (l) => `${date(l.note_le)} — ${l.pseudo}`,
          }}
          lignes={evolution}
          cle={(l) => `${l.note_le}-${l.pseudo}`}
          vide="Ce film n'a pas encore été noté."
          colonnes={[
            { titre: 'Date', cellule: (l) => date(l.note_le) },
            { titre: 'Membre', cellule: (l) => <LienMembre pseudo={l.pseudo} /> },
            { titre: 'Note', numerique: true, cellule: (l) => nombre(l.note) },
            { titre: 'Moyenne cumulée', numerique: true, cellule: (l) => nombre(l.moyenne_cumulee) },
          ]}
        />
      </section>
    </>
  )
}
