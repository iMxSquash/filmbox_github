-- =====================================================================
--  011 — Compteur de vues des films et journal privé
--  Source : filmbox-s5.sql (séance 5)
--  Le compteur s'incrémente toujours dans l'UPDATE (M15.2) :
--    UPDATE films SET nb_vues = nb_vues + 1 WHERE id = $1;
-- =====================================================================

ALTER TABLE films ADD COLUMN nb_vues INTEGER NOT NULL DEFAULT 0;

-- Entrées de journal privées (environ une sur quatre)
ALTER TABLE journal ADD COLUMN prive BOOLEAN NOT NULL DEFAULT false;
UPDATE journal SET prive = true WHERE id % 4 = 0;
