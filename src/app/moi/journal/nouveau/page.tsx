import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormulaireSoiree } from '@/app/moi/journal/nouveau/FormulaireSoiree'
import { choixDeFilms } from '@/lib/db/journal'
import { aujourdhui } from '@/lib/format'
import { getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Ajouter des visionnages' }

export default async function PageNouvelleSoiree() {
  const session = await getSession()
  if (!session) redirect('/connexion')
  const films = await choixDeFilms()

  return (
    <>
      <h1>Ajouter des visionnages</h1>
      <p className="intro">La soirée est enregistrée entièrement ou pas du tout.</p>
      <FormulaireSoiree films={films} aujourdhui={aujourdhui()} />
    </>
  )
}
