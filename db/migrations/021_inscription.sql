-- =====================================================================
--  021 — Création de compte
--  Source : cours N38 (bcrypt via pgcrypto, moindre privilège) et N40 (SECURITY DEFINER).
--  Fonctionnalité demandée après coup : aucune mission ne crée de membre.
--  L'application n'a pas le droit d'écrire dans utilisateurs : elle passe par inscription(),
--  qui valide, hache le mot de passe (bcrypt, coût 10) et crée le membre.
--  Le pseudo est unique sans tenir compte de la casse (Lea.Reel et lea.reel se confondraient).
-- =====================================================================

CREATE UNIQUE INDEX utilisateurs_pseudo_minuscule_key ON utilisateurs (lower(pseudo));

CREATE FUNCTION inscription(p_pseudo TEXT, p_mot_de_passe TEXT)
RETURNS TABLE (id INTEGER, pseudo VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id INTEGER;
    v_pseudo VARCHAR;
BEGIN
    IF p_pseudo !~ '^[^[:space:]]{3,30}$' THEN
        RAISE EXCEPTION 'Le pseudo doit contenir de 3 à 30 caractères, sans espace.';
    END IF;
    -- bcrypt ne lit que les 72 premiers octets : au-delà, deux mots de passe seraient équivalents
    IF length(p_mot_de_passe) < 8 OR octet_length(p_mot_de_passe) > 72 THEN
        RAISE EXCEPTION 'Le mot de passe doit contenir de 8 à 72 caractères.';
    END IF;
    IF EXISTS (SELECT 1 FROM utilisateurs u WHERE lower(u.pseudo) = lower(p_pseudo)) THEN
        RAISE EXCEPTION 'Ce pseudo est déjà pris.';
    END IF;

    INSERT INTO utilisateurs (pseudo, inscrit_le, empreinte_mdp)
    VALUES (p_pseudo, CURRENT_DATE, crypt(p_mot_de_passe, gen_salt('bf', 10)))
    RETURNING utilisateurs.id, utilisateurs.pseudo INTO v_id, v_pseudo;

    RETURN QUERY SELECT v_id, v_pseudo;
EXCEPTION
    WHEN unique_violation THEN   -- deux inscriptions simultanées du même pseudo
        RAISE EXCEPTION 'Ce pseudo est déjà pris.';
END;
$$;

REVOKE EXECUTE ON FUNCTION inscription(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION inscription(TEXT, TEXT) TO filmbox_app;
