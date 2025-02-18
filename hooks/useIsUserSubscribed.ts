import { useState, useEffect } from "react";
// import { getUserSubscriptionPlan } from "@/lib/subscription";
import { checkUserSubscription } from "@/app/actions/user/check-user-subscription";
export const useIsUserSubscribed = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkUserSubscription().then((id) => {
        if (id !== null) {
            setIsSubscribed(true);
        }
        });
  }, []);

  return isSubscribed;
};

export default useIsUserSubscribed;