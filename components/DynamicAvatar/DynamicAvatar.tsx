import React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

interface DynamicAvatarProps {
  src?: string
  fallbackText: string
  className?: string
}

export const DynamicAvatar = ({
  src,
  fallbackText,
  className,
}: DynamicAvatarProps) => {
  return (
    <Avatar className={className}>
      <AvatarImage src={src} />
      <AvatarFallback>{fallbackText}</AvatarFallback>
    </Avatar>
  )
}
