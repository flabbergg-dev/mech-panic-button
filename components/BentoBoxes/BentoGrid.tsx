"use client"

import { cn } from "@/lib/utils"
import { Booking } from "@/components/cards/Booking"
import { motion } from "framer-motion"


const BentoInfo = [
  {
    eyebrow: "Book Appointments",
    title: "Today or later this week",
    description:
      "Mech-Panic Button is the fastest way to book an appointment with your local mechanic. We’ll even send you a message to let you know their on their way.",
    graphic: (
      <div className="absolute inset-0 bg-[url('/images/mapDashboard.jpg')] object-fill bg-cover" />
    ),
    className: "max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl",
    url: "/dashboard",
  },
  {
    eyebrow: "Featured",
    title: "Road side assistance",
    description:
      "We’ll send a mechanic to your location to help you with your car troubles. No need to worry about getting to a garage.",
    graphic: (
      <div className="absolute inset-0 bg-[url(/images/mapDashboard2.jpg)] object-fill bg-cover" />
    ),
    className: "lg:col-span-3 lg:rounded-tr-4xl",
    url: "/dashboard",
  },
  {
    eyebrow: "Car Diagnostics",
    title: "Get a diagnosis in minutes",
    description: "Our mechanics will diagnose your car troubles in minutes.",
    graphic: (
      <div className="absolute inset-0 -top-20 -left-60 bg-[url(/images/mechanic-working.webp)] object-scale-down bg-cover" />
    ),
    className: "lg:col-span-2 lg:rounded-bl-4xl",
    url: "/dashboard",
  },
  {
    eyebrow: "Global Reach",
    title: "We’re everywhere",
    description:
      "The Mechanics will help you anywhere possible. We have a global reach.",
    graphic: (
      <div className="absolute inset-0 bg-[url(/images/mechanic-working.webp)] object-contain bg-cover" />
    ),
    className: "lg:col-span-2",
    url: "/dashboard",
  },
  {
    eyebrow: "Trustworthy",
    title: "We’re here to help",
    description:
      "Our mechanics are here to help you with your car troubles. We’re here to help.",
    graphic: (
      <div className="absolute inset-0 -top-44 -left-60 bg-[url(/images/mechanic-at-work.webp)] object-contain bg-cover" />
    ),
    className: "max-lg:rounded-b-4xl lg:col-span-2 lg:rounded-br-4xl",
    url: "/dashboard",
  },
]

type BentoGridProps = {
  user: unknown
}

export default function BentoGrid({ user }: BentoGridProps) {
  return (
    <div className="container  mx-auto">
      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
        {BentoInfo.map((info, index) => (
          <BentoCard key={index} {...info} user={user} />
        ))}
      </div>
      <Booking />
    </div>
  )
}

export function BentoCard({
  dark = false,
  className = "",
  eyebrow,
  title,
  description,
  graphic,
  fade = ["top"],
  url,
  user,
}: {
  dark?: boolean
  className?: string
  eyebrow: React.ReactNode
  title: React.ReactNode
  description: React.ReactNode
  graphic?: React.ReactNode
  fade?: ("top" | "bottom")[]
  url: string
  user: unknown
}) {
  return (
    <motion.div
      initial="idle"
      whileHover="active"
      variants={{ idle: {}, active: {} }}
      data-dark={dark ? "true" : undefined}
      className={cn(
        className,
        " group  relative  flex  flex-col  overflow-hidden  rounded-lg hover:scale-95 transition-all duration-400",
        " bg-white  transform-gpu dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#8686f01f_inset]  shadow-sm  ring-1  ring-black/5",
        "data-[dark]:bg-gray-800 data-[dark]:ring-white/15"
      )}
    >
      <div className=" relative  h-[29rem]  shrink-0">
        {graphic}
        {fade.includes("top") && (
          <div className=" absolute  inset-0  bg-gradient-to-b  from-white  to-50%  group-data-[dark]:from-gray-800  group-data-[dark]:from-[-25%]  opacity-25" />
        )}
        {fade.includes("bottom") && (
          <div className=" absolute  inset-0  bg-gradient-to-t  from-white  to-50%  group-data-[dark]:from-gray-800  group-data-[dark]:from-[-25%]  opacity-25" />
        )}
      </div>
      <div className=" relative  p-10  z-20  isolate  mt-[-110px]  h-[14rem]  backdrop-blur-xl">
        <h1>{eyebrow}</h1>
        <p className=" mt-1  text-2xl/8  font-medium  tracking-tight dark:text-gray-100  text-gray-950  group-data-[dark]:text-white">
          {title}
        </p>
        <p className=" mt-2  max-w-[600px]  text-sm/6  text-gray-600 dark:text-gray-300  group-data-[dark]:text-gray-400">
          {description}
        </p>
      </div>
    </motion.div>
  )
}
