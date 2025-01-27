import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { File, Settings2, ShieldAlert, Timer, User, X } from "lucide-react"

export const Request = () => {
  return (
    <div className=" bg-white  h-auto  rounded-t-2xl  mt-6  absolute  bottom-0  left-0  right-0  flex  flex-col  top-40 ">
      <div className=" flex  justify-between  pt-5  w-[-webkit-fill-available]  px-4">
        <p className=" font-semibold  text-xl">Manage Service Request</p>
        <X size={24} />
      </div>
      <p className=" p-4">
        Schedule your appoinments efficiently for a smoother workflow.
      </p>
      <div className=" flex  flex-col  gap-5">
        <div className=" px-4  flex  justify-between  items-center">
          <div className=" flex  justify-between  gap-5">
            <Settings2 size={24} />
            <p>Service Type</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className=" bg-secondary  p-2  rounded-md">
              Tire Change
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Tire Change</DropdownMenuItem>
              <DropdownMenuItem>Oil Change</DropdownMenuItem>
              <DropdownMenuItem>Inspection</DropdownMenuItem>
              <DropdownMenuItem>Other</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className=" px-4  flex  justify-between  items-center">
          <div className=" flex  justify-between  gap-5">
            <ShieldAlert size={24} />
            <p>Urgency Level</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className=" bg-secondary  p-2  rounded-md">
              Urgency level
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>High</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className=" px-4  flex  justify-between  items-center">
          <div className=" flex  justify-between  gap-5">
            <Timer size={24} />
            <p>Time Taken</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className=" bg-secondary  p-2  rounded-md">
              Pick time
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Input type="time" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className=" flex  flex-col  px-4  gap-4">
        <p className=" py-4  font-semibold  text-xl">Service Details</p>
        <div className=" flex  gap-4">
          <File size={24} className=" border  rounded-md  p-1" />
          Service Invoice
        </div>
        <div className=" flex  gap-4">
          <User size={24} className=" border  rounded-md  p-1" />
          Nombre del cliente
        </div>
      </div>
      <Button className=" bg-accent  text-white  rounded-md  mx-4  relative  top-12">
        Submit Request
      </Button>
    </div>
  )
}
