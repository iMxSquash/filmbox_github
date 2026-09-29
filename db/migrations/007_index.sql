-- =====================================================================
--  007 — Index mesurés
--  Source : M12-defi-optimisation.md (M12.1, M12.2, M12.3)
--  Seuls les index dont le gain a été mesuré sont conservés
--  (le B-tree simple sur films.titre a été rejeté en M12.3).
-- =====================================================================

-- M12.1 — page profil : 20 derniers visionnages d'un membre (30,5 ms → 0,23 ms)
CREATE INDEX idx_journal_profil ON journal (utilisateur_id, date_visionnage DESC) INCLUDE (film_id);

-- M12.2 — tendances : filtre en plage de dates, jamais TO_CHAR (102,8 ms → 8,0 ms)
CREATE INDEX idx_journal_date ON journal (date_visionnage) INCLUDE (film_id);

-- M12.3 — recherche de titre ILIKE '%…%' (39,9 ms → 2,1 ms)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_films_titre_trgm ON films USING GIN (titre gin_trgm_ops);
