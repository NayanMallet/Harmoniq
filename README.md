# Harmoniq - API Project

Harmoniq est une API de gestion de musique et de profils d'artistes, offrant des fonctionnalités de distribution de singles/albums, de recherche avancée, de statistiques, de playlists, et plus encore. L’objectif est de disposer d’une plateforme d’administration complète pour un label musical.

## Sommaire

1. [Fonctionnalités Principales](#fonctionnalités-principales)
2. [Technologies Utilisées](#technologies-utilisées)
3. [Structure du Projet](#structure-du-projet)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Lancement du Projet](#lancement-du-projet)
7. [Documentation OpenAPI/Swagger](#documentation-openapiswagger)
8. [Endpoints Principaux](#endpoints-principaux)
9. [Contribution](#contribution)
10. [Licence](#licence)

---

## Fonctionnalités Principales

- **Authentification et gestion des artistes**
  - Enregistrement d’un artiste avec vérification par email.
  - Connexion, déconnexion, réinitialisation de mot de passe.
  - Suppression de compte.
  - Mise à jour du profil d’artiste (biographie, liens sociaux, localisation, etc.).

- **Gestion des singles**
  - Création, mise à jour et suppression d’un single.
  - Ajout de featurings via une table pivot (`single_featurings`).
  - Ajout de métadonnées (coverUrl, lyrics, copyrights).
  - Filtrage et pagination sur la liste des singles (genreId, titre, artisteId, etc.).

- **Gestion des albums**
  - Création, mise à jour et suppression d’un album.
  - Ajout d’un tableau de genres (stockés en JSON).
  - Ajout de métadonnées (coverUrl, etc.).
  - Filtrage et pagination sur la liste des albums (genreId, titre, artisteId, etc.).

- **Gestion des genres**
  - Création d’un nouveau genre.
  - Suppression d’un genre.
  - Listing de tous les genres.

- **Profil d’artiste**
  - Consultation du profil d’artiste par ID.
  - Filtrage/pagination des artistes par genre, nom, popularité, localisation (pays, ville).

- **Statistiques**
  - Chaque single possède des statistiques (nombre d’écoutes, revenus).
  - Génération automatique d’une ligne Stat lors de la création d’un single.

- **Recherche avancée**
  - Recherche insensible à la casse (pour les titres de single ou le nom d’artiste).
  - Filtres multiples (genre, localisation, popularité, etc.).
  - Tri et pagination.

- **Documentation OpenAPI**
  - Adonis AutoSwagger pour générer la documentation Swagger en fonction des annotations dans les contrôleurs.

---

## Technologies Utilisées

- **[AdonisJS](https://adonisjs.com/)** : Framework Node.js pour construire des APIs robustes.
- **TypeScript** : Langage offrant du typage statique pour JavaScript.
- **MySQL** (ou autre base SQL) : Stockage des données (artistes, singles, albums, etc.).
- **adonis-autoswagger** : Génération automatique de documentation OpenAPI/Swagger grâce à des annotations.
- **Luxon** : Gestion avancée des dates/heures (utilisé pour la vérification de la `releaseDate` ou les tokens expirés).
- **Knex** (fourni par Adonis) : Builder SQL pour les migrations et requêtes brutes.

---

## Structure du Projet

```bash
harmoniq/
  ├─ app/
  │   ├─ Controllers/
  │   │   ├─ Http/
  │   │   │   ├─ AuthController.ts
  │   │   │   ├─ ProfilesController.ts
  │   │   │   ├─ SinglesController.ts
  │   │   │   ├─ AlbumsController.ts
  │   │   │   ├─ GenresController.ts
  │   │   │   └─ ...
  │   ├─ Models/
  │   │   ├─ Artist.ts
  │   │   ├─ Album.ts
  │   │   ├─ Single.ts
  │   │   ├─ Genre.ts
  │   │   ├─ Metadata.ts
  │   │   ├─ Copyright.ts
  │   │   ├─ Stat.ts
  │   │   └─ ...
  │   ├─ Validators/
  │   │   ├─ AuthValidator.ts
  │   │   ├─ ProfileValidator.ts
  │   │   ├─ SingleValidator.ts
  │   │   ├─ AlbumValidator.ts
  │   │   ├─ GenresValidator.ts
  │   │   └─ ...
  │   ├─ Services/
  │   │   ├─ EmailService.ts
  │   │   └─ GenreService.ts
  │   └─ ...
  ├─ config/
  │   ├─ swagger.ts
  │   └─ ...
  ├─ database/
  │   ├─ migrations/
  │   │   └─ xxxx_create_all_tables.ts
  │   └─ ...
  ├─ resources/
  │   └─ utils/
  │       ├─ Functions.ts
  │       └─ Interfaces.ts
  ├─ start/
  │   └─ routes.ts
  └─ package.json
```

---

Installation

Cloner ce dépôt :
```bash
git clone https://github.com/votre-user/harmoniq.git
```
Se positionner dans le dossier :
```bash
cd harmoniq
```
Installer les dépendances :
```bash
npm install
```
ou
```bash
yarn
```

---

Configuration

Fichier .env : Créez ou éditez le fichier .env basé sur .env.example :
```bash
HOST=127.0.0.1
PORT=3333
APP_KEY=some_random_key
NODE_ENV=development

DB_CONNECTION=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=secret
MYSQL_DB_NAME=harmoniq_db
```
Générer une clé d’application (si non défini) :
```bash
node ace generate:key
```
Exécuter les migrations :
```bash
node ace migration:run
```
Lancement du Projet

Démarrer le serveur de développement :
```bash
node ace serve --watch
```
Par défaut, l’API est accessible sur 
```bash
http://127.0.0.1:3333.
```
Swagger UI : Accéder à la documentation via
```bash
http://127.0.0.1:3333/docs
```
(selon la config de swagger.ts).
Documentation OpenAPI/Swagger

Le projet utilise adonis-autoswagger pour générer la documentation.
Les annotations @tag, @summary, @operationId, @paramQuery, @requestBody, etc. sont présentes dans les contrôleurs.
Endpoints de documentation :
```bash
http://127.0.0.1:3333/swagger
```
(JSON)
```bash
http://127.0.0.1:3333/docs
```
(UI Swagger)
Endpoints Principaux

## Authentication
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/login
POST /api/auth/request-password-reset
POST /api/auth/reset-password
POST /api/auth/logout
DELETE /api/auth/delete-account

## Artists (Profiles)
GET /api/artists (filtrer/paginer)
GET /api/artists/:id (voir un profil)
PUT /api/artists (mettre à jour le profil de l’artiste connecté)
GET /api/artists/compare?ids=1,2,3 (comparer plusieurs artistes)

## Singles
GET /api/singles (filtrer/paginer)
GET /api/singles/:id (afficher un single)
POST /api/singles (créer un single)
PUT /api/singles/:id (mettre à jour)
DELETE /api/singles/:id (supprimer)

## Albums
GET /api/albums (filtrer/paginer)
GET /api/albums/:id (afficher un album)
POST /api/albums (créer un album)
PUT /api/albums/:id (mettre à jour)
DELETE /api/albums/:id (supprimer)

## Genres
GET /api/genres (lister)
POST /api/genres (créer un genre)
DELETE /api/genres/:id (supprimer)
