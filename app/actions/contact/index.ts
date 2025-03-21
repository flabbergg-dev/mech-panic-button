// index.ts
"use server"

import type { ContactFormSchema } from "@/schemas/contact/contactFormSchema"
import { sendEmail } from "@/lib/resend"

if (!process.env.NEXT_PUBLIC_EMAIL_RECIPIENT || !process.env.NEXT_PUBLIC_RESEND_SENDER) {
  throw new Error("NEXT_PUBLIC_EMAIL_RECIPIENT or NEXT_PUBLIC_RESEND_SENDER is not defined");
}

const sender = process.env.NEXT_PUBLIC_RESEND_SENDER;
const recipient = process.env.NEXT_PUBLIC_EMAIL_RECIPIENT;

export async function sendContactFormAction(values: ContactFormSchema) {
  try {
    await sendEmail({
      from: `Mech-Panic Button <${sender}>`,
      to: [recipient],
      subject: "Contact Form Submission",
      html: `
        <h1>Contact Form Submission</h1>
        <p>Name: ${values.name}</p>
        <p>Email: ${values.email}</p>
        <p>Phone: ${values.phone}</p>
        <p>Message: ${values.message}</p>
      `
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email." };
  }
}