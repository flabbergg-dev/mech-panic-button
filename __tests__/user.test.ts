import { prisma } from "@/lib/prisma";

import { describe, expect, it, afterEach } from "@jest/globals";
import { checkUserRoleAction } from "@/app/actions/user/check-user-role.action";
import { checkUserSubscription } from "@/app/actions/user/check-user-subscription";
import { getAllUsersAction } from "@/app/actions/user/get-all-users.action";
import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { getStripeCustomerId } from "@/app/actions/user/get-stripe-customer-id";
import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action";
import { getUserRole } from "@/app/actions/user/get-user-role.action";
import { getUserAction } from "@/app/actions/user/get-user.action";
import { getUserEmailPreferenceAction } from "@/app/actions/user/getUserEmailPreferenceAction";
import { onboardUserAction } from "@/app/actions/user/onboard-user.action";
import { updateProfileImageAction } from "@/app/actions/user/update-profile-image.action";
import { updateStripeCustomerId } from "@/app/actions/user/update-stripe-customer-id";
import { updateUserProfileAction } from "@/app/actions/user/update-user-profile.action";
import { updateUserEmailPreferenceAction } from "@/app/actions/user/updateUserEmailPreferenceAction";

describe("User Tests", () => {
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

  it("Onboards user", async () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "testedUser@test.com",
      role: 'Customer' as const, 
      make: "Toyota",
      model: "Camry",
      year: 2020,
      license: "ABC123"
    };
    
    const response = await onboardUserAction(data);
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.redirect).toBe('/dashboard');
  });

  it("Onboards mechanic with PRO subscription", async () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      email: "testedUser@test.com",
      role: 'Mechanic' as const, 
      make: "Toyota",
      model: "Camry",
      year: 2020,
      license: "ABC123"
    };
    
    const response = await onboardUserAction(data);
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.redirect).toBe('/dashboard');

    const user = await prisma.user.findFirst({
      where: { email: data.email }
    });
    expect(user).toBeDefined();
    expect(user?.role).toBe('Mechanic');
  });

  it("Assigns Role", async () => {
    const user = await createTestUserClient();
    expect(user.role).toBe('Customer');
  });

  it("Checks User Role", async () => {
    const user = await createTestUserClient();
    const role = await checkUserRoleAction();
    expect(role).toBe('Customer');
  });

  it("Gets the users Role", async () => {
    const user = await createTestUserClient();
    const role = await getUserRole();
    expect(role).toBe('Customer');
  });

  it("Checks User Subscription", async () => {
    const user = await createTestUserClient();
    const subscription = await checkUserSubscription();
    expect(subscription).toBeNull();
  });

  it("Checks User Email Preference", async () => {
    const user = await createTestUserClient();
    const emailPreference = await getUserEmailPreferenceAction(user.id);
    expect(emailPreference).toBeNull();
  });

  it("Gets all users", async () => {
    await createTestUserClient();

    const response = await getAllUsersAction();
    
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    
    const users = response.data;
    expect(Array.isArray(users)).toBe(true);
    expect(users?.length).toBeGreaterThan(0);
    
    const testUser = users?.find(u => u.email === "testedUser@test.com");
    expect(testUser).toBeDefined();
    expect(testUser?.firstName).toBe("John");
    expect(testUser?.lastName).toBe("Doe");
    expect(testUser?.role).toBe("Customer");
  });

  it("Checks users stripeConnectId", async () => {
    const user = await createTestUserClient();
    const response = await prisma.mechanic.findUnique({
      where: { userId: user.id },
    });
    const stripeConnectId = await getStripeConnectId(response?.id);
    expect(stripeConnectId).toBeDefined();
  });

  it("Gets user profile", async () => {
    const user = await createTestUserClient();
    const response = await getUserProfileAction(user.id);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data?.firstName).toBe("John");
    expect(response.data?.lastName).toBe("Doe");
  });

  it("Gets user", async () => {
    const user = await createTestUserClient();
    const response = await getUserAction(user.id);
    expect(response).toBeDefined();
    expect(response?.firstName).toBe("John");
    expect(response?.lastName).toBe("Doe");
  });

  it("Checks users stripeCustomerId", async () => {
    const user = await createTestUserClient();
    const stripeCustomerId = await getStripeCustomerId();
    expect(stripeCustomerId).toBeDefined();
  });

  it("Checks users stripeSubscriptionPlan", async () => {
    const user = await createTestUserClient();
    expect(user.stripeSubscriptionPlan).toBe('PRO');
  });

  it("Updates user profile", async () => {
    const user = await createTestUserClient();
    // const response = await updateUserProfileAction(user.id, {
    //   firstName: "Jane",
    //   lastName: "Doe",
    // });
    // expect(response).toBeDefined();
    // expect(response?.firstName).toBe("Jane");
    // expect(response?.lastName).toBe("Doe");
  });

  it("Updates profile image", async () => {
    const user = await createTestUserClient();
    const response = await updateProfileImageAction(user.id, "https://example.com/profile.jpg");
    expect(response).toBeDefined();
  });

  it("Updates stripe customer id", async () => {
    const user = await createTestUserClient();
    const response = await updateStripeCustomerId(user.id, "test");
    expect(response).toBeDefined();
  });

  it("Updates user email preference", async () => {
    const user = await createTestUserClient();
    const response = await updateUserEmailPreferenceAction(user.id, true);
    expect(response).toBeDefined();
  });
});