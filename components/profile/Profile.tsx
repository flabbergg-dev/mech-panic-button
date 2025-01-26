"use client"

import { useUserRole } from "@/hooks/use-user-role"

// import { Elements } from "@stripe/react-stripe-js"
// import { loadStripe } from "@stripe/stripe-js"

import { ClientProfile } from "./ClientProfile"
import { MechanicProfile } from "./MechanicProfile"

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// const stripePromise = loadStripe("pk_test_TYooMQauvdEDq54NiTphI7jx")

export const Profile = () => {
  const { userRole } = useUserRole()
  // const options = {
  //   // passing the client secret obtained from the server
  //   clientSecret: "{{CLIENT_SECRET}}",
  // }

  return (
    <div className="min-h-screen bg-black text-white mt-16">
      {userRole === "Mechanic" ? <MechanicProfile /> : <ClientProfile />}
    </div>
  )
}
