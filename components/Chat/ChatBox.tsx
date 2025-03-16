"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMessageAction } from "@/app/actions/chats/create-message.action";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action";
import { useUser } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";
import { MessageCircle } from "lucide-react";
import { getChatMessages } from "@/app/actions/chats/get-chat-messages.action";
import { supabase } from "@/utils/supabase/client";
import { getUserToken } from "@/app/actions/getUserToken";
import { Message as MessageType, User, UserRole } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "../loader";
import { Message } from "./Message";

type ChatBoxProps = {
  userId: string;
  divClassName: string;
  buttonClassName?: string;
};

export const ChatBox = ({ userId, divClassName, buttonClassName }: ChatBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const toast = useToast();

  // Convert Clerk user to Prisma User type
  useEffect(() => {
    if (clerkUser) {
      // Create a User object that matches Prisma's User type
      const prismaUser: User = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        role: null as UserRole | null,
        createdAt: new Date(),
        updatedAt: new Date(),
        profileImage: clerkUser.imageUrl,
        dob: null,
        phoneNumber: null,
        stripeCustomerId: null,
        stripeConnectId: null,
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: null,
        stripeSubscriptionPlan: null,
        firstTransactionId: null,
        secondTransactionId: null,
        // Empty object for Json type
        currentLocation: {}, 
        // Array of strings
        documentsUrl: [], 
        notificationsEmailEnabled: true,
        stripeSubEndingDate: null
      };
      setCurrentUser(prismaUser);
    } else {
      setCurrentUser(null);
    }
  }, [clerkUser]);

  // Fetch messages for a given chat ID
  const fetchMessages = async (chatId: number) => {
    try {
      setLoadingMessages(true);
      const messages = await getChatMessages(chatId);
      if (messages?.messages) {
        setMessages(messages.messages as MessageType[]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch chat by user ID
  const fetchChat = async () => {
    try {
      const chat = await getChatByUserIdAction(userId);
      if (chat?.chat?.id) {
        setChatId(chat.chat.id);
        await fetchMessages(chat.chat.id);
      }
    } catch (error) {
      console.error("Error fetching or creating chat:", error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!currentUser || !chatId || !inputValue.trim()) {
      toast.toast({
        title: "Missing user or chat",
        description: "An error occurred while sending your message",
      });
      return;
    }

    try {
      const newMessage = await createMessageAction(
        currentUser.id,
        chatId,
        inputValue.trim()
      );
      if (newMessage.message) {
        setInputValue(""); // Clear input after sending
      }
    } catch (error) {
      toast.toast({
        title: "Error sending message",
        description: "An error occurred while sending your message",
      });
      console.error("Error sending message:", error);
    }
  };

  // Handle button click to open/close chat
  const handleButtonClick = async () => {
    setIsOpen(!isOpen);
  };

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId) {
      fetchChat();
    }
    const subscribeToRealtime = async () => {
      const token = await getUserToken();
      if (!token) {
        console.error("No token available");
        return;
      }

      supabase.realtime.setAuth(token);
      channelRef.current = supabase
        .channel("realtime:public:messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "Message" },
          (payload: { new: MessageType }) => {
            // Avoid adding duplicate messages
            if (!messages.some((msg) => msg.id === payload.new.id)) {
              setMessages((prev) => [...prev, payload.new]);
            }
          }
        )
        .subscribe();

      return () => {
        channelRef.current?.unsubscribe();
      };
    };

    subscribeToRealtime();
  }, [chatId, messages]);

  return (
    <div className={divClassName}>
      {chatId && (
        <Button
          onClick={handleButtonClick}
          className={"rounded-full p-3 bg-slate-600 text-white z-[990]" + (buttonClassName ? ` ${buttonClassName}` : "")}
        >
          <MessageCircle size={24} />
        </Button>
      )}
      {isOpen && (
        <div
          className={`fixed inset-0 z-[99] top-24 bg-background p-4 flex flex-col overflow-y-scroll ${
            isOpen ? "translate-y-0" : "translate-y-2/4 opacity-0"
          } transition-transform duration-300 ease-in-out`}
        >
          {chatId && (
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4 py-4">
                <h1 className="bg-secondary text-secondary-foreground p-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                  Chat
                </h1>
                <Button onClick={() => setIsOpen(false)}>Close</Button>
              </div>
              <Separator />
              <div className="grid gap-4 my-4">
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} currentUser={currentUser} />
                ))}
                <div className="flex gap-4 my-4">
                  <Input
                    placeholder="Type a message"
                    value={inputValue}
                    onChange={(ev) => setInputValue(ev.target.value)}
                  />
                  <Button
                    variant="secondary"
                    disabled={!chatId}
                    onClick={handleSendMessage}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
          {chatId === null && <Loader title="Loading Chat!" />}
          {loadingMessages && <Loader title="Loading Messages!" />}
        </div>
      )}
    </div>
  );
};
