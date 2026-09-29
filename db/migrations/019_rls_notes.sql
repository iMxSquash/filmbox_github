-- =====================================================================
--  019 — RLS sur les notes : chacun n'écrit que ses propres notes
--  Source : cours N39 (Row Level Security), revue de sécurité de la phase 5.
--  filmbox_app a INSERT/UPDATE sur notes (M16.1) mais, sans RLS, rien n'empêchait d'écrire
--  une note au nom d'un autre membre en dehors de noter(). Les notes restent lisibles par
--  tous (moyennes, évolution) ; l'écriture exige app.membre_id = utilisateur_id.
--  Les triggers (SECURITY DEFINER) et le compte postgres ne sont pas concernés.
-- =====================================================================

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_lecture ON notes
  FOR SELECT
  USING (true);

CREATE POLICY notes_ecriture ON notes
  FOR INSERT
  WITH CHECK (utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);

CREATE POLICY notes_modification ON notes
  FOR UPDATE
  USING (utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER)
  WITH CHECK (utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);
