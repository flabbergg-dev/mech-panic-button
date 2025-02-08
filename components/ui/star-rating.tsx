"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  reviewCount?: number
  maxStars?: number
  className?: string
  size?: number
}

export function StarRating({
  rating,
  reviewCount,
  maxStars = 5,
  className,
  size = 16
}: StarRatingProps) {
  // Calculate the number of full and partial stars
  const fullStars = Math.floor(rating)
  const hasPartialStar = rating % 1 !== 0
  const emptyStars = maxStars - fullStars - (hasPartialStar ? 1 : 0)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={size}
            className="fill-yellow-400 text-yellow-400"
          />
        ))}

        {/* Partial star */}
        {hasPartialStar && (
          <div className="relative">
            {/* Empty star background */}
            <Star size={size} className="text-yellow-400" />
            {/* Filled star overlay with width based on partial value */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                width: `${(rating % 1) * 100}%`
              }}
            >
              <Star
                size={size}
                className="fill-yellow-400 text-yellow-400"
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={size}
            className="text-yellow-400"
          />
        ))}
      </div>

      {/* Review count */}
      {reviewCount !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
