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
import { Genre } from '../../resources/utils/GenreEnum'
import { Location, SearchHistoryEntry } from '../../resources/utils/Interfaces'

/**
 * @swagger
 * definitions:
 *   Artist:
 *     type: object
 *     properties:
 *       id:
 *         type: number
 *         description: Artist ID
 *       email:
 *         type: string
 *         format: email
 *         description: Artist email (lowercased)
 *       name:
 *         type: string
 *         description: Artist name
 *       biography:
 *         type: string
 *         description: Artist biography
 *       social_links:
 *         type: string
 *         description: JSON stringified object of social links
 *       location:
 *         type: string
 *         description: JSON stringified object containing country and city
 *       search_history:
 *         type: string
 *         description: JSON stringified array of search entries
 *       verificationCode:
 *         type: string
 *         description: Code used for verifying email (null if verified)
 *       isVerified:
 *         type: boolean
 *         description: Whether artist verified email
 *       popularity:
 *         type: number
 *         description: Artist popularity score
 *       genres:
 *         type: string
 *         description: JSON stringified array of genres
 *       createdAt:
 *         type: string
 *         format: date-time
 *       updatedAt:
 *         type: string
 *         format: date-time
 */
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

  @column()
  public genres?: Genre[] | null

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

  @hasMany(() => Single)
  public singles: HasMany<typeof Single>

  @hasMany(() => Playlist)
  public playlists: HasMany<typeof Playlist>

  @hasMany(() => Notification)
  public notifications: HasMany<typeof Notification>
}
