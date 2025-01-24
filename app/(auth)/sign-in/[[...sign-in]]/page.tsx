"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SignIn, useUser } from "@clerk/nextjs"
import { Loader } from "@/components/loader"

export default function SignInPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard")
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <Loader title="Checking authentication..."/>
    )
  }

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="rounded-lg bg-secondary p-8 text-center shadow-lg">
          <div className="mb-4 text-2xl">👋 Welcome Back!</div>
          <p className="text-muted-foreground">
            You&apos;re already signed in. Redirecting...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid w-full grow items-center px-4 sm:justify-center h-screen bg-background">
      <SignIn />
    </div>
  )
}
