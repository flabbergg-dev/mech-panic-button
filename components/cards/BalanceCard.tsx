"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { EyeClosed, EyeIcon, Lock } from "lucide-react"
import { Card } from "../ui/card"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

interface BalanceCardProps {
  currentAvailableBalance: {
    available: number;
    pending: number;
  };
}

export const BalanceCard = ({ 
  currentAvailableBalance,
}: BalanceCardProps) => {
  const [showBalance, setShowBalance] = useState(false);

  const handleShowBalance = () => {
    setShowBalance(!showBalance);
  };

  const totalBalance = (currentAvailableBalance.available + currentAvailableBalance.pending) / 100;
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalBalance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="text-white p-6 rounded-xl shadow-lg bg-cover bg-center bg-no-repeat max-w-md mx-auto"
        style={{ backgroundImage: "url('/card.png')" }}
      >
        <div className="flex items-center flex-col justify-between">
          <div className="flex flex-row gap-2 justify-center">
            <h2 className="font-medium opacity-80">Total Balance</h2>
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
            <span className="text-2xl font-roboto-regular font-semibold">
              {formattedBalance}
            </span>
          ) : (
            <span className="text-2xl font-roboto-regular">****</span>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 w-full text-sm">
            <div className={cn(
              "p-2 rounded bg-white/10",
              !showBalance && "opacity-50"
            )}>
              <span className="block opacity-80">Available</span>
              {showBalance ? (
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(currentAvailableBalance.available / 100)}
                </span>
              ) : (
                <span>****</span>
              )}
            </div>
            <div className={cn(
              "p-2 rounded bg-white/10",
              !showBalance && "opacity-50"
            )}>
              <span className="block opacity-80">Pending</span>
              {showBalance ? (
                <span className="font-medium">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(currentAvailableBalance.pending / 100)}
                </span>
              ) : (
                <span>****</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
