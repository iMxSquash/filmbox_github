import type { Metadata } from 'next'
import { rechercher } from '@/lib/db/films'
import { LienFilm } from '@/components/Liens'

export const metadata: Metadata = { title: 'Recherche' }

export default async function PageRecherche({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 100)
  const resultats = q ? await rechercher(q) : []

  return (
    <>
      <h1>Rechercher un film</h1>
      <form method="get" role="search" className="filtres">
        <div className="champ">
          <label htmlFor="q">Titre du film</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={100} autoComplete="off" />
        </div>
        <button type="submit" className="bouton">
          Rechercher
        </button>
      </form>

      {q && (
        <>
          <p role="status">
            {resultats.length === 0
              ? `Aucun film ne correspond à « ${q} ».`
              : `${resultats.length} ${resultats.length > 1 ? 'résultats' : 'résultat'} pour « ${q} » (5 au maximum).`}
          </p>
          <ul className="liste-nue">
            {resultats.map((r) => (
              <li key={r.id}>
                <LienFilm id={r.id} titre={r.titre} /> <span className="aide">({r.annee})</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
