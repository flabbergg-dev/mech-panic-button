import { type Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import CustomerDashboard from "./CustomerDashboard"
import { Navbar } from "@/components/navigation/client-navbar.navigation"

export const metadata: Metadata = {
  title: "Customer Dashboard - Mech-Panic Button",
  description: "Manage your service requests and view your history",
}

export default async function Page() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }



  return (
  <>
   <Navbar/>
   <CustomerDashboard />
  </>

)
}
