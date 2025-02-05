import { createClient } from "@supabase/supabase-js"

const specialClient = () =>
    createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // {
    //     realtime: {
    //         params: {
    //         eventsPerSecond: 2,
    //         },
    //     }
    // }
    )
const supabase = specialClient()

export default supabase

// import 'server-only'

// import { createClient } from "@supabase/supabase-js"

// interface SpecialClientProps {
//     token: string | null
// }

// const specialClient = async ({token}: SpecialClientProps) => {

//     return createClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//         {
//             global: {
//                 headers: { Authorization: `Bearer ${token}` || "" }
//             }
//         }
//     )
// }

// // const supabase = await specialClient()

// export default specialClient