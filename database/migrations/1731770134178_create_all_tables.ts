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
      table.json('social_links').nullable()
      table.string('location').nullable()
      table.boolean('is_verified').defaultTo(false)
      table.string('verification_code').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des albums
    this.schema.createTable('albums', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('artist_id').unsigned().references('id').inTable('artists').onDelete('CASCADE')
      table.date('release_date').nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des singles
    this.schema.createTable('singles', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('album_id').unsigned().nullable().references('id').inTable('albums').onDelete('CASCADE')
      table.integer('artist_id').unsigned().references('id').inTable('artists').onDelete('CASCADE')
      table.date('release_date').nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des droits d'auteur
    this.schema.createTable('copyrights', (table) => {
      table.increments('id')
      table.integer('single_id').unsigned().references('id').inTable('singles').onDelete('CASCADE')
      table.string('owner_name').notNullable()
      table.float('percentage').notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des statistiques
    this.schema.createTable('stats', (table) => {
      table.increments('id')
      table.integer('single_id').unsigned().references('id').inTable('singles').onDelete('CASCADE')
      table.integer('listens_count').defaultTo(0)
      table.decimal('revenue', 10, 2).defaultTo(0.0)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des playlists
    this.schema.createTable('playlists', (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.integer('artist_id').unsigned().references('id').inTable('artists').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des relations playlists - singles
    this.schema.createTable('playlist_singles', (table) => {
      table.integer('playlist_id').unsigned().references('id').inTable('playlists').onDelete('CASCADE')
      table.integer('single_id').unsigned().references('id').inTable('singles').onDelete('CASCADE')
      table.timestamp('added_at', { useTz: true })
      table.primary(['playlist_id', 'single_id'])
    })

    // Table des notifications
    this.schema.createTable('notifications', (table) => {
      table.increments('id')
      table.integer('artist_id').unsigned().references('id').inTable('artists').onDelete('CASCADE')
      table.text('message').notNullable()
      table.boolean('is_read').defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    // Table des tokens API
    this.schema.createTable('api_tokens', (table) => {
      table.increments('id')
      table.integer('artist_id').unsigned().references('id').inTable('artists').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('type').notNullable()
      table.string('token', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable('api_tokens')
    this.schema.dropTable('notifications')
    this.schema.dropTable('playlist_singles')
    this.schema.dropTable('playlists')
    this.schema.dropTable('stats')
    this.schema.dropTable('copyrights')
    this.schema.dropTable('singles')
    this.schema.dropTable('albums')
    this.schema.dropTable('artists')
  }
}
