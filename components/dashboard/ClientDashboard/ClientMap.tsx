import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MechanicListCard } from "@/components/layouts/MechanicListCard.Layout"
import { HalfSheet } from "@/components/ui/HalfSheet"
import { Car, MapPin, MoveLeftIcon, Star, StarIcon, User, User2Icon } from "lucide-react"
import { MessageCircleMoreIcon } from "../../Animated/message-circle-more"
import { DynamicAvatar } from "../../DynamicAvatar/DynamicAvatar"
import { Mechanic, Message } from "@prisma/client"
import { DepositModal } from "@/components/Modal/DepositModal"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { createMessageAction } from "@/app/actions/chats/create-message.action"
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action"
import { subscribeToMessages } from "@/app/actions/chats/subcribe-to-chat.action"
import { getChatMessages } from "@/app/actions/chats/get-chat-messages.action"
import { RealtimeChannel } from "@supabase/supabase-js"
import supabase from "@/utils/supabase/specialClient"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface UserCoordinates {
  latitude: number
  longitude: number
}

interface MechanicUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "Mechanic"
  profileImage?: string
  phoneNumber?: string | null
  documentsUrl?: string[]
  dob?: string
  currentLocation?: UserCoordinates
  createdAt?: Date
  updatedAt?: Date
  props?: any
  isMechanic?: boolean
  isCustomer?: boolean
}

interface clientMapProps {
  selectedUser: any
  selectedMechanic: any
}

export const ClientMap = ({
  selectedUser,
  selectedMechanic,
}: clientMapProps) => {
  // managing the chat identidier
  const [chatId, setChatId] = useState(0)
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
  const [mechanicServices, setMechanicServices] = useState<Mechanic | null>(
    null
  )
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
      .subscribe((status) => {
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
    if (selectedMechanic) {
      setMechanicServices(selectedMechanic)
    }
  }, [selectedMechanic])

  useEffect(() => {
      if (currentUser && selectedUser) {
        console.log("channelRef: ", channelRef.current)
        channelRef.current = realTimeSubscription()
      }

    return () => {
      if(channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [currentUser, selectedUser])

  return (
    <HalfSheet>
      <MechanicListCard>
        <div className="flex flex-col justify-between">
          <h1 className="p-2 bg-slate-600 text-white rounded-md w-fit my-4">
            Chat with mechanic
          </h1>
          <div className="flex items-center gap-2 my-4">
            <DynamicAvatar
            src={selectedUser?.profileImage || <User2Icon/>}
            fallbackText={selectedUser?.firstName.slice(0, 2)}
            className="border-2 border-slate-500"
            />
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
      </MechanicListCard>
    </HalfSheet>
  )
}
