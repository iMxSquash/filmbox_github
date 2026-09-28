# M14

*« Un import insère un million de notes : que coûte ton trigger, et que fais-tu ? » :*
Ce que ça coûte. trg_films_stats (M14.1) est un trigger FOR EACH ROW, donc il s'exécute une fois par ligne insérée. Et à chaque exécution, il ne fait pas un calcul incrémental (contrairement à trg_stats_ventes en 31.2, qui incrémente juste un compteur) : il relance SELECT COUNT(*), AVG(note) FROM notes WHERE film_id = v_film, c'est-à-dire un balayage complet de toutes les notes déjà présentes pour ce film, à chaque nouvelle note. Pour un film qui reçoit N notes pendant l'import, ça fait N recalculs coûtant chacun O(N) : le coût total est quadratique en N, pas linéaire. Sur un million de lignes concentrées sur quelques films populaires, ça peut faire exploser le temps d'import de plusieurs ordres de grandeur par rapport aux seuls INSERT. En plus, chaque exécution réécrit la ligne de films_stats du film (via ON CONFLICT DO UPDATE), alors que seul l'état final après import nous intéresse : 999 des 1000 écritures faites pour un film à 1000 notes sont du travail jeté.

Ce que je fais. Je désactive les triggers utilisateur sur notes le temps de l'import (comme en 33.2 : ALTER TABLE notes DISABLE TRIGGER USER), je charge le million de lignes sans surcoût, puis je recalcule films_stats une seule fois, par lots, avec la même logique que recalculer_stats() en M13 (un GROUP BY direct sur notes, pas un recalcul par ligne) avant de réactiver les triggers avec ALTER TABLE notes ENABLE TRIGGER USER. Le trigger reprend ensuite son rôle normal : maintenir films_stats à jour note par note pour le trafic courant, où le volume par film est trop faible pour que le coût quadratique se voie.

## M14.1 Des statistiques maintenues

Écrivez un trigger sur `notes` qui recalcule la ligne de `films_stats` du film concerné à chaque insertion, modification ou suppression. `bobine` donne ensuite 5 à The Artist ; affichez ses statistiques.

Réponse :

```sql
CREATE OR REPLACE FUNCTION trg_films_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_film INTEGER := CASE WHEN TG_OP = 'DELETE' THEN OLD.film_id ELSE NEW.film_id END;
BEGIN
    INSERT INTO films_stats (film_id, nb_notes, moyenne)
    SELECT v_film, COUNT(*), COALESCE(ROUND(AVG(note), 2), 0)
    FROM notes WHERE film_id = v_film
    ON CONFLICT (film_id)
        DO UPDATE SET nb_notes = EXCLUDED.nb_notes, moyenne = EXCLUDED.moyenne;
    RETURN NULL;
END;
$$;

CREATE TRIGGER films_stats
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW
EXECUTE FUNCTION trg_films_stats();
```

```sql
SELECT f.titre, s.nb_notes, s.moyenne FROM films_stats s JOIN films f ON f.id = s.film_id WHERE f.titre = 'The Artist';
```

```sql
CALL noter('bobine', 'The Artist', 5);
```

```sql
SELECT f.titre, s.nb_notes, s.moyenne FROM films_stats s JOIN films f ON f.id = s.film_id WHERE f.titre = 'The Artist';
```
</details>

## M14.2 Journaliser les notes réellement modifiées

Enregistrez dans `audit_notes` chaque note **réellement modifiée** (ancienne et nouvelle valeur). `lea.reel` passe sa note d'Inception de 3,5 à 4,5, puis la confirme à 4,5.

Réponse :

```sql
CREATE OR REPLACE FUNCTION trg_audit_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_notes (utilisateur_id, film_id, ancienne, nouvelle)
    VALUES (NEW.utilisateur_id, NEW.film_id, OLD.note, NEW.note);
    RETURN NULL;
END;
$$;

CREATE TRIGGER audit_notes
AFTER UPDATE OF note ON notes
FOR EACH ROW
WHEN (OLD.note IS DISTINCT FROM NEW.note)
EXECUTE FUNCTION trg_audit_notes();
```

```sql
CALL noter('lea.reel', 'Inception', 4.5);
CALL noter('lea.reel', 'Inception', 4.5);
```

```sql
SELECT u.pseudo, f.titre, a.ancienne, a.nouvelle
FROM audit_notes a
JOIN utilisateurs u ON u.id = a.utilisateur_id
JOIN films f ON f.id = a.film_id;
```
</details>

## M14.3 Le filet de sécurité

Vérifiez que `films_stats` est parfaitement cohérente avec la table `notes` : comptez les films dont le nombre de notes ou la moyenne diffère du calcul direct.

Réponse :

```sql
SELECT COUNT(*) AS films_incoherents
FROM films_stats s
JOIN (SELECT film_id, COUNT(*) AS nb, ROUND(AVG(note), 2) AS moy
      FROM notes GROUP BY film_id) n ON n.film_id = s.film_id
WHERE s.nb_notes <> n.nb OR s.moyenne <> n.moy;
```
</details>
