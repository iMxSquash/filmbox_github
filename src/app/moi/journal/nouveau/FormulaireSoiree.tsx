'use client'

import { useActionState, useState, useTransition } from 'react'
import { ajouterSoiree, chercherFilms, type EtatSoiree } from '@/app/moi/journal/nouveau/actions'
import { Message } from '@/components/Message'
import { pluriel } from '@/lib/format'
import { MAX_FILMS } from '@/lib/journal'

type Film = { id: number; titre: string; annee: number }

export function FormulaireSoiree({ aujourdhui }: { aujourdhui: string }) {
  const [etat, action, enCours] = useActionState<EtatSoiree, FormData>(ajouterSoiree, {})
  const [choisis, setChoisis] = useState<Film[]>([])
  const [texte, setTexte] = useState('')
  const [resultats, setResultats] = useState<Film[]>([])
  const [annonce, setAnnonce] = useState('')
  const [recherche, lancer] = useTransition()

  const chercher = () =>
    lancer(async () => {
      const trouves = await chercherFilms(texte)
      setResultats(trouves)
      setAnnonce(trouves.length === 0 ? `Aucun film ne correspond à « ${texte} ».` : `${pluriel(trouves.length, 'résultat')}.`)
    })

  const ajouter = (f: Film) => {
    setChoisis((c) => [...c, f])
    setAnnonce(`${f.titre} ajouté à la soirée.`)
  }
  const retirer = (f: Film) => {
    setChoisis((c) => c.filter((x) => x.id !== f.id))
    setAnnonce(`${f.titre} retiré de la soirée.`)
  }

  return (
    <form action={action} className="formulaire">
      {etat.erreur && <Message type="erreur">{etat.erreur}</Message>}

      <div className="champ">
        <label htmlFor="jour">Date de la soirée</label>
        <input id="jour" name="jour" type="date" required max={aujourdhui} defaultValue={aujourdhui} />
      </div>

      <fieldset>
        <legend>Films vus (au moins un, {MAX_FILMS} au maximum)</legend>

        <div role="search" className="champ">
          <label htmlFor="recherche-film">Rechercher un film par son titre</label>
          <input
            id="recherche-film"
            type="search"
            value={texte}
            maxLength={100}
            autoComplete="off"
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                chercher()
              }
            }}
          />
          <button type="button" className="bouton bouton-secondaire" onClick={chercher} disabled={recherche || !texte.trim()}>
            {recherche ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>

        <p role="status" className="aide">
          {annonce}
        </p>

        {resultats.length > 0 && (
          <ul className="liste-nue">
            {resultats.map((f) => (
              <li key={f.id}>
                {f.titre} <span className="aide">({f.annee})</span>{' '}
                <button
                  type="button"
                  className="bouton bouton-secondaire"
                  onClick={() => ajouter(f)}
                  disabled={choisis.some((c) => c.id === f.id) || choisis.length >= MAX_FILMS}
                  aria-label={`Ajouter ${f.titre} (${f.annee})`}
                >
                  Ajouter
                </button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="sous-titre">Films de la soirée</h2>
        {choisis.length === 0 ? (
          <p className="aide">Aucun film choisi.</p>
        ) : (
          <ul className="liste-nue">
            {choisis.map((f) => (
              <li key={f.id}>
                <input type="hidden" name="film" value={f.id} />
                {f.titre} <span className="aide">({f.annee})</span>{' '}
                <button
                  type="button"
                  className="bouton bouton-secondaire"
                  onClick={() => retirer(f)}
                  aria-label={`Retirer ${f.titre} (${f.annee})`}
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <label className="case">
        <input type="checkbox" name="prive" /> Soirée privée (visible de vous seul)
      </label>
      <button type="submit" className="bouton" disabled={enCours || choisis.length === 0}>
        {enCours ? 'Enregistrement…' : 'Enregistrer la soirée'}
      </button>
    </form>
  )
}
