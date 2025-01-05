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

  public async sendPasswordResetEmail(to: string, resetToken: string) {
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_SENDER'), 'Harmoniq')
        .to(to)
        .subject('Réinitialisation de votre mot de passe')
        .htmlView('emails/reset_password', { resetToken })
    }).then(() => {
      console.log('Email de réinitialisation envoyé avec succès à', to)
    }).catch((error) => {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
    })
  }

  /**
   * Envoie un email de félicitations lorsque l’artiste franchit un palier (Gold/Platinum/Diamond).
   */
  public async sendAwardEmail(to: string, artistName: string, singleTitle: string, awardName: string, listensCount: number) {
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_SENDER'), 'Harmoniq')
        .to(to)
        .subject(`Félicitations - Nouveau palier atteint : ${awardName}`)
        .htmlView('emails/award', {
          artistName,
          singleTitle,
          awardName,
          listensCount,
        })
    }).then(() => {
      console.log(`Award email "${awardName}" sent successfully to`, to)
    }).catch((error) => {
      console.error('Error sending award email:', error)
    })
  }
}

export default new EmailService()
