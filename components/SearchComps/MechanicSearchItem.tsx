import React from 'react'
import { CommandItem } from "@/components/ui/command";
import useUserFirstName from '@/hooks/useUserFirstName';
import { Mechanic, Prisma, ServiceType } from '@prisma/client';
import useUserProfilePic from '@/hooks/useUserProfilePic';
import Image from 'next/image';

interface MechanicLocation extends Prisma.JsonObject {
  latitude: number;
  longitude: number;
}

interface ExtendedMechanic extends Omit<Mechanic, 'location' | 'servicesOffered'> {
  isAvailable: boolean;
  location: MechanicLocation | null;
  serviceArea: string;
  servicesOffered: ServiceType[];
  user?: string;
  rating: number | null;
  subscriptionPlan?: string | null;
}

type mechanicSearchItemProps = {
  mechanic: ExtendedMechanic;
  setSearchQuery: any;
  onSelect: (mechanicId: string) => void;
};

export const MechanicSearchItem = ({
  mechanic,
  setSearchQuery,
  onSelect
}: mechanicSearchItemProps) => {
  // If mechanic.user is already a string (name), use it directly
  // Otherwise fetch the name using the hook
  const userName = typeof mechanic.user === 'string' && mechanic.user 
    ? mechanic.user 
    : useUserFirstName(mechanic.userId);
    
  const userPic = useUserProfilePic(mechanic.userId);

  return (
    <CommandItem
      value={mechanic.id}
      onSelect={() => {
        setSearchQuery(userName);
        onSelect(mechanic.id);
      }}
    >
      <div className="flex items-center gap-2">
        <Image 
          src={userPic ?? "/logo.png"} 
          alt={`${userName}'s profile`} 
          width={32} 
          height={32} 
          className="w-8 h-8 rounded-full object-cover" 
        />
        <div>
          <p className="font-medium">{userName}</p>
          {mechanic.subscriptionPlan?.toLowerCase() === 'pro' && (
            <span className="text-xs text-primary">PRO</span>
          )}
        </div>
      </div>
    </CommandItem>
  );
};
