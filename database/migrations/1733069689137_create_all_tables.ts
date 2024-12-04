// database/migrations/xxxx_create_all_tables.ts

import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { Genre } from '../../resources/utils/GenreEnum'

export default class CreateAllTables extends BaseSchema {
  public async up() {
    // Table des artistes
    this.schema.createTable('artists', (table) => {
      table.increments('id')
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('name').notNullable()
      table.text('biography').nullable()
      table.json('social_links').nullable()
      table.json('location').nullable()
      table.string('verification_code').nullable()
      table.string('password_reset_token').nullable()
      table.timestamp('password_reset_expires_at', { useTz: true }).nullable()
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.integer('popularity').notNullable().defaultTo(0)
      table.json('genres').nullable() // Tableau de genres
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des albums
    this.schema.createTable('albums', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.json('genres').nullable() // Tableau de genres
      table.timestamp('release_date', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des singles
    this.schema.createTable('singles', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('album_id').unsigned().nullable()
        .references('id').inTable('albums').onDelete('SET NULL')
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.enum('genre', Object.values(Genre)).notNullable()
      table.timestamp('release_date', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des métadonnées
    this.schema.createTable('metadata', (table) => {
      table.increments('id')
      table.integer('single_id').unsigned().nullable()
        .references('id').inTable('singles').onDelete('CASCADE')
      table.integer('album_id').unsigned().nullable()
        .references('id').inTable('albums').onDelete('CASCADE')
      table.string('cover_url').notNullable()
      table.text('lyrics').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Contrainte pour s'assurer que soit single_id, soit album_id est présent, mais pas les deux
      table.check(
        '((single_id IS NOT NULL AND album_id IS NULL) OR (single_id IS NULL AND album_id IS NOT NULL))'
      )
    })

    // Table des droits d'auteur
    this.schema.createTable('copyrights', (table) => {
      table.increments('id')
      table.integer('metadata_id').unsigned().notNullable()
        .references('id').inTable('metadata').onDelete('CASCADE')
      table.integer('artist_id').unsigned().nullable()
        .references('id').inTable('artists').onDelete('SET NULL')
      table.string('owner_name').nullable()
      table.string('role').notNullable()
      table.float('percentage').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Contrainte pour s'assurer que le pourcentage est entre 0 et 100
      table.check('percentage >= 0 AND percentage <= 100')
    })

    // Table des statistiques
    this.schema.createTable('stats', (table) => {
      table.increments('id')
      table.integer('single_id').unsigned().notNullable()
        .references('id').inTable('singles').onDelete('CASCADE')
      table.integer('listens_count').notNullable().defaultTo(0)
      table.decimal('revenue', 10, 2).notNullable().defaultTo(0.0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des playlists
    this.schema.createTable('playlists', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table pivot playlists - singles
    this.schema.createTable('playlist_singles', (table) => {
      table.integer('playlist_id').unsigned().notNullable()
        .references('id').inTable('playlists').onDelete('CASCADE')
      table.integer('single_id').unsigned().notNullable()
        .references('id').inTable('singles').onDelete('CASCADE')
      table.timestamp('added_at', { useTz: true }).notNullable()
      table.primary(['playlist_id', 'single_id'])
    })

    // Table des notifications
    this.schema.createTable('notifications', (table) => {
      table.increments('id')
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.text('message').notNullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des tokens API
    this.schema.createTable('api_tokens', (table) => {
      table.increments('id')
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('type').notNullable()
      table.string('token', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
    })

    // Table pivot pour les featurings
    this.schema.createTable('single_featurings', (table) => {
      table.integer('single_id').unsigned().notNullable()
        .references('id').inTable('singles').onDelete('CASCADE')
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      table.primary(['single_id', 'artist_id'])
    })
  }

  public async down() {
    this.schema.dropTable('single_featurings')
    this.schema.dropTable('api_tokens')
    this.schema.dropTable('notifications')
    this.schema.dropTable('playlist_singles')
    this.schema.dropTable('playlists')
    this.schema.dropTable('stats')
    this.schema.dropTable('copyrights')
    this.schema.dropTable('metadata')
    this.schema.dropTable('singles')
    this.schema.dropTable('albums')
    this.schema.dropTable('artists')
  }
}
