export interface ServiceRequestMock {
  id: string
  clientName: string
  serviceType: string
  fromLocation: string
  toLocation: string
  serviceCalculatedPrice?: number
  isScheduled: boolean
  scheduledDateTime?: string
}

const SERVICE_PRICE_MAP: Record<string, number> = {
  "Car Inspection": 49.99,
  Towing: 89.99,
  "Tire Change": 39.99,
  "Fuel Delivery": 29.99,
  "Jump Start": 34.99,
  "Battery Replacement": 119.99,
  "Lockout Service": 44.99,
  "Winch Service": 79.99,
  "Flatbed Towing": 99.99,
}

export const mockServiceRequests: ServiceRequestMock[] = [
  {
    id: "1",
    clientName: "Carmen Rivera",
    serviceType: "Car Inspection",
    fromLocation: "San Juan, Puerto Rico",
    toLocation: "Ponce, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Car Inspection"],
    isScheduled: false,
  },
  {
    id: "2",
    clientName: "José Rodríguez",
    serviceType: "Towing",
    fromLocation: "Bayamón, Puerto Rico",
    toLocation: "Carolina, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Towing"],
    isScheduled: false,
  },
  {
    id: "3",
    clientName: "María González",
    serviceType: "Tire Change",
    fromLocation: "Mayagüez, Puerto Rico",
    toLocation: "Aguadilla, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Tire Change"],
    isScheduled: false,
  },
  {
    id: "4",
    clientName: "Luis Vázquez",
    serviceType: "Fuel Delivery",
    fromLocation: "Arecibo, Puerto Rico",
    toLocation: "Fajardo, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Fuel Delivery"],
    isScheduled: false,
  },
  {
    id: "5",
    clientName: "Ana Torres",
    serviceType: "Jump Start",
    fromLocation: "Caguas, Puerto Rico",
    toLocation: "Guaynabo, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Jump Start"],
    isScheduled: false,
  },
  {
    id: "6",
    clientName: "Roberto Méndez",
    serviceType: "Battery Replacement",
    fromLocation: "Humacao, Puerto Rico",
    toLocation: "Cayey, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Battery Replacement"],
    isScheduled: true,
    scheduledDateTime: "2024-02-15T14:30:00Z",
  },
  {
    id: "7",
    clientName: "Isabel Ramos",
    serviceType: "Lockout Service",
    fromLocation: "Vega Baja, Puerto Rico",
    toLocation: "Manatí, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Lockout Service"],
    isScheduled: true,
    scheduledDateTime: "2024-02-16T10:00:00Z",
  },
  {
    id: "8",
    clientName: "Miguel Acosta",
    serviceType: "Winch Service",
    fromLocation: "Yauco, Puerto Rico",
    toLocation: "Guánica, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Winch Service"],
    isScheduled: true,
    scheduledDateTime: "2024-02-17T15:45:00Z",
  },
  {
    id: "9",
    clientName: "Sofia Nieves",
    serviceType: "Flatbed Towing",
    fromLocation: "Cabo Rojo, Puerto Rico",
    toLocation: "Lajas, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Flatbed Towing"],
    isScheduled: true,
    scheduledDateTime: "2024-02-18T09:15:00Z",
  },
  {
    id: "10",
    clientName: "Pedro Ortiz",
    serviceType: "Tire Change",
    fromLocation: "Aguada, Puerto Rico",
    toLocation: "Rincón, Puerto Rico",
    serviceCalculatedPrice: SERVICE_PRICE_MAP["Tire Change"],
    isScheduled: true,
    scheduledDateTime: "2024-02-19T11:30:00Z",
  },
]

export const getServiceRequestById = (
  id: string
): ServiceRequestMock | undefined => {
  return mockServiceRequests.find((request) => request.id === id)
}
