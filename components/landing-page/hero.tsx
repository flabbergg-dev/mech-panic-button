"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"

// type IconProps = LucideProps

export default function Header() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen bg-[url('/images/hero.webp')] bg-cover bg-no-repeat">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-card/90 p-10 rounded-lg shadow-2xl max-w-3xl text-center text-black backdrop-blur-md"
      >
        <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your Personal Mechanic, Just a Tap Away
        </h1>
        <p className="text-xl mb-8 text-text/70">
          Experience instant roadside assistance with real-time updates,
          diagnostics, and repair estimates. Stay in control with our
          user-friendly app.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            size="lg"
            className="text-xl px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Download Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-xl px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Learn More
          </Button>
        </div>
        {/* <div className="flex flex-wrap justify-center mt-8 gap-6 text-sm font-medium text-foreground/80">
          <span className="flex items-center">
            <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
            4.8/5 App Store Rating
          </span>
          <span className="flex items-center">
            <WrenchIcon className="w-5 h-5 text-blue-500 mr-1" />
            10,000+ Repairs Completed
          </span>
          <span className="flex items-center">
            <ClockIcon className="w-5 h-5 text-green-500 mr-1" />
            24/7 Assistance
          </span>
        </div> */}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-8"
      >
        <ChevronDown className="w-12 h-12 text-primary animate-bounce" />
      </motion.div>
    </section>
  )
}

// const StarIcon: React.FC<IconProps> = (props) => (
//   <svg
//     {...props}
//     fill="currentColor"
//     viewBox="0 0 20 20"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//   </svg>
// )

// const WrenchIcon: React.FC<IconProps> = (props) => (
//   <svg
//     {...props}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
//     />
//   </svg>
// )

// const ClockIcon: React.FC<IconProps> = (props) => (
//   <svg
//     {...props}
//     fill="none"
//     stroke="currentColor"
//     viewBox="0 0 24 24"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <path
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       strokeWidth={2}
//       d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
//     />
//   </svg>
// )
