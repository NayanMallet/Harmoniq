import { DateTime } from 'luxon'
import { BaseModel, beforeSave, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Single from 'App/Models/Single'
import Album from 'App/Models/Album'
import Artist from 'App/Models/Artist'

//relation ManyToMany
export default class Genres extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public slug: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async generateSlug(genre: Genres) {
    genre.slug = genre.name.toLowerCase().replace(/ /g, '-')
  }

  @belongsTo(() => Single)
  public single: BelongsTo<typeof Single>

  @belongsTo(() => Album)
  public album: BelongsTo<typeof Album>

  @belongsTo(() => Artist)
  public artist: BelongsTo<typeof Artist>
}
