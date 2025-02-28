"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ServiceRequest, ServiceStatus } from "@prisma/client"
import { getMechanicLocation } from "@/app/actions/location"

interface ServiceRequestMapProps {
  serviceRequest: ServiceRequest
  customerLocation: { latitude: number; longitude: number }
  mechanicLocation?: { latitude: number; longitude: number }
  showMechanicLocation?: boolean
  showRoute?: boolean
  onRouteCalculated?: (duration: number, distance: number) => void
}

type LocationType = { latitude: number; longitude: number }

// Helper function to convert location to mapbox format
const toMapboxLngLat = (location: LocationType): [number, number] => {
  return [location.longitude, location.latitude]
}

// Storage keys for localStorage
const STORAGE_KEY_PREFIX = {
  MECHANIC: "mechanic_location_",
  CUSTOMER: "customer_location_"
}

const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  showMechanicLocation = false,
  showRoute = false,
  onRouteCalculated,
}: ServiceRequestMapProps) => {
  // DOM and mapbox refs
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const customerMarker = useRef<mapboxgl.Marker | null>(null)
  const mechanicMarker = useRef<mapboxgl.Marker | null>(null)
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null)
  const routeCoordinates = useRef<[number, number][]>([])
  const bearing = useRef<number>(0)
  
  // State tracking refs to minimize re-renders
  const mapInitialized = useRef(false)
  const routeCalculated = useRef(false)
  const currentStatus = useRef(serviceRequest.status)
  const lastMechanicLocation = useRef<LocationType | null>(null)
  const locationPollingInterval = useRef<NodeJS.Timeout | null>(null)
  const isUpdatingRoute = useRef(false)
  const lastRouteInfo = useRef<{ duration: number; distance: number } | null>(null)
  
  // Simple state to track map readiness
  const [mapReady, setMapReady] = useState(false)
  
  // Get customer location from props or localStorage
  const effectiveCustomerLocation = useMemo(() => {
    if (customerLocation?.latitude && customerLocation?.longitude) {
      // Store in localStorage for persistence
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX.CUSTOMER}${serviceRequest.id}`, 
          JSON.stringify(customerLocation)
        )
      } catch (e) {
        console.error("Failed to store customer location:", e)
      }
      return customerLocation
    }
    
    // Try to get from localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX.CUSTOMER}${serviceRequest.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.latitude && parsed?.longitude) {
          return parsed
        }
      }
    } catch (e) {
      console.error("Failed to retrieve customer location:", e)
    }
    
    return null
  }, [customerLocation, serviceRequest.id])
  
  // Get mechanic location from props or localStorage
  const effectiveMechanicLocation = useMemo(() => {
    if (mechanicLocation?.latitude && mechanicLocation?.longitude) {
      // Store in localStorage for persistence
      try {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX.MECHANIC}${serviceRequest.id}`, 
          JSON.stringify(mechanicLocation)
        )
      } catch (e) {
        console.error("Failed to store mechanic location:", e)
      }
      return mechanicLocation
    }
    
    // Try to get from localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX.MECHANIC}${serviceRequest.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.latitude && parsed?.longitude) {
          return parsed
        }
      }
    } catch (e) {
      console.error("Failed to retrieve mechanic location:", e)
    }
    
    return null
  }, [mechanicLocation, serviceRequest.id])
  
  // Clear all intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (locationPollingInterval.current) {
        clearInterval(locationPollingInterval.current)
        locationPollingInterval.current = null
      }
      
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      
      if (customerMarker.current) {
        customerMarker.current.remove()
        customerMarker.current = null
      }
      
      if (mechanicMarker.current) {
        mechanicMarker.current.remove()
        mechanicMarker.current = null
      }
    }
  }, [])
  
  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current || !effectiveCustomerLocation) return
    
    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: toMapboxLngLat(effectiveCustomerLocation),
        zoom: 14,
        attributionControl: false,
      })
      
      newMap.on("load", () => {
        // Add route source and layer
        newMap.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        })
        
        // Add a casing layer for the route (outline)
        newMap.addLayer({
          id: "route-casing",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#000",
            "line-width": 8,
            "line-opacity": 0.6,
          },
        });
        
        // Add the main route line
        newMap.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10B981",
            "line-width": 4,
            "line-opacity": 0.9,
            "line-dasharray": [0, 2, 1], // Create a dashed effect for better visibility
          },
        })
        
        routeSource.current = newMap.getSource("route") as mapboxgl.GeoJSONSource
        map.current = newMap
        mapInitialized.current = true
        setMapReady(true)
        
        // Add customer marker immediately after map is ready
        if (effectiveCustomerLocation) {
          customerMarker.current = new mapboxgl.Marker({ color: "#4B5563" })
            .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
            .setLngLat(toMapboxLngLat(effectiveCustomerLocation))
            .addTo(newMap)
        }
      })
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [effectiveCustomerLocation])
  
  // Update customer marker when location changes
  useEffect(() => {
    if (!mapReady || !map.current || !effectiveCustomerLocation) return
    
    try {
      const lngLat = toMapboxLngLat(effectiveCustomerLocation)
      
      if (!customerMarker.current) {
        customerMarker.current = new mapboxgl.Marker({ color: "#4B5563" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
          .setLngLat(lngLat)
          .addTo(map.current)
      } else {
        customerMarker.current.setLngLat(lngLat)
      }
    } catch (error) {
      console.error("Error updating customer marker:", error)
    }
  }, [mapReady, effectiveCustomerLocation])
  
  // Fetch mechanic location from server
  const fetchMechanicLocation = async () => {
    if (serviceRequest.status !== ServiceStatus.IN_ROUTE || !serviceRequest.mechanicId) return
    
    try {
      console.log("Fetching mechanic location for mechanic ID:", serviceRequest.mechanicId);
      const location = await getMechanicLocation(serviceRequest.mechanicId)
      
      // If server location is not available, try to use the prop or localStorage
      if (!location) {
        console.log("Server location not available, using fallback");
        if (effectiveMechanicLocation) {
          console.log("Using effective mechanic location from props or localStorage");
          // Use the current effective location if available
          if (showRoute && effectiveCustomerLocation) {
            calculateRoute(effectiveMechanicLocation, effectiveCustomerLocation);
          }
          return;
        } else {
          console.log("No fallback location available");
          return;
        }
      }
      
      console.log("Received mechanic location:", location);
      
      // Only update if location has changed significantly
      if (!lastMechanicLocation.current || 
          Math.abs(lastMechanicLocation.current.latitude - location.latitude) > 0.0001 || 
          Math.abs(lastMechanicLocation.current.longitude - location.longitude) > 0.0001) {
        
        console.log("Location changed significantly, updating");
        lastMechanicLocation.current = location
        
        // Store in localStorage
        try {
          localStorage.setItem(
            `${STORAGE_KEY_PREFIX.MECHANIC}${serviceRequest.id}`, 
            JSON.stringify(location)
          )
        } catch (e) {
          console.error("Failed to store mechanic location:", e)
        }
        
        // Update marker and route if map is ready
        if (mapReady && map.current) {
          try {
            updateMechanicMarker(location)
          } catch (error) {
            console.error("Error updating mechanic marker:", error)
          }
          if (showRoute && effectiveCustomerLocation) {
            calculateRoute(location, effectiveCustomerLocation)
          }
        }
      } else {
        console.log("Location hasn't changed significantly");
        // Even if location hasn't changed, ensure route is calculated
        if (mapReady && map.current && showRoute && effectiveCustomerLocation && !routeCalculated.current) {
          console.log("Calculating route with unchanged location");
          calculateRoute(location, effectiveCustomerLocation);
        }
      }
    } catch (error) {
      console.error("Error fetching mechanic location:", error)
      
      // Use fallback on error
      if (effectiveMechanicLocation && showRoute && effectiveCustomerLocation) {
        console.log("Using fallback location after error");
        calculateRoute(effectiveMechanicLocation, effectiveCustomerLocation);
      }
    }
  }
  
  // Start/stop location polling based on service status
  useEffect(() => {
    // Check if status has changed
    if (currentStatus.current !== serviceRequest.status) {
      console.log(`Status changed from ${currentStatus.current} to ${serviceRequest.status}`);
      currentStatus.current = serviceRequest.status
      routeCalculated.current = false // Reset route calculation flag on status change
    }
    
    // Start polling for IN_ROUTE status
    if (serviceRequest.status === ServiceStatus.IN_ROUTE && !locationPollingInterval.current) {
      console.log("Starting location polling for IN_ROUTE status");
      
      // Initial fetch with retry mechanism
      const initialFetch = async () => {
        console.log("Performing initial location fetch");
        await fetchMechanicLocation();
        
        // If route wasn't calculated on first try, retry after a short delay
        if (!routeCalculated.current && effectiveCustomerLocation) {
          console.log("Route not calculated on first try, retrying in 2 seconds");
          setTimeout(async () => {
            console.log("Retrying location fetch");
            await fetchMechanicLocation();
            
            // If still not calculated, try one more time with any available location
            if (!routeCalculated.current && effectiveMechanicLocation && effectiveCustomerLocation) {
              console.log("Forcing route calculation with available location");
              calculateRoute(effectiveMechanicLocation, effectiveCustomerLocation);
            }
          }, 2000);
        }
      };
      
      initialFetch();
      locationPollingInterval.current = setInterval(fetchMechanicLocation, 5000);
    } 
    // Stop polling for other statuses
    else if (serviceRequest.status !== ServiceStatus.IN_ROUTE && locationPollingInterval.current) {
      console.log("Stopping location polling");
      clearInterval(locationPollingInterval.current)
      locationPollingInterval.current = null
    }
    
    // Clean up on unmount
    return () => {
      if (locationPollingInterval.current) {
        clearInterval(locationPollingInterval.current)
        locationPollingInterval.current = null
      }
    }
  }, [serviceRequest.status, serviceRequest.mechanicId, effectiveCustomerLocation, effectiveMechanicLocation])
  
  // Update mechanic marker
  const updateMechanicMarker = (location: LocationType) => {
    if (!map.current || !mapReady) return
    
    try {
      const lngLat = toMapboxLngLat(location)
      
      const shouldShowMechanic = showMechanicLocation && (
        serviceRequest.status === ServiceStatus.PAYMENT_AUTHORIZED ||
        serviceRequest.status === ServiceStatus.IN_ROUTE ||
        serviceRequest.status === ServiceStatus.SERVICING
      )
      
      if (!shouldShowMechanic) {
        if (mechanicMarker.current) {
          mechanicMarker.current.remove()
          mechanicMarker.current = null
        }
        return
      }
      
      // Calculate bearing if we have route coordinates
      let currentBearing = bearing.current;
      if (routeCoordinates.current.length > 1 && serviceRequest.status === ServiceStatus.IN_ROUTE) {
        // Find the closest point on the route
        let minDistance = Infinity;
        let closestPointIndex = 0;
        
        for (let i = 0; i < routeCoordinates.current.length; i++) {
          const routePoint = routeCoordinates.current[i];
          const distance = Math.sqrt(
            Math.pow(routePoint[0] - lngLat[0], 2) + 
            Math.pow(routePoint[1] - lngLat[1], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = i;
          }
        }
        
        // Get next point to determine direction (if not at the end of the route)
        if (closestPointIndex < routeCoordinates.current.length - 1) {
          const currentPoint = routeCoordinates.current[closestPointIndex];
          const nextPoint = routeCoordinates.current[closestPointIndex + 1];
          
          // Calculate bearing between points
          const y = Math.sin(nextPoint[0] - currentPoint[0]) * Math.cos(nextPoint[1]);
          const x = Math.cos(currentPoint[1]) * Math.sin(nextPoint[1]) -
                   Math.sin(currentPoint[1]) * Math.cos(nextPoint[1]) * Math.cos(nextPoint[0] - currentPoint[0]);
          const bearingRadians = Math.atan2(y, x);
          currentBearing = (bearingRadians * 180 / Math.PI + 360) % 360;
          bearing.current = currentBearing;
        }
      }
      
      // Create custom element for directional arrow
      const createArrowElement = () => {
        const el = document.createElement('div');
        el.className = 'mechanic-marker';
        
        // Set the rotation based on bearing
        el.style.transform = `rotate(${currentBearing}deg)`;
        
        return el;
      };
      
      if (!mechanicMarker.current) {
        const el = createArrowElement();
        mechanicMarker.current = new mapboxgl.Marker({ element: el })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
          .setLngLat(lngLat)
          .addTo(map.current)
      } else {
        mechanicMarker.current.setLngLat(lngLat);
        
        // Update the rotation of the existing marker
        const markerElement = mechanicMarker.current.getElement();
        const arrowElement = markerElement.querySelector('.mechanic-marker') as HTMLElement;
        if (arrowElement) {
          arrowElement.style.transform = `rotate(${currentBearing}deg)`;
        }
      }
    } catch (error) {
      console.error("Error updating mechanic marker:", error)
    }
  }
  
  // Update mechanic marker when location or status changes
  useEffect(() => {
    if (!mapReady || !map.current) return;
    
    console.log("Status effect triggered, current status:", serviceRequest.status);
    
    // Update mechanic marker if location is available
    if (effectiveMechanicLocation) {
      try {
        updateMechanicMarker(effectiveMechanicLocation);
      } catch (error) {
        console.error("Error updating mechanic marker:", error);
      }
    }
    
    // Update map view based on status
    if (serviceRequest.status === ServiceStatus.PAYMENT_AUTHORIZED) {
      console.log("Status is PAYMENT_AUTHORIZED, updating map view");
      
      // If mechanic location is available, center on mechanic
      if (effectiveMechanicLocation) {
        map.current.flyTo({
          center: toMapboxLngLat(effectiveMechanicLocation),
          zoom: 15,
          duration: 1000
        });
      } 
      // Otherwise center on customer
      else if (effectiveCustomerLocation) {
        map.current.flyTo({
          center: toMapboxLngLat(effectiveCustomerLocation),
          zoom: 15,
          duration: 1000
        });
      }
    } 
    else if ((serviceRequest.status === ServiceStatus.IN_ROUTE || 
              serviceRequest.status === ServiceStatus.SERVICING) && 
              showRoute && effectiveCustomerLocation) {
      
      // Calculate route if not already calculated for this status
      if (!routeCalculated.current || currentStatus.current !== serviceRequest.status) {
        console.log("Calculating route for status:", serviceRequest.status);
        if (effectiveMechanicLocation) {
          calculateRoute(effectiveMechanicLocation, effectiveCustomerLocation);
        }
      }
      
      // Fit bounds to show both markers if both locations are available
      if (effectiveMechanicLocation && effectiveCustomerLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(toMapboxLngLat(effectiveMechanicLocation));
        bounds.extend(toMapboxLngLat(effectiveCustomerLocation));
        map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
      }
    }
    
    // Update current status reference
    if (currentStatus.current !== serviceRequest.status) {
      console.log(`Status changed from ${currentStatus.current} to ${serviceRequest.status}`);
      currentStatus.current = serviceRequest.status;
      // Reset route calculation flag on status change
      routeCalculated.current = false;
    }
  }, [mapReady, effectiveMechanicLocation, serviceRequest.status, showRoute, effectiveCustomerLocation]);
  
  // Add CSS styles for the arrow marker
  useEffect(() => {
    // Add CSS for the mechanic marker if it doesn't exist
    if (!document.getElementById('mechanic-marker-style')) {
      const style = document.createElement('style');
      style.id = 'mechanic-marker-style';
      style.innerHTML = `
        .mechanic-marker {
          width: 30px;
          height: 30px;
          background-color: #10B981;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center;
        }
        .mechanic-marker::after {
          content: '';
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 16px solid white;
          transform-origin: center;
        }
      `;
      document.head.appendChild(style);
    }
  }, [])
  
  // Calculate and display route
  const calculateRoute = async (from: LocationType, to: LocationType) => {
    if (!routeSource.current || !map.current) {
      console.error("Cannot calculate route: route source or map is not available");
      return;
    }
    
    if (isUpdatingRoute.current) {
      console.log("Route calculation already in progress, skipping");
      return;
    }
    
    // Skip if already calculated for IN_ROUTE status
    if (routeCalculated.current && serviceRequest.status === ServiceStatus.IN_ROUTE) {
      console.log("Route already calculated for IN_ROUTE status");
      // Even if we skip recalculation, we should still call onRouteCalculated with the last values
      // This ensures the UI updates properly
      if (onRouteCalculated && lastRouteInfo.current) {
        console.log("Calling onRouteCalculated with cached values:", lastRouteInfo.current);
        onRouteCalculated(lastRouteInfo.current.duration, lastRouteInfo.current.distance);
      }
      return;
    }
    
    console.log("Calculating route from", from, "to", to);
    isUpdatingRoute.current = true
    
    try {
      // Request a more detailed route with higher overview quality and more steps
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?steps=true&geometries=geojson&overview=full&annotations=duration,distance,speed&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const { coordinates } = route.geometry
        
        if (!routeSource.current) {
          console.error("Route source is null after fetch");
          return;
        }
        
        console.log(`Route received with ${coordinates.length} coordinate points`);
        
        // Store route coordinates for bearing calculations
        routeCoordinates.current = coordinates;
        
        routeSource.current.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        })
        
        // Store the route info for future reference
        lastRouteInfo.current = {
          duration: Math.round(route.duration / 60),
          distance: route.distance
        };
        
        // Call the callback with the route information
        if (onRouteCalculated) {
          console.log("Calling onRouteCalculated with", Math.round(route.duration / 60), route.distance);
          onRouteCalculated(Math.round(route.duration / 60), route.distance)
        }
        
        // Mark as calculated for this status
        if (serviceRequest.status === ServiceStatus.IN_ROUTE) {
          routeCalculated.current = true
        }
        
        // Update mechanic marker with the new route information if it exists
        if (effectiveMechanicLocation) {
          try {
            updateMechanicMarker(effectiveMechanicLocation);
          } catch (error) {
            console.error("Error updating mechanic marker:", error)
          }
        }
      } else {
        console.error("No routes found in response:", data);
        // Even if no routes found, call callback with zeros to update UI
        if (onRouteCalculated) {
          onRouteCalculated(0, 0);
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error)
      // Call callback with zeros on error to update UI
      if (onRouteCalculated) {
        onRouteCalculated(0, 0);
      }
    } finally {
      isUpdatingRoute.current = false
    }
  }
  
  // Clean up mechanic location on completion
  useEffect(() => {
    if (serviceRequest.status === ServiceStatus.COMPLETED) {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX.MECHANIC}${serviceRequest.id}`)
        lastMechanicLocation.current = null
        
        if (mechanicMarker.current) {
          mechanicMarker.current.remove()
          mechanicMarker.current = null
        }
      } catch (e) {
        console.error("Error cleaning up mechanic location:", e)
      }
    }
  }, [serviceRequest.status, serviceRequest.id])
  
  return <div ref={mapContainer} className="w-full h-full" />
}

export default ServiceRequestMap