interface Coordinates {
  latitude: number;
  longitude: number;
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
  if (!customerLocation?.latitude || !customerLocation?.longitude) {
    console.error('Invalid customer location coordinates');
    return "N/A";
  }
  if (!mechanicLocation?.latitude || !mechanicLocation?.longitude) {
    console.error('Invalid mechanic location coordinates');
    return "N/A";
  }

  if (!isValidCoordinates(mechanicLocation) || !isValidCoordinates(customerLocation)) {
    console.error(' Coordinates out of valid range:', {
      mechanic: mechanicLocation,
      customer: customerLocation
    });
    return "N/A";
  }

  try {
    // Format as longitude,latitude as required by Mapbox
    const mechanicCoords = `${mechanicLocation.longitude},${mechanicLocation.latitude}`;
    const customerCoords = `${customerLocation.longitude},${customerLocation.latitude}`;

    console.log(' Coordinates:', {
      mechanic: mechanicCoords,
      customer: customerCoords,
      rawMechanic: mechanicLocation,
      rawCustomer: customerLocation
    });

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicCoords};${customerCoords}?geometries=geojson&steps=true&overview=full`;
    console.log(' Base URL:', url);
    console.log(' Access Token exists:', !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);

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
      console.error(' Mapbox API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(` Mapbox API error: ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    console.log(' API Response:', json);
    
    if (json.routes?.[0]?.duration) {
      const durationMinutes = Math.round(json.routes[0].duration / 60);
      return `${durationMinutes} min away - (${(json.routes[0].distance / 1000).toFixed(2)} km)`;
    } else {
      console.error(' No valid route found in Mapbox response:', json);
      return "N/A";
    }
  } catch (error) {
    console.error(' Error calculating distance:', error);
    return "N/A";
  }
}
