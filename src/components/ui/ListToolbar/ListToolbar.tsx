"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

import { SearchField } from "@/components/ui/SearchField/SearchField";
import { TableFilter, type FilterDefinition } from "@/components/ui/TableFilter/TableFilter";
import type { FilterValues } from "@/lib/primitives/types";

import styles from "./ListToolbar.module.css";

export interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: FilterDefinition[];
  filterValues?: FilterValues;
  onFiltersChange?: (values: FilterValues) => void;
  className?: string;
  children?: ReactNode;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel = "Search",
  filters,
  filterValues,
  onFiltersChange,
  className,
  children,
}: ListToolbarProps) {
  return (
    <div className={clsx(styles.toolbar, className)}>
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        aria-label={searchLabel}
        className={styles.searchField}
      />
      {filters && filters.length > 0 && onFiltersChange && (
        <TableFilter
          filters={filters}
          values={filterValues ?? {}}
          onChange={onFiltersChange}
          onClear={() => onFiltersChange({})}
        />
      )}
      {children}
    </div>
  );
}
