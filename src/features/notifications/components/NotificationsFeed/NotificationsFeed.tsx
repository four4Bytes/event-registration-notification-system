"use client";

import { useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ListToolbar } from "@/components/ui/ListToolbar/ListToolbar";
import { ProgressCircle } from "@/components/ui/ProgressCircle/ProgressCircle";
import type { FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import {
  getNotificationPageAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { NotificationCard } from "@/features/notifications/components/NotificationCard/NotificationCard";
import { NotificationDetailModal } from "@/features/notifications/components/NotificationDetailModal/NotificationDetailModal";
import { SendNotificationModal } from "@/features/notifications/components/SendNotificationModal/SendNotificationModal";
import type { NotificationRow } from "@/features/notifications/queries";
import { useUnreadCount } from "@/features/notifications/unread-count-context";
import { toastActionError } from "@/lib/hooks/toast-utils";
import { useCursorPagination } from "@/lib/hooks/useCursorPagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { FilterValues } from "@/lib/primitives/types";

import styles from "./NotificationsFeed.module.css";

interface NotificationsFeedProps {
  initialNotifications: NotificationRow[];
  initialCursor: string | null;
  canCompose: boolean;
}

const notificationFilters: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { value: "unread", label: "Unread" },
      { value: "read", label: "Read" },
    ],
  },
];

function resolveEmptyMessage(search: string, hasActiveFilters: boolean): string {
  if (search) return `No notifications matching "${search}".`;
  if (hasActiveFilters) return "No notifications match the current filters.";
  return "You do not have any notifications yet.";
}

export function NotificationsFeed({
  initialNotifications,
  initialCursor,
  canCompose,
}: NotificationsFeedProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { decrement } = useUnreadCount();

  const { items, setItems, hasMore, isInitialLoad, isLoadingMore, loadMore, refresh } =
    useCursorPagination({
      fetchPage: getNotificationPageAction,
      query: { search: debouncedSearch, filters },
      initialRows: initialNotifications,
      initialCursor,
    });

  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  useEffect(() => {
    const root = listRef.current;
    const node = sentinelRef.current;
    if (!root || !node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { root, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, items.length]);

  async function handleOpen(notification: NotificationRow) {
    setSelected(notification);
    if (notification.isRead) return;

    const response = await markNotificationReadAction({ notificationId: notification.id });
    if (!response.success) {
      toastActionError(response, "mark notification as read");
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
    );
    setSelected((current) =>
      current && current.id === notification.id ? { ...current, isRead: true } : current,
    );
    decrement();
  }

  const hasActiveFilters = Object.values(filters).some((selected) => selected.length > 0);
  const isEmpty = !isInitialLoad && items.length === 0;
  const emptyMessage = resolveEmptyMessage(debouncedSearch, hasActiveFilters);

  return (
    <div className={styles.page}>
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search notifications..."
        searchLabel="Search notifications"
        filters={notificationFilters}
        filterValues={filters}
        onFiltersChange={setFilters}
      >
        {canCompose && (
          <Button className={styles.addButton} onPress={() => setIsComposeOpen(true)}>
            <FaPlus aria-hidden="true" />
            Send notification
          </Button>
        )}
      </ListToolbar>

      {isInitialLoad ? (
        <div className={styles.status}>
          <ProgressCircle aria-label="Loading notifications..." />
        </div>
      ) : isEmpty ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <div ref={listRef} className={styles.list}>
          {items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={(entry) => void handleOpen(entry)}
            />
          ))}
          {hasMore && (
            <div ref={sentinelRef} className={styles.sentinel}>
              {isLoadingMore && <ProgressCircle aria-label="Loading more notifications..." />}
            </div>
          )}
          {!hasMore && <p className={styles.end}>You&apos;re all caught up.</p>}
        </div>
      )}

      {canCompose && (
        <SendNotificationModal
          isOpen={isComposeOpen}
          onOpenChange={setIsComposeOpen}
          onSuccess={refresh}
        />
      )}
      {selected && (
        <NotificationDetailModal
          notification={selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </div>
  );
}
