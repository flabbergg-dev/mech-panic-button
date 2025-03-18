'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus, OfferStatus } from "@prisma/client"

interface UpdateServiceRequestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function updateServiceRequestByIdAction(
  serviceRequestId: string,
  status: ServiceStatus
): Promise<UpdateServiceRequestResponse> {
  try {
    // Validate the current state
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    });

    if (!currentRequest) {
      return { 
        success: false,
        error: "Service request not found"
      };
    }

    // Validate state transitions
    const validTransitions: Record<ServiceStatus, ServiceStatus[]> = {
      [ServiceStatus.REQUESTED]: [ServiceStatus.ACCEPTED],
      [ServiceStatus.ACCEPTED]: [ServiceStatus.PAYMENT_AUTHORIZED],
      // [ServiceStatus.PAYMENT_AUTHORIZED]: [ServiceStatus.SERVICING],
      [ServiceStatus.PAYMENT_AUTHORIZED]: [ServiceStatus.IN_ROUTE, ServiceStatus.SERVICING],
      [ServiceStatus.IN_ROUTE]: [ServiceStatus.IN_PROGRESS],
      [ServiceStatus.IN_PROGRESS]: [ServiceStatus.SERVICING],
      [ServiceStatus.SERVICING]: [ServiceStatus.IN_COMPLETION],
      [ServiceStatus.IN_COMPLETION]: [ServiceStatus.COMPLETED],
      [ServiceStatus.COMPLETED]: [],
      [ServiceStatus.BOOKED]: [ServiceStatus.COMPLETED]
    };

    const allowedNextStates = validTransitions[currentRequest.status];
    if (!allowedNextStates.includes(status)) {
      return { 
        success: false,
        error: `Invalid status transition from ${currentRequest.status} to ${status}`
      };
    }

    // Update the request
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status }
    });

    return { 
      success: true, 
      message: "Service request updated successfully" 
    };
  } catch (error) {
    console.error("Error updating service request:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update service request" 
    };
  }
}