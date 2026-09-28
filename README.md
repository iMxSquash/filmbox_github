# FilmBox

Projet fil rouge PostgreSQL (J1 – Requêtages, Vues & Fonctions) : une base de données de cinéma sur laquelle on enchaîne des missions de création de tables et de requêtage.

## Le jeu de données

Le script `filmbox.sql` crée et remplit la base :

| Table | Contenu |
| --- | --- |
| `sagas` | Sagas de films (Retour vers le futur, The Dark Knight, X-Men : la prélogie) |
| `films` | Titre, année, genre, saga et épisode précédent |
| `personnes` | Acteurs et réalisateurs |
| `casting` | Lien film ↔ personne avec le rôle (`acteur` ou `realisateur`) |
| `utilisateurs` | Membres fictifs (pseudo, ville, date d'inscription) |
| `notes` | Note attribuée par un membre à un film |
| `journal` | Visionnages des membres, revisionnages inclus |

Les films et les castings sont réels ; les membres, les notes et les visionnages sont fictifs (générés de façon déterministe). Les tables `listes` et `liste_films` ne sont pas dans le script : elles sont créées pendant la mission M1.

Le script `filmbox-s2.sql` (séance 2) ajoute une colonne `details` en JSONB sur `films` (durée, pays, langue, tags, Oscar du meilleur film) et supprime les objets créés pendant les missions M9 et M10 pour repartir d'une base propre.

Le script `filmbox-s3.sql` (séance 3) fait grossir `journal` et `films` (100 000 films, 20 000 membres, 2 millions de lignes d'activité) et ne crée volontairement aucun index : c'est l'objet des missions M11 et M12.

Le script `filmbox-s4.sql` (séance 4) crée `films_stats` (statistiques dénormalisées) et `audit_notes` (historique des notes modifiées), alimentées par les procédures et triggers des missions M13 et M14.

## Mise en place

Prérequis : PostgreSQL et le client `psql`.

```bash
createdb filmbox
psql -d filmbox -f filmbox.sql
psql -d filmbox -f filmbox-s2.sql   # complément séance 2, à exécuter après filmbox.sql
psql -d filmbox -f filmbox-s3.sql   # complément séance 3, à exécuter après filmbox-s2.sql
psql -d filmbox -f filmbox-s4.sql   # complément séance 4, à exécuter après filmbox-s2.sql (inutile de charger filmbox-s3.sql)
```

Les quatre scripts sont ré-exécutables : ils suppriment puis recréent leurs objets à chaque chargement (`filmbox-s3.sql` génère 2 millions de lignes, comptez 20 secondes à 2 minutes).

## Les missions

Chaque fichier regroupe les énoncés et les réponses (requêtes SQL) d'une série de missions.

| Fichier | Thème | Missions |
| --- | --- | --- |
| [`M1-prise-en-main.md`](M1-prise-en-main.md) | Prise en main | Explorer la base, créer `listes` et `liste_films`, le top Nolan |
| [`M2-catalogue.md`](M2-catalogue.md) | Interroger le catalogue | Films des années 2000, filmographie de Kevin Bacon, réalisateurs prolifiques, films les mieux notés, membres les plus actifs |
| [`M3-profil-membre.md`](M3-profil-membre.md) | Profil d'un membre | Carte de profil en CTE, films restant à voir, films qui divisent |
| [`M4-sagas-kevin-bacon.md`](M4-sagas-kevin-bacon.md) | Sagas & degrés de séparation | Ordre des épisodes en CTE récursive, toutes les sagas, nombre de Bacon, chemin d'Omar Sy à Kevin Bacon, acteurs inaccessibles |
| [`M5-classements.md`](M5-classements.md) | Classements | Top 3 par genre, classement des réalisateurs, coup de cœur de chacun, meilleur épisode d'une saga |
| [`M6-saison-cine.md`](M6-saison-cine.md) | Séries temporelles | Visionnages cumulés, évolution de la note d'un film, sévérité par rapport à la moyenne, rythme de visionnage |
| [`M7-tableau-de-bord.md`](M7-tableau-de-bord.md) | Tableau de bord | Coups de cœur/déceptions par genre (FILTER), la SF vue par chaque membre, visionnages par genre et trimestre (ROLLUP) |
| [`M8-fiche-film-enrichie.md`](M8-fiche-film-enrichie.md) | JSONB & LATERAL | Films de plus de 2h30, Oscars du meilleur film, top 5 des tags, derniers visionnages par membre (LATERAL) |
| [`M9-vues-et-cache.md`](M9-vues-et-cache.md) | Vues & cache | Vue `v_fiche_film`, vue matérialisée `mv_stats_films`, vue modifiable limitée à la science-fiction |
| [`M10-note-ponderee.md`](M10-note-ponderee.md) | Fonctions SQL | `duree_texte()`, note pondérée façon IMDb (`note_ponderee()`), compatibilité entre deux membres (`compatibilite()`) |
| [`M11-diagnostic.md`](M11-diagnostic.md) | Le diagnostic | Mesurer la page profil, la page tendances, l'estimation du planificateur pour la science-fiction |
| [`M12-defi-optimisation.md`](M12-defi-optimisation.md) | Le défi des 3 requêtes lentes (IA) | Index page profil, réécriture + index tendances, index trigramme recherche de titre, rapport d'optimisation |
| [`M13-publier-une-note.md`](M13-publier-une-note.md) | Procédures | `noter()` (vérification, note ou remplace, journal, moyenne), messages d'erreur clairs, initialisation par lots de `films_stats` (`recalculer_stats()`) |
| [`M14-statistiques-justes.md`](M14-statistiques-justes.md) | Triggers | Trigger `films_stats` (statistiques toujours à jour), trigger `audit_notes` (notes réellement modifiées, `WHEN`), filet de sécurité (cohérence `films_stats` / `notes`) |

## Structure du dépôt

```
.
├── README.md
├── filmbox.sql              # schéma + données
├── filmbox-s2.sql           # complément séance 2 (colonne details en JSONB)
├── filmbox-s3.sql           # complément séance 3 (volumétrie, sans index)
├── filmbox-s4.sql           # complément séance 4 (films_stats, audit_notes)
├── M1-prise-en-main.md
├── M2-catalogue.md
├── M3-profil-membre.md
├── M4-sagas-kevin-bacon.md
├── M5-classements.md
├── M6-saison-cine.md
├── M7-tableau-de-bord.md
├── M8-fiche-film-enrichie.md
├── M9-vues-et-cache.md
├── M10-note-ponderee.md
├── M11-diagnostic.md
├── M12-defi-optimisation.md
├── M13-publier-une-note.md
└── M14-statistiques-justes.md
```
