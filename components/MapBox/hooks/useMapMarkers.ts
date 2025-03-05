import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { LocationType } from '../types';
import { createArrowElement } from '../utils';

interface UseMapMarkersProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  mapReady: boolean;
  mechanicLocation?: LocationType;
  customerLocation?: LocationType;
}

export const useMapMarkers = ({ 
  map, 
  mapReady, 
  mechanicLocation, 
  customerLocation 
}: UseMapMarkersProps) => {
  const mechanicMarker = useRef<mapboxgl.Marker | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);
  const currentBearing = useRef<number>(0);

  // Update mechanic marker
  const updateMechanicMarker = async (location: LocationType) => {
    if (!map.current || !mapReady) return;
    
    try {
      const lngLat: [number, number] = [location.longitude, location.latitude];
      
      if (!mechanicMarker.current) {
        const el = createArrowElement();
        mechanicMarker.current = new mapboxgl.Marker({ element: el })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
          .setLngLat(lngLat)
          .addTo(map.current);
      } else {
        mechanicMarker.current.setLngLat(lngLat);
        
        // Update arrow rotation
        const markerElement = mechanicMarker.current.getElement();
        const arrowElement = markerElement.querySelector('.mechanic-marker') as HTMLElement;
        if (arrowElement) {
          arrowElement.style.transform = `rotate(${currentBearing.current}deg)`;
        }
      }
    } catch (error) {
      console.error("Error updating mechanic marker:", error);
    }
  };

  // Update customer marker
  const updateCustomerMarker = async (location: LocationType) => {
    if (!map.current || !mapReady) return;
    
    try {
      const lngLat: [number, number] = [location.longitude, location.latitude];
      
      if (!customerMarker.current) {
        customerMarker.current = new mapboxgl.Marker({ color: "#4B5563" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
          .setLngLat(lngLat)
          .addTo(map.current);
      } else {
        customerMarker.current.setLngLat(lngLat);
      }
    } catch (error) {
      console.error("Error updating customer marker:", error);
    }
  };

  // Update markers when locations change
  useEffect(() => {
    if (mechanicLocation) {
      updateMechanicMarker(mechanicLocation);
    }
    if (customerLocation) {
      updateCustomerMarker(customerLocation);
    }
  }, [mapReady, mechanicLocation, customerLocation]);

  return {
    mechanicMarker,
    customerMarker,
    currentBearing,
    updateMechanicMarker,
    updateCustomerMarker
  };
};
