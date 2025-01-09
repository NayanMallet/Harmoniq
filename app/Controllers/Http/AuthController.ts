// app/Controllers/Http/AuthController.ts

import EmailService from 'App/Services/EmailService'
import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AuthValidator from 'App/Validators/AuthValidator'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Endpoints for user authentication (register, login, password reset, etc.)
 */
export default class AuthController {
  /**
   * @register
   * @summary Register a new artist
   * @tag Authentication
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
    try {
      const data = await request.validate({
        schema: AuthValidator.registerSchema,
        messages: AuthValidator.messages,
      })

      const existingArtist = await Artist.findBy('email', data.email.toLowerCase())
      if (existingArtist) {
        return response.badRequest({
          errors: [{ field: 'email', message: 'Email already registered.', code: 'EMAIL_TAKEN' }],
        })
      }

      const artist = await Artist.create(data)
      await EmailService.sendVerificationEmail(artist.email, artist.verificationCode!)

      return response.created({ message: 'Artist registered successfully. Please verify your email.' })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Registration failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @verifyEmail
   * @summary Verify artist's email
   * @tag Authentication
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
    try {
      const data = await request.validate({
        schema: AuthValidator.verifyEmailSchema,
        messages: AuthValidator.messages,
      })

      const artist = await Artist.findBy('email', data.email.toLowerCase())
      if (!artist) {
        return response.notFound({ errors: [{ message: 'Artist not found.', code: 'ARTIST_NOT_FOUND' }] })
      }

      if (artist.verificationCode === data.code) {
        artist.isVerified = true
        artist.verificationCode = null
        await artist.save()

        return response.ok({ message: 'Email verified successfully.' })
      } else {
        return response.badRequest({ errors: [{ message: 'Invalid verification code.', code: 'INVALID_CODE' }] })
      }
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Verification failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @login
   * @summary Log in an artist
   * @tag Authentication
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
    try {
      const data = await request.validate({
        schema: AuthValidator.loginSchema,
        messages: AuthValidator.messages,
      })

      const artist = await Artist.findBy('email', data.email.toLowerCase())
      if (!artist) {
        return response.badRequest({ errors: [{ message: 'Invalid credentials.', code: 'INVALID_CREDENTIALS' }] })
      }

      if (!artist.isVerified) {
        return response.unauthorized({ errors: [{ message: 'Email not verified.', code: 'EMAIL_NOT_VERIFIED' }] })
      }

      try {
        const token = await auth.use('api').attempt(data.email.toLowerCase(), data.password, {
          expiresIn: '1hours',
        })

        return response.ok({ message: 'Login successful.', token })
      } catch {
        return response.badRequest({ errors: [{ message: 'Invalid credentials.', code: 'INVALID_CREDENTIALS' }] })
      }
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Login failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @requestPasswordReset
   * @summary Request password reset
   * @tag Authentication
   * @description Requests a password reset. Sends a reset link to the artist's email address.
   * @requestBody
   * {
   *   "email": "string"
   * }
   * @responseBody 200 - { "message": "Password reset link sent to your email." }
   * @responseBody 404 - { "errors": [{ "message": "Artist not found." }] }
   */
  public async requestPasswordReset({ request, response }: HttpContextContract) {
    try {
      const data = await request.validate({
        schema: AuthValidator.requestPasswordResetSchema,
        messages: AuthValidator.messages,
      })

      const artist = await Artist.findBy('email', data.email.toLowerCase())
      if (!artist) {
        return response.notFound({ errors: [{ message: 'Artist not found.', code: 'ARTIST_NOT_FOUND' }] })
      }

      const resetToken = randomBytes(20).toString('hex')
      artist.passwordResetToken = resetToken
      artist.passwordResetExpiresAt = DateTime.now().plus({ hours: 1 })
      await artist.save()

      await EmailService.sendPasswordResetEmail(artist.email, resetToken)

      return response.ok({ message: 'Password reset link sent to your email.' })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Request failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @resetPassword
   * @summary Reset password
   * @tag Authentication
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
    try {
      const data = await request.validate({
        schema: AuthValidator.resetPasswordSchema,
        messages: AuthValidator.messages,
      })

      const artist = await Artist.findBy('passwordResetToken', data.token)

      if (
        !artist ||
        !artist.passwordResetExpiresAt ||
        artist.passwordResetExpiresAt < DateTime.now()
      ) {
        return response.badRequest({ errors: [{ message: 'Invalid or expired token.', code: 'TOKEN_INVALID' }] })
      }

      artist.password = data.password
      artist.passwordResetToken = null
      artist.passwordResetExpiresAt = null
      await artist.save()

      return response.ok({ message: 'Password reset successfully.' })
    } catch (error) {
      if (error.messages?.errors) {
        return response.badRequest({ errors: error.messages.errors })
      }
      return response.internalServerError({ errors: [{ message: 'Reset failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @logout
   * @summary Log out the authenticated artist
   * @tag Authentication
   * @description Logs out the currently authenticated artist by revoking the API token.
   * @responseBody 200 - { "message": "Logged out successfully." }
   * @responseBody 401 - { "errors": [{ "message": "Unauthorized." }] }
   * @responseBody 500 - { "errors": [{ "message": "Logout failed due to an internal error." }] }
   */
  public async logout({ auth, response }: HttpContextContract) {
    try {
      // Le middleware auth garantit que l'utilisateur est authentifié
      await auth.use('api').revoke()
      return response.ok({ message: 'Logged out successfully.' })
    } catch (error) {
      return response.internalServerError({ errors: [{ message: 'Logout failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }

  /**
   * @deleteAccount
   * @summary Delete the authenticated artist's account
   * @tag Authentication
   * @description Permanently deletes the authenticated artist's account.
   * @responseBody 200 - { "message": "Account deleted successfully." }
   * @responseBody 401 - { "errors": [{ "message": "Unauthorized." }] }
   * @responseBody 500 - { "errors": [{ "message": "Account deletion failed due to an internal error." }] }
   */
  public async deleteAccount({ auth, response }: HttpContextContract) {
    try {
      // Le middleware auth garantit que l'utilisateur est authentifié
      const artist = auth.user
      if (!artist) {
        // Cas improbable si le middleware est bien configuré, mais on gère quand même
        return response.unauthorized({ errors: [{ message: 'Unauthorized.', code: 'UNAUTHORIZED' }] })
      }

      await artist.delete()
      return response.ok({ message: 'Account deleted successfully.' })
    } catch (error) {
      return response.internalServerError({ errors: [{ message: 'Account deletion failed due to an internal error.', code: 'INTERNAL_ERROR' }] })
    }
  }
}
