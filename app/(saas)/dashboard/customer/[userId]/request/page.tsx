import { Suspense } from "react"
import { Request } from "@/components/service/Request"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"

export default function AppointmentsPage() {
  return (
    <div className=" p-4  min-h-screen">
      <h1 className=" mt-6  text-3xl  font-bold  text-foreground">
        Book a request
      </h1>
      <Suspense fallback={<SkeletonBasic />}>
        <Request />
      </Suspense>
    </div>
  )
}
