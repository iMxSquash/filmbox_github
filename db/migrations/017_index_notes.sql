-- =====================================================================
--  017 — Index sur les notes par film
--  Source : mesure de la phase 5 avec db/seeds/volume.sql (méthode de M12 : on ne garde
--  un index que si le gain est mesuré).
--  Avant : la moyenne d'un film (profil M6.3, fiche M9.1) faisait un Seq Scan de 1 M de notes
--  par film : profil d'un membre 678 ms. Après : Index Only Scan, 0,49 ms (~1 400x).
--  Coût : 30 Mo pour une table de 50 Mo.
-- =====================================================================

CREATE INDEX idx_notes_film ON notes (film_id) INCLUDE (note);
