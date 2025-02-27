"use client"

import { ReactNode, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface HalfSheetProps {
  children: ReactNode
  className?: string
  showToggle?: boolean
  defaultExpanded?: boolean
}

export const HalfSheet = ({ 
  children, 
  className = "", 
  showToggle = false,
  defaultExpanded = true 
}: HalfSheetProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100vh" }}
        animate={{ 
          y: isExpanded ? 0 : "85%",
          transition: {
            y: { type: "spring", damping: 30, stiffness: 200, mass: 0.8 }
          }
        }}
        exit={{ y: "100vh" }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-4xl max-h-[90vh]",
          className
        )}
        onClick={showToggle ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {showToggle && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-md"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </Button>
          </div>
        )}
        <motion.div 
          layout
          className="overflow-hidden"
          animate={{ 
            height: isExpanded ? "" : "15vh",
          }}
          transition={{
            height: { type: "spring", damping: 30, stiffness: 200, mass: 0.8 }
          }}
        >
          <motion.div 
            layout
            className="h-full overflow-hidden"
            animate={{ 
              opacity: isExpanded ? 1 : 0.8,
            }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
