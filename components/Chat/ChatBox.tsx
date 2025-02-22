"use client"

import { useEffect, useRef, useState } from "react"
// import {
//   getAvailableMechanicsListAction,
// } from "@/app/actions/mechanic/get-available-mechanics-list.action"
// import { Mechanic, User } from "@prisma/client"
import { DynamicAvatar } from "@/components/DynamicAvatar/DynamicAvatar"
import { Button } from "@/components/ui/button"
// import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { Input } from "@/components/ui/input"
import { createMessageAction } from "@/app/actions/chats/create-message.action"
import { RealtimeChannel } from "@supabase/supabase-js"
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action"
import { useUser } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import { MessageCircle } from "lucide-react"
import { getChatMessages } from "@/app/actions/chats/get-chat-messages.action"
import supabase from "@/utils/supabase/specialClient"
import { useAuth } from '@clerk/clerk-react'
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"

type ChatBoxProps = {
  mechanicId: string
}

export const ChatBox = ({mechanicId}: ChatBoxProps) => {
  const { userId } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  // const supabase = createClient()
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
    content: string
  }[]>([])
  const [mechanicMessages, setMechanicMessages] = useState<{
    id: number
    chatId: number
    content: string
  }[]>([])
  const { user: currentUser } = useUser()
  const channelRef = useRef<RealtimeChannel | null>(null)

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

  const fetchMessages = async (chatId: number) => {
      const messages = await getChatMessages(chatId)
      if (messages) {
        if(currentUser) {
          const userMessages = messages.messages!.filter((msg) => msg.authorId === currentUser!.id)
          const mechanicMessages = messages.messages!.filter((msg) => msg.authorId !== currentUser!.id)
          setUserMessages(userMessages)
          setMechanicMessages(mechanicMessages)
          console.log("Messages: ", messages)
        }
      } else {
        console.error("Error fetching messages")
      }
  }

  const fetchChat = async () => {
    const chat = await getChatByUserIdAction(
      userId!,
      mechanicId
    );
    if (chat.chat?.id) {
      setChatId(chat.chat.id)
      if(chatId) {
        await fetchMessages(chatId!)
      }
    } else if (!chat) {
      createChat(userId!, mechanicId)
    }
    else {
      console.error("Error fetching chat")
    }
  }

  const realTimeSubscription = async () => {
    await fetchChat()

    channelRef.current = supabase.channel('realtime:public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, async (payload: any) => {
      setTimeout(async () => {
        await fetchMessages(chatId!)
      }, 2000)
    }).subscribe()
    console.log("Channel: ", channelRef.current)
    return () => {
      channelRef.current?.unsubscribe()
    }
  }

  useEffect(() => {
    realTimeSubscription()
  }, [chatId, channelRef])



  return (
    <div className="">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 bg-slate-600 text-white"
      >
        <MessageCircle size={24} />
      </Button>

      <div className={`absolute left-0 right-0 justify-center bg-slate-600 text-white p-2 rounded-md duration-300 h-auto overflow-y-scroll w-[70dvw] md:w-[20dvw] border-2 hover:border-slate-400 transition-all ${isOpen ? "transform translate-y-0" : "transform translate-y-4 opacity-0"}`}>
        {!chatId && (
          <div className="flex flex-col justify-center items-center">
            <h1>
              No Chat at the moment
            </h1>
          </div>
        )}
        {chatId && (
          <div className="flex flex-col justify-between">
            <h1 className="p-2 bg-slate-600 text-white rounded-md w-fit my-4">
              Chat with user
            </h1>
            <Separator />
            <div className="grid gap-4 my-4">
              {mechanicMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="place-self-start h-auto gap-4 w-24 flex flex-row items-center justify-center"
                >
                  <DynamicAvatar className="border-2" src={typeof currentUser?.username === 'string' ? currentUser.username : undefined} fallbackText={currentUser?.firstName ? currentUser.firstName.slice(0, 2) : "NA"} />
                  <div className="flex w-[-webkit-fill-available]">
                    <p className="text-white bg-slate-600 p-2 rounded-lg">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {userMessages.map((msg, index) => (
                <div
                  key={`${msg.id}-${index}`}
                  className="place-self-end h-auto w-24 flex flex-row items-center justify-center"
                >
                  <div className="flex w-[-webkit-fill-available]">
                    <p className="text-white bg-slate-600 p-2 rounded-lg">
                      {msg.content}
                    </p>
                  </div>
                  <div className="flex w-32">
                    <DynamicAvatar className="border-2" src={typeof currentUser?.username === 'string' ? currentUser.username : undefined} fallbackText={currentUser?.firstName ? currentUser.firstName.slice(0, 2) : "NA"} />
                  </div>
                </div>
              ))}
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
          </div>
        )}
      </div>
    </div>
  )
}