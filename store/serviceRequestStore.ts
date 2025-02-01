import { create } from 'zustand'
import { ServiceRequest } from '@prisma/client'

interface Location {
  latitude: number
  longitude: number
}

interface ServiceRequestState {
  serviceRequests: ServiceRequest[]
  mechanicLocation: Location | null
  serviceStatus: string | null
  setServiceRequests: (serviceRequests: ServiceRequest[]) => void
  setMechanicLocation: (location: Location | null) => void
  setServiceStatus: (status: string | null) => void
  addServiceRequest: (serviceRequest: ServiceRequest) => void
  updateServiceRequest: (serviceRequest: ServiceRequest) => void
}

export const useServiceRequestStore = create<ServiceRequestState>((set) => ({
  serviceRequests: [],
  mechanicLocation: null,
  serviceStatus: null,
  setServiceRequests: (serviceRequests) => set({ serviceRequests }),
  setMechanicLocation: (location) => set({ mechanicLocation: location }),
  setServiceStatus: (status) => set({ serviceStatus: status }),
  addServiceRequest: (serviceRequest) => 
    set((state) => ({ 
      serviceRequests: [...state.serviceRequests, serviceRequest] 
    })),
  updateServiceRequest: (updatedServiceRequest) =>
    set((state) => ({
      serviceRequests: state.serviceRequests.map((request) =>
        request.id === updatedServiceRequest.id ? updatedServiceRequest : request
      ),
    })),
}))
