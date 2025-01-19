import { type Metadata } from "next"
import CustomerDashboard from "./CustomerDashboard"

export const metadata: Metadata = {
  title: "Customer Dashboard - Mech Panic",
  description: "Manage your service requests and view your history",
}

export default function Page() {
  return <CustomerDashboard />
}
