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
  setSelectedMechanic: React.Dispatch<React.SetStateAction<any | undefined>>
  mechanics: Mechanic[]
  mechanicUsers: MechanicUser[]
}

export const ClientMap = ({
  selectedUser,
  selectedMechanic,
  setSelectedMechanic,
  mechanics,
  mechanicUsers,
}: clientMapProps) => {
  // managing the account balance
  const [accountBalance, setAccountBalance] = useState(10.0)
  // managing the dashboard state
  const [currentStep, setCurrentStep] = useState<
    | "mechanicList"
    | "mechanicDetails"
    | "mechanicWatch"
    | "chat"
    | "providePin"
    | "review"
  >("mechanicList")
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
  // if theres no mechanic in range increase mile radius
  const [rangeValue, setRangeValue] = useState(0)
  // services offered by mechanic
  const [mechanicServices, setMechanicServices] = useState<Mechanic | null>(
    null
  )
  // Loading state/ui related
  const [isLoading, setIsLoading] = useState(false)
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

  // handles Dashboard change and calls the users chat based on the user id
  const handleDashboardChangeOpeningChat = async () => {
    setCurrentStep("chat")
    if (currentUser && selectedUser) {
      const chat = await getChatByUserIdAction(currentUser.id!, selectedUser.id!)

      const usersMessages = await getChatMessages(chat.chat!.id, currentUser.id)
      const mechanicsMessages = await getChatMessages(chat.chat!.id, selectedUser.id)

      if (chat) {
        setChatId(chat.chat!.id)
      }

      if (usersMessages) {
        setUserMessages(usersMessages.messages.map(msg => ({ ...msg, userId: msg.authorId })))
      }

      if (mechanicsMessages) {
        setMechanicMessages(mechanicsMessages.messages.map(msg => ({ ...msg, userId: msg.authorId })))
      }
    }
  }
  // picks a mechanic and changes the dashboard state
  const handleDashboardChangeAndUserPick = (Mechanic: any) => {
    setSelectedMechanic(Mechanic)
    setCurrentStep("mechanicDetails")
  }

  //  goes back to the previous step
  const handlePreviousStep = () => {
    const steps = [
      "mechanicList",
      "mechanicDetails",
      "mechanicWatch",
      "chat",
      "providePin",
      "review",
    ]
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0 && steps[currentIndex - 1]) {
      setCurrentStep(steps[currentIndex - 1] as typeof currentStep)
    }
  }

  useEffect(() => {
    if (selectedMechanic) {
      setMechanicServices(selectedMechanic)
    }
  }, [selectedMechanic])

  useEffect(() => {
    if(currentStep === "chat") {
      if (currentUser && selectedUser) {
        console.log("channelRef: ", channelRef.current)
        channelRef.current = realTimeSubscription()
      }
    }

    return () => {
      if(channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [currentUser, selectedUser])

  return (
    <HalfSheet>
      {currentStep != "mechanicList" && (
        <Button
          onClick={handlePreviousStep}
          className="bg-slate-500 text-white rounded-3xl mb-4"
        >
          <MoveLeftIcon />
        </Button>
      )}
      <MechanicListCard>
        {currentStep === "mechanicList" && (
            <>
            {mechanics.filter((mechanic) => mechanic.isAvailable === true).length > 0 ? (
              <p className="text-3xl font-semibold pb-4">Available mechanics</p>
            ) : (
              <div className="flex flex-col">
              <p className="text-3xl pb-4">No available mechanics</p>
              {/* <span>Expand Range</span>
              <Slider
              defaultValue={[10]}
              max={40}
              step={10}
              onValueChange={(value) => {
                if (value[0] !== undefined) {
                setRangeValue(value[0])
                }
              }}
              />
              <span>{rangeValue} miles</span>
              <Button>
              <span>Search</span>
              </Button> */}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {mechanics.length > 0 && (
              mechanics
                .filter((mechanic) => mechanic.isAvailable === true)
                .map((mechanic) => {
                const mechanicUser = mechanicUsers.find(
                  (user) =>
                  user.id === mechanic.userId && user.role === "Mechanic"
                )
                return (
                  <Card
                  key={mechanic.id}
                  onClick={() => handleDashboardChangeAndUserPick(mechanic)}
                  className="hover:bg-slate-300 transition-all"
                  >
                  <CardContent className="flex flex-col gap-4 p-4">
                    {/* <DynamicAvatar fallbackText="SC" /> */}
                    <p className="font-semibold">
                    {mechanicUser?.firstName} {mechanicUser?.lastName}
                    </p>
                    <div className="flex gap-4">
                    <MapPin size={24} />
                    <p className="font-semibold">
                      {mechanicUser?.currentLocation
                      ? `${mechanicUser.currentLocation.latitude}, ${mechanicUser.currentLocation.longitude}`
                      : "Location not available"}
                    </p>
                    </div>
                    <div className="flex gap-4">
                    <StarIcon size={24} />
                    <p className="font-semibold">{mechanic.rating}</p>
                    </div>
                    <p className="font-semibold">{mechanic.bio}</p>
                  </CardContent>
                  </Card>
                )
                })
              )}
            </div>
            </>
        )}

        {currentStep === "mechanicDetails" && (
          <>
          <div className="flex justify-between gap-4 items-center">
            <p className="text-3xl font-semibold pb-4">{selectedUser?.firstName}&apos;s Services</p>
            <div className="flex justify-between gap-4 items-center">
              <StarIcon size={24} />
              <p className="font-bold text-xl">{selectedMechanic.rating}</p>
            </div>
          </div>
            <div className="grid gap-4">
              <RadioGroup defaultValue={mechanicServices?.servicesOffered[0]}>
                {mechanicServices?.servicesOffered.map((service, index) => (
                  <div key={index} className="flex items-center border space-x-2 justify-between p-2 rounded-md border-slate-400">
                    <div className="flex items-center justify-between gap-2">
                      <RadioGroupItem value={service} id={`service-${index}`} />
                      <Label htmlFor={`service-${index}`} className="text-xl">{service}</Label>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`service-${index}`} className="text-xl">${(service as any).price || ""}</Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              <div className="relative">
                <div className="flex place-self-center justify-between items-center bottom-6 rounded-t-md gap-2 p-2 bg-foreground text-white w-[98%]">
                  <div className="flex gap-2 text-lg">
                    <p>Account balance: </p>
                    {accountBalance === 0 ? (
                      <p className="font-bold">${accountBalance} </p>
                    ) : (
                      <p className="font-semibold">${accountBalance}</p>
                    )}
                  </div>
                  {/* <DepositModal /> */}
                </div>
                <Button
                  onClick={() => setCurrentStep("mechanicWatch")}
                  variant={"secondary"}
                  disabled={accountBalance < 9}
                  className="w-[-webkit-fill-available]"
                >
                  Submit request
                </Button>
              </div>
            </div>
          </>
        )}

        {currentStep === "mechanicWatch" && (
          <>
          {/* TODO: add variance to h1 tag like realtime changes */}
            <h1 className="p-1 bg-slate-600 text-white rounded-md w-fit">
              Waiting for mechanic to accept
            </h1>
            <div className="flex justify-between my-4">
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
                  <div className="flex items-center gap-2">
                    <Star size={24} />
                    <p className="text-xl">{selectedMechanic.rating} (345)</p>
                  </div>
                </div>
                </div>
              <div className="grid gap-4">
                <Image
                  src="/images/maps.png"
                  alt="car"
                  width={100}
                  height={100}
                  className="rounded-lg border-2 w-full"
                />
                <div className="flex gap-4 text-xs">
                  <span>Toyota Camry</span>
                  <span>Plate number: 1234</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button
                onClick={() => setCurrentStep("providePin")}
                variant={"secondary"}
              >
                Complete request
              </Button>
              <Button
                onClick={() => handleDashboardChangeOpeningChat()}
                variant={"default"}
              >
                <MessageCircleMoreIcon />
              </Button>
            </div>
          </>
        )}

        {currentStep === "chat" && (
          <>
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
          </>
        )}

        {currentStep === "providePin" && (
          <>
            <h1 className="p-1 bg-slate-600 text-white rounded-md w-fit">
              Provide pin
            </h1>
            <Input className="my-5" placeholder="1234" />
            <div>
              <Button
                onClick={() => setCurrentStep("review")}
                className="bg-slate-500 text-white rounded-3xl"
                variant={"secondary"}
              >
                Complete request
              </Button>
            </div>
          </>
        )}

        {currentStep === "review" && (
          <>
            <h1 className="p-1 bg-slate-600 text-white rounded-md w-fit">
              Review
            </h1>
            <div className="flex gap-4 my-4">
              <DynamicAvatar src={"/images/download.jpeg"} fallbackText="SC" />
              <div>
                <p>
                  {selectedUser.firstName}
                </p>
                <p>
                  {selectedUser.lastName}
                </p>
                <Star size={24} />
              </div>
            </div>
            <Input className="my-5" placeholder="Leave a review" />
            <div>
              <Button
                onClick={() => setCurrentStep("mechanicList")}
                className="bg-slate-500 text-white rounded-3xl"
                variant={"secondary"}
              >
                Submit
              </Button>
            </div>
          </>
        )}
      </MechanicListCard>
    </HalfSheet>
  )
}
