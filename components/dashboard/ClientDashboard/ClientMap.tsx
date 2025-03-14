import { useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/utils/supabase"
import { LoaderIcon } from "lucide-react"
import type { ServiceRequest } from "@prisma/client"
import MapboxDisplay from "@/components/MapBox/MapboxDisplay"

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
}

interface UserCoordinates {
  latitude: number;
  longitude: number;
}

interface MechanicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Mechanic";
  profileImage?: string;
  phoneNumber?: string | null;
  documentsUrl?: string[];
  dob?: string;
  currentLocation?: UserCoordinates;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClientMapProps {
  selectedUser: {
    id: string;
    location?: UserCoordinates;
  };
  selectedMechanic: MechanicUser;
  serviceRequest?: ServiceRequest;
}

export default function ClientMap({
  selectedUser,
  selectedMechanic,
  serviceRequest
}: ClientMapProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Handle route calculation with proper types
  const handleRouteCalculated = (duration: number, steps: unknown[], distance: number) => {
    if (duration && distance) {
      const durationMinutes = Math.round(duration / 60);
      const distanceKm = Math.round(distance / 1000);
      setEstimatedTime(durationMinutes);
      setEstimatedDistance(distanceKm);
    }
  };

  // Initialize real-time chat with proper cleanup
  useEffect(() => {
    if (!selectedUser?.id || !selectedMechanic?.id) return;

    const channel = supabase.channel(`chat-${selectedUser.id}-${selectedMechanic.id}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          ...payload,
          timestamp: Date.now()
        }]);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [selectedUser?.id, selectedMechanic?.id]);

  // Send message with proper error handling
  const sendMessage = async () => {
    if (!newMessage.trim() || !channelRef.current) return;

    try {
      await channelRef.current.send({
        type: "broadcast",
        event: "message",
        payload: {
          sender: selectedUser.id,
          message: newMessage.trim()
        }
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <MapboxDisplay
          center={selectedUser?.location}
          markers={[
            {
              location: selectedUser?.location || { latitude: 0, longitude: 0 },
              color: "blue",
              popupText: "You are here"
            },
            {
              location: selectedMechanic?.currentLocation || { latitude: 0, longitude: 0 },
              color: "red",
              popupText: "Mechanic location"
            }
          ]}
          showRoute={true}
          followMechanic={true}
          onRouteCalculated={handleRouteCalculated}
        />
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col gap-2">
          {estimatedTime && estimatedDistance && (
            <div className="text-sm text-gray-600">
              <p>Estimated arrival: {estimatedTime} minutes</p>
              <p>Distance: {estimatedDistance} km</p>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded ${
                  msg.sender === selectedUser.id ? "bg-blue-100 ml-auto" : "bg-gray-100"
                }`}
              >
                {msg.message}
              </div>
            ))}
          </div>
          {isConnected && (
            <div className="flex gap-2 mt-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <p>Connection Status:</p>
          {isConnected ? (
            <span className="text-green-500">Connected</span>
          ) : (
            <span className="text-red-500">Disconnected</span>
          )}
        </div>
      </div>
    </div>
  );
}
