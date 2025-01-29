import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { MechanicListCard } from "@/components/layouts/MechanicListCard.Layout"
import { HalfSheet } from "@/components/ui/HalfSheet"
import { Car, MapPin, MoveLeftIcon, Star, StarIcon, User, User2Icon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MessageCircleMoreIcon } from "../../Animated/message-circle-more"
import { DynamicAvatar } from "../../DynamicAvatar/DynamicAvatar"
import { Mechanic, Message } from "@prisma/client"
import { DepositModal } from "@/components/Modal/DepositModal"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { createMessageAction } from "@/app/actions/chats/create-message.action"

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
  serviceArea?: UserCoordinates
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
  const [messages, setMessages] = useState([] as any)
  // state for user and mechanic messages (fetching from db)
  const [userMessages, setUserMessages] = useState<Message[]>([])
  const [mechanicMessages, setMechanicMessages] = useState<Message[]>([])
  const { user: currentUser } = useUser()
  // if theres no mechanic in range increase mile radius
  const [rangeValue, setRangeValue] = useState(0)
  // services offered by mechanic
  const [mechanicServices, setMechanicServices] = useState<Mechanic | null>(
    null
  )
  // Loading state/ui related
  const [isLoading, setIsLoading] = useState(false)

  const servicesPerMechanic = selectedMechanic?.servicesOffered

  useEffect(() => {
    if (selectedMechanic) {
      setMechanicServices(selectedMechanic)
    }
  }, [selectedMechanic])

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const usersChat = await getChatByUserIdAction(currentUser!.id)
        if (usersChat) {
          setChatId(parseInt(usersChat.chatId))
        } else {
          return null
        }

        if (chatId) {
          const Chat = await getChatAction(chatId)
          if (Chat) {
            setChatId(Chat.id)
            const subToMessages = async () => {
              await subscribeToMessages().then((data) => {
                console.log("Data: ", data)
                setMessages(data)
              })
            }
            subToMessages()
          }
        } else {
          return null
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchChat()
  }, [messages, chatId, currentUser])

  // TODO: Clean this function of Clientmap
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch("/api/mapbox", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
  //         },
  //         // body: JSON.stringify({
  //         //   service: "driving",
  //         //   coordinates: [-74.5, 30],
  //         // }),
  //       })
  //       if (!response.ok) {
  //         throw new Error("Network response was not ok")
  //       }
  //       const data = await response.json()
  //       console.log(data)
  //     } catch (error) {
  //       console.error("Fetch error:", error)
  //     }
  //   }

  //   fetchData()
  // }, [])

  const createChat = async (userId: string, mechanicId: string) => {
    try {
      const chat = await createChatWithUserAction(userId, mechanicId)
      if (chat) {
        if (chat.chat?.id !== undefined) {
          setChatId(chat.chat.id)
        }
        return chat
      }
      return null
    } catch (error) {
      throw new Error(`Error creating chat: ${error}`)
    }
  }

  const createNewMessage = async (message: Message) => {
    try {
      await createMessageAction(message.userId, message.chatId, message.content)
    } catch (error) {
      throw new Error(`Error sending message: ${error}`)
    }
  }

  const handleNewMessage = async () => {
    setMessages([
      {
        chatId: 1,
        authorId: currentUser!.id,
        content: "Hello, how can I help you?",
        userId: selectedMechanic!.id, // TODO: This can be dinamic for both users
        id: 0,
      },
    ])
    // createNewMessage(messages)
  }

  const handleDashboardChangeAndUserPick = (Mechanic: any) => {
    setSelectedMechanic(Mechanic)
    setCurrentStep("mechanicDetails")
  }

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
            {mechanics.filter((mechanic) => mechanic.availabilityStatus === true).length > 0 ? (
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
                .filter((mechanic) => mechanic.availabilityStatus === true)
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
                  <DepositModal />
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
                onClick={() => setCurrentStep("chat")}
                variant={"default"}
                disabled={accountBalance < 9}
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
                    key={msg.id}
                    className="h-auto w-auto flex flex-col items-start justify-start"
                  >
                    <p className="bg-slate-600 text-white p-2 rounded-lg">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {userMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="place-self-center h-auto w-24 flex flex-col items-center justify-center"
                  >
                    <p className="bg-black text-white p-1 rounded-lg">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {!chatId && (
                  <Button
                    onClick={() => {
                      if (currentUser && selectedUser) {
                        // createChat(currentUser.id, selectedMechanic.id)
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
                      // onChange={() => handleNewMessage()}
                    />
                    <Button
                      variant={"secondary"}
                      // onClick={() => createNewMessage(messages[0])}
                    >
                      Send
                    </Button>
                  </div>
                )}
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
