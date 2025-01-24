"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { EyeClosed, EyeIcon } from "lucide-react"
import { Card } from "../ui/card"

export const BalanceCard = () => {
  const [showBalance, setShowBalance] = useState(false)

  const handleShowBalance = () => {
    setShowBalance(!showBalance)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="text-white p-6 rounded-xl shadow-lg bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/card.png')" }}
      >
        <div className="flex items-center flex-col  justify-between">
          <div className="flex flex-row gap-2 justify-center">
            <h2 className=" font-medium opacity-80">Total Balance</h2>
            {showBalance ? (
              <EyeClosed
                className="cursor-pointer opacity-80"
                onClick={handleShowBalance}
              />
            ) : (
              <EyeIcon
                className="cursor-pointer opacity-80"
                onClick={handleShowBalance}
              />
            )}
          </div>
          {showBalance ? (
            <span className="text-2xl">$1,000.00</span>
          ) : (
            <span className="text-2xl">****</span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
