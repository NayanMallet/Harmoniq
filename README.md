# 🎵 Harmoniq - Gestionnaire pour Artistes Musicaux

**Harmoniq** est une plateforme REST API pour les artistes, permettant la gestion de singles, albums, droits d'auteur, statistiques, playlists, et notifications. L'API inclut un système d'authentification sécurisé et une vérification par email.

## Table des Matières

- [Fonctionnalités](#fonctionnalités)
- [Schéma de Base de Données](#schéma-de-base-de-données)
- [Technologies Utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Migrations](#migrations)
- [API](#api)
  - [Authentification](#authentification)
  - [Gestion des Artistes](#gestion-des-artistes)
  - [Albums et Singles](#albums-et-singles)
  - [Statistiques](#statistiques)
  - [Playlists](#playlists)
- [Contribution](#contribution)

---

## 📋 Fonctionnalités

- **Authentification et Vérification** :
  - Inscription avec envoi de code de vérification par email.
  - Connexion sécurisée avec gestion des tokens via la table `api_tokens`.
  - Vérification obligatoire par email pour activer un compte.

- **Gestion des Artistes** :
  - Création et mise à jour des profils artistes.
  - Champs personnalisables : biographie, localisation, liens sociaux.

- **Distribution de Contenu** :
  - Gestion des albums et singles, avec métadonnées (genre, date de sortie).
  - Liaison des singles avec des albums.

- **Suivi des Statistiques** :
  - Nombre d'écoutes et revenus par single.
  - Gestion des droits d'auteur.

- **Playlists et Notifications** :
  - Création et gestion des playlists.
  - Notifications personnalisées pour les artistes.

---

## Schéma de Base de Données

Voici le schéma de la base de données utilisé pour le projet (généré avec [dbdiagram.io](https://dbdiagram.io)) :

![Schéma de Base de Données](./dbdiagram.png)

> Remplacez `./dbdiagram.png` par le chemin ou le lien vers votre schéma généré.

---

## Technologies Utilisées

- **Framework** : [AdonisJS](https://adonisjs.com/) (TypeScript)
- **Base de Données** : MySQL
- **Authentification** : Adonis Auth (Opaque Tokens)
- **Gestion des Emails** : Brevo (anciennement SendinBlue)
- **Modèle de Données** : ORM Lucid
- **Documentation API** : Adonis AutoSwagger

---

## ⚙️ Installation

### Prérequis

- [Node.js](https://nodejs.org/) (version 16 ou supérieure)
- [MySQL](https://www.mysql.com/)
- [Docker](https://www.docker.com/) (optionnel pour la base de données)
- [PNPM](https://pnpm.io/) (gestionnaire de paquets)

### Étapes

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-repo/harmoniq.git
   cd harmoniq
    ```
2. Installez les dépendances :
   ```bash
    pnpm install
    ```
3. Configurez votre fichier .env : Copiez le fichier .env.example :
   ```bash
    cp .env.example .env
    ```
   Modifiez les variables suivantes :
   - `DB_CONNECTION`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`

4. Exécutez les migrations :
   ```bash
   node ace migration:run
   ```
   
5. Lancez le serveur :
   ```bash
    node ace serve --watch
    ```
   
---

## Migrations
Pour réinitialiser et appliquer les migrations :
  ``` bash
  node ace db:wipe
  node ace migration:run
  ```

---

## API

### Authentification
- **Inscription** : `POST /register`

  ```json
  {
  "email": "artist@example.com",
  "password": "securepassword",
  "name": "Artist Name"
  }
  ```
- **Vérification par email** : `POST /verify-email`

  ```json
  {
    "email": "artist@example.com",
    "code": "123456"
  }
  ```
- **Connexion** : `POST /login`

  ```json
  {
    "email": "artist@example.com",
    "password": "securepassword"
  }
  ```

### Gestion des Artistes
- **Récupérer un profil artiste** : `GET /artists/:id`
- **Mettre à jour un profil artiste** : `PUT /artists/:id`

### Albums et Singles
- **Créer un album** : `POST /albums`

  ```json
  {
    "title": "My First Album",
    "release_date": "2024-12-01",
    "metadata": {
      "genre": "Pop"
    }
  }
  ```
  
- **Créer un single** : `POST /singles`

  ```json
  {
    "title": "My First Single",
    "artist_id": 1,
    "album_id": null,
    "release_date": "2024-12-01",
    "metadata": {
      "genre": "Rock"
    }
  }
  ```

### Statistiques
- **Récupérer les statistiques d'un single** : `GET /stats/:single_id`

### Playlists
- **Créer une playlist** : `POST /playlists`

  ```json
  {
    "title": "My Playlist",
    "artist_id": 1
  }
  ```
  
- **Ajouter un single à une playlist** : `POST /playlists/:playlist_id/singles`

  ```json
  {
    "single_id": 1
  }
  ```

---

### ❤️ Contribuez
1. Forkez le dépôt.
2. Créez une branche pour vos modifications :
   ```bash
   git checkout -b feature/new-feature
   ```
3. Faites vos changements et soumettez un PR.

---

## Auteur
Harmoniq a été développé pour simplifier la gestion des artistes et leurs contenus.

---

## 🛠️ Points Techniques
### Authentification
- Basée sur le modèle Artist et des tokens stockés dans api_tokens.
- Vérification des comptes par email avant utilisation.

### Relations de la Base de Données
- Relation Many-to-One entre Artist et Album.
- Relation Many-to-One entre Artist et Single.
- Relation Many-to-Many entre Playlist et Single.

### Envoi d'Emails
- Configuré avec Brevo pour la vérification par email et les notifications.

---

## 📘 Schéma de la Base de Données

---



   
