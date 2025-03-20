import React from 'react'
import { Modal } from './Modal'
import { Button } from '@/components/ui/button'
import { ApproveButton } from "@/components/ui/approveButton"
import { ChevronRightIcon, CheckIcon } from 'lucide-react'
import { ModalMapComp } from '@/components/MapBox/ModalMapComp'

export const LocationModal = ({
  isOpen,
  onOpenChange,
  userCords,
  onLocationUpdate,
  modalRef,
  adjustedLocation,
  handleLocationConfirm
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userCords: { latitude: number; longitude: number };
  onLocationUpdate: (newLocation: { latitude: number; longitude: number }) => void;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  modalRef: any;
  adjustedLocation: { latitude: number; longitude: number } | null;
  handleLocationConfirm: () => void;
}) => {
  return (
    <Modal
    dialogText="Confirm Your Location"
    buttonText=""
    buttonActive={false}
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    variant="default"
    className="sm:max-w-[500px] mx-auto lg:mx-0"
    side="bottom"
  >
    <div className="flex flex-col gap-4" ref={modalRef}>
      <div className="w-[-webkit-fill-available] h-[300px] border-2 rounded-md border-slate-300 mb-4">
        <ModalMapComp
          userCords={userCords}
          onLocationUpdate={onLocationUpdate}
        />
      </div>
    </div>
    <div className="flex justify-between md:gap-0 gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <ApproveButton
        buttonColor="#000000"
        subscribeStatus={false}
        initialText={
          <span className="group inline-flex items-center">
            {adjustedLocation ? "Location adjusted" : "This is my location"}{" "}
            <ChevronRightIcon className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        }
        changeText={
          <span className="group inline-flex items-center">
            {adjustedLocation ? "Using adjusted location" : "Using current location"}{" "}
            <CheckIcon className="ml-1 size-4" />
          </span>
        }
        onClick={handleLocationConfirm}
      />
    </div>
  </Modal>
  )
}
