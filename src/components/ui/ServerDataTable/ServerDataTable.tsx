"use client";

import { useCallback, useState } from "react";
import { type SortDescriptor } from "react-aria-components";
import { FaPlus } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable/DataTable";
import { ListToolbar } from "@/components/ui/ListToolbar/ListToolbar";
import { ProgressCircle } from "@/components/ui/ProgressCircle/ProgressCircle";
import type { FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import type { CursorPage } from "@/lib/domain/pagination";
import { toSortQuery } from "@/lib/domain/sort";
import { useCursorPagination } from "@/lib/hooks/useCursorPagination";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { FilterValues, PageQuery } from "@/lib/primitives/types";

import styles from "./ServerDataTable.module.css";

interface ServerDataTableProps<T extends { id: string }> {
  fetchAction: (params: PageQuery) => Promise<CursorPage<T>>;
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  emptyContent?: string;
  loadingMessage?: string;
  searchLabel?: string;
  filters?: FilterDefinition[];
  renderAddButton?: boolean;
  addButtonLabel?: string;
  onAddButtonPress?: () => void;
  selectionMode?: "none" | "single" | "multiple";
  selectionBehavior?: "toggle" | "replace";
  onRowAction?: (key: string) => void;
  refreshTrigger?: number;
  initialRows?: T[];
  initialCursor?: string | null;
  filtersValue?: FilterValues;
  onFiltersChange?: (values: FilterValues) => void;
  collectionDependencies?: unknown[];
}

export function ServerDataTable<T extends { id: string }>({
  fetchAction,
  columns,
  searchPlaceholder = "Search...",
  emptyContent = "No items yet",
  loadingMessage = "Loading...",
  searchLabel = "Search",
  filters,
  renderAddButton = false,
  addButtonLabel = "Add",
  onAddButtonPress,
  selectionMode = "single",
  selectionBehavior = "replace",
  onRowAction,
  refreshTrigger,
  initialRows,
  initialCursor,
  filtersValue,
  onFiltersChange,
  collectionDependencies,
}: ServerDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | undefined>();
  const [internalFilters, setInternalFilters] = useState<FilterValues>({});
  const filterValues = filtersValue ?? internalFilters;

  const handleFiltersChange = useCallback(
    (next: FilterValues) => {
      if (filtersValue === undefined) {
        setInternalFilters(next);
      }
      onFiltersChange?.(next);
    },
    [filtersValue, onFiltersChange],
  );

  const debouncedSearch = useDebounce(search, 300);

  const { items, hasMore, isLoading, isInitialLoad, loadMore } = useCursorPagination({
    fetchPage: fetchAction,
    query: { search: debouncedSearch, sort: toSortQuery(sortDescriptor), filters: filterValues },
    pageSize: 10,
    refreshTrigger,
    initialRows,
    initialCursor,
    loadErrorMessage: "The list could not be loaded. Please check your connection and try again.",
    loadMoreErrorMessage: "Additional items could not be loaded. Please try again.",
  });

  const hasActiveFilters = Object.values(filterValues).some((selected) => selected.length > 0);

  let computedEmptyContent: string | undefined;
  if (items.length === 0 && !isLoading) {
    computedEmptyContent = emptyContent;
    if (hasActiveFilters) {
      computedEmptyContent = "No results matching the current filters";
    }
    if (debouncedSearch) {
      computedEmptyContent = `No results matching "${debouncedSearch}"`;
    }
    if (debouncedSearch && hasActiveFilters) {
      computedEmptyContent = `No results matching "${debouncedSearch}" with the current filters`;
    }
  }

  return (
    <div className={styles.content}>
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        searchLabel={searchLabel}
        filters={filters}
        filterValues={filterValues}
        onFiltersChange={handleFiltersChange}
        className={styles.toolbar}
      >
        {renderAddButton && (
          <Button
            variant="primary"
            className={styles.addButton}
            aria-label={addButtonLabel}
            onPress={onAddButtonPress}
          >
            <FaPlus /> {addButtonLabel}
          </Button>
        )}
      </ListToolbar>
      {isInitialLoad ? (
        <div className={styles.loadingContainer}>
          <ProgressCircle aria-label={loadingMessage} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          selectionMode={selectionMode}
          selectionBehavior={selectionBehavior}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoading={isLoading}
          emptyContent={computedEmptyContent}
          onRowAction={onRowAction}
          collectionDependencies={collectionDependencies}
        />
      )}
    </div>
  );
}
