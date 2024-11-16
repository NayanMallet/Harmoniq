import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Artist from './Artist'
import Album from './Album'

export default class Single extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public albumId: number | null

  @column()
  public artistId: number

  @column.dateTime()
  public releaseDate: DateTime | null

  @column()
  public metadata: any // JSON

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Album)
  public album: BelongsTo<typeof Album>

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>
}
