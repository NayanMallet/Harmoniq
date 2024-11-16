import EmailService from 'App/Services/EmailService'
import Artist from 'App/Models/Artist'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const data = request.only(['email', 'password', 'name'])
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      const artist = await Artist.create({ ...data, verificationCode })

      // Envoyer le code de vérification par email
      await EmailService.sendVerificationEmail(artist.email, verificationCode)

      return response.created({ message: 'Artist registered. Please verify your email.' })
    } catch (error) {
      return response.badRequest({ error: 'Registration failed' })
    }
  }

  public async verifyEmail({ request, response }: HttpContextContract) {
    const { email, code } = request.only(['email', 'code'])
    const artist = await Artist.findBy('email', email)

    if (!artist) {
      return response.notFound({ error: 'Artist not found' })
    }

    if (artist.verificationCode === code) {
      artist.isVerified = true
      artist.verificationCode = null // Effacez le code après vérification
      await artist.save()

      return response.ok({ message: 'Email verified successfully' })
    } else {
      return response.badRequest({ error: 'Invalid verification code' })
    }
  }

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

}
