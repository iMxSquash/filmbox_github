import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FormulaireInscription } from '@/app/inscription/FormulaireInscription'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Créer un compte' }

export default async function PageInscription() {
  if (await getSession()) redirect('/')

  return (
    <>
      <h1>Créer un compte</h1>
      <FormulaireInscription />
      <p>
        Déjà membre ? <Link href="/connexion">Se connecter</Link>
      </p>
    </>
  )
}
