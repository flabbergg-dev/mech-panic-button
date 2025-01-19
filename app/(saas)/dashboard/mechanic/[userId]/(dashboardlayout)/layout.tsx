// import { DashboardLayout } from "components/layouts/DashboardLayout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* <DashboardLayout> */}
        {children}
        {/* </DashboardLayout> */}
    </div>
  )
}
