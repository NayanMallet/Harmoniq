import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  beforeSave,
} from '@ioc:Adonis/Lucid/Orm'
import Metadata from './Metadata'
import Artist from './Artist'

export default class Copyright extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public metadataId: number

  @column()
  public artistId?: number

  // Le champ ownerName est utilisé lorsque `artistId` est null
  @column()
  public ownerName?: string

  @column()
  public role: string

  @column()
  public percentage: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relations
  @belongsTo(() => Metadata)
  public metadata: BelongsTo<typeof Metadata>

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>

  @beforeSave()
  public static async validateCopyright(copyright: Copyright) {
    // Validation du pourcentage entre 0 et 100
    if (copyright.percentage < 0 || copyright.percentage > 100) {
      throw new Error('Percentage must be between 0 and 100')
    }

    // Validation de la présence de artistId ou ownerName
    if (!copyright.artistId && !copyright.ownerName) {
      throw new Error('Either artistId or ownerName must be provided')
    }
  }
}
