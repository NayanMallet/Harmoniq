import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasOne,
  HasOne,
  afterSave,
} from '@ioc:Adonis/Lucid/Orm'
import Artist from './Artist'
import Album from './Album'
import Metadata from './Metadata'
import Stat from './Stat'

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
  public genre: string

  @column.dateTime()
  public releaseDate?: DateTime

  // Suppression du champ metadata JSON

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relations
  @belongsTo(() => Album)
  public album: BelongsTo<typeof Album>

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @hasOne(() => Metadata, {
    foreignKey: 'singleId',
  })
  public metadata: HasOne<typeof Metadata>

  @hasOne(() => Stat)
  public stats: HasOne<typeof Stat>

  @afterSave()
  public static async updateArtistGenres(single: Single) {
    const artist = await Artist.find(single.artistId)
    if (artist) {
      await artist.updateGenres()
    }
  }
}
