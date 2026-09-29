-- =====================================================================
--  015 — Droits nécessaires au site
--  Source : cours N38 (moindre privilège), N39 (RLS), N40 (SECURITY DEFINER).
--  Les droits de M16.1 sont volontairement minimaux : sans ce complément,
--  CALL noter() échoue (permission denied for table audit_notes) et sagas est illisible.
--  Ce qui reste interdit à filmbox_app : DELETE, renommer un film, écrire directement
--  dans films_stats / audit_notes, lire empreinte_mdp et audit_notes.
-- =====================================================================

-- Lecture du catalogue et des statistiques
-- (v_fiche_film s'exécute avec les droits de son propriétaire : seul le SELECT sur la vue est requis)
GRANT SELECT ON sagas, personnes, casting, films_stats, v_fiche_film TO filmbox_app;

-- Compteur de vues : droit de colonne, le renommage d'un film reste refusé (M16.1)
GRANT UPDATE (nb_vues) ON films TO filmbox_app;

-- Les triggers écrivent films_stats et audit_notes avec les droits du propriétaire :
-- l'application n'a aucun droit direct sur ces tables (N40, search_path figé)
ALTER FUNCTION trg_films_stats()  SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION trg_audit_notes()  SECURITY DEFINER SET search_path = public, pg_temp;

-- Portes d'accès : par défaut tout le monde peut exécuter (N40)
REVOKE EXECUTE ON PROCEDURE recalculer_stats(INTEGER) FROM PUBLIC;             -- réservé à l'admin
REVOKE EXECUTE ON PROCEDURE noter(TEXT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT  EXECUTE ON PROCEDURE noter(TEXT, TEXT, NUMERIC, NUMERIC) TO filmbox_app;

-- Listes : lecture seule (phase 1) ; une liste privée n'est visible que de son propriétaire (N39)
GRANT SELECT ON listes, liste_films TO filmbox_app;

ALTER TABLE listes ENABLE ROW LEVEL SECURITY;
ALTER TABLE liste_films ENABLE ROW LEVEL SECURITY;

CREATE POLICY listes_lecture ON listes
  FOR SELECT
  USING (publique OR utilisateur_id = NULLIF(current_setting('app.membre_id', true), '')::INTEGER);

-- Le contenu d'une liste suit la visibilité de la liste (elle-même filtrée par la RLS)
CREATE POLICY liste_films_lecture ON liste_films
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM listes l WHERE l.id = liste_films.liste_id));
