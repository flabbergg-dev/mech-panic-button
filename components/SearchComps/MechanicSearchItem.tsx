import React from 'react'
import { CommandItem } from "@/components/ui/command";
import useUserFirstName from '@/hooks/useUserFirstName';
import { Mechanic } from '@prisma/client';

type mechanicSearchItemProps = {
  mechanic: Mechanic;
  setSearchQuery: any;
  onSelect: (mechanicId: string) => void;
};

export const MechanicSearchItem = ({
  mechanic,
  setSearchQuery,
  onSelect
}: mechanicSearchItemProps) => {
  const useUserName = useUserFirstName(mechanic.userId);

  return (
    <CommandItem
      value={mechanic.id}
      onSelect={() => {
        setSearchQuery(useUserName);
        onSelect(mechanic.id);
      }}
    >
      {useUserName}
    </CommandItem>
  );
};
