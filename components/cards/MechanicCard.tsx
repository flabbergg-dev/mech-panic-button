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
import useCarInformation from '@/hooks/useCarInformation';

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
  subscriptionPlan?: string | null;
}

interface BookingFormData {
  mechanic: ExtendedMechanic | null;
  selectedDate: Date | null;
  name: string | null;
  email: string | null;
}

interface MechanicCardProps {
  mechanic: ExtendedMechanic;
  formData: BookingFormData;
  setFormData: (data: BookingFormData) => void;
  onSelect: (id: string) => void;
};

export const MechanicCard = ({
  mechanic,
  formData,
  setFormData,
  onSelect
}: MechanicCardProps) => {
  const firstName = useUserFirstName(mechanic.userId);
  const profileImage = useUserProfileImage(mechanic.userId);
  const isSelected = formData.mechanic?.id === mechanic.id;
  const userCarInfo = useCarInformation(mechanic.userId);
  const handleSelect = () => {
    setFormData({ ...formData, mechanic });
    onSelect(mechanic.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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
                <AvatarImage src={profileImage ?? undefined} alt={firstName || 'Mechanic'} />
                <AvatarFallback>{firstName?.charAt(0) ?? 'M'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{firstName || mechanic.user || 'Mechanic'}</h3>
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {mechanic.rating ? mechanic.rating.toFixed(1) : "New"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={mechanic.isAvailable ? "default" : "destructive"}>
                {mechanic.isAvailable ? "Available" : "Unavailable"}
              </Badge>
              {mechanic.subscriptionPlan?.toLowerCase() === 'pro' && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground">PRO</Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Services:</strong>{" "}
              {Array.isArray(mechanic.servicesOffered) && mechanic.servicesOffered.length > 0
                ? mechanic.servicesOffered.map(service => 
                    typeof service === 'string' 
                      ? service.replace(/_/g, ' ') 
                      : JSON.stringify(service)
                  ).join(", ")
                : "No services listed"}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">{mechanic.bio || "No bio available"}</p>
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                asChild
              >
                <a href={`/dashboard/profileView/${mechanic.userId}`}>View Profile</a>
              </Button>
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={handleSelect}
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
