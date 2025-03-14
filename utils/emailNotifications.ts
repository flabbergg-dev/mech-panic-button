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

export async function sendBookingConfirmationEmail({
  to,
  subject,
  message,
  userName,
  mechanicName,
  bookingDate,
  serviceType,
}: NotificationEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mech-Panic Button <notifications@mech-panicbutton.com>',
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
              body {
                font-family: 'Michroma Sans', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #0070f3;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .mechanic-details {
                background-color: #f8fafc;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .pro-badge {
                display: inline-block;
                padding: 4px 12px;
                background-color: #fbbf24;
                color: #1e293b;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                margin-left: 8px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #0070f3;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 500;
              }
              .button:hover {
                background-color: #0051cc;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                background-color: #22c55e;
                color: white;
                border-radius: 9999px;
                font-size: 14px;
                margin-top: 10px;
              }
              .booking-info {
                margin: 20px 0;
                padding: 15px;
                border-left: 4px solid #0070f3;
                background-color: #f0f9ff;
                border-radius: 0 6px 6px 0;
              }
              .highlight {
                color: #0070f3;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Mech-Panic Button</h1>
              </div>
              <div class="content">
                <h2>Hello ${userName || 'there'}!</h2>
                <div class="status-badge">Booking Confirmed</div>
                <div class="booking-info">
                  <p><span class="highlight">Mechanic:</span> ${mechanicName || 'Your Mechanic'} <span class="pro-badge">PRO</span></p>
                  ${bookingDate ? `<p><span class="highlight">Date:</span> ${new Date(bookingDate).toLocaleString()}</p>` : ''}
                  ${serviceType ? `<p><span class="highlight">Service:</span> ${serviceType}</p>` : ''}
                </div>
                <div style="white-space: pre-line; margin-top: 20px;">${message}</div>
                <div class="mechanic-details">
                  <p>
                    Your mechanic has been notified and will be ready to assist you at the scheduled time.
                    If you need to make any changes to your booking or have any questions,
                    please don't hesitate to contact us.
                  </p>
                </div>
                <div style="text-align: center;">
                  <a href="https://mech-panicbutton.com/bookings" class="button">
                    View Your Booking
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>
                  This email was sent from Mech-Panic Button.
                  If you prefer not to receive these notifications,
                  you can update your preferences in your account settings.
                </p>
                <p> ${new Date().getFullYear()} Mech-Panic Button. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
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
