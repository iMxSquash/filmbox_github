# Charte graphique FilmBox

> **Salle obscure, programme papier.** Un site de cinéphiles sobre : le contenu (titres, notes, chiffres) est la vedette, l'interface s'efface. Rouge velours pour l'action, or pour les étoiles, typographie éditoriale.

Cible : **WCAG 2.2 AA / RGAA 4.1**. Tous les contrastes ci-dessous ont été calculés (formule WCAG), pas estimés.

## 1. Couleurs (tokens)

Deux thèmes, choisis par `prefers-color-scheme`. Les composants n'utilisent **que les tokens sémantiques**, jamais une valeur hexadécimale.

| Token | Rôle | Clair | Sombre |
|---|---|---|---|
| `--fond` | Fond de page | `#FAF7F2` | `#121014` |
| `--surface` | Cartes, tableaux, champs | `#FFFFFF` | `#1E1B20` |
| `--texte` | Texte principal | `#1C1917` | `#F5F2EC` |
| `--texte-secondaire` | Métadonnées, légendes | `#57534E` | `#B8B2A9` |
| `--bordure` | Contours des champs et contrôles | `#78716C` | `#8A837A` |
| `--accent` | Liens, bouton principal, sélection | `#9F1239` | `#FB7185` |
| `--sur-accent` | Texte sur fond `--accent` | `#FFFFFF` | `#1C0A10` |
| `--etoile` | Notes, étoiles | `#8A5A00` | `#F5C542` |
| `--succes` | Confirmation | `#166534` | `#4ADE80` |
| `--erreur` | Erreurs de formulaire | `#B91C1C` | `#F87171` |
| `--focus` | Anneau de focus | `#1D4ED8` | `#93C5FD` |

### Contrastes vérifiés

| Paire | Clair | Sombre | Exigence |
|---|---|---|---|
| texte / fond | 16,37 | 16,93 | 4,5 (AA) |
| texte-secondaire / fond | 7,14 | 8,99 | 4,5 |
| accent / fond | 7,50 | 7,03 | 4,5 |
| sur-accent / accent | 8,02 | 7,09 | 4,5 |
| etoile / fond | 5,55 | 11,67 | 4,5 |
| succes / fond | 6,67 | 10,86 | 4,5 |
| erreur / fond | 6,05 | 6,84 | 4,5 |
| focus / fond | 6,27 | 10,49 | 3 (non textuel) |
| bordure / surface | 4,80 | 4,55 | 3 (non textuel) |

Règles :
- **Jamais la couleur seule** pour porter une information : une erreur a une icône + un texte ; une note a sa valeur chiffrée (« 4,5 / 5 ») à côté des étoiles ; un lien dans un paragraphe est souligné.
- Toute nouvelle couleur passe par un token et un calcul de contraste consigné ici.

## 2. Typographie

| Usage | Police | Repli |
|---|---|---|
| Titres (`h1`–`h3`, titre de film) | **Fraunces** (variable, auto-hébergée) | `Georgia, serif` |
| Texte, interface, tableaux | **Inter** (variable, auto-hébergée) | `system-ui, sans-serif` |
| Chiffres dans les tableaux | Inter avec `font-variant-numeric: tabular-nums` | — |

Polices auto-hébergées (pas de CDN : RGPD + CSP stricte), `font-display: swap`.

Échelle (en `rem`, base 16 px ; jamais de `px` pour le texte afin de respecter le zoom 200 %) :

| Token | Taille | Interligne | Usage |
|---|---|---|---|
| `--t-xs` | 0,8125 rem | 1,4 | Mentions, légendes de tableaux |
| `--t-sm` | 0,875 rem | 1,5 | Métadonnées |
| `--t-base` | 1 rem | 1,6 | Texte courant |
| `--t-lg` | 1,25 rem | 1,4 | Intertitres (`h3`) |
| `--t-xl` | 1,75 rem | 1,25 | `h2` |
| `--t-2xl` | 2,5 rem | 1,1 | `h1`, titre de la fiche film |

