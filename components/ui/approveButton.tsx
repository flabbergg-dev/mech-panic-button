"use client"

import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

interface ApproveButtonProps {
  buttonColor: string
  buttonTextColor?: string
  subscribeStatus: boolean
  initialText: React.ReactElement | string
  changeText: React.ReactElement | string
  onClick?: () => void
}

export const ApproveButton: React.FC<ApproveButtonProps> = ({
  buttonColor,
  subscribeStatus,
  buttonTextColor,
  changeText,
  initialText,
  onClick,
}) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(subscribeStatus)

  const handleOnClick = () => {
    setIsSubscribed(!isSubscribed)
    if (onClick) {
      onClick()
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isSubscribed ? (
        <motion.button
          className="relative flex h-10 w-[200px] items-center justify-center overflow-hidden rounded-md bg-white outline outline-1 outline-black "
          onClick={handleOnClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.span
            key="action"
            className="relative flex h-full w-full items-center justify-center font-semibold"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            style={{ color: buttonColor }}
          >
            {changeText}
          </motion.span>
        </motion.button>
      ) : (
        <motion.button
          className="relative flex h-10 w-[200px] cursor-pointer items-center justify-center rounded-md border-none"
          style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          onClick={() => setIsSubscribed(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            key="reaction"
            className="relative flex items-center justify-center font-semibold"
            initial={{ x: 0 }}
            exit={{ x: 50, transition: { duration: 0.1 } }}
          >
            {initialText}
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
