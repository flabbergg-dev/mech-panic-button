"use client"

import { useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

import { LogoutIcon } from "@/components/icons/logout"

export const SignOutButton = () => {
  const { signOut } = useClerk()

  return (
    // Clicking this button signs out a user
    // and redirects them to the home page "/".
    <Button
      variant={"destructive"}
      size={"icon"}
      onClick={() => signOut({ redirectUrl: "/" })}
    >
      <LogoutIcon />
    </Button>
  )
}
