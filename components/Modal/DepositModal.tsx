import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { DepositForm } from "../forms/deposit-form";
import { Modal } from "./Modal";
import { Button } from "../ui/button";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const DepositModal = () => {
  const [isActive, setIsActive] = useState(false);
  // const options = {
  //   // passing the client secret obtained from the server
  //   clientSecret: process.env.NEXT_PUBLIC_STRIPE_CLIENT_SECRET!,
  // };

  const options = {
    mode: 'payment' as 'payment',
    amount: 10,
    currency: 'usd',
    // Fully customizable with appearance API.
    appearance: {/*...*/},
  };


  return (
    <Elements stripe={stripePromise} options={options}>
      <Modal
        dialogText="Deposit"
        buttonText="Deposit"
        buttonClassName="btn btn-primary"
        // isOpen={isActive}
        buttonActive={true}
      >
        <DepositForm stripePromise={stripePromise}/>
        <Button onClick={() => setIsActive(!isActive)} />
      </Modal>
    </Elements>
  );
}