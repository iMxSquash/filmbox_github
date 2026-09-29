-- =====================================================================
--  008 — Statistiques dénormalisées et audit des notes
--  Source : filmbox-s4.sql (séance 4)
-- =====================================================================

CREATE TABLE films_stats (                       -- statistiques dénormalisées, pour un affichage rapide
    film_id   INTEGER PRIMARY KEY REFERENCES films(id),
    nb_notes  INTEGER      NOT NULL,
    moyenne   NUMERIC(3,2) NOT NULL
);

CREATE TABLE audit_notes (                       -- historique des notes modifiées
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id  INTEGER      NOT NULL,
    film_id         INTEGER      NOT NULL,
    ancienne        NUMERIC(2,1),
    nouvelle        NUMERIC(2,1),
    le              TIMESTAMP    NOT NULL DEFAULT now()
);
