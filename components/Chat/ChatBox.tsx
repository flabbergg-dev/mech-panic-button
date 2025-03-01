"use client"

import { useEffect, useRef, useState } from "react"
import { DynamicAvatar } from "@/components/DynamicAvatar/DynamicAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createMessageAction } from "@/app/actions/chats/create-message.action"
import { RealtimeChannel } from "@supabase/supabase-js"
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action"
import { useUser } from "@clerk/nextjs"
import { Separator } from "@/components/ui/separator"
import { MessageCircle } from "lucide-react"
import { getChatMessages } from "@/app/actions/chats/get-chat-messages.action"
import supabase from "@/utils/supabase/specialClient"
import { getUserToken } from "@/app/actions/getUserToken"
import { HalfSheet } from "../ui/HalfSheet"
import useUserFirstName from "@/hooks/useUserFirstName"

type ChatBoxProps = {
  mechanicId: string
  userId: string
}

export const ChatBox = ({mechanicId, userId}: ChatBoxProps) => {

  const [isOpen, setIsOpen] = useState(false)
  const useFirstName = useUserFirstName(mechanicId!)
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
      mechanicId!
    );
    if (chat?.chat?.id) {
      setChatId(chat.chat.id)
      if(chatId) {
        await fetchMessages(chatId!)
      }
    }
    else {
      console.error("Error fetching chat")
    }
  }

  const realTimeSubscription = async () => {
    await fetchChat();
    const token = await getUserToken()
    if (!token) {
      console.log("No token available")
      return
    }
    supabase.realtime.setAuth(token)

    channelRef.current = supabase.channel('realtime:public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message' }, async (payload: any) => {
      payload.new.authorId === userId ? setUserMessages((prevMessages: any) => [...prevMessages, payload.new]) : setMechanicMessages((prevMessages: any) => [...prevMessages, payload.new])
    }).subscribe()
    console.log("Channel: ", channelRef.current)
    return () => {
      channelRef.current?.unsubscribe()
    }
  }

  useEffect(() => {
    realTimeSubscription()
  }, [channelRef, chatId])



  return (
    <div className="">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 bg-slate-600 text-white z-[990]"
      >
        <MessageCircle size={24} />
      </Button>
      {isOpen === true && (
        <div
          className={`absolute top-0 bottom-0 left-0 z-[99] bg-background p-4 h-[-webkit-fill-available] ${isOpen ? "transform translate-y-0" : "transform translate-y-4 opacity-0"}`}
        >
          {chatId && (
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4 py-4">
                <h1 className="bg-secondary text-secondary-foreground p-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                  Chat
                </h1>
                <Button className="" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
              <Separator />
              <div className="grid gap-4 my-4">
                {mechanicMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="place-self-start h-auto gap-4 w-fit flex flex-row items-center justify-center"
                  >
                    <DynamicAvatar
                      className="border-2"
                      // src={
                      //   typeof currentUser?.username === "string"
                      //     ? currentUser.username
                      //     : undefined
                      // }
                      fallbackText={
                        useFirstName ? useFirstName.slice(0, 2) : "NA"
                      }
                    />
                    <p className="text-white bg-slate-600 p-2 rounded-lg">
                      {msg.content}
                    </p>
                  </div>
                ))}

                {userMessages.map((msg, index) => (
                  <div
                    key={`${msg.id}-${index}`}
                    className="place-self-end h-auto gap-4 w-fit flex flex-row items-center justify-center"
                  >
                    <p className="text-white bg-slate-600 p-2 rounded-lg">
                      {msg.content}
                    </p>
                    <DynamicAvatar
                      className="border-2"
                      // src={
                      //   typeof currentUser?.username === "string"
                      //     ? currentUser.username
                      //     : undefined
                      // }
                      fallbackText={
                        currentUser?.firstName
                          ? currentUser.firstName.slice(0, 2)
                          : "NA"
                      }
                    />
                  </div>
                ))}
                <div className="flex gap-4 my-4">
                  <Input
                    placeholder="Type a message"
                    onChange={(ev) => handleNewMessage(ev)}
                  />
                  <Button
                    variant={"secondary"}
                    onClick={() =>
                      createNewMessage({
                        userId: currentUser!.id!,
                        chatId: chatId,
                        authorId: currentUser!.id!,
                        content: messages[messages.length - 1].message,
                      })
                    }
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}