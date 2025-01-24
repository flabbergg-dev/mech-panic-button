"use client"

import React, { useEffect, useState } from "react"
import { Clock, LucideIcon, MapPin, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"

type FeatureItemProps = {
  icon: LucideIcon
  title: string
  description: string
  isActive: boolean
}

const FeatureItem = ({
  icon: Icon,
  title,
  description,
  isActive,
}: FeatureItemProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`p-6 rounded-lg shadow-md transition-all duration-300 ${
      isActive
        ? "bg-primary text-white"
        : "bg-white text-gray-800 hover:bg-gray-100"
    }`}
  >
    <Icon
      className={`w-10 h-10 mb-4 ${isActive ? "text-white" : "text-primary"}`}
    />
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className={isActive ? "text-white/80" : "text-gray-600"}>
      {description}
    </p>
  </motion.div>
)

export default function CompleteExperience() {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
  const images = [
    { src: "/maps.jpg", alt: "Service Area Map" },
    { src: "/maps_usa_east.jpg", alt: "Service Area Map East" },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? 1 : 0))
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-20 bg-gradient-to-br from-[#DEDCEA] to-[#F0EFF7] w-full">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-gray-800 mb-12 text-center"
        >
          The Complete Experience
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <FeatureItem
            icon={MapPin}
            title="Anywhere"
            description="Our service is available wherever you are"
            isActive={true}
          />
          <FeatureItem
            icon={Clock}
            title="Anytime"
            description="24/7 service at your convenience"
            isActive={false}
          />
          <FeatureItem
            icon={Zap}
            title="Now"
            description="Instant response to your needs"
            isActive={false}
          />
          <FeatureItem
            icon={Shield}
            title="Always"
            description="Consistently ready to assist you"
            isActive={false}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-green-500"></div>
          <div className="relative h-[600px]">
            <motion.div
              className="w-full h-full"
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-8">
              <p className="text-white text-2xl font-semibold">
                Our Extensive Service Coverage
              </p>
            </div>
           
          </div>
        </motion.div>
      </div>
    </section>
  )
}
