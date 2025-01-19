"use client"

import { motion, useAnimation, Variants } from "framer-motion"
import { useEffect } from "react"


const lineVariants: Variants = {
  normal: {
    rotate: 0,
    y: 0,
    opacity: 1,
    originX: "center",
  },
  animate: (custom: number) => ({
    rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
    y: custom === 1 ? 8 : custom === 3 ? -4 : 0,
    opacity: custom === 2 ? 0 : 1,
    originX: "center",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  }),
}

const MenuIcon = ({ isOpen }: { isOpen: boolean }) => {
  const controls = useAnimation()

  // Trigger animation when isOpen changes
  useEffect(() => {
    controls.start(isOpen ? "animate" : "normal")
  }, [isOpen, controls])

  return (
    <div className="cursor-pointer select-none p-2 rounded-md transition-colors duration-200 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.line
          x1="4"
          y1="6"
          x2="20"
          y2="6"
          variants={lineVariants}
          animate={controls}
          custom={1}
        />
        <motion.line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          variants={lineVariants}
          animate={controls}
          custom={2}
        />
        <motion.line
          x1="4"
          y1="18"
          x2="20"
          y2="18"
          variants={lineVariants}
          animate={controls}
          custom={3}
        />
      </svg>
    </div>
  )
}

export { MenuIcon }
