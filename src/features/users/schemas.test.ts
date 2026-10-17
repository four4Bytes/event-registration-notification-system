import { describe, expect, it } from "vitest";

import {
  AddPendingUserSchema,
  AssignableRoleSchema,
  UpdateRoleSchema,
} from "@/features/users/schemas";
import { Role } from "@/generated/prisma/browser";

const userId = `c${"a".repeat(24)}`;

describe("assignable roles", () => {
  it("rejects the retired ATTENDANCE_STAFF role in every payload", () => {
    expect(AssignableRoleSchema.safeParse("ATTENDANCE_STAFF").success).toBe(false);
    expect(UpdateRoleSchema.safeParse({ userId, role: "ATTENDANCE_STAFF" }).success).toBe(false);
    expect(
      AddPendingUserSchema.safeParse({ email: "staff@acdeducation.com", role: "ATTENDANCE_STAFF" })
        .success,
    ).toBe(false);
  });

  it("accepts every remaining assignable role", () => {
    for (const role of [Role.STUDENT, Role.OFFICER, Role.ADMIN, Role.APPROVER]) {
      expect(AssignableRoleSchema.safeParse(role).success).toBe(true);
    }
  });

  it("keeps DEV out of the assignable set, since it is support-only", () => {
    expect(AssignableRoleSchema.safeParse(Role.DEV).success).toBe(false);
  });
});
