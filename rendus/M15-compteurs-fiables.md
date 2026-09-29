# M15 

## M15.1 Les vues perdues

Deux membres ouvrent la fiche d'Inception au même moment ; l'application lit le compteur, ajoute 1, puis écrit le résultat. Rejouez la scène à deux terminaux.

Réponse :

| # | 🅰️ Terminal A | 🅱️ Terminal B | Ce qui se passe |
|---|---|---|---|
| 1 | `BEGIN;` | | |
| 2 | `SELECT nb_vues FROM films WHERE titre = 'Inception';` → 0 | | A lit 0 |
| 3 | | `BEGIN;` | |
| 4 | | `SELECT nb_vues FROM films WHERE titre = 'Inception';` → 0 | B lit aussi 0 |
| 5 | `UPDATE films SET nb_vues = 1 WHERE titre = 'Inception';` -- 0 + 1 | | |
| 6 | `COMMIT;` | | |
| 7 | | `UPDATE films SET nb_vues = 1 WHERE titre = 'Inception';` -- 0 + 1 | B écrit un résultat calculé sur une valeur périmée |
| 8 | | `COMMIT;` | |
| 9 | `SELECT nb_vues FROM films WHERE titre = 'Inception';` → **1** | | 1 au lieu de 2 |

## M15.2 Des vues qui s'additionnent

Corrigez la scène : chaque terminal incrémente le compteur directement dans l'`UPDATE`. Montrez que le second attend le premier, et que les deux vues sont comptées.

Réponse :

| # | 🅰️ Terminal A | 🅱️ Terminal B | Ce qui se passe |
|---|---|---|---|
| 1 | `BEGIN;` | | |
| 2 | `UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = 'Inception';` → `UPDATE 1` | | A verrouille la ligne |
| 3 | | `BEGIN;` | |
| 4 | | `UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = 'Inception';` | ⏳ bloquée : B attend le verrou posé par A |
| 5 | `COMMIT;` | | |
| 6 | | → débloquée, `UPDATE 1` | B repart de la valeur validée |
| 7 | | `COMMIT;` | |
| 8 | `SELECT nb_vues FROM films WHERE titre = 'Inception';` → **3** | | 1 + 1 + 1 = 3 |

## M15.3 La soirée cinéma

`lea.reel` (id 5) enregistre sa soirée : trois visionnages, dont un avec un identifiant de film erroné (99999). La soirée doit être enregistrée entièrement ou pas du tout.

Réponse :

```sql
SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;
```

```sql
BEGIN;
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 20, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 99999, '2026-09-25');
```

```
ERROR:  insert or update on table "journal" violates foreign key constraint "journal_film_id_fkey"
DETAIL:  Key (film_id)=(99999) is not present in table "films".
```

```sql
ROLLBACK;
```

```sql
SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;
```
