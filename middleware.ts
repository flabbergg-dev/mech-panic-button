import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/api/user/(.*)',
  '/api/mechanic/(.*)',
  '/api/service/(.*)'
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
  '/api/webhook/(.*)'  // Webhooks are public
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()
  
  // If it's a protected route and user is not authenticated, redirect to sign in
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // If user is authenticated and accessing protected routes
  if (userId && isProtectedRoute(req)) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })

      // New user, redirect to onboarding
      if (!user || !user.role) {
        const path = new URL(req.url).pathname
        if (path !== '/onboarding') {
          return NextResponse.redirect(new URL('/onboarding', req.url))
        }
        return NextResponse.next()
      }

      // Role-based routing for existing users
      const path = new URL(req.url).pathname
      if (user.role === "Mechanic" && !path.startsWith("/dashboard/mechanic")) {
        return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
      }
      if (user.role === "Customer" && !path.startsWith("/dashboard/customer")) {
        return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
      }
    } catch (error) {
      console.error("Error in middleware:", error)
      // Continue to the next middleware/route handler in case of database errors
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
