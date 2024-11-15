import Mail from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'

class EmailService {
  public async sendVerificationEmail(to: string, code: string) {
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_SENDER'), 'Harmoniq')
        .to(to)
        .subject('Vérification de votre adresse email')
        .htmlView('emails/verify', { code })
    }).then(() => {
      console.log('Email de vérification envoyé avec succès à', to)
    }).catch((error) => {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
    })
  }

  // Vous pouvez ajouter d'autres méthodes pour différents types d'emails, par exemple :
  public async sendPasswordResetEmail(to: string, resetToken: string) {
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_SENDER'), 'Harmoniq')
        .to(to)
        .subject('Réinitialisation de votre mot de passe')
        .htmlView('emails/reset_password', { resetToken })
    })
  }
}

export default new EmailService()
