import type { Metadata } from 'next'
import { Tableau } from '@/components/Tableau'
import { acteurs, chemin, inaccessibles, plusEloignes } from '@/lib/db/personnes'
import { identifiant } from '@/lib/params'
import { LienPersonne } from '@/components/Liens'

export const metadata: Metadata = { title: 'Le nombre de Bacon' }

export default async function PageBacon({ searchParams }: { searchParams: Promise<{ vers?: string }> }) {
  const versId = identifiant((await searchParams).vers)
  const [eloignes, tous, hors, trajet] = await Promise.all([
    plusEloignes(),
    acteurs(),
    inaccessibles(),
    versId ? chemin(versId) : Promise.resolve(null),
  ])
  const choisi = tous.find((a) => a.id === versId)

  return (
    <>
      <h1>Le nombre de Bacon</h1>
      <p className="intro">
        1 si l’acteur a joué avec Kevin Bacon, 2 s’il a joué avec quelqu’un qui a joué avec lui, et ainsi de suite,
        jusqu’à 4 degrés.
      </p>

      <section aria-labelledby="titre-chemin">
        <h2 id="titre-chemin">Le chemin vers Kevin Bacon</h2>
        <form method="get" className="filtres">
          <div className="champ">
            <label htmlFor="vers">Acteur</label>
            <select id="vers" name="vers" defaultValue={versId ?? ''}>
              <option value="">Choisir un acteur</option>
              {tous.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="bouton">
            Afficher le chemin
          </button>
        </form>
        {choisi && (
          <p role="status">
            {trajet
              ? `${choisi.nom} est à ${trajet.degre} degré${trajet.degre > 1 ? 's' : ''} : ${trajet.chemin}.`
              : `Aucun chemin de 3 degrés ou moins entre Kevin Bacon et ${choisi.nom}.`}
          </p>
        )}
      </section>

      <section aria-labelledby="titre-eloignes">
        <h2 id="titre-eloignes">Les acteurs les plus éloignés</h2>
        <Tableau
          legende="Nombre de Bacon, du plus éloigné au plus proche"
          lignes={eloignes}
          cle={(l) => l.id}
          colonnes={[
            { titre: 'Acteur', cellule: (l) => <LienPersonne id={l.id} nom={l.nom} /> },
            { titre: 'Nombre de Bacon', numerique: true, cellule: (l) => l.nombre_de_bacon },
          ]}
        />
      </section>

      <section aria-labelledby="titre-inaccessibles">
        <h2 id="titre-inaccessibles">Les inaccessibles</h2>
        <Tableau
          legende="Acteurs reliés à Kevin Bacon par aucun chemin"
          lignes={hors}
          cle={(l) => l.id}
          vide="Tous les acteurs du catalogue sont reliés à Kevin Bacon."
          colonnes={[{ titre: 'Acteur', cellule: (l) => <LienPersonne id={l.id} nom={l.nom} /> }]}
        />
      </section>
    </>
  )
}
