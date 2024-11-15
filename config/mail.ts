/**
 * Config source: https://git.io/JvgAf
 *
 * Feel free to let us know via PR, if you find something broken in this contract
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import { mailConfig } from '@adonisjs/mail/build/config'

export default mailConfig({
  /*
  |--------------------------------------------------------------------------
  | Default mailer
  |--------------------------------------------------------------------------
  |
  | The following mailer will be used to send emails, when you don't specify
  | a mailer
  |
  */
  mailer: 'smtp',

  /*
  |--------------------------------------------------------------------------
  | Mailers
  |--------------------------------------------------------------------------
  |
  | You can define or more mailers to send emails from your application. A
  | single `driver` can be used to define multiple mailers with different
  | config.
  |
  | For example: Postmark driver can be used to have different mailers for
  | sending transactional and promotional emails
  |
  */
  mailers: {
    /*
    |--------------------------------------------------------------------------
    | Smtp
    |--------------------------------------------------------------------------
    |
    | Uses SMTP protocol for sending email
    |
    */
    smtp: {
      driver: 'smtp',
      host: Env.get('SMTP_HOST'),
      port: Env.get('SMTP_PORT'),
			auth: {
				user: Env.get('SMTP_USERNAME'),
				pass: Env.get('SMTP_PASSWORD'),
				type: 'login',
			},
      logger: true,  // Activez cette option pour voir les logs
      debug: true,   // Activez cette option pour le débogage
    },
  },
})

// Exemple d'Envoi de Mail
// Une fois configuré, vous pouvez tester l’envoi d’un email avec Adonis en utilisant le code suivant dans un contrôleur :
//
//   typescript
// Copier le code
// import Mail from '@ioc:Adonis/Addons/Mail'
//
// await Mail.send((message) => {
//   message
//     .to('destinataire@example.com')
//     .from('votre_email@example.com')
//     .subject('Sujet de test')
//     .htmlView('emails/welcome', { name: 'Utilisateur' }) // View Blade pour le contenu HTML
// })
