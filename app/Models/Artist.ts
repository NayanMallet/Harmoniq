import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Album from './Album'
import Single from './Single'
import Playlist from './Playlist'
import Notification from './Notification'

export default class Artist extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public name: string

  @column()
  public biography: string | null

  @column()
  public socialLinks: any // JSON

  @column()
  public location: string | null

  @column()
  public isVerified: boolean

  @column()
  public verificationCode: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(artist: Artist) {
    if (artist.$dirty.password) {
      artist.password = await Hash.make(artist.password)
    }
  }

  // Relations
  @hasMany(() => Album)
  public albums: HasMany<typeof Album>

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>

  @hasMany(() => Playlist)
  public playlists: HasMany<typeof Playlist>

  @hasMany(() => Notification)
  public notifications: HasMany<typeof Notification>
}
