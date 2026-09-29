import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormulaireConnexion } from '@/app/connexion/FormulaireConnexion'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Connexion' }

export default async function PageConnexion() {
  if (await getSession()) redirect('/')

  return (
    <>
      <h1>Connexion</h1>
      <FormulaireConnexion />
    </>
  )
}
