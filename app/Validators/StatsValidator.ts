// app/Validators/StatsValidator.ts

import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'

export default class StatsValidator {
  public static updateSchema = schema.create({
    listensCount: schema.number.optional([
      rules.unsigned(), // pas de valeur négative
    ]),
  })

  public static messages: CustomMessages = {
    'listensCount.number': 'listensCount must be a number.',
    'listensCount.unsigned': 'listensCount cannot be negative.'
  }
}
