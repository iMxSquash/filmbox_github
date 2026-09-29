'use client'

import { useActionState } from 'react'
import { sInscrire, type EtatInscription } from '@/app/inscription/actions'
import { Message } from '@/components/Message'

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(sInscrire, {})
  const invalide = etat.erreur !== undefined
  const erreurLiee = invalide ? 'erreur-inscription' : undefined

  return (
    <form action={action} className="formulaire" noValidate>
      {invalide && (
        <Message type="erreur" id="erreur-inscription">
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
          minLength={3}
          maxLength={30}
          defaultValue={etat.pseudo}
          aria-invalid={invalide}
          aria-describedby={`aide-pseudo${erreurLiee ? ` ${erreurLiee}` : ''}`}
        />
        <p id="aide-pseudo" className="aide">
          De 3 à 30 lettres, chiffres, points, tirets ou tirets bas. Il apparaît sur votre profil public.
        </p>
      </div>
      <div className="champ">
        <label htmlFor="mot_de_passe">Mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={invalide}
          aria-describedby={`aide-mdp${erreurLiee ? ` ${erreurLiee}` : ''}`}
        />
        <p id="aide-mdp" className="aide">
          8 caractères au minimum.
        </p>
      </div>
      <div className="champ">
        <label htmlFor="confirmation">Confirmer le mot de passe</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={invalide}
          aria-describedby={erreurLiee}
        />
      </div>
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? 'Création…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
