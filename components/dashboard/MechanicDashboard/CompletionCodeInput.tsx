'use client'

import { useState } from 'react'
import { PinInput } from '@/components/ui/PinInput'
import { validateCompletionCodeAction } from '@/app/actions/validateCompletionCodeAction'
import { Loader2Icon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CompletionCodeInputProps {
  requestId: string
  onSuccess?: () => void
}

export function CompletionCodeInput({ requestId, onSuccess }: CompletionCodeInputProps) {
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()

  const handleComplete = async (code: string) => {
    try {
      setIsValidating(true)
      await validateCompletionCodeAction(requestId, code)
      toast({title:'Service completed successfully',description:'Your service has been completed successfully'})
      onSuccess?.()
    } catch (error) {
      toast({title:'Error',description:error instanceof Error ? error.message : 'Failed to validate completion code',variant:'destructive'})
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Enter Completion Code</h2>
      <p className="text-muted-foreground">
        Enter the completion code provided by the customer to receive payment
      </p>
      <div className="mt-8">
        <PinInput onComplete={handleComplete} />
      </div>
      {isValidating && (
        <div className="flex items-center justify-center mt-4">
          <Loader2Icon className="animate-spin h-5 w-5 mr-2" />
          <span>Validating code...</span>
        </div>
      )}
    </div>
  )
}
