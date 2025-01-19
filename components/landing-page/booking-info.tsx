"use client"

import React from "react"
import { ArrowRight, Calendar, LucideIcon, MapPin, Wrench } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"

interface FeatureCardProps {
  icon: LucideIcon
  text: string
}
const FeatureItem = ({ icon: Icon, text }: FeatureCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="flex items-center space-x-3 bg-card/80 p-3 md:p-4 rounded-lg shadow-sm"
  >
    <Icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
    <p className="text-base md:text-lg ui-text-card-foreground">{text}</p>
  </motion.div>
)

export default function BookingInfo() {
      return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-background to-primary-foreground overflow-hidden w-full">
      <div className="container mx-auto px-4 max-w-full md:max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 mb-8 lg:mb-0"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4 md:mb-6">
              Book Your Mechanic with Ease
            </h2>
            <p className="text-lg md:text-xl text-text/75 mb-6 md:mb-8">
              Schedule tire changes, oil changes, and more with trusted
              mechanics.
            </p>
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <FeatureItem icon={MapPin} text="Choose location" />
              <FeatureItem icon={Calendar} text="Select time" />
              <FeatureItem icon={Wrench} text="Pick service" />
            </div>
            <Button
              size="lg"
              className="w-full md:w-auto text-base md:text-lg px-6 py-3 rounded-full shadow-lg"
            >
              <span>Request Mechanic</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <div className="relative w-full h-[300px] md:h-[400px]">
              <img
                src="/maps.png"
                alt="Service area map"
                className="rounded-xl shadow-2xl w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl flex items-end justify-center pb-4 md:pb-8">
                <p className="text-white text-xl md:text-2xl font-semibold">
                  Our Service Area
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
