-- =====================================================================
--  020 — Pas de visionnage dans le futur : règle portée par la base
--  Source : cours N39 (WITH CHECK), revue de la phase 5.
--  La règle n'existait qu'en TypeScript et dans l'attribut `max` du champ : tout autre chemin
--  d'écriture pouvait l'ignorer. Elle est ajoutée à la politique d'écriture de journal (012),
--  ce qui évite un CHECK non immuable. noter() écrit déjà CURRENT_DATE.
--  Note : filmbox_app garde le droit UPDATE sur journal (M16.1) mais aucune politique
--  UPDATE n'existe : la RLS le refuse.
-- =====================================================================

ALTER POLICY journal_ecriture ON journal
  WITH CHECK (
    utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER
    AND date_visionnage <= CURRENT_DATE
  );
