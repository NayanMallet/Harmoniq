import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  hasMany,
  HasMany,
  beforeCreate,
} from '@ioc:Adonis/Lucid/Orm'
import Album from './Album'
import Single from './Single'
import Playlist from './Playlist'
import Notification from './Notification'

type SocialLinks = {
  [key: string]: string
}

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


  // Assure la conversion entre l'objet et la chaîne JSON pour le stockage en base de données.
  @column({
    serialize: (value: string) => (value ? JSON.parse(value) : null),
    prepare: (value: SocialLinks) => JSON.stringify(value),
  })
  public socialLinks?: SocialLinks

  @column({
    serialize: (value: string) => value ? value.split(',').map((v) => v.trim()) : null,
    prepare: (value: string[]) => value.join(', '),
  })
  public location?: string

  @column({ serializeAs: null })
  public verificationCode?: string

  @column()
  public isVerified: boolean = false

  @column()
  public popularity: number = 0

  @column()
  public genres?: string[]

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

  public async updateGenres() {
    const singlesGenres = await Single
      .query()
      .where('artistId', this.id)
      .whereNotNull('genre')
      .groupBy('genre')
      .count('* as count')
      .select('genre')

    const genreCounts: { [key: string]: number } = {}
    singlesGenres.forEach((row) => {
      const genre = row.genre
      const count = Number(row.$extras.count)
      genreCounts[genre] = (genreCounts[genre] || 0) + count
    })

    const sortedGenres = Object.keys(genreCounts).sort(
      (a, b) => genreCounts[b] - genreCounts[a]
    )

    this.genres = sortedGenres
    await this.save()
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
