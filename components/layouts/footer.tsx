"use client"

import  { useState } from "react"

import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6"

import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { CheckCircle, Send } from "lucide-react"

const ICON_SIZE = 24

type FooterSectionProps = {
  title: string
  links: string[]
}

const FooterSection = ({ title, links }: FooterSectionProps) => (
  <div className="mb-8 md:mb-0">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
    <ul className="space-y-2">
      {links.map((link, index) => (
        <li key={index}>
          <a
            href="#"
            className="text-gray-600 hover:text-gray-900 transition-colors duration-300"
          >
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
)

export const Footer = () => {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // const result = await subscribeNewsletter(email)
    const result = {
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
    <footer className="bg-gradient-to-b from-[#DEDCEA] to-[#F0EFF7] pt-16 pb-8 w-full">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <FooterSection
            title="Mech-Panic Button"
            links={[
              "Safety",
              "Our Story",
              "Reviews",
              "Mechanic Advisors",
              "Careers",
            ]}
          />
          <FooterSection
            title="Guest Resources"
            links={[
              "FAQs",
              "Mechanic",
              "Specials",
              "Reservation Lookup",
              "Operator Participant Agreement",
              "NA Conditions of Appointment",
            ]}
          />
          <FooterSection
            title="Connect"
            links={[
              "Contact Us",
              "Instagram",
              "Facebook",
              "LinkedIn",
              "Twitter",
            ]}
          />
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-4">
              Sign up for info on special partnerships and new promos
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
            <p className="text-xs text-gray-500 pt-2">
              By subscribing you accept to receive marketing information from
              Mech-Panic Button and agree to our Privacy Policy.
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-300 mb-8"></div>

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0 md:w-2/3">
            © {new Date().getFullYear()} Mech-Panic-Button. All appointments are facilitated through
            mechanics. We serve as a booking intermediary. Terms and conditions
            apply.
          </p>
          <div className="flex space-x-4">
            <FaFacebook size={ICON_SIZE} />
            <FaInstagram size={ICON_SIZE} />
            <FaLinkedin size={ICON_SIZE} />
            <FaXTwitter size={ICON_SIZE} />
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/privacy-policy"
            className="text-sm text-gray-600 hover:text-gray-900 mr-4"
          >
            Privacy Policy
          </a>
          <a href="/terms-of-use" className="text-sm text-gray-600 hover:text-gray-900">
            Terms of Use
          </a>
        </div>
      </div>
    </footer>
  )
}
