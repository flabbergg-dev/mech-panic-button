"use client"

import { useState } from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion } from "framer-motion"

export default function AboutUs() {
  const [activeSection, setActiveSection] = useState(0)

  const sections = [
    {
      id: 1,
      path: "/lottie/mission.lottie",
      title: "Our Mission",
      content:
        "To revolutionize the automotive repair industry by providing instant, reliable connections between drivers in need and skilled mechanics, ensuring safety and peace of mind on the road.",
    },
    {
      id: 2,
      path: "/lottie/vision.lottie",
      title: "Our Vision",
      content:
        "To create a world where vehicle breakdowns are no longer a source of stress, but an opportunity for swift, trustworthy assistance, empowering both drivers and mechanics in a seamless digital ecosystem.",
    },
    {
      id: 3,
      path: "/lottie/purpose.lottie",
      title: "Our Purpose",
      content:
        "To transform roadside emergencies into manageable situations, fostering a community of support that elevates the mechanic profession and provides drivers with unparalleled peace of mind.",
    },
  ]

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="container px-4 mx-auto">
        <motion.h1
          className="mb-4 text-4xl font-bold text-center md:text-5xl text-foreground"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Revolutionizing Roadside Assistance
        </motion.h1>
        <motion.p
          className="mb-8 text-xl text-center text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Your Instant Solution for Auto Emergencies
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {sections.map((section, index) => (
            <motion.button
              key={section.title}
              className={`px-6 py-3 text-sm font-medium rounded-full transition-colors duration-300 ${
                activeSection === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              }`}
              onClick={() => setActiveSection(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {section.title}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center mx-auto md:flex-row"
          >
            <div className="mb-8 md:w-1/2 md:pr-12 md:mb-0">
              <h2 className="mb-6 text-3xl font-bold text-foreground">
                {sections[activeSection]?.title}
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-foreground">
                {sections[activeSection]?.content}
              </p>
              <Button size="lg" className="font-semibold">
                Join Our Network
              </Button>
            </div>
            <div className="md:w-1/2">
              <DotLottieReact
                src={sections[activeSection]?.path || ""}
                loop
                autoplay
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-16 text-center">
          <h3 className="mb-4 text-2xl font-bold text-foreground">
            Trusted by Drivers and Mechanics Alike
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            {/* Add trust badges or partner logos here */}
            {/* Example: <img src="/logo1.png" alt="Partner 1" className="h-12" /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

