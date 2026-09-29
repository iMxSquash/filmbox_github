import type { Metadata } from 'next'
import { z } from 'zod'
import { Pagination } from '@/components/Pagination'
import { Tableau } from '@/components/Tableau'
import { catalogue, genres, TAILLE_PAGE } from '@/lib/db/films'
import { LienFilm } from '@/components/Liens'

export const metadata: Metadata = { title: 'Films' }

const ANNEE_MIN = 1888
const ANNEE_MAX = 2100

// Un paramètre invalide ou vide est simplement ignoré (.catch) : jamais d'erreur pour une URL saisie à la main.
const annee = z.coerce.number().int().min(ANNEE_MIN).max(ANNEE_MAX).optional().catch(undefined)
const parametres = z.object({
  anneeMin: annee,
  anneeMax: annee,
  genre: z.string().trim().max(30).catch(''),
  tri: z.enum(['annee', 'titre']).catch('annee'),
  page: z.coerce.number().int().min(1).catch(1),
})

export default async function PageFilms({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const brut = await searchParams
  const f = parametres.parse(brut)
  const [{ films, total }, listeGenres] = await Promise.all([catalogue(f), genres()])
  const href = (page: number) => `/films?${new URLSearchParams({ ...brut, page: String(page) })}`

  return (
    <>
      <h1>Films</h1>

      <form method="get" className="filtres" aria-label="Filtrer les films">
        <div className="champ">
          <label htmlFor="anneeMin">Année minimum</label>
          <input id="anneeMin" name="anneeMin" type="number" min={ANNEE_MIN} max={ANNEE_MAX} defaultValue={f.anneeMin} />
        </div>
        <div className="champ">
          <label htmlFor="anneeMax">Année maximum</label>
          <input id="anneeMax" name="anneeMax" type="number" min={ANNEE_MIN} max={ANNEE_MAX} defaultValue={f.anneeMax} />
        </div>
        <div className="champ">
          <label htmlFor="genre">Genre</label>
          <select id="genre" name="genre" defaultValue={f.genre}>
            <option value="">Tous les genres</option>
            {listeGenres.map((g) => (
              <option key={g.genre} value={g.genre}>
                {g.genre}
              </option>
            ))}
          </select>
        </div>
        <div className="champ">
          <label htmlFor="tri">Trier par</label>
          <select id="tri" name="tri" defaultValue={f.tri}>
            <option value="annee">Année</option>
            <option value="titre">Titre</option>
          </select>
        </div>
        <button type="submit" className="bouton">
          Filtrer
        </button>
      </form>

      <p role="status">
        {total} {total > 1 ? 'films trouvés' : 'film trouvé'}.
      </p>
      <Tableau
        legende="Catalogue"
        lignes={films}
        cle={(l) => l.id}
        vide="Aucun film ne correspond à ces critères."
        colonnes={[
          { titre: 'Titre', cellule: (l) => <LienFilm id={l.id} titre={l.titre} /> },
          { titre: 'Année', numerique: true, cellule: (l) => l.annee },
          { titre: 'Genre', cellule: (l) => l.genre },
        ]}
      />
      <Pagination page={f.page} total={total} taille={TAILLE_PAGE} href={href} />
    </>
  )
}
