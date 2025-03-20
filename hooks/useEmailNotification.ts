import { getUserToken } from "@/app/actions/getUserToken";
import type { NotificationEmailProps } from "@/types";

export const useEmailNotification = () => {
  const sendEmail = async ({ to: email, subject, message, userName }: NotificationEmailProps, skipPreferenceCheck = false) => {
    try {
      const token = await getUserToken();

      if (!token) {
        throw new Error('Unauthorized');
      }

      // Only check preferences if not skipped
      if (!skipPreferenceCheck) {
        const stateResponse = await fetch(`/api/notifications/email/state?clientEmail=${encodeURIComponent(email)}`);
        const stateData = await stateResponse.json();

        if (!stateResponse.ok) {
          throw new Error(stateData.error || 'Failed to verify email notifications state');
        }

        // If enabled is false, don't send the email but return success
        if (!stateData.enabled) {
          return { success: true, skipped: true, reason: 'notifications-disabled' };
        }
      }

      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message, userName })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email notification');
      }

      return { success: true, sent: true };
    } catch (error) {
      console.error('Email notification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        skipped: false 
      };
    }
  };

  return { sendEmail };
};
