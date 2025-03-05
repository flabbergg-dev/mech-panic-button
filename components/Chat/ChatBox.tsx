"use client";

import { useEffect, useRef, useState } from "react";
import { DynamicAvatar } from "@/components/DynamicAvatar/DynamicAvatar";
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
import useUserFirstName from "@/hooks/useUserFirstName";
import { Message } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "../loader";

type ChatBoxProps = {
  userId: string;
};

export const ChatBox = ({ userId }: ChatBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { user: currentUser } = useUser();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const toast = useToast();
  const useMechanicFirstNameHook = useUserFirstName();
  const useUserFirstNameHook = useUserFirstName(userId);

  // Fetch messages for a given chat ID
  const fetchMessages = async (chatId: number) => {
    try {
      setLoadingMessages(true);
      const messages = await getChatMessages(chatId);
      if (messages?.messages) {
        setMessages(messages.messages as Message[]);
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
    fetchChat();
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
          (payload: { new: Message }) => {
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
    <div>
      {chatId && (
      <Button
        onClick={handleButtonClick}
        className="rounded-full p-2 bg-slate-600 text-white z-[990]"
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
                  <div
                    key={msg.id}
                    className={`h-auto gap-4 w-fit flex flex-row items-center justify-center ${
                      msg.authorId === currentUser?.id
                        ? "place-self-end"
                        : "place-self-start"
                    }`}
                  >
                    {msg.authorId !== currentUser?.id && (
                      <DynamicAvatar
                        className="border-2"
                        fallbackText={
                          useMechanicFirstNameHook
                            ? useMechanicFirstNameHook.slice(0, 2)
                            : "NA"
                        }
                      />
                    )}
                    <p className="text-white bg-slate-600 p-2 rounded-lg">
                      {msg.content}
                    </p>
                    {msg.authorId === currentUser?.id && (
                      <DynamicAvatar
                        className="border-2"
                        fallbackText={
                          useUserFirstNameHook
                            ? useUserFirstNameHook.slice(0, 2)
                            : "NA"
                        }
                      />
                    )}
                  </div>
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
