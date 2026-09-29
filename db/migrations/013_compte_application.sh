#!/usr/bin/env bash
# =====================================================================
#  013 — Compte de connexion de l'application
#  Source : cours N38 (rôles et privilèges) — les droits se donnent au groupe
#  (filmbox_app, M16.1), le compte de connexion en hérite.
#  L'application ne se connecte JAMAIS avec postgres.
#  Mot de passe lu dans l'environnement (.env), jamais écrit dans le dépôt.
# =====================================================================
set -euo pipefail

: "${FILMBOX_APP_USER:?FILMBOX_APP_USER manquant dans .env}"
: "${FILMBOX_APP_PASSWORD:?FILMBOX_APP_PASSWORD manquant dans .env}"

# Variables psql (:"…" identifiant, :'…' littéral) : aucune concaténation dans le SQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     -v app_user="$FILMBOX_APP_USER" -v app_password="$FILMBOX_APP_PASSWORD" <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password' IN ROLE filmbox_app;
SQL
