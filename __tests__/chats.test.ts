// __tests__/chats.test.ts
import { prisma } from "@/lib/prisma";
import { describe, expect, it } from "@jest/globals"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action";
import { createMessageAction } from "@/app/actions/chats/create-message.action";
import { getChatByUserIdAction } from "@/app/actions/chats/get-chat-by-user-id.action";
import { getChatMessages } from "@/app/actions/chats/get-chat-messages.action";
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

  it("should create a chat", async () => {
    const client = await createTestUserClient();
    const mechanic = await createTestUserMechanic();
    const chat = await createChatWithUserAction(client.id, mechanic.id);
    expect(chat).toBeDefined();

    await deleteTestUser(client.id);
    await deleteTestUser(mechanic.id);

    await prisma.chat.delete({
      where: {
        id: chat.chat?.id
      }
    });
  });

  it("should create a message", async () => {
    const client = await createTestUserClient();
    const mechanic = await createTestUserMechanic();
    const chat = await createChatWithUserAction({
      userId: client.id,
      mechanicId: mechanic.id
    });
    const message = await createMessageAction({
      chatId: chat.id,
      userId: client.id,
      content: "Hello, how are you?"
    });
    expect(message).toBeDefined();
  });

  it("should get chat by user id", async () => {
    const client = await createTestUserClient();
    const mechanic = await createTestUserMechanic();
    const chat = await createChatWithUserAction({
      userId: client.id,
      mechanicId: mechanic.id
    });
    const chatByUserId = await getChatByUserIdAction({
      userId: client.id
    });
    expect(chatByUserId).toBeDefined();
  });

  it("should get chat messages", async () => {
    const client = await createTestUserClient();
    const mechanic = await createTestUserMechanic();
    const chat = await createChatWithUserAction({
      userId: client.id,
      mechanicId: mechanic.id
    });
    const message = await createMessageAction({
      chatId: chat.id,
      userId: client.id,
      content: "Hello, how are you?"
    });
    const chatMessages = await getChatMessages({
      chatId: chat.id
    });
    expect(chatMessages).toBeDefined();
  });

})
