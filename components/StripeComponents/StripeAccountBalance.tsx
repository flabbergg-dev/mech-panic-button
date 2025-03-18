import React, { useEffect, useState } from "react";
import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BalanceData {
  available: number;
  pending: number;
}

interface BalanceAmountProps {
  label: string;
  amount: number;
  className?: string;
}

const BalanceAmount = ({ label, amount, className }: BalanceAmountProps) => (
  <div className={cn("flex flex-col", className)}>
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-2xl font-semibold">
      ${(amount / 100).toFixed(2)}
    </span>
  </div>
);

export const StripeAccountBalance = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStripeConnectId = async () => {
      try {
        const response = await getStripeConnectId();

        if (response?.stripeConnectId) {
          setStripeConnectId(response.stripeConnectId);
        } else {
          setError("No Stripe Connect account found.");
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching Stripe Connect ID:', err);
        setError("Failed to fetch Stripe Connect ID. Please try again later.");
        setLoading(false);
      }
    };

    fetchStripeConnectId();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!stripeConnectId) return;

      try {
        const response = await fetch('/api/stripe/connect-balance-funds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: stripeConnectId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to fetch balance:', errorData);
          throw new Error(errorData.error || 'Failed to fetch balance');
        }

        const data = await response.json();
        
        if (typeof data.available === 'undefined' || typeof data.pending === 'undefined') {
          throw new Error('Invalid balance data received');
        }

        setBalance(data);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      } finally {
        setLoading(false);
      }
    };

    if (stripeConnectId) {
      fetchBalance();
    }
  }, [stripeConnectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive">
        <div className="text-destructive">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No balance information available
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Account Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BalanceAmount 
              label="Available Balance" 
              amount={balance.available}
              className="bg-primary/5 p-4 rounded-lg"
            />
            <BalanceAmount 
              label="Pending Balance" 
              amount={balance.pending}
              className="bg-muted p-4 rounded-lg"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Available balance can be withdrawn to your connected bank account.</p>
          <p>Pending balance will be available after payment processing is complete.</p>
        </div>
      </div>
    </Card>
  );
};
