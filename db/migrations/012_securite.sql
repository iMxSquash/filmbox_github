-- =====================================================================
--  012 — Sécurité : rôle applicatif, RLS, recherche sans injection
--  Source : M16-securiser-filmbox.md (M16.1, M16.2, M16.3)
--  Les politiques RLS ne s'appliquent pas au superutilisateur :
--  toujours tester avec SET ROLE filmbox_app.
-- =====================================================================

-- M16.1 — le groupe de droits de l'application (moindre privilège)
CREATE ROLE filmbox_app NOLOGIN;
GRANT SELECT ON films, utilisateurs, notes, journal TO filmbox_app;
GRANT INSERT, UPDATE ON notes, journal TO filmbox_app;

-- M16.2 — le journal privé : entrées publiques de tous + toutes les siennes ;
-- écriture uniquement à son nom. app.membre_id est posé par le serveur, jamais par le client.
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_lecture ON journal
  FOR SELECT
  USING (prive = false OR utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);

CREATE POLICY journal_ecriture ON journal
  FOR INSERT
  WITH CHECK (utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);

-- M16.3 — recherche de titre en SQL statique : la saisie n'est jamais collée dans le code
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
