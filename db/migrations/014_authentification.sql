-- =====================================================================
--  014 — Authentification des membres
--  Source : cours N38 (mots de passe en empreinte bcrypt via pgcrypto)
--           et N40 (SECURITY DEFINER : porte contrôlée).
--  Connexion uniquement : aucune mission ne crée de membre, pas d'inscription.
--  Le compte applicatif ne peut jamais lire l'empreinte : il passe par connexion().
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NULL = le membre ne peut pas se connecter (membres générés du volume de test)
ALTER TABLE utilisateurs ADD COLUMN empreinte_mdp TEXT;

-- Mot de passe de DÉMONSTRATION des 8 membres fictifs : 'filmbox-demo'.
-- À ne jamais utiliser hors développement.
UPDATE utilisateurs SET empreinte_mdp = crypt('filmbox-demo', gen_salt('bf', 10));

-- Moindre privilège : lecture des colonnes publiques uniquement
-- (un SELECT * par l'application est désormais refusé : il faut nommer les colonnes)
REVOKE SELECT ON utilisateurs FROM filmbox_app;
GRANT SELECT (id, pseudo, ville, inscrit_le) ON utilisateurs TO filmbox_app;

-- Porte contrôlée : renvoie l'id du membre si le mot de passe est bon, sinon aucune ligne.
-- On recalcule l'empreinte avec le sel stocké et on compare (N38) ; on ne « décrypte » jamais.
CREATE OR REPLACE FUNCTION connexion(p_pseudo TEXT, p_mot_de_passe TEXT)
RETURNS TABLE (id INTEGER, pseudo VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT u.id, u.pseudo
    FROM utilisateurs u
    WHERE u.pseudo = p_pseudo
      AND u.empreinte_mdp IS NOT NULL
      AND u.empreinte_mdp = crypt(p_mot_de_passe, u.empreinte_mdp);
$$;

REVOKE EXECUTE ON FUNCTION connexion(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION connexion(TEXT, TEXT) TO filmbox_app;
