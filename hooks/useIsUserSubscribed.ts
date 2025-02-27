import { useState, useEffect } from "react";
// import { getUserSubscriptionPlan } from "@/lib/subscription";
import { checkUserSubscription } from "@/app/actions/user/check-user-subscription";
import { SubscriptionPlan } from "@prisma/client";
export const useIsUserSubscribed = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionEndingPeriod, setSubscriptionEndingPeriod] = useState<Date | null>(null);

  useEffect(() => {
    checkUserSubscription().then((id) => {
        if (id !== null) {
            setIsSubscribed(true);
            setSubscriptionPlan(id.stripeSubscriptionPlan);
            setSubscriptionId(id.stripeSubscriptionId);
            setSubscriptionStatus(id.stripeSubscriptionStatus);
            setSubscriptionEndingPeriod(id.stripeSubEndingDate);
        }
        });
  }, []);

  return {isSubscribed, subscriptionPlan, subscriptionId, subscriptionStatus, subscriptionEndingPeriod};
};

export default useIsUserSubscribed;