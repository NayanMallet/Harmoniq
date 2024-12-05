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
import { Location, SocialLinks } from '../../resources/utils/interfaces'
import { Genre } from '../../resources/utils/GenreEnum'


export default class Artist extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  // Sérialisation de l'email en minuscule pour éviter les doublons liés à la casse.
  @column({ serialize: (value: string) => value.toLowerCase() })
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public name: string

  @column()
  public biography?: string

  // Sérialisation/Désérialisation JSON
  @column({
    prepare: (value: SocialLinks | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      } else {
        // Si la valeur est déjà un objet, on la retourne directement
        return value as SocialLinks
      }
    },
  })
  public socialLinks?: SocialLinks

  @column({
    prepare: (value: Location | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      } else {
        return value as Location
      }
    },
  })
  public location?: Location

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

  @column({
    prepare: (value: Genre[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | object | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value) as Genre[]
      } else {
        return value as Genre[]
      }
    },
  })
  public genres?: Genre[]

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
