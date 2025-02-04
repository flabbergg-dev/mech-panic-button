"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface HalfSheetProps {
  children: ReactNode
  className?: string
}

export const HalfSheet = ({ children, className = "" }: HalfSheetProps) => {
  return (
    <motion.div
      initial={{ y: "100vh" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className={`fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}
    >
      {children}
    </motion.div>
  )
}
