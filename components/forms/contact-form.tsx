"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "../ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must not exceed 500 characters"),
})

type ContactFormProps = {
  onSubmit?: (
    values: z.infer<typeof formSchema>
  ) => Promise<{ success: boolean; error?: string }>
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const result = await onSubmit?.({
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
      })

      if (result?.success) {
        alert("Message sent! We'll get back to you soon.")
        form.reset()
        setIsSubmitted(true)
      } else {
        alert(result?.error || "Failed to send message. Please try again.")
      }
    } catch (error) {
      alert("An error occurred. Please try again.")
      setIsSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:w-1/2 bg-card p-8 rounded-lg shadow-lg text-card-foreground"
        >
          <h2 className="text-3xl font-bold mb-6 text-center lg:text-left text-card-foreground">
            Get in Touch
          </h2>
          <p className="text-lg mb-8 text-center lg:text-left text-card-foreground/80">
            Have a question or need assistance? We&apos;re here to help. Fill
            out the form, and our team of expert mechanics will get back to you
            shortly.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="bg-card/10 border border-gray-300 text-card-foreground/90 text-sm rounded-lg block w-full p-2.5 cursor-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        className="bg-card/10 border border-gray-300 text-card-foreground text-sm rounded-lg block w-full p-2.5 cursor-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        {...field}
                        className="bg-card/10 border border-gray-300 text-card-foreground text-sm rounded-lg block w-full p-2.5 cursor-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your message here..."
                        {...field}
                        className="bg-card/10 border border-gray-300 text-card-foreground text-sm rounded-lg block w-full p-2.5 cursor-text"
                      />
                    </FormControl>
                    <FormDescription>Max 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant={isSubmitting ? "ghost" : "default"}
                className="w-full text-primary-foreground font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitting
                  ? "Sending..."
                  : isSubmitted
                    ? "Sent!"
                    : "Send Message"}
              </Button>
            </form>
          </Form>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full lg:w-1/2 flex justify-center items-center"
        >
          <DotLottieReact src="/mechanic-illustration.lottie" loop autoplay />
        </motion.div>
      </div>
    </div>
  )
}
