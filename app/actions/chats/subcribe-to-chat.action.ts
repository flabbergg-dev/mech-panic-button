"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function subscribeToMessages(userId: string, mechanicId: string) {
    try {
        const channel = supabase.channel(`chat:${userId},${mechanicId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, (payload) => {
            console.log("Message received!", payload)
        }).subscribe()

        return () => {
            channel.unsubscribe()
        }
    }
        catch (error) {
        console.error("Error in getChatAction:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch chat",
        }
    }
}