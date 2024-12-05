import EmailService from 'App/Services/EmailService'
import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class AuthController {

  /**
   * @register
   * @summary Register a new artist
   * @description Registers a new artist and sends a verification email.
   * @requestBody
   * {
   *   "email": "string",
   *   "password": "string",
   *   "password_confirmation": "string",
   *   "name": "string"
   * }
   * @responseBody 201 - { "message": "Artist registered successfully. Please verify your email." }
   * @responseBody 400 - { "errors": [{ "field": "email", "message": "Validation or registration failed." }] }
   */
  public async register({ request, response }: HttpContextContract) {
    const artistSchema = schema.create({
      email: schema.string({}, [
        rules.email(),
        rules.normalizeEmail({ allLowercase: true }),
        rules.maxLength(255),
      ]),
      password: schema.string({}, [
        rules.confirmed(),
        rules.minLength(8),
      ]),
      name: schema.string({}, [rules.maxLength(255)]),
    })

    const messages = {
      'email.required': 'Email is required.',
      'email.email': 'Please provide a valid email address.',
      'email.maxLength': 'Email cannot be longer than 255 characters.',
      'password.required': 'Password is required.',
      'password.minLength': 'Password must be at least 8 characters long.',
      'password_confirmation.confirmed': 'Password confirmation does not match.',
      'name.required': 'Name is required.',
      'name.maxLength': 'Name cannot be longer than 255 characters.',
    }

    try {
      const data = await request.validate({ schema: artistSchema, messages })

      // Vérifie si l'email est déjà utilisé
      const existingArtist = await Artist.findBy('email', data.email.toLowerCase())
      if (existingArtist) {
        return response.badRequest({
          errors: [{ field: 'email', message: 'Email already registered.' }],
        })
      }

      const artist = await Artist.create(data)
      await EmailService.sendVerificationEmail(artist.email, artist.verificationCode!)

      return response.created({ message: 'Artist registered successfully. Please verify your email.' })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({ errors: error.messages.errors })
      } else {
        return response.badRequest({ errors: [{ message: 'Registration failed.' }] })
      }
    }
  }

  /**
   * @verifyEmail
   * @summary Verify artist's email
   * @description Verifies the artist's email using the provided verification code.
   * @requestBody
   * {
   *   "email": "string",
   *   "code": "string"
   * }
   * @responseBody 200 - { "message": "Email verified successfully." }
   * @responseBody 400 - { "errors": [{ "message": "Invalid verification code." }] }
   * @responseBody 404 - { "errors": [{ "message": "Artist not found." }] }
   */
  public async verifyEmail({ request, response }: HttpContextContract) {
    const { email, code } = request.only(['email', 'code'])
    const artist = await Artist.findBy('email', email.toLowerCase())

    if (!artist) {
      return response.notFound({ errors: [{ message: 'Artist not found.' }] })
    }

    if (artist.verificationCode === code) {
      artist.isVerified = true
      artist.verificationCode = null
      await artist.save()

      return response.ok({ message: 'Email verified successfully.' })
    } else {
      return response.badRequest({ errors: [{ message: 'Invalid verification code.' }] })
    }
  }

  /**
   * @login
   * @summary Log in an artist
   * @description Logs in an artist and returns an API token.
   * @requestBody
   * {
   *   "email": "string",
   *   "password": "string"
   * }
   * @responseBody 200 - { "message": "Login successful.", "token": { "type": "object" } }
   * @responseBody 400 - { "errors": [{ "message": "Invalid credentials." }] }
   * @responseBody 401 - { "errors": [{ "message": "Email not verified." }] }
   */
  public async login({ request, auth, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    const artist = await Artist.findBy('email', email.toLowerCase())
    if (!artist) {
      return response.badRequest({ errors: [{ message: 'Invalid credentials.' }] })
    }

    if (!artist.isVerified) {
      return response.unauthorized({ errors: [{ message: 'Email not verified.' }] })
    }

    try {
      const token = await auth.use('api').attempt(email.toLowerCase(), password, {
        expiresIn: '7days',
      })

      return response.ok({ message: 'Login successful.', token })
    } catch {
      return response.badRequest({ errors: [{ message: 'Invalid credentials.' }] })
    }
  }

  /**
   * @requestPasswordReset
   * @summary Request password reset
   * @description Requests a password reset. Sends a reset link to the artist's email address.
   * @requestBody
   * {
   *   "email": "string"
   * }
   * @responseBody 200 - { "message": "Password reset link sent to your email." }
   * @responseBody 404 - { "errors": [{ "message": "Artist not found." }] }
   */
  public async requestPasswordReset({ request, response }: HttpContextContract) {
    const { email } = request.only(['email'])
    const artist = await Artist.findBy('email', email.toLowerCase())

    if (!artist) {
      return response.notFound({ errors: [{ message: 'Artist not found.' }] })
    }

    const resetToken = randomBytes(20).toString('hex')
    artist.passwordResetToken = resetToken
    artist.passwordResetExpiresAt = DateTime.now().plus({ hours: 1 })
    await artist.save()

    await EmailService.sendPasswordResetEmail(artist.email, resetToken)

    return response.ok({ message: 'Password reset link sent to your email.' })
  }

  /**
   * @resetPassword
   * @summary Reset password
   * @description Resets the artist's password using a valid reset token.
   * @requestBody
   * {
   *   "token": "string",
   *   "password": "string",
   *   "password_confirmation": "string"
   * }
   * @responseBody 200 - { "message": "Password reset successfully." }
   * @responseBody 400 - { "errors": [{ "message": "Invalid or expired token." }] }
   */
  public async resetPassword({ request, response }: HttpContextContract) {
    const resetSchema = schema.create({
      token: schema.string({}),
      password: schema.string({}, [
        rules.confirmed(),
        rules.minLength(8),
      ]),
    })

    const messages = {
      'token.required': 'Reset token is required.',
      'password.required': 'Password is required.',
      'password.minLength': 'Password must be at least 8 characters long.',
      'password_confirmation.confirmed': 'Password confirmation does not match.',
    }

    try {
      const { token, password } = await request.validate({ schema: resetSchema, messages })
      const artist = await Artist.findBy('passwordResetToken', token)

      if (
        !artist ||
        !artist.passwordResetExpiresAt ||
        artist.passwordResetExpiresAt < DateTime.now()
      ) {
        return response.badRequest({ errors: [{ message: 'Invalid or expired token.' }] })
      }

      artist.password = password
      artist.passwordResetToken = null
      artist.passwordResetExpiresAt = null
      await artist.save()

      return response.ok({ message: 'Password reset successfully.' })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({ errors: error.messages.errors })
      } else {
        return response.badRequest({ errors: [{ message: 'Password reset failed.' }] })
      }
    }
  }
}
