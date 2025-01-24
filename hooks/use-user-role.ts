"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { getUserRole } from "@/app/actions/get-user-role.action"

type UserRole = "Mechanic" | "Customer" | null

export const useUserRole = () => {
  const { user } = useUser()
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const userRole = await getUserRole()
        setRole(userRole as UserRole)
      } catch (error) {
        console.error("Error fetching user role:", error)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  const isMechanic = role === "Mechanic"
  const isCustomer = role === "Customer"

  const redirectToRoleBasedPage = useCallback(() => {
    if (!user || isLoading) return

    if (isMechanic) {
      router.push(`/dashboard/mechanic/${user.id}`)
    } else if (isCustomer) {
      router.push(`/dashboard/customer/${user.id}`)
    } else {
      router.push("/onboarding")
    }
  }, [isMechanic, isCustomer, router, user, isLoading])

  return {
    userRole: role,
    isMechanic,
    isCustomer,
    isLoading,
    redirectToRoleBasedPage,
  }
}
