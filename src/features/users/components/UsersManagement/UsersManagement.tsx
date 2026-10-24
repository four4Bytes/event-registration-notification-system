"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaBan, FaPencil, FaPeopleGroup, FaUserCheck } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import type { ColumnDef } from "@/components/ui/DataTable/DataTable";
import { ServerDataTable } from "@/components/ui/ServerDataTable/ServerDataTable";
import { StatusBadge } from "@/components/ui/StatusBadge/StatusBadge";
import type { FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import { Tooltip, TooltipTrigger } from "@/components/ui/Tooltip/Tooltip";
import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import {
  cancelPendingInvitationAction,
  getUserManagementPageAction,
  setUserActiveAction,
} from "@/features/users/actions";
import { AddUserModal } from "@/features/users/components/AddUserModal/AddUserModal";
import { AssignClubModal } from "@/features/users/components/AssignClubModal/AssignClubModal";
import { EditRoleModal } from "@/features/users/components/EditRoleModal/EditRoleModal";
import { roleLabels } from "@/features/users/constants";
import type { UserManagementRow } from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import styles from "./UsersManagement.module.css";

interface UsersManagementProps {
  initialRows: UserManagementRow[];
  initialCursor: string | null;
}

const assignableRoles = [Role.STUDENT, Role.OFFICER, Role.ADMIN] as const;
type AssignableRole = (typeof assignableRoles)[number];

function isAssignableRole(role: Role): role is AssignableRole {
  return assignableRoles.some((assignable) => assignable === role);
}

const userFilters: FilterDefinition[] = [
  {
    key: "role",
    label: "Role",
    options: Object.values(Role).map((role) => ({ value: role, label: roleLabels[role] })),
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ],
  },
];

export function UsersManagement({ initialRows, initialCursor }: UsersManagementProps) {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [roleRow, setRoleRow] = useState<UserManagementRow | null>(null);
  const [clubRow, setClubRow] = useState<UserManagementRow | null>(null);
  const [statusRow, setStatusRow] = useState<UserManagementRow | null>(null);
  const [invitationRow, setInvitationRow] = useState<UserManagementRow | null>(null);

  const refresh = () => setRefreshTrigger((trigger) => trigger + 1);

  const columns: ColumnDef<UserManagementRow>[] = [
    { id: "name", name: "Name", isRowHeader: true },
    { id: "email", name: "Email" },
    {
      id: "role",
      name: "Role",
      render: (_value, row) => roleLabels[row.role],
    },
    {
      id: "clubName",
      name: "Club",
      render: (_value, row) =>
        row.clubName ? <ClubLabel name={row.clubName} shortName={row.clubShortName} /> : "—",
    },
    {
      id: "isActive",
      name: "Status",
      render: (_value, row) =>
        row.kind === "pending" ? (
          <StatusBadge variant="pending">Pending</StatusBadge>
        ) : row.isActive ? (
          <StatusBadge variant="done">Active</StatusBadge>
        ) : (
          <StatusBadge variant="danger">Inactive</StatusBadge>
        ),
    },
    {
      id: "id",
      name: "Actions",
      render: (_value, row) => (
        <div className={styles.actions}>
          {row.kind === "pending" ? (
            <Button variant="ghost" onPress={() => setInvitationRow(row)}>
              Cancel invitation
            </Button>
          ) : (
            <>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  aria-label="Edit role"
                  isDisabled={row.role === Role.DEV}
                  onPress={() => setRoleRow(row)}
                >
                  <FaPencil aria-hidden="true" className={styles.actionIcon} />
                </Button>
                <Tooltip>
                  {row.role === Role.DEV ? "Developer role cannot be edited" : "Edit role"}
                </Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <Button variant="ghost" aria-label="Assign club" onPress={() => setClubRow(row)}>
                  <FaPeopleGroup aria-hidden="true" className={styles.actionIcon} />
                </Button>
                <Tooltip>Assign club</Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  aria-label={row.isActive ? "Deactivate user" : "Reactivate user"}
                  onPress={() => setStatusRow(row)}
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
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <ServerDataTable
        fetchAction={getUserManagementPageAction}
        columns={columns}
        initialRows={initialRows}
        initialCursor={initialCursor}
        searchPlaceholder="Search users..."
        searchLabel="Search users"
        filters={userFilters}
        selectionMode="none"
        renderAddButton
        addButtonLabel="Add user"
        onAddButtonPress={() => setAddOpen(true)}
        refreshTrigger={refreshTrigger}
        emptyContent="No users yet"
      />
      <AddUserModal isOpen={addOpen} onOpenChange={setAddOpen} onSuccess={refresh} />
      {clubRow && clubRow.kind === "user" && (
        <AssignClubModal
          key={clubRow.id}
          userId={clubRow.id}
          userLabel={clubRow.name ?? clubRow.email}
          initialClubId={clubRow.clubId}
          isOpen
          onOpenChange={(open) => {
            if (!open) setClubRow(null);
          }}
          onSuccess={refresh}
        />
      )}
      {roleRow && isAssignableRole(roleRow.role) && (
        <EditRoleModal
          userId={roleRow.id}
          userEmail={roleRow.email}
          initialRole={roleRow.role}
          isOpen
          onOpenChange={(open) => {
            if (!open) setRoleRow(null);
          }}
          onSuccess={(selfDemoted) => {
            if (selfDemoted) {
              router.replace("/access-changed");
              return;
            }
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        isOpen={!!statusRow}
        onOpenChange={(open) => {
          if (!open) setStatusRow(null);
        }}
        title={statusRow?.isActive ? "Deactivate user" : "Reactivate user"}
        confirmLabel={statusRow?.isActive ? "Deactivate" : "Reactivate"}
        onConfirm={async () => {
          if (!statusRow) return;
          const isActive = !statusRow.isActive;
          const result = await setUserActiveAction({ userId: statusRow.id, isActive });
          if (!result.success) {
            toastActionError(result, isActive ? "reactivate user" : "deactivate user");
            return;
          }
          if (result.data?.selfDeactivated) {
            router.push("/deactivated?reason=deactivated");
            return;
          }
          setStatusRow(null);
          refresh();
          toastSuccess(
            isActive ? "User reactivated" : "User deactivated",
            isActive
              ? `The account for ${statusRow.email} can sign in again.`
              : `The account for ${statusRow.email} has been deactivated.`,
          );
        }}
      >
        {statusRow?.isActive ? (
          <>
            Are you sure you want to deactivate <strong>{statusRow.name ?? statusRow.email}</strong>
            ? They won&apos;t be able to sign in.
          </>
        ) : (
          <>
            Are you sure you want to reactivate{" "}
            <strong>{statusRow?.name ?? statusRow?.email}</strong>? They will be able to sign in
            again.
          </>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={!!invitationRow}
        onOpenChange={(open) => {
          if (!open) setInvitationRow(null);
        }}
        title="Cancel invitation"
        confirmLabel="Cancel invitation"
        onConfirm={async () => {
          if (!invitationRow) return;
          const result = await cancelPendingInvitationAction({
            roleAssignmentId: invitationRow.id,
          });
          if (!result.success) {
            toastActionError(result, "cancel invitation");
            return;
          }
          setInvitationRow(null);
          refresh();
          toastSuccess(
            "Invitation cancelled",
            `The invitation for ${invitationRow.email} has been cancelled.`,
          );
        }}
      >
        Are you sure you want to cancel the invitation for <strong>{invitationRow?.email}</strong>?
        They will need to be invited again.
      </ConfirmDialog>
    </div>
  );
}
