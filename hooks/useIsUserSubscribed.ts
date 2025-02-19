import { useState, useEffect } from "react";
// import { getUserSubscriptionPlan } from "@/lib/subscription";
import { checkUserSubscription } from "@/app/actions/user/check-user-subscription";
import { SubscriptionPlan } from "@prisma/client";
export const useIsUserSubscribed = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    checkUserSubscription().then((id) => {
        if (id !== null) {
            setIsSubscribed(true);
            setSubscriptionPlan(id.stripeSubscriptionPlan);
        }
        });
  }, []);

  return {isSubscribed, subscriptionPlan};
};

export default useIsUserSubscribed;