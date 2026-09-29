-- =====================================================================
--  010 — Triggers
--  Source : M14-statistiques-justes.md (M14.1, M14.2)
--  Import massif de notes : désactiver les triggers utilisateur, charger,
--  recalculer films_stats une fois, réactiver (voir la réponse M14).
-- =====================================================================

-- M14.1 — films_stats toujours à jour
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

-- M14.2 — journaliser les notes réellement modifiées
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
