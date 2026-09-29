import Link from 'next/link'
import { deconnecter } from '@/app/connexion/actions'
import { NavLien } from '@/components/NavLien'
import { getSession } from '@/lib/session'
import { LienMembre } from '@/components/Liens'

const LIENS = [
  { href: '/', titre: 'Accueil' },
  { href: '/films', titre: 'Films' },
  { href: '/recherche', titre: 'Recherche' },
  { href: '/sagas', titre: 'Sagas' },
  { href: '/classements', titre: 'Classements' },
  { href: '/statistiques', titre: 'Statistiques' },
  { href: '/membres', titre: 'Membres' },
  { href: '/kevin-bacon', titre: 'Kevin Bacon' },
]

const LIENS_MEMBRE = [
  { href: '/moi/a-voir', titre: 'À voir' },
  { href: '/moi/journal/nouveau', titre: 'Ajouter des visionnages' },
]

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
            {LIENS.map((l) => (
              <li key={l.href}>
                <NavLien href={l.href}>{l.titre}</NavLien>
              </li>
            ))}
            {session &&
              LIENS_MEMBRE.map((l) => (
                <li key={l.href}>
                  <NavLien href={l.href}>{l.titre}</NavLien>
                </li>
              ))}
          </ul>
        </nav>
        <div className="compte">
          {session ? (
            <>
              <span>
                Connecté : <LienMembre pseudo={session.pseudo} />
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
