import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Tableau } from '@/components/Tableau'
import { liste } from '@/lib/db/listes'
import { date } from '@/lib/format'
import { identifiant } from '@/lib/params'
import { getSession } from '@/lib/session'
import { LienFilm, LienMembre } from '@/components/Liens'

type Props = { params: Promise<{ id: string }> }

const charger = cache(async (membreId: number | null, id: number) => liste(membreId, id))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = identifiant((await params).id)
  const l = id ? await charger((await getSession())?.membreId ?? null, id) : null
  return { title: l?.titre ?? 'Liste introuvable' }
}

export default async function PageListe({ params }: Props) {
  const id = identifiant((await params).id)
  const session = await getSession()
  const l = id ? await charger(session?.membreId ?? null, id) : null
  // Une liste privée d'autrui est masquée par la RLS : elle est traitée comme inexistante
  if (!l) notFound()

  return (
    <>
      <h1>{l.titre}</h1>
      <p className="intro">
        Par <LienMembre pseudo={l.pseudo} />, créée le {date(l.creee_le)}
        {l.publique ? '' : ' · 🔒 Liste privée'}.
      </p>
      <Tableau
        legende="Films de la liste, dans l'ordre"
        lignes={l.films}
        cle={(f) => f.id}
        vide="Cette liste est vide."
        colonnes={[
          { titre: 'Position', numerique: true, cellule: (f) => f.position },
          { titre: 'Film', cellule: (f) => <LienFilm id={f.id} titre={f.titre} /> },
        ]}
      />
    </>
  )
}
