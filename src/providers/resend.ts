import { Resend } from 'resend'
import { envConfig } from '~/config/environment'
import path from 'path'
import fs from 'fs'

const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf-8')

const resend = new Resend(envConfig.resendApiKey)

const sendVerifyEmail = (toAddress: string, subject: string, body: string) => {
  return resend.emails.send({
    from: envConfig.resendEmailFromAddress,
    to: toAddress,
    subject,
    html: body
  })
}

export const sendVerifyRegisterEmail = (
  toAddress: string,
  email_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendVerifyEmail(
    toAddress,
    'Confirm your email address',
    template
      .replace('{{title}}', 'Account registration confirmation')
      .replace('{{content}}', `Hi ${toAddress},`)
      .replace('{{title_link}}', 'Confirm your email')
      .replace('{{link}}', `${envConfig.clientUrl}/verify-email?token=${email_verify_token}`)
  )
}
