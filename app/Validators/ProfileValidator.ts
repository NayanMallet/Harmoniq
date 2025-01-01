import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ProfileValidator {
  constructor(protected ctx: HttpContextContract) {}

  /**
   * Validation pour la mise à jour du profil de l’artiste
   */
  public static updateSchema = schema.create({
    biography: schema.string.optional({}, [rules.maxLength(1000)]),
    socialLinks: schema.object.optional().anyMembers(
      //@ts-ignore
      schema.string({}, [rules.url()])
    ),
    location: schema.object.optional().members({
      country: schema.string({}, [
        rules.minLength(2),
        rules.maxLength(255),
        rules.regex(/^[A-Za-z]+$/),
      ]),
      city: schema.string({}, [
        rules.maxLength(255),
        rules.regex(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/),
      ]),
    }),
  })

  /**
   * Validation pour la recherche d’artistes (index)
   */
  public static searchSchema = schema.create({
    genreId: schema.number.optional([
      // On vérifie que cet ID existe dans la table "genres" si on veut être strict
      rules.exists({ table: 'genres', column: 'id' }),
    ]),

    country: schema.string.optional({}, [
      rules.minLength(2),
      rules.maxLength(255),
    ]),
    city: schema.string.optional({}, [
      rules.maxLength(255),
    ]),
    name: schema.string.optional({}, [rules.maxLength(255)]),

    sort: schema.enum.optional(['popularity', 'name'] as const),
    // Optionnel : si vous voulez gérer la direction du tri dans le validateur
    // sortDirection: schema.enum.optional(['asc', 'desc'] as const),

    page: schema.number.optional([rules.range(1, 10000)]),
    limit: schema.number.optional([rules.range(1, 100)]),
  })

  /**
   * Validation pour la comparaison d’artistes
   */
  public static compareSchema = schema.create({
    ids: schema.string({}, [
      rules.regex(/^\d+(,\d+)*$/),
    ]),
  })

  /**
   * Les clés reconnues par le validateur.
   * On s'en servira pour détecter les params inconnus.
   */
  public static recognizedKeys = [
    'genreId',
    'title',
    'artistId',
    'sortBy',
    'sortDirection',
    'page',
    'limit',
  ]

  public static messages: CustomMessages = {
    'genreId.number': 'genreId must be a valid number.',
    'genreId.exists': 'Specified genre does not exist.',
    'country.maxLength': 'Country cannot exceed 255 characters.',
    'country.regex': 'Country must be letters only.',
    'city.maxLength': 'City name cannot exceed 255 characters.',
    'name.maxLength': 'Name cannot exceed 255 characters.',
    'sort.enum': 'Sort must be either "popularity" or "name".',
    'biography.maxLength': 'Biography cannot exceed 1000 characters.',
    'socialLinks.*.url': 'Each social link must be a valid URL.',
    'location.country.minLength': 'Country name must be at least 2 characters.',
    'location.country.maxLength': 'Country name cannot exceed 255 characters.',
    'location.country.regex': 'Country name must contain only letters.',
    'location.city.maxLength': 'City name cannot exceed 255 characters.',
    'ids.regex': 'The "ids" parameter must be a comma-separated list of numeric IDs.',
    'page.range': 'Page number must be between 1 and 10000.',
    'limit.range': 'Limit must be between 1 and 100.',
  }
}
