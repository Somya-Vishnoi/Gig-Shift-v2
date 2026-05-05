// EmailJS integration
// Docs: https://www.emailjs.com/docs/

const SERVICE_ID  = 'service_lm3rjmm'
const TEMPLATE_ID = 'template_0alg46p'
const PUBLIC_KEY  = 'yZpmfwswhyWbfcUBE'

export interface EmailParams {
  to_name:  string
  to_email: string
  role:     string
  zone?:    string
  company?: string
}

export async function sendWelcomeEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailjs = await import('@emailjs/browser')
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name:   params.to_name,
        to_email:  params.to_email,
        role:      params.role,
        zone:      params.zone    ?? '—',
        company:   params.company ?? '—',
        app_name:  'GigShift',
        app_url:   'https://gig-shift-v2.vercel.app',
      },
      PUBLIC_KEY
    )
    return true
  } catch (err) {
    console.error('EmailJS error:', err)
    return false
  }
}
