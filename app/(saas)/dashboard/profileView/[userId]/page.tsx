import { Profile } from "@/components/profile/Profile"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mechanic Profile | Mech Panic",
  description: "View the mechanics profile and appointments",
}

export default function MechanicProfilePage() {
  return <Profile />
}
