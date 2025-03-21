"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ContactFormSchema, formSchema } from "@/schemas/contact/contactFormSchema";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { toast } from "sonner";
import { sendContactFormAction } from "@/app/actions/contact";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Contact() {
  const form = useForm<ContactFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const submitContactForm = async (values: ContactFormSchema): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await sendContactFormAction(values);

      if (!response.success) {
        toast.error("Failed to send message. Please try again.");
        return { success: false, error: "Failed to send message." };
      }

      toast.success("Message sent successfully!");
      return { success: true };
    } catch (error) {
      toast.error("An error occurred while sending the message.");
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  async function handleSubmit(values: ContactFormSchema) {
    try {
      setIsSubmitting(true);
      const result = await submitContactForm(values);

      if (result.success) {
        setIsSent(true);
      }
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 via-slate-300 to-slate-500 dark:to-red-800 dark:from-slate-700  p-4 w-full">
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
                className="w-full text-primary-foreground font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sending..."
                  : "Send Message"}
              </Button>
            </form>
          </Form>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full flex justify-center items-center"
          >
            <DotLottieReact src="/icons/mechanic-illustration.lottie" loop autoplay />
          </motion.div>
        </div>
      </div>
    </div>
  );
}