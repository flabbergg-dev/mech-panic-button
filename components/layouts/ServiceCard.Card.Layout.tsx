import { ReactNode, Suspense } from "react"

type ServiceCardCompProps = {
  children?: ReactNode
}

export function ServiceCardLayout({ children }: ServiceCardCompProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 pb-14 space-y-4 rounded-t-3xl border-x-0 border-b-0 rounded-b-none">
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </div>
  )
}
