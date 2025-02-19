import { NotificationEmailProps } from "@/types";

export const useEmailNotification = () => {
  const sendEmail = async ({ to: email, subject, message, userName }: NotificationEmailProps) => {
    try {
      const response = await fetch(`/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message, userName })
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      return { success: true };
    } catch (error) {
      console.error('Email notification error:', error);
      return { success: false, error };
    }
  };

  return { sendEmail };
};
