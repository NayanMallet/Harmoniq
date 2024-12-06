import { schema, rules, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthValidator {
  constructor(protected ctx: HttpContextContract) {}

  /**
   * Schéma pour l'enregistrement d'un artiste
   */
  public static registerSchema = schema.create({
    email: schema.string({}, [
      rules.email(),
      rules.normalizeEmail({ allLowercase: true }),
      rules.maxLength(255),
    ]),
    password: schema.string({}, [rules.confirmed(), rules.minLength(8)]),
    name: schema.string({}, [rules.maxLength(255)]),
  })

  /**
   * Schéma pour la vérification de l'email
   */
  public static verifyEmailSchema = schema.create({
    email: schema.string({}, [rules.email()]),
    code: schema.string({}),
  })

  /**
   * Schéma pour la demande de réinitialisation du mot de passe
   */
  public static requestPasswordResetSchema = schema.create({
    email: schema.string({}, [rules.email()]),
  })

  /**
   * Schéma pour la réinitialisation du mot de passe
   */
  public static resetPasswordSchema = schema.create({
    token: schema.string({}),
    password: schema.string({}, [rules.confirmed(), rules.minLength(8)]),
  })

  /**
   * Schéma pour la connexion
   */
  public static loginSchema = schema.create({
    email: schema.string({}, [
      rules.email(),
      rules.normalizeEmail({ allLowercase: true }),
    ]),
    password: schema.string({}, [rules.minLength(8)]),
  })

  /**
   * Messages personnalisés pour tous les schémas
   */
  public static messages: CustomMessages = {
    'email.required': 'L’email est requis.',
    'email.email': 'Veuillez fournir une adresse email valide.',
    'email.maxLength': 'L’email ne peut pas dépasser 255 caractères.',
    'password.required': 'Le mot de passe est requis.',
    'password.minLength': 'Le mot de passe doit contenir au moins 8 caractères.',
    'password_confirmation.confirmed': 'La confirmation du mot de passe ne correspond pas.',
    'name.required': 'Le nom est requis.',
    'name.maxLength': 'Le nom ne peut pas dépasser 255 caractères.',
    'token.required': 'Le jeton est requis.',
    'code.required': 'Le code de vérification est requis.',
  }
}
