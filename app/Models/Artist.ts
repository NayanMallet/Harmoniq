import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  BaseModel,
  column,
  beforeSave,
  beforeCreate,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Album from './Album'
import Single from './Single'
import Playlist from './Playlist'
import Notification from './Notification'
import { Location, SearchHistoryEntry } from '../../resources/utils/Interfaces'
import Genres from 'App/Models/Genres'

export default class Artist extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ serialize: (value: string) => value.toLowerCase() })
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public name: string

  @column()
  public genresId?: number[]

  @column()
  public biography?: string

  @column()
  public socialLinks?: Record<string, string> | null

  @column()
  public location?: Location | null

  @column()
  public searchHistory?: SearchHistoryEntry[] | null

  @column({ serializeAs: null })
  public verificationCode?: string | null

  @column({ serializeAs: null })
  public passwordResetToken?: string | null

  @column.dateTime({ serializeAs: null })
  public passwordResetExpiresAt?: DateTime | null

  @column()
  public isVerified: boolean = false

  @column()
  public popularity: number = 0

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static assignVerificationCode(artist: Artist) {
    artist.verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
  }

  @beforeSave()
  public static async hashPassword(artist: Artist) {
    if (artist.$dirty.password) {
      artist.password = await Hash.make(artist.password)
    }
  }

  @hasMany(() => Album)
  public albums: HasMany<typeof Album>

  @hasMany(() => Genres)
  public genre: HasMany<typeof Genres>

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>

  @hasMany(() => Playlist)
  public playlists: HasMany<typeof Playlist>

  @hasMany(() => Notification)
  public notifications: HasMany<typeof Notification>
}
