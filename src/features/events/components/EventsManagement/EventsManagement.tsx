"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaQrcode } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import type { ColumnDef } from "@/components/ui/DataTable/DataTable";
import { ServerDataTable } from "@/components/ui/ServerDataTable/ServerDataTable";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge/StatusBadge";
import type { FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import { getEventPageAction } from "@/features/events/actions";
import { EventFormModal } from "@/features/events/components/EventFormModal/EventFormModal";
import type { EventRow } from "@/features/events/queries";
import { EventStatus } from "@/generated/prisma/browser";
import { formatDateTime } from "@/lib/primitives/date";

import styles from "./EventsManagement.module.css";

interface EventsManagementProps {
  initialRows: EventRow[];
  initialCursor: string | null;
  canCreate: boolean;
  isAdmin: boolean;
}

const statusLabels: Record<EventStatus, string> = {
  [EventStatus.PENDING]: "Pending",
  [EventStatus.APPROVED]: "Approved",
  [EventStatus.REJECTED]: "Rejected",
  [EventStatus.CANCELLED]: "Cancelled",
};

const statusVariants: Record<EventStatus, StatusBadgeVariant> = {
  [EventStatus.PENDING]: "pending",
  [EventStatus.APPROVED]: "done",
  [EventStatus.REJECTED]: "danger",
  [EventStatus.CANCELLED]: "cancelled",
};

const eventFilters: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    options: Object.values(EventStatus).map((status) => ({
      value: status,
      label: statusLabels[status],
    })),
  },
];

export function EventsManagement({
  initialRows,
  initialCursor,
  canCreate,
  isAdmin,
}: EventsManagementProps) {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  const refresh = () => setRefreshTrigger((trigger) => trigger + 1);

  const columns: ColumnDef<EventRow>[] = [
    { id: "title", name: "Event", isRowHeader: true },
    {
      id: "startAt",
      name: "Starts",
      allowsSorting: true,
      render: (_value, row) => formatDateTime(row.startAt),
    },
    { id: "venue", name: "Location" },
    {
      id: "clubName",
      name: "Club",
      render: (_value, row) =>
        row.clubName ? <ClubLabel name={row.clubName} shortName={row.clubShortName} /> : "—",
    },
    {
      id: "status",
      name: "Status",
      render: (_value, row) => (
        <StatusBadge variant={statusVariants[row.status]}>{statusLabels[row.status]}</StatusBadge>
      ),
    },
    {
      id: "id",
      name: "Actions",
      render: (_value, row) => (
        <Button
          variant="ghost"
          aria-label={`View QR code for ${row.title}`}
          onPress={() => router.push(`/events/${row.id}`)}
        >
          <FaQrcode aria-hidden="true" className={styles.actionIcon} />
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <ServerDataTable
        fetchAction={getEventPageAction}
        columns={columns}
        initialRows={initialRows}
        initialCursor={initialCursor}
        searchPlaceholder="Search events..."
        searchLabel="Search events"
        filters={eventFilters}
        selectionMode="none"
        renderAddButton={canCreate}
        addButtonLabel="Add event"
        onAddButtonPress={() => setAddOpen(true)}
        refreshTrigger={refreshTrigger}
        emptyContent="No events yet"
      />
      {canCreate && (
        <EventFormModal
          isOpen={addOpen}
          onOpenChange={setAddOpen}
          onSuccess={refresh}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
