-- =====================================================================
--  Volume de test (optionnel, hors migrations)
--  Source : filmbox-s3.sql (séance 3) — utilisé par M11 et M12 (ex. membre_4242).
--  100 000 films, 20 000 membres, 1 million de notes, 1 million de visionnages.
--  À charger UNE fois sur une base fraîchement migrée, avec postgres :
--    docker compose exec -T db psql -U postgres -d filmbox -f /seeds/volume.sql
--  Les index de M12 existent déjà (migration 007).
--  Import massif : triggers utilisateur désactivés puis films_stats recalculée
--  en une fois, comme préconisé dans la réponse M14.
-- =====================================================================

\set ON_ERROR_STOP on

ALTER TABLE notes DISABLE TRIGGER USER;

-- ---------- 100 000 films générés (id 31 et suivants) ----------
INSERT INTO films (titre, annee, genre, details)
SELECT (ARRAY['Le Dernier','La Nuit du','Les Enfants du','Le Secret du','La Chute du','Le Retour du',
              'L''Ombre du','La Légende du','Le Cri du','Les Gardiens du'])[1 + i % 10]
         || ' ' ||
       (ARRAY['Phare','Désert','Volcan','Marais','Glacier','Labyrinthe','Temple','Faubourg','Nord','Loup',
              'Cyclone','Pendule','Miroir','Canyon','Silence','Carrousel','Sablier','Brouillard','Récif','Métronome'])[1 + (i / 10) % 20]
         || ' ' || (1 + i / 200),
       1950 + (i * 7) % 76,
       (ARRAY['Drame','Comédie','Thriller','Science-fiction','Action','Policier','Romance','Aventure','Horreur','Animation'])[1 + (i * 3) % 10],
       jsonb_build_object('duree', 80 + (i * 13) % 100,
                          'tags', jsonb_build_array((ARRAY['culte','indé','festival','blockbuster','classique'])[1 + i % 5]))
FROM generate_series(1, 100000) AS i;

-- ---------- 20 000 membres générés (id 9 et suivants) ----------
INSERT INTO utilisateurs (pseudo, ville, inscrit_le)
SELECT 'membre_' || i,
       (ARRAY['Paris','Lyon','Marseille','Lille','Nantes','Bordeaux','Toulouse','Rennes'])[1 + i % 8],
       DATE '2023-01-01' + (i * 37) % 1000
FROM generate_series(1, 20000) AS i;

-- ---------- 1 million de notes ----------
INSERT INTO notes (utilisateur_id, film_id, note, note_le)
SELECT 8 + 1 + (i % 20000),
       1 + (i * 7919) % 100030,
       (1 + (i * 31) % 10) / 2.0,
       DATE '2025-01-01' + ((i * 13) % 630)::INTEGER
FROM generate_series(1::BIGINT, 1000000) AS i
ON CONFLICT DO NOTHING;

-- ---------- 1 million de visionnages ----------
INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
SELECT 8 + 1 + (i * 17) % 20000,
       1 + (i * 104729) % 100030,
       DATE '2025-01-01' + ((i * 7) % 630)::INTEGER
FROM generate_series(1::BIGINT, 1000000) AS i;

-- Même proportion d'entrées privées que la migration 011
UPDATE journal SET prive = true WHERE id % 4 = 0 AND NOT prive;

-- films_stats recalculée une seule fois par un GROUP BY direct (réponse M14),
-- puis triggers réactivés
INSERT INTO films_stats (film_id, nb_notes, moyenne)
SELECT film_id, COUNT(*), ROUND(AVG(note), 2) FROM notes GROUP BY film_id
ON CONFLICT (film_id)
    DO UPDATE SET nb_notes = EXCLUDED.nb_notes, moyenne = EXCLUDED.moyenne;
ALTER TABLE notes ENABLE TRIGGER USER;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_films;
VACUUM ANALYZE films, utilisateurs, notes, journal, films_stats;
