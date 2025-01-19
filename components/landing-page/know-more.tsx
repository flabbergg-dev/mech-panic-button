"use client"

import React from "react"
import { Car, Clock, LucideIcon, Shield, Wrench } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function KnowMore() {
  return (
    <section className="py-20 bg-gradient-to-b from-[#001529] to-[#003366]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4 text-white"
          >
            Experience Premium Roadside Assistance
          </motion.h2>
          <p className="text-xl text-gray-300">
            Discover why thousands trust our expert mechanics
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={Car}
            title="On-Demand Service"
            description="Book trusted mechanics instantly, saving time and hassle."
          />
          <FeatureCard
            icon={Clock}
            title="Quick Booking"
            description="Schedule your appointment in minutes for doorstep service."
          />
          <FeatureCard
            icon={Wrench}
            title="Expert Care"
            description="Experience top-notch service with quality parts and thorough check-ups."
          />
          <FeatureCard
            icon={Shield}
            title="Peace of Mind"
            description="Enjoy a stress-free, premium service experience every time."
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <motion.img
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              src="/images/mechanic-at-work.webp"
              alt="Expert mechanic at work"
              className="rounded-lg shadow-2xl"
            />
          </div>
          <div className="md:w-1/2 md:pl-12">
            <h3 className="text-3xl font-bold mb-4 text-white">
              Why Choose Our Mechanics?
            </h3>
            <ul className="space-y-4 text-gray-300 mb-8">
              <li className="flex items-center">
                <CheckIcon className="w-6 h-6 text-green-500 mr-2" />
                Transparent pricing with no hidden fees
              </li>
              <li className="flex items-center">
                <CheckIcon className="w-6 h-6 text-green-500 mr-2" />
                24/7 availability for emergencies
              </li>
            </ul>
            <Button
              size="lg"
              className="text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Book Your Mechanic Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/10 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
  >
    <Icon className="w-12 h-12 text-primary mb-4" />
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
)
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

const CheckIcon: React.FC<IconProps> = (props) => (
  <svg
    {...props}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
)