Longueur de ligne du texte courant : 65 caractères max (`max-width: 65ch`). Un seul `h1` par page, hiérarchie des titres sans saut.

## 3. Espacements, formes, élévation

- Espacements sur une grille de 4 px : `--e-1` 0,25 rem · `--e-2` 0,5 rem · `--e-3` 0,75 rem · `--e-4` 1 rem · `--e-6` 1,5 rem · `--e-8` 2 rem · `--e-12` 3 rem.
- Rayons : `--rayon` 6 px (champs, boutons), `--rayon-carte` 10 px. Pas d'autres valeurs.
- Élévation : une seule ombre, `--ombre: 0 1px 3px rgb(0 0 0 / .12)`, uniquement sur les cartes au survol. En sombre, on distingue par `--surface` plutôt que par l'ombre.
- Mise en page : conteneur de 72 rem max, gouttière de 1 rem sur mobile. Grille des cartes de films : `repeat(auto-fill, minmax(12rem, 1fr))`.
- Points de rupture : 40 rem, 64 rem. Aucun défilement horizontal à 320 px de large (sauf tableaux de données, dans un conteneur défilant et focusable avec `tabindex="0"` + `aria-label`).

## 4. Composants

| Composant | Règles |
|---|---|
| **Lien d'évitement** | Premier élément focusable : « Aller au contenu », visible au focus. |
| **En-tête / navigation** | `<header>` + `<nav aria-label="Navigation principale">`, page courante marquée par `aria-current="page"` (et pas seulement par la couleur). |
| **Bouton principal** | Fond `--accent`, texte `--sur-accent`. Un seul par écran. Cible ≥ 44×44 px. |
| **Bouton secondaire** | Contour `--bordure`, texte `--texte`. |
| **Focus** | `outline: 3px solid var(--focus); outline-offset: 2px` sur `:focus-visible`, **jamais supprimé**. |
| **Champ de formulaire** | `<label>` visible et associé, aide et erreur reliées par `aria-describedby`, `aria-invalid="true"` en erreur, `autocomplete` renseigné. |
| **Carte film** | Titre (lien, zone cliquable = titre), année, genre, note moyenne. Pas d'affiche : la base n'en a pas. |
| **Note (affichage)** | Étoiles décoratives (`aria-hidden="true"`) + texte « 4,5 / 5 (12 notes) ». |
| **Note (saisie)** | `<fieldset>` + `<legend>` + 10 boutons radio natifs (0,5 à 5 par demi-point, règle de `noter()`), navigables aux flèches. |
| **Tableau de données** | `<caption>`, `<th scope>`, chiffres alignés à droite en `tabular-nums`. Les lignes de total (ROLLUP) sont en gras **et** libellées « Total ». |
| **Message d'état** | Région `role="status"` (succès) ou `role="alert"` (erreur) ; texte clair repris des messages de la base (« Note invalide : 6 (de 0,5 à 5, par demi-point) »). |
| **Pastille « privé »** | Icône cadenas + texte « Privé ». |
| **Pagination** | `<nav aria-label="Pagination">`, liens « Précédent / Suivant » explicites. |

## 5. Iconographie et mouvement

- Icônes : un seul jeu, trait de 1,5 px (Lucide). Décoratives → `aria-hidden="true"` ; seules → `aria-label`.
- Mouvement : transitions ≤ 150 ms sur `color`, `background-color`, `transform` uniquement. Tout est coupé sous `@media (prefers-reduced-motion: reduce)`.

## 6. Ton rédactionnel

Français, tutoiement évité (vouvoiement), phrases courtes. Les messages d'erreur disent **quoi** et **comment corriger**. Dates au format français (`29 septembre 2026`), notes avec virgule décimale (`4,5`), durées via `duree_texte()` (« 2 h 28 »).
