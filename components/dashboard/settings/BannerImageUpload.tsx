"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { updateMechanicBannerAction } from "@/app/actions/mechanic/update-mechanic-banner.action"

export function BannerImageUpload({ currentImage, userId }: { currentImage?: string; userId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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
      formData.append("type", "document")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      
      // Update mechanic profile with banner URL
      const result = await updateMechanicBannerAction(userId, data.url)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Banner image updated successfully",
      })
    } catch (error) {
      console.error("Error uploading banner image:", error)
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
    <div className="space-y-4">
      {currentImage && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <img
            src={currentImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="banner-image"
        />
        <Button
          variant="outline"
          disabled={isUploading}
          onClick={() => document.getElementById("banner-image")?.click()}
        >
          {isUploading ? "Uploading..." : "Change Banner"}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Recommended: 1200x400 pixels, max 5MB
        </p>
      </div>
    </div>
  )
}
