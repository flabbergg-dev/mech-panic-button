export interface Location {
  latitude: number;
  longitude: number;
}

export interface MapOptions {
  style?: string;
  zoom?: number;
  center?: [number, number];
}

export interface RouteInfo {
  duration: number;
  distance: number;
}

export interface UpdateLocationResponse {
  success: boolean;
  error?: string;
}

export interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minDistanceChange?: number;
  updateInterval?: number;
}
