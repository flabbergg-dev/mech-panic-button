import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { MechanicSearchItem } from './MechanicSearchItem';
import { Mechanic, Prisma, ServiceType } from '@prisma/client';

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

type mechanicSearchProps = {
  mechanicList: ExtendedMechanic[];
  onSelect: (mechanicId: string) => void;
};

export const MechanicSearch = ({ mechanicList, onSelect }: mechanicSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Search className="mr-2 h-4 w-4" />
            {searchQuery || "Search mechanics..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search mechanics..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No mechanics found.</CommandEmpty>
              <CommandGroup>
                {mechanicList.length > 0 ? (
                  mechanicList.map((mechanic, index) => (
                    <MechanicSearchItem
                      key={index}
                      mechanic={mechanic}
                      setSearchQuery={setSearchQuery}
                      onSelect={onSelect}
                    />
                  ))
                ) : (
                  <CommandItem disabled>No mechanics available</CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
