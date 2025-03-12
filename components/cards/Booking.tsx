"use client"

import {  FormEvent, useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Loader } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Mechanic as PrismaMechanic } from "@prisma/client"
import { getAvailableMechanicsListAction } from "@/app/actions/mechanic/get-available-mechanics-list.action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "../forms/dateTimePicker";
import { Button } from "../ui/button"

type Mechanic = PrismaMechanic & {
  isAvailable: boolean
  location: string
  serviceArea: string
  servicesOffered: string[]
}

// This would come from your API/database
type MechanicAvailability = {
  date: Date
  slots: string[]
}

export const Booking = () => {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<"selectMechanic" | "selectDateTime" | "confirmBooking">("selectMechanic")
  const [formData, setFormData] = useState({
    mechanic: {} as Mechanic,
    selectedDate: Date,
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isActive, setIsActive] = useState(0)
  const [mechanicList, setMechanicList] = useState([] as Mechanic[])
  const modalRef = useRef<HTMLDivElement>(null)
  const [availability, setAvailability] = useState([] as MechanicAvailability[])
  const [dateTime, setDateTime] = useState<Date | undefined>();

  useEffect(() => {
    const fetchAvailability = async () => {
      const response = await getAvailableMechanicsListAction();
      if (response && response.mechanic) {
        setMechanicList(
          response.mechanic.map((m: any) => ({
            ...m,
            isAvailable: m.isAvailable,
            location: m.location,
            serviceArea: m.serviceArea,
            servicesOffered: m.servicesOffered,
            availability: m.availability,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            isApproved: m.isApproved,
          }))
        );

        setAvailability(
          response.mechanic.map((m: any) => ({
            date: new Date(m.availability.date),
            slots: m.availability.slots
          }))
        )
      }
    };

    fetchAvailability();
  }, []);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(event.target as Node) &&
      !(event.target as HTMLElement).closest(".date-time-picker-container") && // Exclude DateTimePicker
      !(event.target as HTMLElement).closest(".select-container") // Exclude Select
    ) {
      setIsOpen(false);
    }
  };

  if (isOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [isOpen]);

  
  const bookingVariant = {
    initial: {
      opacity: 0,
      y: 100,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: 100,
      transition: {
        duration: 0.2,
      },
    },
  }

  // Get available time slots for selected date
  const getAvailableSlots = (date: Date) => {
    const dayAvailability = availability.find(
      (a) => format(a.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return dayAvailability?.slots || []
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setLoading(true)
      // Here you would make an API call to save the booking
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsConfirmed(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsConfirmed(false)
      }, 2000)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="md:h-full flex items-end justify-center w-full z-20 p-4 pb-24">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        className="absolute"
      >
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div style={{ filter: "url(#goo)" }} className="w-full max-w-lg mx-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={modalRef}
              className="min-h-[300px] max-h-[85vh] bg-primary text-primary-foreground fixed bottom-20 left-0 right-0 md:bottom-24 md:left-4 md:right-4 md:absolute md:w-[500px] rounded-t-3xl md:rounded-3xl overflow-auto scrollbar-hide -z-10 p-4 md:p-5 mx-auto touch-pan-y"
              variants={bookingVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 200 || velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
            >
              <div className="w-full flex justify-center mb-2 md:hidden">
                <div className="w-10 h-1 bg-primary-foreground/20 rounded-full" />
              </div>
              <AnimatePresence>
                {steps === "selectMechanic" && (
                  <motion.div
                    className="flex flex-col gap-6 md:gap-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-4">
                      <h1 className="text-xl md:text-2xl font-medium">
                        Select a mechanic
                      </h1>
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {mechanicList.map((mechanic, index) => {
                          return (
                            <motion.button
                              whileTap={{
                                scale: 0.9,
                              }}
                              key={index}
                              className={
                                "bg-secondary backdrop-blur px-4 py-1.5 rounded-xl whitespace-nowrap text-sm md:text-base"
                              }
                              onClick={() => {
                                setFormData({ ...formData, mechanic });
                              }}
                            >
                              <span className="block text-center">
                                {/* {mechanic.name} */}
                              </span>
                              <span className="block text-center text-xs opacity-70">
                                {mechanic.rating}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <h1 className="text-xl md:text-2xl font-medium">
                        Select a Date & Time
                      </h1>
                      <div className="flex items-center gap-2 pb-2 date-time-picker-container">
                        <DateTimePicker
                          value={dateTime}
                          onChange={setDateTime}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <h1 className="text-xl md:text-2xl font-medium">
                        This Mechanic Offers
                      </h1>
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Pick service" />
                        </SelectTrigger>
                        <SelectContent className="select-container">
                          {mechanicList
                            .filter((mechanic) => mechanic.servicesOffered)
                            .map((mechanic) =>
                              mechanic.servicesOffered.map(
                                (service: string, index: number) => (
                                  <SelectItem key={mechanic.id} value={service}>
                                    {service}
                                  </SelectItem>
                                )
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Button
                        variant={"outline"}
                        onClick={() => setSteps("confirmBooking")}
                      >
                        Next step
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {steps === "confirmBooking" && (
                  <motion.div
                    className="text-primary-foreground h-full w-full flex flex-col md:flex-row gap-6 md:gap-2 pb-safe"
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: isConfirmed ? -400 : 0,
                      opacity: 1,
                    }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col gap-6 w-full">
                    <div>
                      <Button
                        variant={"outline"}
                        onClick={() => setSteps("selectMechanic")}
                      >
                        Previous step
                      </Button>
                    </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-background rounded-xl p-2 h-12 w-12 md:h-14 md:w-14 flex items-center justify-center">
                          <img
                            src={user.imageUrl}
                            alt="Mechanic"
                            width={100}
                            height={100}
                            className="rounded-lg"
                          />
                        </div>
                        <h2 className="flex flex-col gap-1 text-sm md:text-base">
                          <span>
                            {format(selectedDate, "EEEE, MMMM d yyyy")}
                          </span>
                          <span className="text-muted-foreground">
                            {steps[0]}
                          </span>
                        </h2>
                      </div>
                    </div>
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4 md:gap-5 w-full"
                    >
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="name"
                          className="font-medium text-primary-foreground/70 text-sm"
                        >
                          Your name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="firstName"
                          value={user.firstName || ""}
                          readOnly
                          required
                          disabled={loading}
                          className="h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 px-4 text-sm md:text-base text-primary-foreground/70 outline-none border-background"
                        />
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <label
                          htmlFor="email"
                          className="font-medium text-primary-foreground/70 text-sm"
                        >
                          Your email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={user.emailAddresses[0]?.emailAddress || ""}
                          readOnly
                          required
                          disabled={loading}
                          className="h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-2 px-4 text-sm md:text-base text-primary-foreground/70 outline-none border-background"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="bg-background dark:text-white text-black flex items-center gap-2 justify-center px-4 h-12 md:h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base mt-auto"
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading && <Loader className="animate-spin h-4 w-4" />}
                        Book Now
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {isConfirmed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="h-full w-full black absolute top-0 left-0 flex flex-col gap-4 items-center justify-center p-4"
                  >
                    <CheckCircle2
                      className="text-primary-foreground h-12 w-12 md:h-16 md:w-16"
                      fill="white"
                      stroke="black"
                    />
                    <h1 className="text-primary-foreground font-bold flex flex-col text-center text-lg md:text-xl">
                      <span>Booking confirmed!</span>
                      <span>Looking forward to chatting!</span>
                    </h1>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-16 md:h-20 flex items-center justify-center fixed bottom-0 left-0 right-0 md:relative bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">
          <div className="flex items-center justify-between bg-primary rounded-2xl mx-auto z-10 p-1 w-[calc(100%-2rem)] md:w-[500px] px-2.5">
            <motion.div
              animate={{ height: 42 }}
              className="bg-primary bg-black rounded-lg max-w-[42px] min-w-[42px] flex items-center justify-center"
            >
              <div className="h-3 rounded w-3 bg-white dark:bg-black rotate-45" />
            </motion.div>
            <motion.button
              className="bg-secondary text-black dark:text-white px-4 py-1.5 rounded-xl text-sm md:text-base font-medium"
              onClick={() => setIsOpen((prev) => !prev)}
              whileTap={{ scale: 0.98 }}
            >
              {isOpen ? "Close" : "Book a Mechanic"}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
