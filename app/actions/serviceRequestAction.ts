"use server"

import { ServiceStatus, ServiceType } from "@prisma/client"
import type { ServiceRequest } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from 'uuid'

type ServiceRequestInput = {
  userId: string
  location: {
    latitude: number
    longitude: number
  }
  serviceType: ServiceType | string
  status: ServiceStatus
}

type ServiceRequestResponse = {
  success: boolean;
  data?: ServiceRequest;
  mechanic?: {
    name: string;
    rating: number;
    estimatedArrival: string;
  };
  error?: string;
}

export async function createServiceRequestAction(input: ServiceRequestInput): Promise<ServiceRequestResponse> {
  try {
    // Validate input
    if (!input || !input.userId || !input.location || !input.serviceType || !input.status) {
      throw new Error("Invalid input: All fields are required")
    }

    if (!input.location.latitude || !input.location.longitude) {
      throw new Error("Invalid location: latitude and longitude are required")
    }

    // Convert string service type to enum if needed
    const serviceType = typeof input.serviceType === 'string'
      ? input.serviceType as ServiceType
      : input.serviceType

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: input.userId }
    })

    if (!user) {
      throw new Error("User not found in database")
    }


    // Create service request with proper enum handling
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        id: uuidv4(),
        clientId: user.id,
        serviceType: ServiceType[serviceType as keyof typeof ServiceType],
        status: ServiceStatus[input.status as keyof typeof ServiceStatus],
        location: input.location,
        description: `${serviceType.toLowerCase().replace(/_/g, ' ')} service request`,
        totalAmount: 0, // Required by schema
        
        updatedAt: new Date(), // Required by schema
      }
    })


    return {
      success: true,
      data: serviceRequest,
      
    }
  } catch (error) {
    console.error("Error in createServiceRequestAction:", error);
    // Properly format error for server action
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unknown error occurred' }
  }
}
