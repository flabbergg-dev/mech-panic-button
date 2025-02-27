interface Coordinates {
  longitude: number;
  latitude: number;
}

function isValidCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 && coords.latitude <= 90 &&
    coords.longitude >= -180 && coords.longitude <= 180
  );
}

export async function calculateEstimatedTime(
  mechanicLocation: Coordinates | null,
  customerLocation: Coordinates | null
): Promise<string> {
  try {
    if (!mechanicLocation || !customerLocation) {
      console.error('Debug:Location data missing:', {
        mechanicLocation,
        customerLocation
      });
      return 'Unable to calculate ETA - missing location data';
    }

    if (!isValidCoordinates(mechanicLocation) || !isValidCoordinates(customerLocation)) {
      console.error('Debug:Invalid coordinates:', {
        mechanicLocation,
        customerLocation
      });
      return 'Unable to calculate ETA - invalid coordinates';
    }

    const mechanicCoords = `${mechanicLocation.longitude},${mechanicLocation.latitude}`;
    const customerCoords = `${customerLocation.longitude},${customerLocation.latitude}`;

    console.log('Calculating route with coordinates:', {
      mechanic: mechanicCoords,
      customer: customerCoords,
      rawMechanic: mechanicLocation,
      rawCustomer: customerLocation
    });

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicCoords};${customerCoords}?geometries=geojson&steps=true&overview=full`;
    console.log('Debug: Base URL:', url);
    console.log('Debug: Access Token exists:', !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

    const response = await fetch(
      `${url}&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
      { 
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Debug: Mapbox API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Mapbox API error: ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    console.log('Debug: API Response:', json);
    
    if (json.routes?.[0]?.duration) {
      const durationMinutes = Math.round(json.routes[0].duration / 60);
      return `${durationMinutes} min away - (${(json.routes[0].distance / 1000).toFixed(2)} km)`;
    } else {
      console.error('Debug: No valid route found in Mapbox response:', json);
      return "0 min away - (0 km)";
    }
  } catch (error) {
    console.error('Debug: Error calculating distance:', error);
    return "N/A";
  }
}
