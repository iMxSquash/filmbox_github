import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import { EnTete } from '@/components/EnTete'
import './globals.css'

// Polices auto-hébergées par Next au build : aucune requête vers un tiers à l'exécution.
const titre = Fraunces({ subsets: ['latin'], variable: '--font-titre', display: 'swap' })
const texte = Inter({ subsets: ['latin'], variable: '--font-texte', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'FilmBox', template: '%s — FilmBox' },
  description: 'FilmBox : le catalogue, les notes et le journal des cinéphiles.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable}`}>
      <body>
        <a className="evitement" href="#contenu">
          Aller au contenu
        </a>
        <EnTete />
        <main id="contenu" tabIndex={-1}>
          <div className="conteneur">{children}</div>
        </main>
        <footer className="pied">
          <div className="conteneur">
            <p>FilmBox - projet fil rouge PostgreSQL - Elwen COUSSOT</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
