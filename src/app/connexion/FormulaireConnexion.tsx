'use client'

import { useActionState } from 'react'
import { Message } from '@/components/Message'
import { connecter, type EtatConnexion } from '@/app/connexion/actions'

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connecter, {})
  const invalide = etat.erreur !== undefined

  return (
    <form action={action} className="formulaire" noValidate>
      {invalide && (
        <Message type="erreur" id="erreur-connexion">
          {etat.erreur}
        </Message>
      )}
      <div className="champ">
        <label htmlFor="pseudo">Pseudo</label>
        <input
          id="pseudo"
          name="pseudo"
          type="text"
          autoComplete="username"
          required
          maxLength={30}
          defaultValue={etat.pseudo}
          aria-invalid={invalide}
          aria-describedby={invalide ? 'erreur-connexion' : undefined}
        />
      </div>
      <div className="champ">
        <label htmlFor="mot_de_passe">Mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={invalide}
          aria-describedby={invalide ? 'erreur-connexion' : undefined}
        />
      </div>
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
