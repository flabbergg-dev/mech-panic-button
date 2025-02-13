"use server"

import { auth } from "@clerk/nextjs/server"

export const getUserToken = async () => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE) {
            console.error("NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE is not configured")
            return null
        }

        const { getToken } = await auth()
        const token = await getToken({ 
            template: process.env.NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE 
        })

        if (!token) {
            console.error("Failed to get authentication token from Clerk")
            return null
        }

        return token
    } catch (error) {
        console.error("Error getting authentication token:", error)
        return null
    }
}