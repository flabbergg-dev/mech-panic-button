import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface SecureDocumentProps {
  documentPath?: string
  className?: string
  alt?: string
}

export function SecureDocument({ documentPath, className, alt }: SecureDocumentProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!documentPath) {
    return null
  }

  // Remove the 'documents/' prefix if it exists
  const path = documentPath.replace(/^documents\//, '')

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="text-red-500 text-sm">{error}</div>
      ) : (
        <object
          data={`/api/documents/${path}`}
          type="application/pdf"
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError('Failed to load document')
          }}
        >
          <p>Unable to display document</p>
        </object>
      )}
    </div>
  )
}
