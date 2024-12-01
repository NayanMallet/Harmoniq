import EmailService from 'App/Services/EmailService'
import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { randomBytes } from 'crypto'

export default class AuthController {
  /**
   * @register
   * @operationId registerArtist
   * @description Register a new artist and send a verification email.
   * @requestBody {"email": "string", "password": "string", "name": "string"}
   * @responseBody 201 - {"message": "Artist registered. Please verify your email."}
   * @responseBody 400 - {"error": "Registration failed"}
   */
  public async register({ request, response }: HttpContextContract) {
    const data = request.only(['email', 'password', 'name'])
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      const artist = await Artist.create({ ...data, verificationCode })
      await EmailService.sendVerificationEmail(artist.email, verificationCode)

      return response.created({ message: 'Artist registered. Please verify your email.' })
    } catch (error) {
      return response.badRequest({ error: 'Registration failed' })
    }
  }

  /**
   * @verifyEmail
   * @operationId verifyEmail
   * @description Verify the artist's email using the verification code.
   * @requestBody {"email": "string", "code": "string"}
   * @responseBody 200 - {"message": "Email verified successfully"}
   * @responseBody 400 - {"error": "Invalid verification code"}
   * @responseBody 404 - {"error": "Artist not found"}
   */
  public async verifyEmail({ request, response }: HttpContextContract) {
    const { email, code } = request.only(['email', 'code'])
    const artist = await Artist.findBy('email', email)

    if (!artist) {
      return response.notFound({ error: 'Artist not found' })
    }

    if (artist.verificationCode === code) {
      artist.isVerified = true
      artist.verificationCode = null
      await artist.save()

      return response.ok({ message: 'Email verified successfully' })
    } else {
      return response.badRequest({ error: 'Invalid verification code' })
    }
  }

  /**
   * @login
   * @operationId loginArtist
   * @description Log in an artist and return an API token.
   * @requestBody {"email": "string", "password": "string"}
   * @responseBody 200 - {"message": "Login successful", "token": "string"}
   * @responseBody 400 - {"error": "Invalid credentials"}
   */
  public async login({ request, auth, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const token = await auth.use('api').attempt(email, password, {
        expiresIn: '7days',
      })

      return response.ok({ message: 'Login successful', token })
    } catch {
      return response.badRequest({ error: 'Invalid credentials' })
    }
  }

  /**
   * @requestPasswordReset
   * @operationId requestPasswordReset
   * @description Request a password reset. Sends a reset link to the artist's email address.
   * @requestBody {"email": "string"}
   * @responseBody 200 - {"message": "Password reset link sent to your email"}
   * @responseBody 404 - {"error": "Artist not found"}
   */
  public async requestPasswordReset({ request, response }: HttpContextContract) {
    const { email } = request.only(['email'])
    const artist = await Artist.findBy('email', email)

    if (!artist) {
      return response.notFound({ error: 'Artist not found' })
    }

    const resetToken = randomBytes(20).toString('hex')
    artist.verificationCode = resetToken
    await artist.save()

    await EmailService.sendPasswordResetEmail(artist.email, resetToken)

    return response.ok({ message: 'Password reset link sent to your email' })
  }

  /**
   * @resetPassword
   * @operationId resetPassword
   * @description Reset the artist's password using a valid reset token.
   * @requestBody {"token": "string", "password": "string"}
   * @responseBody 200 - {"message": "Password reset successfully"}
   * @responseBody 400 - {"error": "Invalid or expired token"}
   */
  public async resetPassword({ request, response }: HttpContextContract) {
    const { token, password } = request.only(['token', 'password'])
    const artist = await Artist.findBy('verificationCode', token)

    if (!artist) {
      return response.badRequest({ error: 'Invalid or expired token' })
    }

    artist.password = password
    artist.verificationCode = null
    await artist.save()

    return response.ok({ message: 'Password reset successfully' })
  }
}
