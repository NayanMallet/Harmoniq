// app/Models/Album.ts

import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasOne,
  HasOne,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Artist from './Artist'
import Single from './Single'
import Metadata from './Metadata'
import { Genre } from '../../resources/utils/GenreEnum'

//TODO: Singles non ajoutés à l'album

/**
 * @swagger
 * definitions:
 *   Album:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       title:
 *         type: string
 *       artistId:
 *         type: integer
 *       genre:
 *         $ref: '#/definitions/Genre'
 *       releaseDate:
 *         type: string
 *         format: date-time
 *       createdAt:
 *         type: string
 *         format: date-time
 *       updatedAt:
 *         type: string
 *         format: date-time
 */
export default class Album extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public artistId: number

  @column({
    prepare: (value: Genre[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value) as Genre[]
      } else {
        return value as Genre[]
      }
    },
  })
  public genres?: Genre[]

  @column.dateTime()
  public releaseDate?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relations
  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @hasOne(() => Metadata, {
    foreignKey: 'albumId',
  })
  public metadata: HasOne<typeof Metadata>

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>
}
