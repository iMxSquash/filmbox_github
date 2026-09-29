# M13

*« La note 6 est refusée : qu’est-ce qui a été écrit en base ? Et si l’erreur arrivait après l’INSERT ? » :*
Ce qui est écrit avec la note 6 : rien. La vérification IF p_note NOT BETWEEN 0.5 AND 5 ... est la toute première instruction du corps, avant les SELECT INTO et les deux INSERT. Le RAISE EXCEPTION interrompt donc l'exécution avant même d'atteindre INSERT INTO notes donc aucune ligne n'est touchée en base. 

Si l'erreur arrivait après l'INSERT : comme noter() ne fait aucun COMMIT interne, tout le corps de la procédure s'exécute comme une seule transaction implicite (celle du CALL). Une exception non rattrapée (pas de bloc EXCEPTION ici) annule tout ce qui a été fait depuis le début de l'appel y compris l'INSERT INTO notes déjà exécuté, exactement comme un ROLLBACK global. La seule façon qu'un INSERT survive à une erreur ultérieure serait qu'un COMMIT explicite ait déjà été passé avant cette erreur (comme dans recalculer_stats, où chaque lot validé par COMMIT est définitivement acquis même si un lot suivant échoue).

## M13.1 Une procédure pour noter

Écrivez `noter(pseudo, titre, note, INOUT moyenne)` : elle vérifie la note (de 0,5 à 5, par demi-point), le membre et le film ; enregistre ou remplace la note ; ajoute un visionnage au journal ; renvoie la nouvelle moyenne du film. `lea.reel` donne 3,5 à Inception.

Réponse :

```sql
CREATE OR REPLACE PROCEDURE noter(p_pseudo TEXT, p_titre TEXT, p_note NUMERIC, INOUT p_moyenne NUMERIC DEFAULT NULL)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user INTEGER;
    v_film INTEGER;
BEGIN
    IF p_note NOT BETWEEN 0.5 AND 5 OR p_note * 2 <> TRUNC(p_note * 2) THEN
        RAISE EXCEPTION 'Note invalide : % (de 0,5 à 5, par demi-point)', p_note;
    END IF;
    SELECT id INTO v_user FROM utilisateurs WHERE pseudo = p_pseudo;
    IF NOT FOUND THEN RAISE EXCEPTION 'Membre inconnu : %', p_pseudo; END IF;
    SELECT id INTO v_film FROM films WHERE titre = p_titre;
    IF NOT FOUND THEN RAISE EXCEPTION 'Film inconnu : %', p_titre; END IF;

    INSERT INTO notes (utilisateur_id, film_id, note, note_le)
    VALUES (v_user, v_film, p_note, CURRENT_DATE)
    ON CONFLICT (utilisateur_id, film_id)
        DO UPDATE SET note = EXCLUDED.note, note_le = EXCLUDED.note_le;
    INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
    VALUES (v_user, v_film, CURRENT_DATE);

    SELECT ROUND(AVG(note), 2) INTO p_moyenne FROM notes WHERE film_id = v_film;
END;
$$;
```

```sql
CALL noter('lea.reel', 'Inception', 3.5);
```

## M13.2 Des messages compréhensibles

Vérifiez que la procédure refuse une note de 6 et un film absent du catalogue, avec des messages compréhensibles par l'équipe front.

Réponse :

```sql
CALL noter('lea.reel', 'Inception', 6);
```

```sql
CALL noter('lea.reel', 'Avatar', 4);
```

## M13.3 Initialiser les statistiques par lots

La table `films_stats` est vide. Écrivez `recalculer_stats(lot)` qui calcule, film par film, le nombre de notes et la moyenne, en validant tous les `lot` films. Lancez-la par lots de 10.

Réponse :

```sql
CREATE OR REPLACE PROCEDURE recalculer_stats(p_lot INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    v_n INTEGER := 0;
BEGIN
    FOR r IN SELECT DISTINCT film_id FROM notes ORDER BY film_id LOOP
        INSERT INTO films_stats (film_id, nb_notes, moyenne)
        SELECT film_id, COUNT(*), ROUND(AVG(note), 2) FROM notes
        WHERE film_id = r.film_id GROUP BY film_id
        ON CONFLICT (film_id)
            DO UPDATE SET nb_notes = EXCLUDED.nb_notes, moyenne = EXCLUDED.moyenne;
        v_n := v_n + 1;
        IF v_n % p_lot = 0 THEN
            COMMIT;
            RAISE NOTICE '% films traités', v_n;
        END IF;
    END LOOP;
    COMMIT;
END;
$$;
```

```sql
CALL recalculer_stats(10);
```

```sql
SELECT COUNT(*) AS films_avec_stats FROM films_stats;
```
