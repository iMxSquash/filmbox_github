-- =====================================================================
--  018 — connexion() : même temps de réponse pour un pseudo inconnu
--  Source : cours N38 (bcrypt) et N40 (SECURITY DEFINER), revue de sécurité de la phase 5.
--  Avant : un pseudo inconnu ne déclenchait aucun calcul bcrypt (~1 ms contre ~60 ms) :
--  la durée de la réponse révélait si un pseudo existe. Après : un bcrypt de même coût
--  est toujours calculé. Même signature, même contrat (0 ligne = refus).
-- =====================================================================

CREATE OR REPLACE FUNCTION connexion(p_pseudo TEXT, p_mot_de_passe TEXT)
RETURNS TABLE (id INTEGER, pseudo VARCHAR)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id INTEGER;
    v_pseudo VARCHAR;
    v_empreinte TEXT;
BEGIN
    SELECT u.id, u.pseudo, u.empreinte_mdp INTO v_id, v_pseudo, v_empreinte
    FROM utilisateurs u
    WHERE u.pseudo = p_pseudo;

    IF v_empreinte IS NULL THEN
        -- Pseudo inconnu ou membre sans mot de passe : calcul factice de même coût
        PERFORM crypt(p_mot_de_passe, gen_salt('bf', 10));
        RETURN;
    END IF;

    IF v_empreinte = crypt(p_mot_de_passe, v_empreinte) THEN
        RETURN QUERY SELECT v_id, v_pseudo;
    END IF;
END;
$$;
