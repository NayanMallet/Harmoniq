// database/migrations/xxxx_create_all_tables.ts

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CreateAllTables extends BaseSchema {
  public async up() {
    // Table des artistes
    this.schema.createTable('artists', (table) => {
      table.increments('id')
      table.string('email').notNullable().unique()
      table.string('password').notNullable()
      table.string('name').notNullable()
      table.text('biography').nullable()
      // JSON columns
      table.json('social_links').nullable()
      table.json('location').nullable()
      table.string('verification_code').nullable()
      table.string('password_reset_token').nullable()
      table.timestamp('password_reset_expires_at', { useTz: true }).nullable()
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.integer('popularity').notNullable().defaultTo(0)
      // tableau d'IDs de genres
      table.json('genres_id').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des albums
    this.schema.createTable('albums', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      // tableau d'IDs de genres
      table.json('genres_id').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Table des genres
    this.schema.createTable('genres', (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('description').nullable()
      table.string('slug').notNullable().unique()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Insérer des données initiales dans la table genres
    this.defer(async (db) => {
      await db.table('genres').insert([
        { name: 'Pop', description: 'Popular music', slug: 'pop', created_at: new Date(), updated_at: new Date() },
        { name: 'Rock', description: 'Rock music', slug: 'rock', created_at: new Date(), updated_at: new Date() },
        { name: 'HipHop', description: 'Hip Hop music', slug: 'hiphop', created_at: new Date(), updated_at: new Date() },
        { name: 'Jazz', description: 'Jazz music', slug: 'jazz', created_at: new Date(), updated_at: new Date() },
        { name: 'Classical', description: 'Classical music', slug: 'classical', created_at: new Date(), updated_at: new Date() },
        { name: 'Electronic', description: 'Electronic music', slug: 'electronic', created_at: new Date(), updated_at: new Date() },
        { name: 'Reggae', description: 'Reggae music', slug: 'reggae', created_at: new Date(), updated_at: new Date() },
        { name: 'Country', description: 'Country music', slug: 'country', created_at: new Date(), updated_at: new Date() },
        { name: 'Blues', description: 'Blues music', slug: 'blues', created_at: new Date(), updated_at: new Date() },
        { name: 'Metal', description: 'Metal music', slug: 'metal', created_at: new Date(), updated_at: new Date() },
        { name: 'Soul', description: 'Soul music', slug: 'soul', created_at: new Date(), updated_at: new Date() },
        { name: 'Funk', description: 'Funk music', slug: 'funk', created_at: new Date(), updated_at: new Date() },
        { name: 'Disco', description: 'Disco music', slug: 'disco', created_at: new Date(), updated_at: new Date() },
        { name: 'Folk', description: 'Folk music', slug: 'folk', created_at: new Date(), updated_at: new Date() },
        { name: 'Latin', description: 'Latin music', slug: 'latin', created_at: new Date(), updated_at: new Date() },
        { name: 'Other', description: 'Other music', slug: 'other', created_at: new Date(), updated_at: new Date() },
      ])
    })

    // Table des singles
    this.schema.createTable('singles', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('album_id').unsigned().nullable()
        .references('id').inTable('albums').onDelete('SET NULL')
      table.integer('artist_id').unsigned().notNullable()
        .references('id').inTable('artists').onDelete('CASCADE')
      // genre_id => pointeur vers la table genres
      table.integer('genre_id').unsigned().notNullable()
        .references('id').inTable('genres')
        .onDelete('RESTRICT') // ou CASCADE si vous préférez
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

      // single_id XOR album_id
      table.check('((single_id IS NOT NULL AND album_id IS NULL) OR (single_id IS NULL AND album_id IS NOT NULL))')
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

    // Table pivot pour les featurings (single_featurings)
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
    this.schema.dropTable('genres')
    this.schema.dropTable('artists')
  }
}
