-- =====================================================================
--  006 — Fonctions
--  Source : M10-note-ponderee.md (M10.1, M10.2, M10.3)
-- =====================================================================

-- M10.1 — une durée lisible (« 2 h 28 »)
CREATE OR REPLACE FUNCTION duree_texte(p_minutes INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT (p_minutes / 60) || ' h ' || LPAD((p_minutes % 60)::TEXT, 2, '0');
$$;

-- M10.2 — la note pondérée façon IMDb (STABLE : lit la table notes)
CREATE OR REPLACE FUNCTION note_ponderee(p_film_id INTEGER, p_m INTEGER DEFAULT 5)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_nb INTEGER;
    v_moyenne NUMERIC;
    v_globale NUMERIC;
BEGIN
    SELECT COUNT(*), AVG(note) INTO v_nb, v_moyenne
    FROM notes WHERE film_id = p_film_id;

    IF v_nb = 0 THEN
        RAISE EXCEPTION 'Le film % n''a encore aucune note', p_film_id;
    END IF;

    SELECT AVG(note) INTO v_globale FROM notes;

    RETURN ROUND((v_nb::NUMERIC / (v_nb + p_m)) * v_moyenne + (p_m::NUMERIC / (v_nb + p_m)) * v_globale, 2);
END;
$$;

-- M10.3 — la compatibilité entre deux membres
CREATE OR REPLACE FUNCTION compatibilite(p_a TEXT, p_b TEXT)
RETURNS TABLE (titre VARCHAR, note_a NUMERIC, note_b NUMERIC, ecart NUMERIC)
LANGUAGE sql
STABLE
AS $$
    SELECT f.titre, na.note, nb.note, ABS(na.note - nb.note)
    FROM notes na
    JOIN utilisateurs ua ON ua.id = na.utilisateur_id AND ua.pseudo = p_a
    JOIN notes nb ON nb.film_id = na.film_id
    JOIN utilisateurs ub ON ub.id = nb.utilisateur_id AND ub.pseudo = p_b
    JOIN films f ON f.id = na.film_id
    ORDER BY ABS(na.note - nb.note) DESC, f.titre;
$$;
