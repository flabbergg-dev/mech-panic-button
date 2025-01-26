
import { DashboardLayout } from "@/components/layouts/dashboard.layout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </div>
  )
}
