// app/Models/Genre.ts

import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  beforeSave,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Single from 'App/Models/Single'

/**
 * @swagger
 * definitions:
 *   Genre:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       slug:
 *         type: string
 *       createdAt:
 *         type: string
 *         format: date-time
 *       updatedAt:
 *         type: string
 *         format: date-time
 */
export default class Genre extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description: string | null

  @column()
  public slug: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relation: un genre peut appartenir à plusieurs singles
  @hasMany(() => Single, {
    foreignKey: 'genreId', // Single.genreId
  })
  public singles: HasMany<typeof Single>

  @beforeSave()
  public static async generateSlug(genre: Genre) {
    // Minimal slug
    genre.slug = genre.name.toLowerCase().replace(/\s+/g, '-')
  }
}
