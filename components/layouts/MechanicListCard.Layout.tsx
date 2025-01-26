import { ReactNode, Suspense } from "react"

type ServiceCardCompProps = {
  children?: ReactNode
}

export function MechanicListCard({ children }: ServiceCardCompProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4 rounded-t-3xl border-t border-x-0 border-b-0 rounded-b-none">
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </div>
  )
}
