"use client";

import { useState } from "react";
import { FaBan, FaPencil, FaUserCheck } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import { TextField } from "@/components/ui/TextField/TextField";
import { Tooltip, TooltipTrigger } from "@/components/ui/Tooltip/Tooltip";
import {
  cancelPendingUserAction,
  getUserManagementRowsAction,
  setActiveAction,
} from "@/features/users/actions";
import { AddUserModal } from "@/features/users/components/AddUserModal/AddUserModal";
import { EditRoleModal } from "@/features/users/components/EditRoleModal/EditRoleModal";
import type { UserManagementRow } from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";
import { toastActionError, toastError, toastSuccess } from "@/lib/hooks/toast-utils";

import styles from "./UsersManagement.module.css";

interface UsersManagementProps {
  initialRows: UserManagementRow[];
}

const roles = [Role.STUDENT, Role.OFFICER, Role.ADMIN, Role.APPROVER];
type AssignableRole = (typeof roles)[number];

export function UsersManagement({ initialRows }: UsersManagementProps) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [roleRow, setRoleRow] = useState<UserManagementRow | null>(null);

  async function refresh(value?: string) {
    const query = value ?? search;
    setSearch(query);
    try {
      setRows(await getUserManagementRowsAction(query));
    } catch {
      toastError(
        "Failed to refresh users",
        "We couldn't retrieve the user list. Please try again.",
      );
    }
  }

  async function run(
    action: Promise<{
      success: boolean;
      error?: { code: string; title: string; description: string };
    }>,
    operation: string,
  ) {
    const response = await action;
    if (!response.success) toastActionError(response, operation);
    else {
      toastSuccess("Changes saved", "The user management list has been updated.");
      await refresh();
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Administration</p>
          <h1>Manage users</h1>
        </div>
        <Button onPress={() => setAddOpen(true)}>+ Add user</Button>
      </div>
      <TextField label="Search users" value={search} onChange={(value) => void refresh(value)} />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.kind}-${row.id}`}
                className={row.kind === "pending" ? styles.pending : undefined}
              >
                <td>{row.name ?? "—"}</td>
                <td>{row.email}</td>
                <td>{row.role}</td>
                <td>
                  {row.kind === "pending" ? (
                    <StatusBadge variant="pending">Pending</StatusBadge>
                  ) : row.isActive ? (
                    <StatusBadge variant="done">Active</StatusBadge>
                  ) : (
                    <StatusBadge variant="danger">Inactive</StatusBadge>
                  )}
                </td>
                <td className={styles.actions}>
                  {row.kind === "pending" ? (
                    <Button
                      variant="ghost"
                      onPress={() =>
                        void run(
                          cancelPendingUserAction({ userId: row.id }),
                          "cancel pending assignment",
                        )
                      }
                    >
                      Cancel
                    </Button>
                  ) : (
                    <>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          aria-label="Edit role"
                          onPress={() => setRoleRow(row)}
                        >
                          <FaPencil aria-hidden="true" className={styles.actionIcon} />
                        </Button>
                        <Tooltip>Edit role</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          aria-label={row.isActive ? "Deactivate user" : "Reactivate user"}
                          onPress={() =>
                            void run(
                              setActiveAction({ userId: row.id, isActive: !row.isActive }),
                              "update user status",
                            )
                          }
                        >
                          {row.isActive ? (
                            <FaBan aria-hidden="true" className={styles.actionIcon} />
                          ) : (
                            <FaUserCheck aria-hidden="true" className={styles.actionIcon} />
                          )}
                        </Button>
                        <Tooltip>{row.isActive ? "Deactivate" : "Reactivate"}</Tooltip>
                      </TooltipTrigger>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddUserModal isOpen={addOpen} onOpenChange={setAddOpen} onSuccess={() => void refresh()} />
      {roleRow && roles.includes(roleRow.role as AssignableRole) && (
        <EditRoleModal
          userId={roleRow.id}
          userEmail={roleRow.email}
          initialRole={roleRow.role as AssignableRole}
          isOpen
          onOpenChange={(open) => {
            if (!open) setRoleRow(null);
          }}
          onSuccess={() => void refresh()}
        />
      )}
    </div>
  );
}
