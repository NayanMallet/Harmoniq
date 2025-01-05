// app/Validators/AlbumValidator.ts
import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'

export default class AlbumValidator {
  public static createSchema = schema.create({
    title: schema.string({}, [rules.maxLength(255)]),
    metadata: schema.object().members({
      coverUrl: schema.string({}, [rules.url()]),
    }),
  })

  public static updateSchema = schema.create({
    title: schema.string.optional({}, [rules.maxLength(255)]),
    metadata: schema.object.optional().members({
      coverUrl: schema.string.optional({}, [rules.url()]),
    }),
  })

  /**
   * Filtre/Pagination/Tri pour lister les albums
   */
  public static filterSchema = schema.create({
    genreId: schema.number.optional([
      rules.exists({ table: 'genres', column: 'id' }),
    ]),
    title: schema.string.optional({}, [rules.maxLength(255)]),
    artistId: schema.number.optional([
      rules.exists({ table: 'artists', column: 'id' }),
    ]),
    sortBy: schema.enum.optional(['title', 'releaseDate'] as const),
    sortDirection: schema.enum.optional(['asc', 'desc'] as const),
    page: schema.number.optional([rules.range(1, 10000)]),
    limit: schema.number.optional([rules.range(1, 100)]),
  })

  public static messages: CustomMessages = {
    'title.maxLength': 'Title cannot exceed 255 characters.',
    'coverUrl.url': 'Cover URL must be a valid URL.',

    'genreId.number': 'genreId must be a valid number.',
    'genreId.exists': 'Specified genre does not exist.',
    'artistId.exists': 'Specified artist does not exist.',
    'sortBy.enum': 'sortBy must be either "title" or "releaseDate".',
    'sortDirection.enum': 'sortDirection must be either "asc" or "desc".',
    'page.range': 'Page must be between 1 and 10000.',
    'limit.range': 'Limit must be between 1 and 100.',
  }
}
