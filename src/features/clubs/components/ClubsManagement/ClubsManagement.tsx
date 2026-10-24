"use client";

import { useState } from "react";
import { FaPenToSquare, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import type { ColumnDef } from "@/components/ui/DataTable/DataTable";
import { ServerDataTable } from "@/components/ui/ServerDataTable/ServerDataTable";
import { deleteClubAction, getClubPageAction } from "@/features/clubs/actions";
import { ClubFormModal } from "@/features/clubs/components/ClubFormModal/ClubFormModal";
import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import type { ClubRow } from "@/features/clubs/queries";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";

import styles from "./ClubsManagement.module.css";

interface ClubsManagementProps {
  initialRows: ClubRow[];
  initialCursor: string | null;
}

export function ClubsManagement({ initialRows, initialCursor }: ClubsManagementProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editClub, setEditClub] = useState<ClubRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ClubRow | null>(null);

  const refresh = () => setRefreshTrigger((trigger) => trigger + 1);

  const columns: ColumnDef<ClubRow>[] = [
    {
      id: "name",
      name: "Club",
      isRowHeader: true,
      render: (_value, row) => row.name,
    },
    { id: "memberCount", name: "Members" },
    { id: "eventCount", name: "Events" },
    {
      id: "id",
      name: "Actions",
      render: (_value, row) => (
        <div className={styles.actions}>
          <Button variant="ghost" aria-label="Edit club" onPress={() => setEditClub(row)}>
            <FaPenToSquare aria-hidden="true" className={styles.actionIcon} />
          </Button>
          <Button variant="ghost" aria-label="Delete club" onPress={() => setDeleteRow(row)}>
            <FaTrash aria-hidden="true" className={styles.actionIcon} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <ServerDataTable
        fetchAction={getClubPageAction}
        columns={columns}
        initialRows={initialRows}
        initialCursor={initialCursor}
        searchPlaceholder="Search clubs..."
        searchLabel="Search clubs"
        selectionMode="none"
        renderAddButton
        addButtonLabel="Add club"
        onAddButtonPress={() => setAddOpen(true)}
        refreshTrigger={refreshTrigger}
        emptyContent="No clubs yet"
      />
      <ClubFormModal isOpen={addOpen} onOpenChange={setAddOpen} onSuccess={refresh} />
      {editClub && (
        <ClubFormModal
          key={editClub.id}
          club={editClub}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditClub(null);
          }}
          onSuccess={refresh}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteRow}
        onOpenChange={(open) => {
          if (!open) setDeleteRow(null);
        }}
        title="Delete club"
        confirmLabel="Delete club"
        onConfirm={async () => {
          if (!deleteRow) return;
          const result = await deleteClubAction({ clubId: deleteRow.id });
          if (!result.success) {
            toastActionError(result, "delete club");
            return;
          }
          setDeleteRow(null);
          refresh();
          toastSuccess(
            "Club deleted",
            `The club ${deleteRow.shortName ?? deleteRow.name} has been deleted.`,
          );
        }}
      >
        Are you sure you want to delete{" "}
        {deleteRow && <ClubLabel name={deleteRow.name} shortName={deleteRow.shortName} />}? This
        action cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
