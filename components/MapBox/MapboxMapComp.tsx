"use client"

import React, { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { FileText } from "lucide-react"
import mapboxgl from "mapbox-gl"

import { InTransitInstructions } from "./InTransitInstructions"

import "mapbox-gl/dist/mapbox-gl.css"

import Image from "next/image"
import {  usePathname } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal/Modal"
import { Mechanic } from "@prisma/client"

interface MapboxProps {
  userCords: { latitude: number; longitude: number }
  selectedMechanic?: any
  setSelectedMechanic?: React.Dispatch<React.SetStateAction<any | undefined>>
  selectedUser?: any
  setSelectedUser?: React.Dispatch<React.SetStateAction<any | undefined>>
  mechanics?: Mechanic[]
  mechanicMarkers?: {
    id: string
    currentLocation: { latitude: number; longitude: number }
  }[]
}

export const MapboxMapComp = ({
  userCords,
  selectedMechanic,
  setSelectedMechanic,
  mechanics,
  mechanicMarkers,
}: MapboxProps) => {
  const { userRole } = useUserRole()
  const isStartDrive = usePathname().includes("start-drive")
  const isServiceRequest = usePathname().includes("service-request")
  const isInTransit = usePathname().includes("in-transit")
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [showMechanicDetails, setShowMechanicDetails] = useState(false)
  const [currentInstructions, setCurrentInstructions] = useState({
    duration: 0,
    currentStep: "",
    nextStep: "",
  })
  useMemo(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-66.9, 18.03],
        zoom: 9,
        // interactive: isStartDrive || isServiceRequest,
      })
      const map = mapRef.current

      const getRoute = async (end: any[]) => {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userCords.longitude},${userCords.latitude};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
          { method: "GET" }
        )
        const json = await query.json()
        const data = json.routes[0]
        const route = data.geometry.coordinates
        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route,
          },
        }
        if (map.getSource("route")) {
          ;(map.getSource("route") as mapboxgl.GeoJSONSource).setData(geojson)
        } else {
          map.addLayer({
            id: "route",
            type: "line",
            source: {
              type: "geojson",
              data: geojson,
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 5,
              "line-opacity": 0.75,
            },
          })
        }

        const instructions = document.getElementById("instructions")
        const steps = data.legs[0].steps

        let tripInstructions = ""
        steps.forEach(
          (step: { maneuver: { instruction: any } }, index: number) => {
            tripInstructions += `<li class="p-4 bg-slate-200 rounded-md">${index + 1}. ${step.maneuver.instruction}</li>`
          }
        )
        instructions!.innerHTML = `<div class="flex flex-col"><p class="font-bold text-lg mb-2">Trip duration: ${Math.floor(
          data.duration / 60
        )} min</p><ol class="flex flex-col gap-4">${tripInstructions}</ol></div>`

        // Update current instructions
        setCurrentInstructions({
          duration: data.duration / 60,
          currentStep: steps[0]?.maneuver.instruction || "",
          nextStep: steps[1]?.maneuver.instruction || "",
        })
      }

      map.on("load", () => {
        mechanicMarkers!.forEach(
          (mechanicMarkers: {
            id: string
            currentLocation: { longitude: number; latitude: number }
          }) => {
            if (mechanicMarkers) {
              const marker = new mapboxgl.Marker()
                .setLngLat([
                  mechanicMarkers.currentLocation.longitude,
                  mechanicMarkers.currentLocation.latitude,
                ])
                .addTo(map)

              marker.getElement().addEventListener("click", () => {
                const selectedMechanicUserInfo = mechanics?.find(
                  (mechanic) => mechanic.userId === mechanicMarkers.id
                )
                setSelectedMechanic!(selectedMechanicUserInfo)
                setShowMechanicDetails(true)
                console.log("Selected Mechanic", selectedMechanicUserInfo)
              })
            }
          }
        )
      })

      // map.on("click", (event) => {
      //   getRoute([userCords.longitude, userCords.latitude])
      //   const coords = [event.lngLat.lng, event.lngLat.lat]
      //   const end: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
      //     type: "FeatureCollection",
      //     features: [
      //       {
      //         type: "Feature",
      //         properties: {},
      //         geometry: {
      //           type: "Point",
      //           coordinates: coords,
      //         },
      //       },
      //     ],
      //   }
      //   if (map.getLayer("end")) {
      //     ;(map.getSource("end") as mapboxgl.GeoJSONSource).setData(end)
      //   } else {
      //     map.addLayer({
      //       id: "end",
      //       type: "symbol",
      //       source: {
      //         type: "geojson",
      //         data: {
      //           type: "FeatureCollection",
      //           features: [
      //             {
      //               type: "Feature",
      //               properties: {},
      //               geometry: {
      //                 type: "Point",
      //                 coordinates: coords,
      //               },
      //             },
      //           ],
      //         },
      //       },
      //       layout: {
      //         "icon-image": "/images/pin.svg", // hypothetical image
      //         "icon-size": 1.5,
      //       },
      //     })
      //   }
      //   getRoute(coords)
      // })
    }

    if (mapRef.current) {
      new mapboxgl.Marker()
        .setLngLat([userCords.longitude, userCords.latitude])
        .addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      } else {
        return
      }
    }
  }, [
    userCords.longitude,
    userCords.latitude,
    mechanicMarkers,
    mechanics,
    setSelectedMechanic,
  ])

  return (
    <>
      <div
        id="map-container"
        style={{
          height: "100svh",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,

          zIndex: 0,
        }}
        ref={mapContainerRef}
      ></div>

      <Modal
        dialogText="Mechanic Information"
        buttonText=""
        isOpen={showMechanicDetails}
      >
        {selectedMechanic && (
          <Card className="flex flex-col items-center">
            <CardHeader className="border w-full">
              <Image
                src={selectedMechanic.bannerImage || "/images/mechanic.jpg"}
                alt="Mechanic Banner"
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold mt-4">
                {selectedMechanic.isAvailable ? "Available" : "Not Available"}
              </p>
              <p className="">{selectedMechanic.bio}</p>
              <p className="">Rating: {selectedMechanic.rating}</p>
              {/* {selectedMechanic.servicesOffered.map((service: string) => (
                <p key={service} className="text-center">
                  {service}
                </p>
              ))} */}
            </CardContent>
          </Card>
        )}
        <div className="pt-4 flex justify-end">
          <Button onClick={() => setShowMechanicDetails(false)}>Close</Button>
        </div>
      </Modal>

      {userRole === "Mechanic" && (
        <>
          {isInTransit && (
            <Button
              className="fixed top-4 right-4 z-10"
              onClick={() => setShowDirections(!showDirections)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showDirections ? "Hide Directions" : "Show Directions"}
            </Button>
          )}

          <div
            id="instructions"
            className={`bg-white  overflow-y-hidden transition-all duration-300 max-h-[40svh] w-full ${
              showDirections
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
            style={{
              height: "100svh",
              width: "100%",
              zIndex: 45,
              boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
            }}
          ></div>

          {isInTransit && (
            <InTransitInstructions
              duration={currentInstructions.duration}
              currentStep={currentInstructions.currentStep}
              nextStep={currentInstructions.nextStep}
            />
          )}
        </>
      )}
    </>
  )
}
