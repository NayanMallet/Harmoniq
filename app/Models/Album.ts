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
import Genre from 'App/Models/Genre'

export default class Album extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public artistId: number

  @column()
  public genreIds?: number[]

  @column.dateTime()
  public releaseDate?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @hasOne(() => Metadata, {
    foreignKey: 'albumId',
  })
  public metadata: HasOne<typeof Metadata>

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>

  @hasMany(() => Genre)
  public genre: HasMany<typeof Genre>
}
