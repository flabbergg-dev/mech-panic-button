"use client"

import React, { useEffect, useState } from "react"
import {
  getAvailableMechanicsListAction,
} from "@/app/actions/mechanic/get-available-mechanics-list.action"
import {
  getMechanicByIdAction,
} from "@/app/actions/mechanic/get-mechanic-by-id.action"
import { getAllUsersAction } from "@/app/actions/user/get-all-users.action"
import { getUserAction } from "@/app/actions/user/get-user.action"
import { useUserRole } from "@/hooks/use-user-role"

import { MapboxMapComp } from "../../MapBox/MapboxMapComp"
import { ClientMap } from "../ClientDashboard/ClientMap"
import { Mechanic, User } from "@prisma/client"

const getUserLocation = (
  setUserCords: React.Dispatch<React.SetStateAction<UserCoordinates>>
) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        console.info("Latitude: ", position.coords.latitude)
        console.info("Longitude: ", position.coords.longitude)
      },
      (error) => {
        console.error("Error getting location: ", error)
      }
    )
  } else {
    console.error("Geolocation is not supported by this browser.")
  }
}

interface UserCoordinates {
  latitude: number
  longitude: number
}

interface MechanicUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "Mechanic"
  profileImage?: string
  phoneNumber?: string | null
  documentsUrl?: string[]
  dob?: string
  currentLocation?: UserCoordinates
  serviceArea?: UserCoordinates
  createdAt?: Date
  updatedAt?: Date
  props?: any
  isMechanic?: boolean
  isCustomer?: boolean
}

type MechanicMarker = {
  id: string
  userId: string
  currentLocation: UserCoordinates
}

type MechanicMarkers = MechanicMarker[] // Array of MechanicMarker

export const MapDashboard = () => {
  // const pathname = usePathname()
  // const id = pathname.split("/").pop()
  // console.info("id: ", id)
  // user id to used to interact with functions with
  const [userCords, setUserCords] = useState({
    latitude: 0,
    longitude: 0,
  })
  const { userRole } = useUserRole()
  const [selectedMechanic, setSelectedMechanic] =
    useState<Mechanic | null>(null)
  // This state handles the selected mechanics information (as User) and services (as Mechanic)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  // This state handles the list of available mechanics on dashboard
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [mechanicMarkers, setMechanicMarkers] = useState<MechanicMarkers>([
    {
      id: "",
      userId: "",
      currentLocation: {
        latitude: 0,
        longitude: 0,
      },
    },
  ])

  const [mechanicUsers, setMechanicUsers] = useState<MechanicUser[]>([])

  const fetchSingleMechanic = async (id: string) => {
    try {
      const response = await getMechanicByIdAction(id)
      if (response && response.data) {
        setSelectedMechanic({
          id: response.data.id,
          userId: response.data.userId,
          bio: response.data.bio || "",
          servicesOffered: response.data.servicesOffered,
          availability: response.data.availability,
          rating: response.data.rating ?? 0,
          bannerImage: response.data.bannerImage ?? "",
          driversLicenseId: response.data.driversLicenseId ?? "",
          merchantDocumentUrl: response.data.merchantDocumentUrl ?? "",
          isAvailable: response.data.isAvailable,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
        } as Mechanic)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchUserById = async (id: string) => {
    try {
      const response = await getUserAction(id)
      console.info("User: ", response)
      setSelectedUser({
        id: response!.id,
        firstName: response!.firstName,
        lastName: response!.lastName,
        email: response!.email,
        role: response!.role as "Mechanic" | "Customer",
        profileImage: response!.profileImage ?? null,
        phoneNumber: response!.phoneNumber ?? null,
        documentsUrl: response!.documentsUrl ?? [],
        dob: response!.dob ? new Date(response!.dob) : null,
        currentLocation: response!.currentLocation,
        serviceArea: response!.serviceArea,
        createdAt: new Date(response!.createdAt),
        updatedAt: new Date(response!.updatedAt),
      } as unknown as User)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMechanics = async () => {
    try {
      const response = await getAvailableMechanicsListAction()
      if (response) {
        setMechanics(response.data!.map((mechanic: any) => ({
          id: mechanic.id,
          userId: mechanic.userId,
          bio: mechanic.bio || "",
          servicesOffered: mechanic.servicesOffered,
          isAvailable: mechanic.isAvailable,
          rating: mechanic.rating ?? 0,
          bannerImage: mechanic.bannerImage ?? "",
          driversLicenseId: mechanic.driversLicenseId ?? "",
          merchantDocumentUrl: mechanic.merchantDocumentUrl ?? "",
          availability: mechanic.availability ?? [],
          createdAt: new Date(mechanic.createdAt),
          updatedAt: new Date(mechanic.updatedAt),
        })))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await getAllUsersAction()
      if (Array.isArray(response)) {
        const MechanicPins = response
          .filter((user: { role: string | null; currentLocation: any }) => user.role === "Mechanic" && user.currentLocation)
          .map((user: { id: any; currentLocation: any }) => {
            return {
              id: user.id,
              userId: user.id,
              currentLocation: user.currentLocation!,
            }
          })
        const mechanicList = response.filter(
          (user: { role: string | null }): user is MechanicUser => user.role === "Mechanic"
        ).map((user) => ({
          ...user,
          role: "Mechanic" as const,
          currentLocation: user.currentLocation as unknown as UserCoordinates,
          serviceArea: user.serviceArea as unknown as UserCoordinates,
        }))
        setMechanicUsers(mechanicList)
        setMechanicMarkers(MechanicPins)
        console.info("MechanicPins: ", MechanicPins)
      } else {
        console.error("Failed to fetch users")
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (selectedMechanic) {
      fetchSingleMechanic(selectedMechanic!.id)
      fetchUserById(selectedMechanic!.userId)
    }
    fetchMechanics()
    getUserLocation(setUserCords)
    fetchAllUsers()
  }, [selectedMechanic])

  return (
    <div className="max-h-[80dvh]">
      {userRole === "Customer" && (
        <ClientMap
          selectedUser={selectedUser}
          selectedMechanic={selectedMechanic}
          setSelectedMechanic={setSelectedMechanic}
          mechanics={mechanics}
          mechanicUsers={mechanicUsers}
        />
      )}
      <MapboxMapComp
        selectedMechanic={selectedMechanic}
        setSelectedMechanic={setSelectedMechanic}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        userCords={userCords}
        mechanics={mechanics}
        mechanicMarkers={mechanicMarkers}
      />
    </div>
  )
}
