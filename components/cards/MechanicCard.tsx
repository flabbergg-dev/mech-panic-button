import React from 'react'
import {motion} from 'framer-motion'
import { Mechanic as PrismaMechanic, ServiceStatus, ServiceType, Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation"
import useUserFirstName from '@/hooks/useUserFirstName';
import useUserProfileImage from '@/hooks/useUserProfilePic';

interface MechanicLocation extends Prisma.JsonObject {
  latitude: number;
  longitude: number;
}

interface ExtendedMechanic extends Omit<PrismaMechanic, 'location' | 'servicesOffered'> {
  isAvailable: boolean;
  location: MechanicLocation | null;
  serviceArea: string;
  servicesOffered: ServiceType[];
  user?: string;
  rating: number | null;
}

interface BookingFormData {
  mechanic: ExtendedMechanic | null;
  selectedDate: Date | null;
  name: string | null;
  email: string | null;
}

interface MechanicCardProps {
  index: number;
  mechanic: ExtendedMechanic;
  formData: BookingFormData;
  setFormData: (data: BookingFormData) => void;
  onSelect: (id: string) => void;
};

export const MechanicCard = ({
  index,
  mechanic,
  formData,
  setFormData,
  onSelect
}: MechanicCardProps) => {
  const firstName = useUserFirstName(mechanic.userId);
  const profileImage = useUserProfileImage(mechanic.userId);
  const router = useRouter()
  const isSelected = formData.mechanic?.id === mechanic.id;

  const handleSelect = () => {
    setFormData({ ...formData, mechanic });
    onSelect(mechanic.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="w-full"
    >
      <Card
        className={`relative overflow-hidden transition-all ${
          isSelected ? "border-2 border-primary" : "border border-border"
        }`}
        onClick={handleSelect}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={profileImage ?? undefined} />
                <AvatarFallback>{firstName?.charAt(0) ?? 'M'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{mechanic.user}</h3>
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {mechanic.rating ?? "New"}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={mechanic.isAvailable ? "default" : "destructive"}>
              {mechanic.isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Services:</strong>{" "}
              {mechanic.servicesOffered.join(", ")}
            </p>
            {mechanic.rating && (
              <p className="text-sm">
                <strong>Rating:</strong> {mechanic.rating.toFixed(1)}/5
              </p>
            )}
            <p className="text-sm text-muted-foreground">{mechanic.bio}</p>
            {/* {mechanic.location && (
              <p className="text-sm text-muted-foreground">
                Service Area: {mechanic.serviceArea}
              </p>
            )} */}
            <motion.a
              className="bg-secondary/80 text-black dark:text-white px-4 py-1.5 rounded-xl text-sm font-medium mr-2"
              href={`/dashboard/profileView/${mechanic.userId}`}
            >
              View Profile
            </motion.a>
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={handleSelect}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
