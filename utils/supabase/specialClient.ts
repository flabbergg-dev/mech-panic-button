'use client'

import { createClient } from "@supabase/supabase-js"

const specialClient = () =>
    createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
const supabase = specialClient()

export default supabase