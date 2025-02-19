import { type Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navigation/client-navbar.navigation"
import { ClientDashboard } from "@/components/dashboard/ClientDashboard/ClientDashboard";

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
  <ClientDashboard />
  </>

)
}
