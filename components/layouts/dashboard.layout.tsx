import { ReactNode } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {

  return (
    <div className="min-h-screen bg-background md:p-4 p-2 z-40">
      <div className="max-w-md md:max-w-7xl mx-auto space-y-4">{children}</div>
    
    </div>
  )
}
