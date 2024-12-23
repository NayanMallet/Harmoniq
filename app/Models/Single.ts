// app/Models/Single.ts
import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasOne,
  HasOne,
  manyToMany,
  ManyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import Artist from './Artist'
import Album from './Album'
import Metadata from './Metadata'
import Stat from './Stat'
import Genres from 'App/Models/Genres'

export default class Single extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public albumId?: number

  @column()
  public artistId: number

  @column()
  public genreId: number

  @column.dateTime()
  public releaseDate?: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasOne(() => Genres)
  public genre: HasOne<typeof Genres>

  @belongsTo(() => Album)
  public album: BelongsTo<typeof Album>

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @manyToMany(() => Artist, {
    pivotTable: 'single_featurings',
  })
  public featurings: ManyToMany<typeof Artist>

  @hasOne(() => Metadata, {
    foreignKey: 'singleId',
  })
  public metadata: HasOne<typeof Metadata>

  @hasOne(() => Stat)
  public stats: HasOne<typeof Stat>
}
