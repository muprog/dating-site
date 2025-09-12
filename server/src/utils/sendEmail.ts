const nodemailer = require('nodemailer')

export async function sendEmail(to: string, subject: string, text: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or "smtp.ethereal.email" for testing
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASS, // app password
    },
  })

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  }

  await transporter.sendMail(mailOptions)
}
