import Link from 'next/link'
import { deconnecter } from '@/app/connexion/actions'
import { NavLien } from '@/components/NavLien'
import { getSession } from '@/lib/session'

export async function EnTete() {
  const session = await getSession()

  return (
    <header className="en-tete">
      <div className="conteneur">
        <Link href="/" className="logo">
          FilmBox
        </Link>
        <nav className="navigation" aria-label="Navigation principale">
          <ul>
            <li>
              <NavLien href="/">Accueil</NavLien>
            </li>
          </ul>
        </nav>
        <div className="compte">
          {session ? (
            <>
              <span>
                Connecté : <strong>{session.pseudo}</strong>
              </span>
              <form action={deconnecter}>
                <button type="submit" className="bouton bouton-secondaire">
                  Se déconnecter
                </button>
              </form>
            </>
          ) : (
            <NavLien href="/connexion">Se connecter</NavLien>
          )}
        </div>
      </div>
    </header>
  )
}
