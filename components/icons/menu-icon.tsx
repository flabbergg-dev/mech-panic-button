"use client"

import { motion, Variants } from "framer-motion"
import { useEffect } from "react"


const topVariants: Variants = {
  closed: {
    rotate: 0,
    translateY: 0
  },
  open: {
    rotate: 45,
    translateY: 6
  }
}

const centerVariants: Variants = {
  closed: {
    opacity: 1
  },
  open: {
    opacity: 0
  }
}

const bottomVariants: Variants = {
  closed: {
    rotate: 0,
    translateY: 0
  },
  open: {
    rotate: -45,
    translateY: -6
  }
}

const MenuIcon = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <div className="cursor-pointer select-none p-2 rounded-md hover:bg-foreground/10 transition-colors duration-200 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <motion.line
          x1="4"
          y1="6"
          x2="20"
          y2="6"
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={topVariants}
          transition={{ duration: 0.2 }}
        />
        <motion.line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={centerVariants}
          transition={{ duration: 0.2 }}
        />
        <motion.line
          x1="4"
          y1="18"
          x2="20"
          y2="18"
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          variants={bottomVariants}
          transition={{ duration: 0.2 }}
        />
      </svg>
    </div>
  )
}

export { MenuIcon }
