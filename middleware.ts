import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"
// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/api/mechanic/(.*)',
  '/api/service/(.*)',
  '/api/user/create(.*)'
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
  '/api/webhook/(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth() as { userId: string | null; redirectToSignIn: () => void }

  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const path = req.nextUrl.pathname

  // If it's a protected route and user is not authenticated, redirect to sign in
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn()
  }
  // Handle protected routes and dashboard redirection for authenticated users
  if (userId && isProtectedRoute(req)) {
    try {
      // Get user directly from Clerk
      const clerk = await clerkClient()
      const user = await clerk.users.getUser(userId)
      const role = user.publicMetadata.role as string | undefined

      // If no role is set and not on onboarding page, redirect to onboarding
      if (!role && !path.includes('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }

      // If role is set and on onboarding page, redirect to dashboard
      if (role && path.includes('/onboarding')) {
        // console.log('Middleware - Has role, redirecting from onboarding to dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Check dashboard access based on role
      const isMechanicPath = path.includes('/mechanic')
      const isCustomerPath = path.includes('/customer')

      // console.log('Middleware - Path checks:', {
      //   isMechanicPath,
      //   isCustomerPath,
      //   currentRole: role
      // })

      // Strict role-based access control
      if (role === 'Customer' && isMechanicPath) {
        // console.log('Middleware - Customer attempting to access mechanic path')
        return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
      }

      if (role === 'Mechanic' && isCustomerPath) {
        // console.log('Middleware - Mechanic attempting to access customer path')
        return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
      }

      // Handle root dashboard redirection
      if (path === '/dashboard') {
        if (role === 'Mechanic') {
          return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
        } 
        if  (role === 'Customer') {
          return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
        }
      }

      // Ensure users can only access their own dashboard
      if (path.startsWith('/dashboard/')) {
        // Extract userId using regex pattern matching
        // This will match the userId regardless of how deeply nested the route is
        const customerMatch = path.match(/\/dashboard\/customer\/([^\/]+)/)
        const mechanicMatch = path.match(/\/dashboard\/mechanic\/([^\/]+)/)
        
        let dashboardUserId = null
        if (customerMatch) {
          dashboardUserId = customerMatch[1]
        } else if (mechanicMatch) {
          dashboardUserId = mechanicMatch[1]
        }

        if (dashboardUserId && dashboardUserId !== userId) {
          if (role === 'Mechanic') {
            return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
          }
           if (role === 'Customer') {
            return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
          }
        }
      }

    } catch (error) {
      // console.error('Error in middleware:', error)
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

// Configure Clerk middleware
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
