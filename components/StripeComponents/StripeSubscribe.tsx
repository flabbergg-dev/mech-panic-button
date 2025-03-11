import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../ui/card';
import { useAuth } from "@clerk/nextjs"
import { getUserAction } from '@/app/actions/user/get-user.action';
export const StripeSubscribe = () => {
  const { userId } = useAuth();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        const response = await getUserAction(userId);
        setUserEmail(response?.email!);
      }
    };

    fetchData();
  }, [userEmail]);
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
                userEmail
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
                userEmail
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
