"use client"

import { useUser } from "@clerk/nextjs"

import { BalanceCard } from "@/components/cards/BalanceCard"
import { ServiceRequest } from "@/components/service/ServiceRequest"
import { Loader, User2Icon, UserCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PushNotificationButton } from "../../PushNotificationButton"
import { ClientMap } from "../ClientDashboard/ClientMap"
import supabase from "@/utils/supabase/specialClient"
import {
  getAvailableMechanicsListAction,
} from "@/app/actions/mechanic/get-available-mechanics-list.action"
import { Mechanic, User } from "@prisma/client"
import { DynamicAvatar } from "@/components/DynamicAvatar/DynamicAvatar"
import { Button } from "@/components/ui/button"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { Input } from "@/components/ui/input"
import { createMessageAction } from "@/app/actions/chats/create-message.action"
import { RealtimeChannel } from "@supabase/supabase-js"
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action"

export const MechanicHome = () => {
  const { user } = useUser()
  const [isServiceRequestAvailable, setIsServiceRequestAvailable] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsServiceRequestAvailable(true)
    }, 3000)
  }, [isServiceRequestAvailable])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Hello,{" "}
          {user!.firstName
            ? user!.firstName.concat(" ", user!.lastName ?? "")
            : "there"}
          !
        </h1>
        <div className="flex items-center space-x-4 flex-row ">
        <PushNotificationButton />

        <Avatar>
          <AvatarImage
            src={(user!.publicMetadata["avatar"] as string) ?? ""}
            alt={user!.firstName ?? "User"}
          />
          <AvatarFallback>
            <UserCircle />
          </AvatarFallback>
        </Avatar>
          </div>
      </div>

      <BalanceCard />

      {!isServiceRequestAvailable ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <h3 className="text-md font-semibold mt-6">
            No Service Requests Available
          </h3>
          <div className="space-y-4 p-4">
            <img
              src="/icons/car.svg"
              alt="no_request"
              className="invert dark:invert-0"
            />
          </div>
          <div className="space-x-4 text-center p-8">
            You currently have no <strong>Service Request</strong>. Wait a
            moment or refresh the page.
          </div>
          <div>
            <Loader className="animate-spin" />
          </div>
        </div>
      ) : (
        <div className="">
          <ScrollArea className="h-72 rounded-md ">
            <h3 className="text-md font-semibold mt-6">
              Service Requests Available
            </h3>
            <div className="space-y-4 p-4">
              <ServiceRequest serviceRequestId={"1"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"2"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"3"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"4"} isScheduled={false} />
            </div>
          </ScrollArea>
          <Separator className="w-full whitespace-nowrap rounded-md bg-primary" />
          <h3 className="text-md font-semibold mt-6">Scheduled Appointments</h3>
          <ScrollArea className="w-full whitespace-nowrap rounded-md ">
            <div className="flex w-max space-x-4 px-4">
              <ServiceRequest serviceRequestId={"6"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"7"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"8"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"9"} isScheduled={true} />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
      <ChatBox />
    </div>
  )
}


