'use client'

import { useActionState } from 'react'
import { Message } from '@/components/Message'
import { ajouterSoiree, type EtatSoiree } from '@/app/moi/journal/nouveau/actions'

const EMPLACEMENTS = [1, 2, 3, 4, 5]

export function FormulaireSoiree({
  films,
  aujourdhui,
}: {
  films: { id: number; titre: string; annee: number }[]
  aujourdhui: string
}) {
  const [etat, action, enCours] = useActionState<EtatSoiree, FormData>(ajouterSoiree, {})

  return (
    <form action={action} className="formulaire">
      {etat.erreur && <Message type="erreur">{etat.erreur}</Message>}
      <div className="champ">
        <label htmlFor="jour">Date de la soirée</label>
        <input id="jour" name="jour" type="date" required max={aujourdhui} defaultValue={aujourdhui} />
      </div>
      <fieldset>
        <legend>Films vus (au moins un)</legend>
        {EMPLACEMENTS.map((n) => (
          <div className="champ" key={n}>
            <label htmlFor={`film-${n}`}>Film {n}</label>
            <select id={`film-${n}`} name="film" required={n === 1} defaultValue="">
              <option value="">{n === 1 ? 'Choisir un film' : 'Aucun'}</option>
              {films.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.titre} ({f.annee})
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>
      <label className="case">
        <input type="checkbox" name="prive" /> Soirée privée (visible de vous seul)
      </label>
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? 'Enregistrement…' : 'Enregistrer la soirée'}
      </button>
    </form>
  )
}
