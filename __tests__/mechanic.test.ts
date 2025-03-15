import { prisma } from "@/lib/prisma";
import { describe, expect, it, afterEach } from "@jest/globals"
import { getAvailableMechanicsListAction } from "@/app/actions/mechanic/get-available-mechanics-list.action";
import { getMechanicByIdAction } from "@/app/actions/mechanic/get-mechanic-by-id.action";
import { getMechanicProfile } from "@/app/actions/mechanic/get-mechanic-profile.action";
import { updateMechanicBannerAction } from "@/app/actions/mechanic/update-mechanic-banner.action";
import { updateMechanicDocumentsAction } from "@/app/actions/mechanic/update-mechanic-documents.action";
import { updateMechanicServices } from "@/app/actions/mechanic/update-mechanic-services";
import { updateMechanicLocation } from "@/app/actions/location";
import { updateMechanicLocation as updateMechanicLocationAction } from "@/app/actions/updateMechanicLocation";
import { updateMechanicLocationAction as updateMechanicLocationAction2 } from "@/app/actions/mechanic/updateMechanicLocationAction";
import { Mechanic, ServiceType, SubscriptionPlan, SubscriptionStatus, User } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

// Type that matches the actual shape of mechanic data returned by getAvailableMechanicsListAction
interface MechanicListItem {
  id: string;
  userId: string;
  bio: string | null;
  servicesOffered: ServiceType[];
  isAvailable: boolean;
  rating: number | null;
  bannerImage: string | null;
  location: JsonValue;
  serviceArea: JsonValue;
  driversLicenseId: string | null;
  merchantDocumentUrl: string | null;
  user: {
    firstName: string;
  };
  serviceRequests: Array<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    // ... other service request fields
  }>;
}

describe("Mechanics", () => {
  // Helper function to create a test user
  const createTestUserClient = async () => {
    return await prisma.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "testedUser@test.com",
        role: 'Customer',
        stripeCustomerId: "test",
        stripeConnectId: "test",
        stripeSubscriptionPlan: "PRO",
        stripeSubscriptionStatus: "ACTIVE"
      }
    });
  };

  const createTestUserMechanic = async (subscriptionPlan: SubscriptionPlan | null = "PRO") => {
    return await prisma.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: `mechanic.${subscriptionPlan?.toLowerCase() || 'none'}@test.com`,
        role: 'Mechanic',
        stripeCustomerId: "test",
        stripeConnectId: "test",
        stripeSubscriptionPlan: subscriptionPlan,
        stripeSubscriptionStatus: subscriptionPlan ? "ACTIVE" as SubscriptionStatus : null
      }
    });
  };

  // Helper function to create a test mechanic
  const createTestMechanic = async (userId: string) => {
    return await prisma.mechanic.create({
      data: {
        userId,
        isAvailable: true,
        servicesOffered: ['DIAGNOSTIC'],
      }
    });
  };

  // Helper function to delete a test user
  const deleteTestUser = async (userId: string) => {
    await prisma.user.delete({
      where: { id: userId }
    });
  };

  // Clean up after each test
  afterEach(async () => {
    await prisma.serviceRequest.deleteMany({});
    await prisma.mechanic.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@test.com"
        }
      }
    });
  });

  it("should get available mechanics list filtered by PRO subscription", async () => {
    // Create mechanics with different subscription plans
    const proMechanic = await createTestUserMechanic("PRO");
    const basicMechanic = await createTestUserMechanic("BASIC");
    const noSubMechanic = await createTestUserMechanic(null);
    
    // Create mechanic profiles
    const proMechanicProfile = await createTestMechanic(proMechanic.id);
    const basicMechanicProfile = await createTestMechanic(basicMechanic.id);
    const noSubMechanicProfile = await createTestMechanic(noSubMechanic.id);

    const result = await getAvailableMechanicsListAction();
    expect(result).toBeDefined();
    
    // Type guard to check if result has mechanic property
    if (!('mechanic' in result) || !result.mechanic) {
      throw new Error('Failed to fetch mechanics list');
    }

    const mechanics = result.mechanic as MechanicListItem[];
    expect(Array.isArray(mechanics)).toBe(true);
    
    // Verify mechanics are filtered correctly based on subscription plan
    const proMechanicFound = mechanics.some(m => m.userId === proMechanic.id);
    const basicMechanicFound = mechanics.some(m => m.userId === basicMechanic.id);
    const noSubMechanicFound = mechanics.some(m => m.userId === noSubMechanic.id);
    
    // According to the booking component requirements:
    // 1. Only mechanics with role 'Mechanic' should be listed
    // 2. Only mechanics with 'PRO' subscription (case-insensitive) should be listed
    expect(proMechanicFound).toBe(true);
    expect(basicMechanicFound).toBe(false);
    expect(noSubMechanicFound).toBe(false);

    // Log filtering details for debugging
    console.log('Mechanic filtering results:', {
      total: mechanics.length,
      proFound: proMechanicFound,
      basicFound: basicMechanicFound,
      noSubFound: noSubMechanicFound,
      firstMechanicDetails: mechanics[0] ? {
        userId: mechanics[0].userId,
        isAvailable: mechanics[0].isAvailable,
        servicesOffered: mechanics[0].servicesOffered
      } : null
    });
  });

  it("should get mechanic by id", async () => {
    const result = await getMechanicByIdAction();
    expect(result).toBeDefined();
  });

  it("should get mechanic profile", async () => {
    const result = await getMechanicProfile();
    expect(result).toBeDefined();
  });

  it("should update mechanic banner", async () => {
    const client = await createTestUserClient();
    const result = await updateMechanicBannerAction(client.id, "test");
    expect(result).toBeDefined();
  });

  it("should update mechanic documents", async () => {
    const client = await createTestUserClient();
    const result = await updateMechanicDocumentsAction(client.id, { driversLicenseId: 'test', merchantDocumentUrl: 'test' });
    expect(result).toBeDefined();
  });

  it("should update mechanic services", async () => {
    const client = await createTestUserMechanic();
    const mechanic = await createTestMechanic(client.id);
    const result = await updateMechanicServices({
      mechanicId: mechanic.id,
      servicesOffered: ['DIAGNOSTIC'] as ServiceType[]
    });
    
    // First verify the success status
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // Only check MechanicServices if update was successful
    if (result.success && result.MechanicServices) {
      expect(result.MechanicServices.servicesOffered).toContain('DIAGNOSTIC');
    } else {
      throw new Error('Failed to update mechanic services');
    }
  });

  it("should update mechanic location", async () => {
    const client = await createTestUserMechanic();
    const mechanic = await createTestMechanic(client.id);
    const result = await updateMechanicLocation(mechanic.id, { latitude: 0, longitude: 0 });
    expect(result).toBeDefined();
  });

  it("should update mechanic location with action", async () => {
    const client = await createTestUserMechanic();
    const mechanic = await createTestMechanic(client.id);

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        id: 'test-service-request',
        clientId: client.id,
        mechanicId: mechanic.id,
        status: 'REQUESTED',
        location: { latitude: 0, longitude: 0 },
        totalAmount: 0,
        serviceType: 'DIAGNOSTIC'
      },
    });

    const result = await updateMechanicLocationAction(serviceRequest.id, { latitude: 0, longitude: 0 });
    expect(result).toBeDefined();
  });

  it("should update mechanic location with action 2", async () => {
    const client = await createTestUserMechanic();
    const mechanic = await createTestMechanic(client.id);
    const result = await updateMechanicLocationAction2({ latitude: 0, longitude: 0 });
    expect(result).toBeDefined();
  });
});
