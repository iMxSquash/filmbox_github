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

## Mise en place

Prérequis : PostgreSQL et le client `psql`.

```bash
createdb filmbox
psql -d filmbox -f filmbox.sql
```

Le script est ré-exécutable : il supprime puis recrée toutes les tables à chaque chargement.

## Les missions

Chaque fichier regroupe les énoncés et les réponses (requêtes SQL) d'une série de missions.

| Fichier | Thème | Missions |
| --- | --- | --- |
| [`M1-prise-en-main.md`](M1-prise-en-main.md) | Prise en main | Explorer la base, créer `listes` et `liste_films`, le top Nolan |
| [`M2-catalogue.md`](M2-catalogue.md) | Interroger le catalogue | Films des années 2000, filmographie de Kevin Bacon, réalisateurs prolifiques, films les mieux notés, membres les plus actifs |
| [`M3-profil-membre.md`](M3-profil-membre.md) | Profil d'un membre | Carte de profil en CTE, films restant à voir, films qui divisent |

## Structure du dépôt

```
.
├── README.md
├── filmbox.sql            # schéma + données
├── M1-prise-en-main.md
├── M2-catalogue.md
└── M3-profil-membre.md
```
