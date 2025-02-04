import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  // Redirect based on role
  if (!user?.role) {
    redirect("/onboarding")
  } else if (user.role === "Mechanic") {
    redirect(`/dashboard/mechanic/${userId}`)
  } else if (user.role === "Customer") {
    redirect(`/dashboard/customer/${userId}`)
  }

  // This is just a fallback, it should never render.
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl pfont-bold">Redirecting...</h1>
        <p className="text-gray-500">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  )
}
