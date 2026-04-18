import nodemailer from 'nodemailer'

export interface MailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export function createTransporter(config: MailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  })
}

export async function testConnection(config: MailConfig): Promise<boolean> {
  try {
    const transporter = createTransporter(config)
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}
