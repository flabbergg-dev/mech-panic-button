import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/api/mechanic/(.*)',
  '/api/service/(.*)',
  '/api/user/create(.*)'  // Protect other user endpoints except role
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-use',
  '/api/webhook/(.*)',  // Webhooks are public
  '/api/user/role'  // Make role endpoint public
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()
  
  // If it's a protected route and user is not authenticated, redirect to sign in
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  // Handle protected routes and dashboard redirection for authenticated users
  if (userId && isProtectedRoute(req)) {
    try {
      // Get user role from our API endpoint
      const baseUrl = new URL(req.url).origin
      const roleResponse = await fetch(`${baseUrl}/api/user/role`, {
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      })

      if (!roleResponse.ok) {
        console.error(`API request failed with status ${roleResponse.status}`)
        return NextResponse.next()
      }

      const responseText = await roleResponse.text()
      let role
      try {
        const data = JSON.parse(responseText)
        role = data.role
      } catch (error) {
        console.error('Error parsing role response:', error, 'Response text:', responseText)
        return NextResponse.next()
      }

      // If user has no role, redirect to onboarding unless they're already there
      if (!role) {
        const path = new URL(req.url).pathname
        if (path !== '/onboarding') {
          return NextResponse.redirect(new URL('/onboarding', req.url))
        }
        return NextResponse.next()
      }

      const path = req.nextUrl.pathname

      // Check if trying to access role-specific routes
      const isMechanicRoute = path.includes('/mechanic') || path.includes('mechanic')
      const isCustomerRoute = path.includes('/customer') || path.includes('customer')

      // Prevent role crossover access for all routes
      if (role === 'Mechanic' && isCustomerRoute && !path.startsWith('/api')) {
        return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
      }
      if (role === 'Customer' && isMechanicRoute && !path.startsWith('/api')) {
        return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
      }

      // Handle specific dashboard route redirection based on role
      if (path === '/dashboard') {
        if (role === 'Mechanic') {
          return NextResponse.redirect(new URL(`/dashboard/mechanic/${userId}`, req.url))
        } else if (role === 'Customer') {
          return NextResponse.redirect(new URL(`/dashboard/customer/${userId}`, req.url))
        }
      }

      // Check if trying to access dashboard routes
      const isMechanicDashboard = path.startsWith('/dashboard/mechanic/')
      const isCustomerDashboard = path.startsWith('/dashboard/customer/')

      // Ensure users can only access their own dashboard
      const urlParts = path.split('/')
      const dashboardUserId = urlParts[urlParts.length - 1]
      
      if ((isMechanicDashboard || isCustomerDashboard) && dashboardUserId !== userId) {
        // Redirect to their own dashboard if trying to access another user's dashboard
        return NextResponse.redirect(new URL(`/dashboard/${role.toLowerCase()}/${userId}`, req.url))
      }
    } catch (error) {
      console.error('Error in middleware:', error)
      // In case of error accessing the API, allow the request to continue
      // The page's server-side logic can handle any necessary error states
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

// Configure Clerk middleware
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
