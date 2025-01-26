import React from "react"
import { ServiceCardLayout } from "@/components/layouts/ServiceCard.Card.Layout"
import { HalfSheet } from "@/components/ui/HalfSheet"
import { Clock } from "lucide-react"

interface InTransitInstructionsProps {
  duration?: number
  currentStep?: string
  nextStep?: string
}

export const InTransitInstructions = ({
  duration = 0,
  currentStep = "",
  nextStep = "",
}: InTransitInstructionsProps) => {
  return (
    <HalfSheet>
      <ServiceCardLayout>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{Math.floor(duration)} min</span>
          </div>

          <div className="space-y-2"></div>
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="font-medium">Current: {currentStep}</p>
          </div>
          {nextStep && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-gray-600">Next: {nextStep}</p>
            </div>
          )}
        </div>
      </ServiceCardLayout>
    </HalfSheet>
  )
}
