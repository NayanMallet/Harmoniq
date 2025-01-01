// app/Validators/SingleValidator.ts
import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'

export default class SingleValidator {
  public static createSchema = schema.create({
    title: schema.string({}, [rules.maxLength(255)]),
    genreId: schema.number([
      rules.exists({ table: 'genres', column: 'id' }),
    ]),
    releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
    albumId: schema.number.optional([
      rules.exists({ table: 'albums', column: 'id' }),
    ]),
    metadata: schema.object().members({
      coverUrl: schema.string({}, [rules.url()]),
      lyrics: schema.string.optional(),
    }),
    copyrights: schema.array().members(
      schema.object().members({
        artistId: schema.number.optional([
          rules.exists({ table: 'artists', column: 'id' }),
        ]),
        ownerName: schema.string.optional(),
        role: schema.string({}, [rules.maxLength(255)]),
        percentage: schema.number([rules.range(0, 100)]),
      })
    ),
  })

  public static updateSchema = schema.create({
    title: schema.string.optional({}, [rules.maxLength(255)]),
    genreId: schema.number.optional([
      rules.exists({ table: 'genres', column: 'id' }),
    ]),
    releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
    albumId: schema.number.optional([
      rules.exists({ table: 'albums', column: 'id' }),
    ]),
    metadata: schema.object.optional().members({
      coverUrl: schema.string.optional({}, [rules.url()]),
      lyrics: schema.string.optional(),
    }),
    copyrights: schema.array.optional().members(
      schema.object().members({
        artistId: schema.number.optional([
          rules.exists({ table: 'artists', column: 'id' }),
        ]),
        ownerName: schema.string.optional(),
        role: schema.string({}, [rules.maxLength(255)]),
        percentage: schema.number([rules.range(0, 100)]),
      })
    ),
  })

  /**
   * Filtre / pagination / tri
   */
  public static filterSchema = schema.create({
    genreId: schema.number.optional([
      rules.exists({ table: 'genres', column: 'id' }),
    ]),
    title: schema.string.optional({}, [rules.maxLength(255)]),
    artistId: schema.number.optional([
      rules.exists({ table: 'artists', column: 'id' }),
    ]),
    sortBy: schema.enum.optional(['title', 'releaseDate', 'popularity'] as const),
    sortDirection: schema.enum.optional(['asc', 'desc'] as const),
    page: schema.number.optional([rules.range(1, 10000)]),
    limit: schema.number.optional([rules.range(1, 100)]),
  })

  public static messages: CustomMessages = {
    'title.maxLength': 'Title cannot exceed 255 characters.',
    'genreId.number': 'genreId must be a valid number.',
    'genreId.exists': 'Specified genre does not exist.',
    'coverUrl.url': 'Cover URL must be a valid URL.',
    'role.maxLength': 'Role cannot exceed 255 characters.',
    'percentage.range': 'Percentage must be between 0 and 100.',
    'artistId.exists': 'Specified artist does not exist.',
    'albumId.exists': 'Specified album does not exist.',
    'sortBy.enum': 'sortBy must be one of title, releaseDate, popularity.',
    'sortDirection.enum': 'sortDirection must be either asc or desc.',
    'page.range': 'Page must be between 1 and 10000.',
    'limit.range': 'Limit must be between 1 and 100.',
  }
}
