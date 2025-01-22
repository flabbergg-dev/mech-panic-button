"use client"

import Link from "next/link"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gradient-to-bl from-primary/10 via-primary/30 to-secondary/50 py-12 px-4 sm:px-6 lg:px-8 w-full">
      <DotLottieReact
        src="https://lottie.host/044d42f6-920d-41ca-b577-fe2700d06909/g3uXGnzdNv.lottie"
        loop
        autoplay
        className="w-full h-auto max-w-[480px]"
        style={{ width: "100%", height: "auto" }}
        onClick={() => {
          window.location.replace("/sign-in")
        }}
      />
      <Button asChild className="mt-8 w-full sm:w-auto max-w-screen-lg">
        <Link
          href="/sign-in"
          className="flex items-center gap-2 text-center py-4 px-6 sm:px-8 sm:py-6"
        >
          <Home className="w-4 h-4" />
          Volver al inicio
        </Link>
      </Button>
    </div>
  )
}
