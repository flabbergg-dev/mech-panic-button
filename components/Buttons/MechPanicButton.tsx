import React, { useEffect, useState } from "react"
import { ApproveButton } from "@/components/ui/approveButton"
import { Button } from "@/components/ui/button"
// import { createServiceRequestAction } from "app/actions/serviceRequestAction"
import { ModalMapComp } from "@/components/MapBox/ModalMapComp"
import { Modal } from "@/components/Modal/Modal"
import { CheckIcon, ChevronRightIcon, Pin, PinIcon } from "lucide-react"

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
        // console.log("Latitude: ", position.coords.latitude)
        // console.log("Longitude: ", position.coords.longitude)
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
}

export const MechPanicButton = ({ user }: MechPanicButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [userCords, setUserCords] = useState({
    latitude: 0,
    longitude: 0,
  })
  useEffect(() => {
    getUserLocation(setUserCords)
  }, [])

  const handleOnClick = async () => {
    // await createServiceRequestAction({
    //   userId: user.id,
    //   serviceType: "mechanic",
    //   description: "Mechanic needed urgently",
    //   location: [userCords.latitude.toString(), userCords.longitude.toString()],
    //   status: "IN_PROGRESS",
    // })
  }

  return (
    <>
      <button className="btn-class-name" onClick={() => setIsOpen(!isOpen)}>
        <span className="back"></span>
        <span className="front"></span>
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
        dialogText="User Location"
        buttonText=""
        buttonActive={false}
        isOpen={isOpen}
        variant="default"
        className=""
      >
        <div className="flex flex-col gap-4">
          {/* responsive mapbox for users to see their location and proceed */}
          <div className="w-[-webkit-fill-available] h-[300px] border-2 rounded-md border-slate-300 mb-4 flex flex-col items-center justify-center">
            {/* <PinIcon className="w-6 h-6" /> */}
            {/* <span className="text-sm">in progress</span> */}
            <ModalMapComp userCords={userCords} />
          </div>
        </div>
        <div className="flex justify-between">
          <ApproveButton
            buttonColor="#000000"
            buttonTextColor="#ffffff"
            subscribeStatus={false}
            initialText={
              <span className="group inline-flex items-center">
                Is this your location{" "}
                <ChevronRightIcon className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            }
            changeText={
              <span className="group inline-flex items-center">
                <CheckIcon className="mr-2 size-4" />
                Approved{" "}
              </span>
            }
            onClick={handleOnClick}
          />
          <Button onClick={() => setIsOpen(false)} className="">
            Close
          </Button>
        </div>
      </Modal>
    </>
  )
}
