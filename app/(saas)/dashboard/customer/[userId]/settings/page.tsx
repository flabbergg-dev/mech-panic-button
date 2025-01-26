import { Suspense } from "react"
import AccountForm from "@/components/forms/AccountForm"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"

export default function SettingsPage() {
  return (
    <>
      <Suspense fallback={<SkeletonBasic />}>
        <AccountForm />
      </Suspense>
    </>
  )
}
