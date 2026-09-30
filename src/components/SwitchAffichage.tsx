import { basculerAffichage } from '@/app/affichage'
import { lireAffichage } from '@/lib/affichage'

// Interrupteur natif (bouton role="switch") : fonctionne sans JavaScript, l'état est annoncé.
export async function SwitchAffichage() {
  const diagrammes = (await lireAffichage()) === 'diagramme'

  return (
    <form action={basculerAffichage}>
      <input type="hidden" name="mode" value={diagrammes ? 'tableau' : 'diagramme'} />
      <button type="submit" role="switch" aria-checked={diagrammes} className="bascule">
        <span className="bascule-piste" aria-hidden="true">
          <span className="bascule-curseur" />
        </span>
        <span>Diagrammes</span>
      </button>
    </form>
  )
}
