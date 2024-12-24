import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'

export default class GenresValidator {
  public static createSchema = schema.create({
    name: schema.string({}, [rules.maxLength(255)]),
    description: schema.string.optional({}, [rules.maxLength(255)]),
  })

  public static updateSchema = schema.create({
    name: schema.string.optional({}, [rules.maxLength(255)]),
    description: schema.string.optional({}, [rules.maxLength(255)]),
  })

  public static messages: CustomMessages = {
    'name.maxLength': 'Name cannot exceed 255 characters.',
    'description.maxLength': 'Description cannot exceed 255 characters.',
  }
}
