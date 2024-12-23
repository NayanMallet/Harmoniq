// app/Validators/AlbumValidator.ts
import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'

export default class AlbumValidator {
  public static createSchema = schema.create({
    title: schema.string({}, [rules.maxLength(255)]),
    releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
    metadata: schema.object().members({
      coverUrl: schema.string({}, [rules.url()]),
    }),
  })

  public static updateSchema = schema.create({
    title: schema.string.optional({}, [rules.maxLength(255)]),
    releaseDate: schema.date.optional({ format: 'yyyy-MM-dd' }),
    metadata: schema.object.optional().members({
      coverUrl: schema.string.optional({}, [rules.url()]),
    }),
  })

  public static messages: CustomMessages = {
    'title.maxLength': 'Title cannot exceed 255 characters.',
    'coverUrl.url': 'Cover URL must be a valid URL.',
    'releaseDate.date.format': 'Release date must be in yyyy-MM-dd format.',
  }
}
