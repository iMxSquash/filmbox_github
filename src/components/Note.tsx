import { nombre, pluriel } from '@/lib/format'

// Étoile décorative + valeur en toutes lettres : l'information ne repose jamais sur l'icône.
export function Note({ valeur, nb }: { valeur: number | null; nb?: number }) {
  if (valeur === null) return <span className="aide">Pas encore noté</span>
  return (
    <span className="note">
      <span aria-hidden="true" className="etoile">
        ★
      </span>{' '}
      {nombre(valeur)} / 5{nb !== undefined && <span className="aide"> ({pluriel(nb, 'note')})</span>}
    </span>
  )
}
