import { describe, expect, it } from "@jest/globals";
import { prisma } from "@/lib/prisma";



describe("Role Tests", () => {
  it("Assigns Role", async () => {
    const user = await prisma.user.create({
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "testedUser.@test.com",
        role: 'Customer'
      }
    });
    expect(user.role).toBe('Customer');
    await prisma.user.delete({
      where: {
        id: user.id
      }
    });
  });
});
