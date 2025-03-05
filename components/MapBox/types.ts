export interface LocationType {
  latitude: number;
  longitude: number;
}

export interface ServiceRequestMapProps {
  serviceRequest: {
    id: string;
    status: string;
    mechanicId?: string;
  };
  customerLocation: LocationType;
  mechanicLocation?: LocationType;
  showMechanicLocation?: boolean;
  showRoute?: boolean;
  onRouteCalculated?: (duration: number, distance: number) => void;
}
