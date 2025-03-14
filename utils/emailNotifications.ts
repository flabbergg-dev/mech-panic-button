import type { NotificationEmailProps, sendInvoiceEmailProps } from '@/types';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function sendNotificationEmail({
  to,
  subject,
  message,
  userName,
}: NotificationEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mech-Panic Button <notifications@mech-panicbutton.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: 'Michroma Sans', sans-serif; padding: 20px;">
          <h2>Hello ${userName || 'there'}!</h2>
          <p>${message}</p>
          <hr />
          <p style="color: #666; font-size: 14px;">
            This email was sent from Mech-Panic Button. If you prefer not to receive these notifications,
            you can update your preferences in your account settings.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}

export async function sendInvoiceEmail({
  to,
  subject,
  message,
  userName,
  link
}: sendInvoiceEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mech-Panic Button <notifications@mech-panicbutton.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: 'Michroma Sans', sans-serif; padding: 20px;">
          <h2>Hello ${userName || 'there'}!</h2>
          <p>${message}</p>
          <hr />
          <a href=${link} style="padding: '4px', background: 'black', color: 'white' border: '1px solid', border-radius: '10px' ">open invoice</a>
          <p style="color: #666; font-size: 14px;">
            This email was sent from Mech-Panic Button.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}
