import React from 'react'

export const Loader = ({ title }: { title?: string }) => {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
    <div className="text-center">
      <div className="relative inline-block h-24 w-24">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
      {title && (
        <p className="mt-4 text-muted-foreground">
          {title}
        </p>
      )}
    </div>
  </div>
  )
}
