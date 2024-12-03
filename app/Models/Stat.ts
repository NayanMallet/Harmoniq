import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from '@ioc:Adonis/Lucid/Orm'
import Single from './Single'

export default class Stat extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public singleId: number

  @column()
  public listensCount: number

  @column()
  public revenue: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Single)
  public single: BelongsTo<typeof Single>
}
