# M1

## M1.1 Explorer FilmBox

Se connecter à la base `filmbox`, lister ses tables et décrire la table `casting`. Quelle est sa clé primaire ? Quelles valeurs la colonne `role` accepte-t-elle ?

Réponse :

```
\c filmbox
\dt
\d casting
```

## M1.2 La table `listes`

Créer la table `listes` : identifiant automatique, membre propriétaire (obligatoire, **doit exister**), titre obligatoire, visibilité publique ou privée (**privée par défaut**) et date de création (aujourd'hui par défaut).

Réponse :

```sql
CREATE TABLE listes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    titre VARCHAR(100) NOT NULL,
    publique BOOLEAN NOT NULL DEFAULT false,
    creee_le DATE NOT NULL DEFAULT CURRENT_DATE
);
```
</details>

## M1.3 Le contenu des listes

Créer la table `liste_films` qui range des films dans une liste, à une **position strictement positive**. Un film ne peut apparaître **qu'une fois par liste**.

Réponse :

```sql
CREATE TABLE liste_films (
    liste_id INTEGER NOT NULL REFERENCES listes(id),
    film_id INTEGER NOT NULL REFERENCES films(id),
    position INTEGER NOT NULL CHECK (position > 0),
    PRIMARY KEY (liste_id, film_id)
);
```
</details>

## M1.4 Le top Nolan

Créer pour `nolanfan` une liste **publique** « Mon top Nolan » contenant, dans l'ordre, *The Dark Knight*, *Inception* et *Batman Begins*. Afficher ensuite la liste avec les titres.

Réponse :

```sql
INSERT INTO listes (utilisateur_id, titre, publique)
SELECT id, 'Mon top Nolan', true FROM utilisateurs WHERE pseudo = 'nolanfan';
```

```sql
INSERT INTO liste_films (liste_id, film_id, position)
SELECT l.id, f.id, v.position
FROM listes l
JOIN (VALUES ('The Dark Knight', 1), ('Inception', 2), ('Batman Begins', 3)) AS v(titre, position)
     ON true
JOIN films f ON f.titre = v.titre
WHERE l.titre = 'Mon top Nolan';
```

```sql
SELECT l.titre AS liste, lf.position, f.titre AS film
FROM listes l
JOIN liste_films lf ON lf.liste_id = l.id
JOIN films f ON f.id = lf.film_id
ORDER BY lf.position;
```
</details>
