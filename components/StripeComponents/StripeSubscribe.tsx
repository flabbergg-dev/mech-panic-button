import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../ui/card';

export const StripeSubscribe = () => {
  // const handleOnClickEventBasic = async () => {
  //   try {
  //     await fetch("/api/stripe/subscriptionPlans/basic", {
  //       headers: { "Content-Type": "application/json" },
  //       method: "POST",
  //     })
  //       .then((response) => response.json())
  //       .then(async (json) => {
  //         const { session, sessionSecret, error } = json;

  //         if (session) {
  //           setSessionId(session);
  //         }

  //         if (sessionSecret) {
  //           setSecret(sessionSecret);
  //           console.log(sessionSecret + "sessionSecret");
  //         }

  //         if (error) {
  //           console.error("Error creating account:", error);
  //           setError(true);
  //         }
  //       });
  //   } catch (error) {
  //     console.error("Error creating account:", error);
  //     setError(true);
  //   }
  // };

  // const handleOnClickEventPro = async () => {
  //   try {
  //     await fetch("/api/stripe/subscriptionPlans/pro", {
  //       method: "POST",
  //     })
  //       .then((response) => response.json())
  //       .then(async (json) => {
  //         const { session, sessionSecret, error } = json;

  //         if (session) {
  //           setSessionId(session);
  //           console.log(session + "session");
  //         }

  //         if (sessionSecret) {
  //           setSecret(sessionSecret);
  //           console.log(sessionSecret + "sessionSecret");
  //         }

  //         if (error) {
  //           console.error("Error creating account:", error);
  //           setError(true);
  //         }
  //       });
  //   } catch (error) {
  //     console.error("Error creating account:", error);
  //     setError(true);
  //   }
  // };

  return (
    <div className="flex gap-4 items-center justify-between pt-4">
      <Card className="w-6/12 h-auto">
        <CardContent>
          <CardHeader className="font-bold text-3xl">Basic</CardHeader>
          <CardDescription className={"text-lg w-auto mx-6 mb-6"}>
            $10 per month - includes availability to provide onDemand service
          </CardDescription>
          <CardFooter className="flex items-center justify-end">
            <a
              href={
                "https://buy.stripe.com/test_cN2dTJgVc93JaQg5kk" +
                "?prefiled_email" +
                "gregor.gr20@gmail.com"
              }
              target="_blank"
            >
              Subscribe basic
            </a>
          </CardFooter>
        </CardContent>
      </Card>
      <Card className="w-6/12 h-auto">
        <CardContent>
          <CardHeader className="font-bold text-3xl">Pro</CardHeader>
          <CardDescription className={"text-lg w-auto mx-6 mb-6"}>
            $15 per month - includes onDemand and scheduling
          </CardDescription>
          <CardFooter className="flex items-center justify-end">
            <a
              href={
                "https://buy.stripe.com/test_dR68zp34m4Nt7E4001" +
                "?prefiled_email" +
                "gregor.gr20@gmail.com"
              }
              target="_blank"
            >
              Subscribe pro
            </a>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
};
