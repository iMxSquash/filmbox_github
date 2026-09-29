# M16

## M16.1 Le compte de l'application

Créez le rôle `filmbox_app` : lecture des films, membres, notes et journal ; écriture (`INSERT`, `UPDATE`) sur les notes et le journal ; rien d'autre. Vérifiez qu'il ne peut ni supprimer des notes, ni renommer un film.

Réponse :

```sql
CREATE ROLE filmbox_app NOLOGIN;
GRANT SELECT ON films, utilisateurs, notes, journal TO filmbox_app;
GRANT INSERT, UPDATE ON notes, journal TO filmbox_app;
```

```sql
SET ROLE filmbox_app;
DELETE FROM notes WHERE film_id = 12;
UPDATE films SET titre = 'Inception 2' WHERE titre = 'Inception';
RESET ROLE;
```

## M16.2 Le journal privé

Activez la RLS sur `journal` : un membre voit les entrées publiques de tous et toutes les siennes, et ne peut écrire qu'à son nom (paramètre `app.membre_id`). Pour `lea.reel` (id 5), vérifiez qu'aucune entrée privée d'un autre membre n'est visible.

Réponse :

```sql
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_lecture ON journal
  FOR SELECT
  USING (prive = false OR utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);

CREATE POLICY journal_ecriture ON journal
  FOR INSERT
  WITH CHECK (utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);
```

```sql
SET ROLE filmbox_app;
SET app.membre_id = '5';
SELECT COUNT(*) FILTER (WHERE prive AND utilisateur_id = 5)  AS mes_entrees_privees,
       COUNT(*) FILTER (WHERE prive AND utilisateur_id <> 5) AS privees_des_autres
FROM journal;
```

```sql
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (3, 12, '2026-09-25');
RESET ROLE;
```

## M16.3 Une recherche à l'abri des injections

Écrivez `rechercher_films(texte)`, qui renvoie les 5 premiers films dont le titre contient le texte saisi, en SQL statique : la saisie n'est jamais collée dans le code SQL. Testez avec « dark », puis avec une tentative d'injection.

Réponse :

```sql
CREATE OR REPLACE FUNCTION rechercher_films(p_texte TEXT)
RETURNS TABLE (titre VARCHAR, annee INTEGER)
LANGUAGE sql
STABLE
AS $$
    SELECT f.titre, f.annee
    FROM films f
    WHERE f.titre ILIKE '%' || p_texte || '%'
    ORDER BY f.annee
    LIMIT 5;
$$;
```

```sql
SELECT * FROM rechercher_films('dark');
SELECT * FROM rechercher_films($$x' OR '1'='1$$);
```
