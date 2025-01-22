"use client"

import React from "react"
import { Button } from "../ui/button"
import { ArrowBigRight, LucideIcon, MapPin, Shield, Star } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { PwaInstall } from "../PwaInstall"

type SafetyFeatureProps = {
  icon: LucideIcon
  title: string
  description: string
}

const SafetyFeature = ({
  icon: Icon,
  title,
  description,
}: SafetyFeatureProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-start space-x-4 bg-white/10 p-4 sm:p-6 rounded-lg shadow-md"
  >
    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mt-1 flex-shrink-0" />
    <div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-300 text-sm sm:text-base">{description}</p>
    </div>
  </motion.div>
)

export default function SafetyAlways() {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-[#001529] to-[#002a4e] w-full overflow-x-hidden">
      <div className="container mx-auto px-4 ">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">
              Safety Always
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8">
              Our app holds itself to the highest service standards, ensuring
              quality and reliability every step of the way. By connecting you
              with trusted mechanics specializing in car care, we've built a
              platform you can count on—making us a top choice for convenient,
              dependable auto repair appointments.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <SafetyFeature
                icon={Shield}
                title="Trusted Mechanics"
                description="High rating vetted professionals for your peace of mind"
              />

              <SafetyFeature
                icon={Star}
                title="Top-Rated Service"
                description="Consistently high customer satisfaction"
              />
              <SafetyFeature
                icon={MapPin}
                title="Convenient Locations"
                description="Service where and when you need it"
              />
            </div>
            <PwaInstall
              title="Request Assistance"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-primary text-white flex items-center justify-center space-x-2"
            >
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <ArrowBigRight />
              </motion.div>
            </PwaInstall>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 lg:pl-6 sm:lg:pl-10 "
          >
            <div className="relative w-full h-[300px] sm:h-[500px] rounded-xl shadow-2xl overflow-hidden">
              <img
                src="https://www.investopedia.com/thmb/ebMYfMg-5jCEaACcn269MXVhy5w=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-12188964601-e7f4258f37c946b8af0b6c625b95202d.jpg"
                alt="Mechanic working safely"
                className="w-full h-full object-cover " 
      
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-4 sm:pb-8">
                <p className="text-white text-xl sm:text-2xl font-semibold px-4 text-center">
                  Your Safety is Our Priority
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
