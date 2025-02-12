"use server"

import { auth } from "@clerk/nextjs/server"

export const getUserToken = async () => {
    const { getToken } = await auth()
    const token = await getToken({ template: process.env.NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE! })

    if (!token) {
        return null
    }
    return token
}