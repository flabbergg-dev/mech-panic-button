"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfileImageAction } from "@/app/actions/user/update-profile-image.action"

export function ProfileImageUpload({ currentImage, userId }: { currentImage?: string; userId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    try {
      setIsUploading(true)

      // Upload to Supabase
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)
      formData.append("type", "profile")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      
      // Update Prisma database
      await updateProfileImageAction(userId, data.url)

      // Update Clerk profile
      if (user) {
        await user.setProfileImage({
          file: file
        })
      }

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      })
    } catch (error) {
      console.error("Error uploading profile image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={currentImage} alt="Profile" />
        <AvatarFallback>Profile</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="profile-image"
        />
        <Button
          variant="outline"
          disabled={isUploading}
          onClick={() => document.getElementById("profile-image")?.click()}
        >
          {isUploading ? "Uploading..." : "Change Photo"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Recommended: Square image, max 5MB
        </p>
      </div>
    </div>
  )
}
