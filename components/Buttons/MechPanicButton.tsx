import React, { useEffect, useRef, useState } from "react"
import { ApproveButton } from "@/components/ui/approveButton"
import { Button } from "@/components/ui/button"

import { ModalMapComp } from "@/components/MapBox/ModalMapComp"
import { Modal } from "@/components/Modal/Modal"
import { CheckIcon, ChevronRightIcon, WrenchIcon } from "lucide-react"
import { ServiceStatus, ServiceType } from "@prisma/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { createServiceRequestAction } from "@/app/actions/serviceRequestAction"

const getUserLocation = (
  setUserCords: React.Dispatch<
    React.SetStateAction<{ latitude: number; longitude: number }>
  >
) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location: ", error)
      }
    )
  } else {
    console.error("Geolocation is not supported by this browser.")
  }
}

type MechPanicButtonProps = {
  user: any
  onRequestCreated?: () => void
}

export const MechPanicButton = ({ user, onRequestCreated }: MechPanicButtonProps) => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const [userCords, setUserCords] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 0,
    longitude: 0,
  })

  const [adjustedLocation, setAdjustedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null)

  const [selectedService, setSelectedService] = useState<ServiceType>(ServiceType.DIAGNOSTIC)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    getUserLocation(setUserCords)
  }, [])

  const handleLocationUpdate = (newLocation: { latitude: number; longitude: number }) => {
    setAdjustedLocation(newLocation)
  }

  const handleLocationConfirm = () => {
    setIsLocationModalOpen(false)
    setIsServiceTypeModalOpen(true)
  }

  const handleServiceRequest = async () => {
    try {
      setIsSubmitting(true)
      const finalLocation = adjustedLocation || userCords

      // Validate user and location before making request
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      if (!finalLocation || !finalLocation.latitude || !finalLocation.longitude) {
        throw new Error("Location not available")
      }

      console.log('Sending service request with:', {
        userId: user.id,
        location: finalLocation,
        serviceType: selectedService,
        status: ServiceStatus.REQUESTED
      });

      const result = await createServiceRequestAction({
        userId: user.id,
        location: {
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude
        },
        serviceType: selectedService,
        status: ServiceStatus.REQUESTED
      })

      console.log('Service request result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create service request')
      }

      setIsServiceTypeModalOpen(false)
      if (onRequestCreated) {
        onRequestCreated()
      }
    } catch (error) {
      console.error("Failed to create service request:", error)
      alert(error instanceof Error ? error.message : "Failed to create service request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const serviceTypeOptions = [
    { value: ServiceType.DIAGNOSTIC, label: "Diagnostic", description: "General vehicle inspection and problem diagnosis" },
    { value: ServiceType.BATTERY_SERVICE, label: "Battery Service", description: "Battery testing, jump-start, or replacement" },
    { value: ServiceType.TIRE_SERVICE, label: "Tire Service", description: "Flat tire, tire change, or pressure check" },
    { value: ServiceType.GENERAL_MAINTENANCE, label: "General Maintenance", description: "Basic maintenance and minor repairs" },
  ]

  return (
    <>
      <button 
        className="btn-class-name" 
        onClick={() => setIsLocationModalOpen(true)}
        disabled={isSubmitting}
      >
        <span className="back">
          <WrenchIcon className="w-6 h-6" />
        </span>
        <span className="front">
          <WrenchIcon className="w-6 h-6" />
        </span>
      </button>
      <style>
        {`
        .btn-class-name {
          --primary: 255, 90, 120;
          --secondary: 150, 50, 60;
          width: 100px;
          height: 100px;
          border: none;
          outline: none;
          cursor: pointer;
          user-select: none;
          touch-action: manipulation;
          outline: 10px solid rgb(var(--primary), 0.5);
          border-radius: 100%;
          position: relative;
          transition: 0.3s;
        }

        .btn-class-name .back {
          background: rgb(var(--secondary));
          border-radius: 100%;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }

        .btn-class-name .front {
          background: linear-gradient(
            0deg,
            rgba(var(--primary), 0.6) 20%,
            rgba(var(--primary)) 50%
          );
          box-shadow: 0 0.5em 1em -0.2em rgba(var(--secondary), 0.5);
          border-radius: 100%;
          position: absolute;
          border: 1px solid rgb(var(--secondary));
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.2rem;
          font-weight: 600;
          font-family: inherit;
          transform: translateY(-15%);
          transition: 0.15s;
          color: rgb(var(--secondary));
        }

        .btn-class-name:active .front {
          transform: translateY(0%);
          box-shadow: 0 0;
        }
        `}
      </style>
      <Modal
        dialogText="Confirm Your Location"
        buttonText=""
        buttonActive={false}
        isOpen={isLocationModalOpen}
        variant="default"
        className="sm:max-w-[420px]"
      >
        <div className="flex flex-col gap-4" ref={modalRef}>
          <div className="w-[-webkit-fill-available] h-[300px] border-2 rounded-md border-slate-300 mb-4">
            <ModalMapComp 
              userCords={userCords} 
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setIsLocationModalOpen(false)}
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

      {/* Service Type Selection Modal */}
      <Modal
        dialogText="Select Service Type"
        buttonText=""
        buttonActive={false}
        isOpen={isServiceTypeModalOpen}
        variant="default"
        className="sm:max-w-[500px]"
      >
        <div className="flex flex-col gap-6 py-4">
          <RadioGroup
            value={selectedService}
            onValueChange={(value) => setSelectedService(value as ServiceType)}
            className="gap-4"
          >
            {serviceTypeOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="grid gap-1 leading-none"
                >
                  <div className="text-sm font-medium leading-none">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setIsServiceTypeModalOpen(false)}
          >
            Back
          </Button>
          <Button
            onClick={handleServiceRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Requesting..." : "Request Service"}
          </Button>
        </div>
      </Modal>

      <style jsx>{`
        .btn-class-name {
          position: relative;
          padding: 1em 1.5em;
          border: none;
          background-color: transparent;
          cursor: pointer;
          outline: none;
          font-size: 18px;
          margin: 1em 0.8em;
        }

        .btn-class-name .front {
          display: block;
          padding: 0.75rem;
          border-radius: 50%;
          background: rgb(var(--secondary));
          color: rgb(var(--primary));
          transform: translateY(-4px);
        }

        .btn-class-name .back {
          display: block;
          padding: 0.75rem;
          border-radius: 50%;
          background: rgb(var(--primary));
          color: rgb(var(--secondary));
        }

        .btn-class-name:active .front {
          transform: translateY(0%);
          box-shadow: 0 0;
        }
      `}</style>
    </>
  )
}
