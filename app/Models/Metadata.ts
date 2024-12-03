import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  hasMany,
  HasMany,
  beforeSave,
} from '@ioc:Adonis/Lucid/Orm'
import Single from './Single'
import Album from './Album'
import Copyright from './Copyright'

export default class Metadata extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public singleId?: number

  @column()
  public albumId?: number

  @column()
  public coverUrl: string

  @column()
  public lyrics?: string // Pour les singles

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Relations
  @belongsTo(() => Single)
  public single: BelongsTo<typeof Single>

  @belongsTo(() => Album)
  public album: BelongsTo<typeof Album>

  @hasMany(() => Copyright)
  public copyrights: HasMany<typeof Copyright>

  @beforeSave()
  public static async validateMetadata(metadata: Metadata) {
    // Validation pour s'assurer que soit singleId, soit albumId est présent, mais pas les deux
    if ((metadata.singleId && metadata.albumId) || (!metadata.singleId && !metadata.albumId)) {
      throw new Error('Either singleId or albumId must be provided, but not both')
    }
  }
}
