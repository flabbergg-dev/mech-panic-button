import React from 'react'
import { useState } from "react";
import { CardElement, useElements } from "@stripe/react-stripe-js";
import { StripeCardElement } from "@stripe/stripe-js";
import { createPaymentIntent } from "@/app/actions/stripe/create-payment-intent";

interface DepositFormProps {
    stripePromise: any;
}

export const DepositForm = ({stripePromise}: DepositFormProps) => {
  const elements = useElements();
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    const { clientSecret, error } = await createPaymentIntent(amount);

    if (error) {
      setError(error);
      return;
    }

    const stripe = await stripePromise;
    if (!stripe || !clientSecret) {
      setError("Stripe initialization failed");
      return;
    }

    const cardElement = elements!.getElement(CardElement) as StripeCardElement;
    if (!cardElement) {
      setError("Card element not found");
      return;
    }

    const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "An unknown error occurred");
    } else {
      // Handle successful payment here
      console.log("Payment successful");
    }
  };

  return (
    <div>
        <h1>Deposit Funds</h1>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Enter amount"
        />
        <button onClick={handleDeposit}>Deposit</button>
        {error && <p>{error}</p>}
    </div>
  )
}
