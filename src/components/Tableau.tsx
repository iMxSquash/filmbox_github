import { useId } from 'react'

export type Colonne<T> = {
  titre: string
  numerique?: boolean
  cellule: (ligne: T) => React.ReactNode
}

// Tableau de données accessible : <caption>, <th scope>, région défilante focusable au clavier
// (sur mobile, le tableau défile dans son conteneur, pas la page).
export function Tableau<T>({
  legende,
  colonnes,
  lignes,
  cle,
  total,
  vide = 'Aucune donnée.',
}: {
  legende: string
  colonnes: Colonne<T>[]
  lignes: T[]
  cle: (ligne: T, index: number) => string | number
  total?: (ligne: T) => boolean
  vide?: string
}) {
  const id = useId()
  if (lignes.length === 0) {
    return (
      <p>
        <strong>{legende}</strong> — {vide}
      </p>
    )
  }
  return (
    <div className="tableau-defilant" role="region" aria-labelledby={id} tabIndex={0}>
      <table>
        <caption id={id}>{legende}</caption>
        <thead>
          <tr>
            {colonnes.map((c) => (
              <th key={c.titre} scope="col" className={c.numerique ? 'num' : undefined}>
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={cle(l, i)} className={total?.(l) ? 'total' : undefined}>
              {colonnes.map((c, j) => {
                const contenu = c.cellule(l)
                return j === 0 ? (
                  <th key={c.titre} scope="row">
                    {contenu}
                  </th>
                ) : (
                  <td key={c.titre} className={c.numerique ? 'num' : undefined}>
                    {contenu}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
