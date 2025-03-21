
import { Resend } from 'resend';

if (!process.env.NEXT_PUBLIC_RESEND_API_KEY) {
  throw new Error("NEXT_PUBLIC_RESEND_API_KEY is not defined");
}

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function sendEmail({
  from,
  to,
  subject,
  html
}: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from,
    to,
    subject,
    html
  });
}