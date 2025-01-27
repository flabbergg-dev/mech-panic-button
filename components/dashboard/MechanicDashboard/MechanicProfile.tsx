"use client"

import { useUser } from "@clerk/nextjs"
import { UserCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

export const MechanicProfile = () => {
  const { user } = useUser()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Profile</h2>
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={(user!.publicMetadata["avatar"] as string) ?? ""}
              alt={user!.firstName ?? "User"}
            />
            <AvatarFallback>
              <UserCircle className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-semibold">
              {user!.firstName} {user!.lastName}
            </h3>
            <p className="text-muted-foreground">{user!.emailAddresses[0].emailAddress}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
