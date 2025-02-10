import {stripe} from '@/lib/stripe';

export async function POST(req: { method: string; body: { account: any; }; }, res: { json: (arg0: { client_secret?: any; error?: any; }) => void; status: (arg0: number) => void; }) {
    try {
      const accountSession = await stripe.accountSessions.create({
        account: req.body.account,
        components: {
          account_onboarding: { enabled: true },
        }
      });

      res.json({
        client_secret: accountSession.client_secret,
      });
    } catch (error) {
      console.error(
        "An error occurred when calling the Stripe API to create an account session",
        error
      );
      res.status(500);
      res.json({error: (error as Error).message});
    }
}
