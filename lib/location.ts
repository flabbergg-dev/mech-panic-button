interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationInfo {
  city: string;
  state: string;
  country: string;
}

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export async function getLocationInfo({ latitude, longitude }: Coordinates): Promise<LocationInfo | null> {
  try {
    if (!MAPBOX_API_KEY) {
      console.error('Mapbox API key is not configured');
      return null;
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&types=place,region&limit=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return null;
    }

    // Mapbox returns features array with context
    const place = data.features[0];
    const context = place.context || [];

    // Find city, state, and country from the context
    const city = place.text; // The main feature text is usually the city
    const state = context.find((item: any) => item.id.startsWith('region'))?.text || '';
    const country = context.find((item: any) => item.id.startsWith('country'))?.text || '';

    return {
      city,
      state,
      country
    };
  } catch (error) {
    console.error('Error getting location info:', error);
    return null;
  }
}

// Cache for location results to avoid repeated API calls
const locationCache = new Map<string, LocationInfo>();

export async function getCityName(coordinates: Coordinates): Promise<string> {
  const cacheKey = `${coordinates.latitude},${coordinates.longitude}`;
  
  // Check cache first
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!.city;
  }

  const locationInfo = await getLocationInfo(coordinates);
  
  if (locationInfo) {
    // Store in cache
    locationCache.set(cacheKey, locationInfo);
    return locationInfo.city;
  }

  return 'Unknown Location';
}

// Helper to check if coordinates are within US or Puerto Rico bounds
export function isWithinUSorPR(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;

  // Continental US bounds
  const continentalUS = {
    north: 49.384358,
    south: 24.396308,
    east: -66.934570,
    west: -125.000000
  };

  // Puerto Rico bounds
  const puertoRico = {
    north: 18.515683,
    south: 17.922889,
    east: -65.242179,
    west: -67.938339
  };

  // Check if within continental US
  const inUS = latitude <= continentalUS.north &&
               latitude >= continentalUS.south &&
               longitude <= continentalUS.east &&
               longitude >= continentalUS.west;

  // Check if within Puerto Rico
  const inPR = latitude <= puertoRico.north &&
               latitude >= puertoRico.south &&
               longitude <= puertoRico.east &&
               longitude >= puertoRico.west;

  return inUS || inPR;
}
