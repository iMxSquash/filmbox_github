import { useId } from 'react'
import { largeur } from '@/lib/diagramme'
import { lireAffichage } from '@/lib/affichage'
import { nombre } from '@/lib/format'

export type Colonne<T> = {
  titre: string
  numerique?: boolean
  cellule: (ligne: T) => React.ReactNode
}

// Diagramme à barres équivalent au tableau, affiché quand l'interrupteur « Diagrammes » est actif.
// Un tableau sans `diagramme` (plusieurs séries, valeurs négatives, totaux) reste un tableau.
export type Diagramme<T> = {
  valeur: (ligne: T) => number | null
  format?: (valeur: number) => string
  max?: number
  legende?: string
  libelle?: (ligne: T) => React.ReactNode
}

type Props<T> = {
  legende: string
  colonnes: Colonne<T>[]
  lignes: T[]
  cle: (ligne: T, index: number) => string | number
  total?: (ligne: T) => boolean
  vide?: string
  diagramme?: Diagramme<T>
}

// Lit la préférence d'affichage (cookie) puis délègue : le rendu porte les hooks, donc reste synchrone.
export async function Tableau<T>(props: Props<T>) {
  const enDiagramme = props.diagramme !== undefined && (await lireAffichage()) === 'diagramme'
  return <Rendu {...props} enDiagramme={enDiagramme} />
}

// Tableau de données accessible : <caption>, <th scope>, région défilante focusable au clavier
// (sur mobile, le tableau défile dans son conteneur, pas la page).
function Rendu<T>({
  legende,
  colonnes,
  lignes,
  cle,
  total,
  vide = 'Aucune donnée.',
  diagramme,
  enDiagramme,
}: Props<T> & { enDiagramme: boolean }) {
  const id = useId()
  if (lignes.length === 0) {
    return (
      <p>
        <strong>{legende}</strong> — {vide}
      </p>
    )
  }

  if (diagramme && enDiagramme) {
    const valeurs = lignes.map((l) => diagramme.valeur(l))
    const max = diagramme.max ?? Math.max(1, ...valeurs.map((v) => v ?? 0))
    const format = diagramme.format ?? nombre
    return (
      <figure className="diagramme" aria-labelledby={id}>
        <figcaption id={id}>{diagramme.legende ?? legende}</figcaption>
        <ul className="barres" role="list">
          {lignes.map((l, i) => {
            const v = valeurs[i] ?? null
            return (
              <li key={cle(l, i)}>
                <span>{diagramme.libelle ? diagramme.libelle(l) : colonnes[0]?.cellule(l)}</span>
                <span className="barre-valeur">{v === null ? 'aucune donnée' : format(v)}</span>
                <svg className="barre" aria-hidden="true" focusable="false">
                  <rect className="barre-piste" width="100%" height="100%" rx="4" />
                  <rect className="barre-remplie" width={`${largeur(v ?? 0, max)}%`} height="100%" rx="4" />
                </svg>
              </li>
            )
          })}
        </ul>
      </figure>
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
