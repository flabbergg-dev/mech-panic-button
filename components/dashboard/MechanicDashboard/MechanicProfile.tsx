"use client"

import { useCallback, useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Camera, Car, Star, UserCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MechanicProfile } from "@/app/actions/mechanic/get-mechanic-profile.action"
import { getMechanicProfile } from "@/app/actions/mechanic/get-mechanic-profile.action"
import { uploadBanner } from "@/app/actions/mechanic/upload-banner.action"
import { cn } from "@/lib/utils"

export const MechanicProfileView = () => {
  const { user } = useUser()
  const [profile, setProfile] = useState<MechanicProfile | null>(null)
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMechanicProfile()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleBannerUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUpdatingBanner(true)
      const response = await uploadBanner(file)
      if (response.success) {
        await fetchProfile()
      }
    } catch (error) {
      console.error('Error updating banner:', error)
      // You might want to show a toast or error message here
    } finally {
      setIsUpdatingBanner(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>
      
      {/* Banner Section */}
      <div className="relative h-48 w-full rounded-lg overflow-hidden">
        {profile?.bannerImage ? (
          <div className="relative w-full h-full">
            <img 
              src={profile.bannerImage} 
              alt="Profile Banner"
              className={cn(
                "w-full h-full object-cover",
                isUpdatingBanner && "opacity-50 transition-opacity"
              )}
            />
            {isUpdatingBanner && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            {isUpdatingBanner ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Uploading banner...</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No banner image</p>
            )}
          </div>
        )}
        <div className="absolute bottom-4 right-4">
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            id="banner-upload"
            onChange={handleBannerUpdate}
            disabled={isUpdatingBanner}
          />
          <label htmlFor="banner-upload">
            <Button 
              variant="secondary" 
              size="sm" 
              className="cursor-pointer" 
              asChild
              disabled={isUpdatingBanner}
            >
              <span>
                {isUpdatingBanner ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Update Banner
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Profile Info */}
      {!user && 
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
             
            <AvatarFallback>
              <UserCircle className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-2xl font-semibold w-20 h-10 animate-pulse bg-muted"/>
             
            <div className="text-muted-foreground w-20 h-10 animate-pulse bg-muted">Loading...</div>
          </div>
        </div>
      </Card>
      }
      {user && (
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={(user.publicMetadata.avatar as string) ?? ""}
              alt={user.firstName ?? "User"}
            />
            <AvatarFallback>
              <UserCircle className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-muted-foreground">{user.emailAddresses[0].emailAddress}</p>
          </div>
        </div>
      </Card>)}


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Total Bookings</h4>
          <p className="text-2xl font-bold">{profile?.stats.totalBookings ?? 0}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Completed Services</h4>
          <p className="text-2xl font-bold">{profile?.stats.completedServices ?? 0}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Pending Services</h4>
          <p className="text-2xl font-bold">{profile?.stats.pendingServices ?? 0}</p>
        </Card>
        <Card className="p-4">
          <h4 className="font-semibold text-sm text-muted-foreground">Average Rating</h4>
          <div className="flex items-center">
            <p className="text-2xl font-bold">{profile?.stats.averageRating.toFixed(1) ?? 0}</p>
            <Star className="h-4 w-4 ml-1 text-yellow-400 fill-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Cars Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Car className="h-5 w-5 mr-2" />
          Cars Owned
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile?.cars.map((car) => (
            <Card key={car.make + car.model + car.year} className="p-4">
              <p className="font-semibold">{car.make} {car.model}</p>
              <p className="text-sm text-muted-foreground">Year: {car.year}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Reviews Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 mr-2" />
          Recent Reviews
        </h3>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {profile?.reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{review.customerName}</p>
                  <div className="flex items-center">
                    <p className="mr-1">{review.rating}</p>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
