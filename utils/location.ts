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

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Calculate estimated time between two points
export async function calculateEstimatedTime(
  mechanicLocation: Coordinates | null,
  customerLocation: Coordinates | null
): Promise<string> {
  // Validate environment variable first
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
  }

  if (!mechanicLocation || !customerLocation) {
    return 'Unknown';
  }

  if (!isValidCoordinates(mechanicLocation) || !isValidCoordinates(customerLocation)) {
    return 'Invalid coordinates';
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicLocation.longitude},${mechanicLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?access_token=${mapboxToken}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch directions: ${response.status}`);
    }

    const data = await response.json();
    if (data.routes?.[0]?.distance === 0) {
      return '0 min';
    }
    
    if (!data.routes?.[0]?.duration) {
      throw new Error('Invalid response format from Mapbox API');
    }

    const durationInMinutes = Math.round(data.routes[0].duration / 60);
    return durationInMinutes < 60
      ? `${durationInMinutes} min`
      : `${Math.floor(durationInMinutes / 60)}h ${durationInMinutes % 60}min`;
  } catch (error) {
    console.error('Error calculating estimated time:', error);
    return 'Unavailable';
  }
}
