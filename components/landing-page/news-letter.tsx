"use client"

import React, { useState } from "react"
import { CheckCircle, Send } from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

// TODO: implement subscribe logic
 // import { subscribeNewsletter } from "../../app/actions/leadActions"

export default function NewsLetter () {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // const result = await subscribeNewsletter(email)
const result = await {
  success: true
}
    if (result.success) {
      setIsSubmitted(true)
      setEmail("")
    } else {
      // Handle error case
      alert("Failed to subscribe to newsletter. Please try again.")
    }
  }

  return (
    <section className="py-20 bg-gradient-to-r from-secondary to-secondary/20 w-full">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 mb-10 lg:mb-0"
          >
            <h2 className="text-4xl font-bold text-text mb-6">
              Stay Updated with Our Latest Features
            </h2>
            <p className="text-xl text-text mb-8">
              Sign up for our newsletter to get the latest updates on our app
              features, special offers, and car care tips. Be the first to know
              about our on-demand bookings and flexible car care options.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitted}
                className={`flex-grow py-3 px-4 rounded-full cursor-text h-10 ${isSubmitted ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-background text-text"}`}
              />
              <Button
                type="submit"
                size="lg"
                className={` text-text rounded-full px-8 py-3  transition-colors duration-300 ${isSubmitted ? "cursor-not-allowed bg-green-500" : "bg-background hover:bg-background/80"}`}
              >
                {isSubmitted ? (
                  <CheckCircle className="w-6 h-6 " />
                ) : (
                  <>
                    Subscribe
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 lg:pl-10"
          >
            <div className="relative w-full h-[250px] md:h-[300px] lg:h-[400px] bg-[#001529] rounded-xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="w-32 h-32 border-8 border-[#F4D48A] rounded-full"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#001529] to-transparent flex items-end justify-center pb-8">
                <p className="text-[#F4D48A] text-2xl font-semibold">
                  Join Our Community
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
