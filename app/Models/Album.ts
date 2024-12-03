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
  afterSave,
} from '@ioc:Adonis/Lucid/Orm'
import Artist from './Artist'
import Single from './Single'
import Metadata from './Metadata'

export default class Album extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

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
  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @hasOne(() => Metadata, {
    foreignKey: 'albumId',
  })
  public metadata: HasOne<typeof Metadata>

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>

  @afterSave()
  public static async updateArtistGenres(album: Album) {
    const artist = await Artist.find(album.artistId)
    if (artist) {
      await artist.updateGenres()
    }
  }
}
