'use client'

import { useActionState } from 'react'
import { noterFilm, type EtatNote } from '@/app/films/[id]/actions'
import { Message } from '@/components/Message'
import { nombre } from '@/lib/format'

const NOTES = Array.from({ length: 10 }, (_, i) => (i + 1) / 2)

export function FormulaireNote({ filmId, noteActuelle }: { filmId: number; noteActuelle: number | null }) {
  const [etat, action, enCours] = useActionState<EtatNote, FormData>(noterFilm, {})

  return (
    <form action={action} className="formulaire">
      <input type="hidden" name="film_id" value={filmId} />
      <fieldset aria-describedby={etat.erreur ? 'erreur-note' : undefined}>
        <legend>Votre note (de 0,5 à 5)</legend>
        <div className="notes-saisie">
          {NOTES.map((n) => (
            <label key={n}>
              <input type="radio" name="note" value={n} defaultChecked={n === noteActuelle} required />
              {nombre(n)}
            </label>
          ))}
        </div>
      </fieldset>
      {etat.erreur && (
        <Message type="erreur" id="erreur-note">
          {etat.erreur}
        </Message>
      )}
      {etat.succes && <Message type="succes">{etat.succes}</Message>}
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? 'Enregistrement…' : noteActuelle === null ? 'Noter ce film' : 'Modifier ma note'}
      </button>
    </form>
  )
}
