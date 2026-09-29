-- =====================================================================
--  003 — Listes de films des membres
--  Source : M1-prise-en-main.md (M1.2, M1.3, M1.4)
-- =====================================================================

-- M1.2 — la table listes
CREATE TABLE listes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    titre VARCHAR(100) NOT NULL,
    publique BOOLEAN NOT NULL DEFAULT false,
    creee_le DATE NOT NULL DEFAULT CURRENT_DATE
);

-- M1.3 — le contenu des listes
CREATE TABLE liste_films (
    liste_id INTEGER NOT NULL REFERENCES listes(id),
    film_id INTEGER NOT NULL REFERENCES films(id),
    position INTEGER NOT NULL CHECK (position > 0),
    PRIMARY KEY (liste_id, film_id)
);

-- M1.4 — le top Nolan de nolanfan
INSERT INTO listes (utilisateur_id, titre, publique)
SELECT id, 'Mon top Nolan', true FROM utilisateurs WHERE pseudo = 'nolanfan';

INSERT INTO liste_films (liste_id, film_id, position)
SELECT l.id, f.id, v.position
FROM listes l
JOIN (VALUES ('The Dark Knight', 1), ('Inception', 2), ('Batman Begins', 3)) AS v(titre, position)
     ON true
JOIN films f ON f.titre = v.titre
WHERE l.titre = 'Mon top Nolan';
