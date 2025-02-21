import { useState, useEffect } from "react";
// import { getUserSubscriptionPlan } from "@/lib/subscription";
import { checkUserSubscription } from "@/app/actions/user/check-user-subscription";
import { SubscriptionPlan } from "@prisma/client";
export const useIsUserSubscribed = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  useEffect(() => {
    checkUserSubscription().then((id) => {
        if (id !== null) {
            setIsSubscribed(true);
            setSubscriptionPlan(id.stripeSubscriptionPlan);
            setSubscriptionId(id.stripeSubscriptionId);
        }
        });
  }, []);

  return {isSubscribed, subscriptionPlan, subscriptionId};
};

export default useIsUserSubscribed;