"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { createReviewAction } from '@/app/actions/createReviewAction'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  serviceRequestId: string
  clientId: string
  mechanicName: string
}

export function ReviewModal({ isOpen, onClose, serviceRequestId, clientId, mechanicName }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createReviewAction(serviceRequestId, clientId, rating, comment)
      
      if (result.success) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!"
        })
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit review",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Rate Your Experience</DialogTitle>
          <DialogDescription className="text-center">
            How was your service with {mechanicName}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  size={32}
                  className={`${
                    (hoverRating ? star <= hoverRating : star <= rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors duration-200`}
                />
              </motion.button>
            ))}
          </div>
          
          {/* Comment Box */}
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full resize-none"
            rows={4}
          />
          
          {/* Action Buttons */}
          <div className="flex w-full space-x-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
