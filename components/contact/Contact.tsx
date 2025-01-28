import React from "react"
import Image from "next/image"
import { SquareArrowOutDownLeftIcon } from "lucide-react"

export const Contact = () => {
  return (
    <div className=" flex  flex-col  items-center  min-h-screen  justify-center  gap-3">
      <Image
        src={"/images/Email.svg"}
        alt={"Email_On_Contact_Dashboard"}
        width={500}
        height={500}
      />
      <p>Shoot us your complaint through email</p>
      <div className=" flex  justify-between  gap-5">
        <p className=" font-bold">Support@Mech-PanicButton.com</p>
        <SquareArrowOutDownLeftIcon size={24} />
      </div>
      <div className=" flex  justify-between  gap-5">
        <p>FAQ</p>
        <SquareArrowOutDownLeftIcon size={24} />
      </div>
    </div>
  )
}
