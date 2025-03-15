import { prisma } from "@/lib/prisma";
import { describe, expect, it } from "@jest/globals"

describe("Chats", () => {
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

  const createTestUserMechanic = async () => {
    return await prisma.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "testedUser@test.com",
        role: 'Mechanic',
        stripeCustomerId: "test",
        stripeConnectId: "test",
        stripeSubscriptionPlan: "PRO",
        stripeSubscriptionStatus: "ACTIVE"
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
    await prisma.user.deleteMany({
      where: {
        email: "testedUser@test.com"
      }
    });
  });

  it("Expect to be truth", () => {
    expect(true).toBeTruthy();
  })
})