const ChatBox = () => {
    // This state handles the selected mechanics information (as User) and services (as Mechanic)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    // managing the chat identidier
    const [chatId, setChatId] = useState(null as number | null)
    // messages based on chat based in user (creating in client)
    const [messages, setMessages] = useState<
      {
        user: string;
        message: string;
      }[]
    >([]);
    // state for user and mechanic messages (fetching from db)
    const [userMessages, setUserMessages] = useState<{
      id: number
      chatId: number
      userId: string
      content: string
    }[]>([])
    const [mechanicMessages, setMechanicMessages] = useState<{
      id: number
      chatId: number
      userId: string
      content: string
    }[]>([])
    const { user: currentUser } = useUser()
    const channelRef = useRef<RealtimeChannel | null>(null)

  const handleRealtimeInsert = (payload: any) => {
    const { new: newMessage } = payload
    // const { user: {id: userId}, chatId, content } = newMessage
    console.log("New message: ", newMessage)
    const message = {
      ...newMessage,
      // user: currentUser?.id,
    }

    setMessages((prevMessages: any) => [...prevMessages, message])
    console.log("New message: ", message)
  }
  const handleRealtimeUpdate = (payload: any) => {}
  const handleRealtimeDelete = (payload: any) => {}

  const realTimeSubscription = () => {
    const channel = supabase.channel("message").on(
      'postgres_changes',
      {
        event: "*",
        schema: "public",
        table: "Message",
      },
      (payload: any) => {
        console.log('Change received!', payload)
        switch (payload.eventType) {
          case "INSERT":
            handleRealtimeInsert(payload)
            break
          case "UPDATE":
            handleRealtimeUpdate(payload)
            break
          case "DELETE":
            handleRealtimeDelete(payload)
            break
          default:
            console.log("Unknown event type: ", payload.eventType)
            break
        }
      }
    )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("Channel status: ", status)
          channelRef.current = channel
        }
      })

    return channel
  }

  const createChat = async (userId: string, mechanicId: string) => {
    try {
      const chat = await createChatWithUserAction(userId, mechanicId)
      if (chat) {
        setChatId(chat.chat!.id)
        return chat
      } else {
        console.error("Error creating chat")
      }
      return null
    } catch (error) {
      throw new Error(`Error creating chat: ${error}`)
    }
  }

  const createNewMessage = async (message: {
    userId: string
    chatId: number
    authorId: string
    content: string
  }) => {
    console.log("Message: ", message)
    if (!message.userId || !message.chatId || !message.content) {
      throw new Error(`Message parameters cannot be null userID ${message.userId}, chatID ${message.chatId}, content: ${message.content}`)
    }
    try {
      const newMessage = await createMessageAction(message.userId, message.chatId, message.content)
      setUserMessages((prevMessages: any) => [...prevMessages, newMessage])
      return newMessage
    } catch (error) {
      throw new Error(`Error sending message: ${error}`)
    }
  }

  const handleNewMessage = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = {
      user: currentUser!.id,
      message: ev.target.value,
    }
    setMessages((prevMessages: any) => [...prevMessages, newMessage])
  }

  useEffect(() => {
    const fetchChat = async () => {
    const chat = await getChatByUserIdAction("user_2sPgC9CSclCoSGcUHVuK1NeTg4v", "user_2sNHlI1QmJbhC2xrOTT2pFpdnYp")
      if (chat) {
        setChatId(chat.chat!.id)
      }
    }
    channelRef.current = realTimeSubscription()
    fetchChat()
    return () => {
      if(channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [currentUser, selectedUser])


  return (
    <>
    {chatId && (
      <div className="flex flex-col justify-between">
      <h1 className="p-2 bg-slate-600 text-white rounded-md w-fit my-4">
        Chat with user
      </h1>
      <div className="flex items-center gap-2 my-4">
        {/* <DynamicAvatar
        src={selectedUser?.profileImage || <User2Icon/>}
        fallbackText={selectedUser?.firstName.slice(0, 2)}
        className="border-2 border-slate-500"
        /> */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-3xl">{selectedUser?.firstName}</p>
            <p className="text-xl">{selectedUser?.lastName}</p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="grid gap-4 my-4">
        {mechanicMessages.map((msg) => (
          <div
            key={msg.content}
            className="place-self-left h-auto gap-4 w-24 flex items-center justify-center"
          >
            <DynamicAvatar className="border-2" src={typeof currentUser?.username === 'string' ? currentUser.username : undefined} fallbackText={currentUser?.firstName ? currentUser.firstName.slice(0, 2) : "NA"} />
            <div className="flex w-[-webkit-fill-available]">
              <p className="text-white bg-slate-600 p-2 rounded-lg">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {userMessages.map((msg) => (
          <div
            key={msg.content}
            className="place-self-right h-auto gap-4 w-24 flex items-center justify-center"
          >
            <div className="flex w-32">
              <DynamicAvatar className="border-2" src={typeof currentUser?.username === 'string' ? currentUser.username : undefined} fallbackText={currentUser?.firstName ? currentUser.firstName.slice(0, 2) : "NA"} />
            </div>
            <div className="flex w-32">
              <p className="text-white bg-slate-600 p-2 rounded-lg">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {!chatId && (
          <Button
            onClick={() => {
              if (currentUser && selectedUser) {
                createChat(currentUser.id, selectedUser.id)
              }
            }}
          >
            Create Chat
          </Button>
        )}
        {chatId && (
          <div className="flex gap-4 my-4">
            <Input
              placeholder="Type a message"
              onChange={(ev) => handleNewMessage(ev)}
            />
            <Button
              variant={"secondary"}
              onClick={() => createNewMessage({
                userId: currentUser!.id!,
                chatId: chatId,
                authorId: currentUser!.id!,
                content: messages[messages.length - 1].message
              })}
            >
              Send
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 h-32">
        <p>Subscription Status: </p>
        <p>{channelRef.current ? "Active" : "Inactive"}</p>
      </div>
      </div>
    )
    }
    </>
  )
}
