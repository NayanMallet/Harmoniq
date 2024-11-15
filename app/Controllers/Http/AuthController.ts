import EmailService from 'App/Services/EmailService'
import User from 'App/Models/User'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    const data = request.only(['email', 'password'])
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      const user = await User.create({ ...data, verificationCode })

      // Envoyer le code de vérification par email via EmailService
      await EmailService.sendVerificationEmail(user.email, verificationCode)

      return response.created({ user })
    } catch (error) {
      return response.badRequest({ error: 'Registration failed' })
    }
  }

  public async verifyEmailCode({ request, response }: HttpContextContract) {
    const { email, code } = request.only(['email', 'code'])
    const user = await User.findBy('email', email)

    if (user && user.verificationCode === code) {
      user.isVerified = true
      user.verificationCode = null // Effacez le code de vérification
      await user.save()
      return response.ok({ message: 'Email verified successfully' })
    } else {
      return response.badRequest({ error: 'Invalid verification code' })
    }
  }

  public async login({ auth, request, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.findByOrFail('email', email)

      if (!user.isVerified) {
        return response.forbidden({ error: 'Please verify your email before logging in' })
      }

      const token = await auth.use('api').attempt(email, password)
      return response.ok({ token })
    } catch {
      return response.badRequest({ error: 'Invalid credentials' })
    }
  }
}
