import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className=" grid  w-full  grow  items-center  px-4 sm:justify-center  h-screen  bg-background">
      <SignUp />
    </div>
  )
}
