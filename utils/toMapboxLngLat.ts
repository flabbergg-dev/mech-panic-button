/**
 * Converts a location object with latitude and longitude to Mapbox LngLat format
 * @param location The location object with latitude and longitude properties
 * @returns A tuple of [longitude, latitude] or null if location is invalid
 */
const toMapboxLngLat = (location: { latitude: number; longitude: number } | undefined): [number, number] | null => {
  if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
    return null
  }
  return [location.longitude, location.latitude]
}

export default toMapboxLngLat
