"use client"

import React from "react"
import { Clock, LucideIcon, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { PwaInstall } from "../PwaInstall"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}
const ContactMethod = ({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center space-x-4 bg-white/20 p-4 rounded-lg shadow-md"
  >
    <Icon className="w-10 h-10 text-[#001529]" />
    <div>
      <h3 className="text-lg font-semibold text-[#001529]">{title}</h3>
      <p className="text-sm text-[#001529]/80">{description}</p>
    </div>
  </motion.div>
)

export default function Online() {
  return (
    <section className="py-20 bg-gradient-to-r from-[#F4D48A] to-[#F6E6B5] w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 mb-10 lg:mb-0"
          >
            <h2 className="text-4xl font-bold text-[#001529] mb-6">
              24/7 Online Support
            </h2>
            <p className="text-xl text-[#001529] mb-8">
              Our dedicated team of mechanics is ready to assist you anytime,
              day or night. Whether you need urgent help or want to schedule a
              future appointment, we&apos;re here for you.
            </p>
            <div className="space-y-4 mb-8">
              <ContactMethod
                icon={Clock}
                title="Always Available"
                description="Our service runs 24/7, ensuring help whenever you need it."
              />
              <ContactMethod
                icon={MessageCircle}
                title="Instant Messaging"
                description="Get quick responses through our in-app chat feature."
              />
            </div>
            <PwaInstall
            title="Download Mech-Panic Button"
              className="text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-[#001529] text-white"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 lg:pl-10"
          >
            <div className="relative w-full h-[400px] bg-[#001529] rounded-xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-[#F4D48A] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#001529] to-transparent flex items-end justify-center pb-8">
                <p className="text-[#F4D48A] text-2xl font-semibold">
                  Live Support Dashboard
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
