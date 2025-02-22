
interface Coordinates {
  latitude: number;
  longitude: number;
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

  try {
    const mechanicCoords = `${mechanicLocation.longitude},${mechanicLocation.latitude}`;
    const customerCoords = `${customerLocation.longitude},${customerLocation.latitude}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicCoords};${customerCoords}`;
    const response = await fetch(
      `${url}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
      { 
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    const json = await response.json();
    
    if (json.routes?.[0]?.duration) {
      const durationMinutes = Math.round(json.routes[0].duration / 60);
      return `${durationMinutes} min`;
    } else {
      console.error('No valid route found in Mapbox response:', json);
      return "N/A";
    }
  } catch (error) {
    console.error('Error calculating distance:', error);
    return "N/A";
  }
}
