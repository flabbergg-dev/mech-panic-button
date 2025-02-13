import React, { useState } from 'react'
import { Button } from '../ui/button';

export const StripeSubscribe = () => {
  const [error, setError] = useState(false);
  const [session, setSession] = useState();
  const [sessionId, setSessionId] = useState();

  const handleOnClickEvent = async () => {
    fetch("/api/stripe/subscriptionPlans/basic", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((json) => {
        const { session, error } = json;

        if (session) {
          setSessionId(session);
          console.log(session + "session");
        }

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
        }
      });
  }

  return (
    <div className="container">
      <div className="content">
        {!sessionId && (
          <div>
            <Button
              onClick={async () => {
                setError(false);
                handleOnClickEvent();
              }}
            >
              Subscribe basic
            </Button>
          </div>
        )}
        {error && <p className="error">Something went wrong!</p>}
      </div>
    </div>
  );
}
