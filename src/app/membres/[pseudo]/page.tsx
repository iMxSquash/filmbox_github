import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Note } from '@/components/Note'
import { Tableau } from '@/components/Tableau'
import {
  carte,
  compatibilite,
  derniersVisionnages,
  ecartsALaMoyenne,
  listesDuMembre,
  visionnagesParMois,
} from '@/lib/db/membres'
import { date, nombre, pluriel } from '@/lib/format'
import { getSession } from '@/lib/session'
import { LienFilm } from '@/components/Liens'

type Props = { params: Promise<{ pseudo: string }> }

const decoder = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const signe = (n: number) => `${n > 0 ? '+' : ''}${nombre(n)}`

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Profil de ${decoder((await params).pseudo)}` }
}

export default async function PageMembre({ params }: Props) {
  const pseudo = decoder((await params).pseudo)
  const session = await getSession()
  const moi = session?.membreId ?? null

  const c = await carte(moi, pseudo)
  if (!c) notFound()

  const [visionnages, mois, ecarts, listes, compat] = await Promise.all([
    derniersVisionnages(moi, pseudo),
    visionnagesParMois(moi, pseudo),
    ecartsALaMoyenne(pseudo),
    listesDuMembre(moi, pseudo),
    session && session.pseudo !== pseudo ? compatibilite(session.pseudo, pseudo) : Promise.resolve(null),
  ])

  return (
    <>
      <h1>{c.pseudo}</h1>
      <dl className="fiche">
        <dt>Inscrit le</dt>
        <dd>{date(c.inscrit_le)}</dd>
        <dt>Films notés</dt>
        <dd>{c.nb_films_notes}</dd>
        <dt>Note moyenne</dt>
        <dd>
          <Note valeur={c.note_moyenne} />
        </dd>
        <dt>Genre préféré</dt>
        <dd>{c.genre_prefere ?? 'aucun'}</dd>
        <dt>Coup de cœur</dt>
        <dd>
          {c.coup_de_coeur_id && c.coup_de_coeur ? <LienFilm id={c.coup_de_coeur_id} titre={c.coup_de_coeur} /> : 'aucun'}
        </dd>
      </dl>

      {compat && (
        <section aria-labelledby="m-compat">
          <h2 id="m-compat">Compatibilité avec vous</h2>
          <p>
            {compat.films_communs === 0
              ? 'Vous n’avez noté aucun film en commun.'
              : `${pluriel(compat.films_communs, 'film noté', 'films notés')} par vous deux, pour un écart moyen de ${nombre(compat.ecart_moyen ?? 0)} point.`}
          </p>
          <Tableau
            legende="Les films sur lesquels vous divergez le plus"
            lignes={compat.ecarts}
            cle={(l) => l.titre}
            vide="Aucun film en commun."
            colonnes={[
              { titre: 'Film', cellule: (l) => l.titre },
              { titre: 'Votre note', numerique: true, cellule: (l) => nombre(l.note_a) },
              { titre: `Note de ${c.pseudo}`, numerique: true, cellule: (l) => nombre(l.note_b) },
              { titre: 'Écart', numerique: true, cellule: (l) => nombre(l.ecart) },
            ]}
          />
        </section>
      )}

      <section aria-labelledby="m-journal">
        <h2 id="m-journal">Derniers visionnages</h2>
        <Tableau
          legende="Les 20 derniers visionnages et le nombre de jours écoulés depuis le précédent"
          lignes={visionnages}
          cle={(l, i) => `${l.film_id}-${l.date}-${i}`}
          vide="Aucun visionnage."
          colonnes={[
            { titre: 'Date', cellule: (l) => date(l.date) },
            {
              titre: 'Film',
              cellule: (l) => (
                <>
                  <LienFilm id={l.film_id} titre={l.titre} />{' '}
                  {l.prive && <span className="pastille">🔒 Privé</span>}
                </>
              ),
            },
            {
              titre: 'Jours depuis le précédent',
              numerique: true,
              cellule: (l) => l.jours_depuis_precedent ?? '—',
            },
          ]}
        />
        <Tableau
          legende="Visionnages par mois et cumul"
          lignes={mois}
          cle={(l) => l.mois}
          colonnes={[
            { titre: 'Mois', cellule: (l) => l.mois },
            { titre: 'Visionnages', numerique: true, cellule: (l) => l.nb },
            { titre: 'Cumul', numerique: true, cellule: (l) => l.cumul },
          ]}
        />
      </section>

      <section aria-labelledby="m-ecarts">
        <h2 id="m-ecarts">Plus sévère que la moyenne ?</h2>
        <Tableau
          legende="Chaque note comparée à la moyenne du film (tous membres)"
          lignes={ecarts}
          cle={(l) => l.film_id}
          vide="Aucune note."
          colonnes={[
            { titre: 'Film', cellule: (l) => <LienFilm id={l.film_id} titre={l.titre} /> },
            { titre: 'Sa note', numerique: true, cellule: (l) => nombre(l.note) },
            { titre: 'Moyenne du film', numerique: true, cellule: (l) => nombre(l.moyenne_film) },
            { titre: 'Écart', numerique: true, cellule: (l) => signe(l.ecart) },
          ]}
        />
      </section>

      <section aria-labelledby="m-listes">
        <h2 id="m-listes">Listes</h2>
        <Tableau
          legende="Listes de films"
          lignes={listes}
          cle={(l) => l.id}
          vide="Aucune liste."
          colonnes={[
            { titre: 'Liste', cellule: (l) => <Link href={`/listes/${l.id}`}>{l.titre}</Link> },
            { titre: 'Créée le', cellule: (l) => date(l.creee_le) },
            { titre: 'Visibilité', cellule: (l) => (l.publique ? 'Publique' : '🔒 Privée') },
          ]}
        />
      </section>
    </>
  )
}
