// Erreurs de la base traduites pour l'utilisateur. Aucune trace SQL ne quitte le serveur.

const GENERIQUE = 'Une erreur est survenue, veuillez réessayer.'

export function messageUtilisateur(erreur: unknown): string {
  switch ((erreur as { code?: unknown } | null)?.code) {
    // RAISE EXCEPTION des procédures FilmBox (M13.2) : messages écrits pour l'équipe front,
    // ex. « Note invalide : 6 (de 0,5 à 5, par demi-point) », « Film inconnu : Avatar »
    case 'P0001':
      return (erreur as Error).message
    // Droit manquant ou politique RLS violée (M16)
    case '42501':
      return "Vous n'avez pas le droit d'effectuer cette action."
    case '23503':
      return "L'élément demandé n'existe pas."
    case '23505':
      return 'Cet élément existe déjà.'
    case '23514':
    case '22P02':
    case '22003':
      return 'Une valeur saisie est invalide.'
    // Échec de sérialisation, interblocage (N37) : relancer suffit
    case '40001':
    case '40P01':
      return 'Un conflit est survenu, veuillez réessayer.'
    default:
      console.error(erreur)
      return GENERIQUE
  }
}
