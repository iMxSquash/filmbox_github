-- =====================================================================
--  009 — Procédures
--  Source : M13-publier-une-note.md (M13.1, M13.3)
-- =====================================================================

-- M13.1 — noter un film : vérifie, enregistre ou remplace la note,
-- ajoute un visionnage, renvoie la nouvelle moyenne.
-- Aucun COMMIT interne : tout ou rien (voir la réponse M13).
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

-- M13.3 — initialiser films_stats par lots (un COMMIT tous les p_lot films)
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

-- M13.3 — lancement par lots de 10
CALL recalculer_stats(10);
