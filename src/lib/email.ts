import { Resend } from 'resend';
import { site } from '@/config/site';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Email not sent — RESEND_API_KEY not configured');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: site.fromEmail,
    to,
    subject,
    html,
  });
}
