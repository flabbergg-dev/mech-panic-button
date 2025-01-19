"use client"

import React from "react"
import {
  ArrowBigRight,
  CheckCircle,
  Clock,
  LucideIcon,
  Star,
} from "lucide-react"
import { Button } from "../ui/button"
import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

const FeatureItem = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="flex items-start space-x-4 bg-white/10 p-4 sm:p-6 rounded-lg shadow-md overflow-hidden"
  >
    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mt-1 flex-shrink-0" />
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-300">{description}</p>
    </div>
  </motion.div>
)

export default function SecondKnowMore() {
  return (
    <section className="relative py-10 sm:py-20 bg-gradient-to-b from-[#001529] to-[#002a4e] overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 mb-10 lg:mb-0"
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
              Your Car&apos;s Health Is Our Priority
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Don&apos;t worry about keeping your car up to date. Our service is
              carefully designed to exceed your expectations, ensuring your
              vehicle stays in top condition.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <FeatureItem
                icon={CheckCircle}
                title="Trusted Mechanics"
                description="Our partners are committed to providing top-notch service."
              />

              <FeatureItem
                icon={Star}
                title="Exceptional Experience"
                description="Enjoy a smooth and satisfying car care journey from start to finish."
              />
              <FeatureItem
                icon={Clock}
                title="Timely Service"
                description="We respect your time and strive for efficient, punctual service."
              />
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-primary text-white flex items-center justify-center space-x-2"
            >
              <span>Request Your Mechanic Now!</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ArrowBigRight />
              </motion.div>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 lg:pl-6 sm:lg:pl-10"
          >
            <div className="relative w-full h-[300px] sm:h-[500px] bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <img
                src="/mechanic-working.webp"
                alt="Mechanic working on a car"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-8">
                <p className="text-white text-2xl font-semibold">
                  Expert Care for Your Vehicle
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
