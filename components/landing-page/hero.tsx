"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { PwaInstall } from "../PwaInstall"
import Link from "next/link"

export default function Header() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen bg-[url('/hero.webp')] bg-cover bg-no-repeat bg-center w-full pt-12 md:pt-0">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]"/>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 px-4 w-full max-w-6xl mx-auto"
      >
        <div className="bg-card/10 p-8 sm:p-12 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium">
                #1 Rated Mechanic App
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              24/7 Car Repairs,<br />Delivered to You
            </h1>
            
            <p className="text-lg sm:text-xl mb-8 text-foreground/80 max-w-2xl mx-auto">
              Get instant access to mechanics, real-time diagnostics, and upfront pricing. 
              No surprises, just reliable car care at your fingertips.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
           
              <PwaInstall />

                
              
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                asChild
                >
                  <Link href="/#how-it-works" >
                See How It Works
                  </Link>
              </Button>
            </div>

            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-sm sm:text-base">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  ★★★★★
                </div>
                <span className="font-medium">4.9/5 Rating</span>
                <span className="text-foreground/60 text-sm">App Store</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl mb-2">50K+</span>
                <span className="text-foreground/60">Happy Customers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl mb-2">15min</span>
                <span className="text-foreground/60">Avg. Response Time</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-2xl mb-2">24/7</span>
                <span className="text-foreground/60">Support Available</span>
              </div>
            </div> */}
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 z-20"
      >
        <Button
          variant="ghost"
          size="icon"
          className="animate-bounce text-white"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <ChevronDown className="h-8 w-8" />
        </Button>
      </motion.div>
    </section>
  )
}
