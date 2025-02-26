// "use server"
// import { auth } from "@clerk/nextjs/server"
// import { ChatBox } from "./ChatBox"
// export async function Chat () {
//     const { getToken } = await auth()
//     const token = await getToken({ template: process.env.NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE! })

//     if (!token) {
//         return null
//     }

    // const fetchData = async () => {
    //   try {
    //     const response = await fetch(process.env.URL + '/api/realtime-events/realtime-chat/', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ token }),
    //     });
    //     const data = await response.json();
    //     console.log('API data:', data);
    //     // Process the data as needed
    //   } catch (error) {
    //     console.error('Error fetching data:', error);
    //   }
    // };

    // console.log("Token: ", token)

    // fetchData();

    // const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

    // return () => clearInterval(intervalId); // Cleanup interval on component unmount

//     return (
//         <ChatBox/>
//     )
// }

import React from 'react'

export const Chat = () => {
  return (
    <div>Chat</div>
  )
}

