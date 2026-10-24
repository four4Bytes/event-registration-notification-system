"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { appendPage, type CursorPage } from "@/lib/domain/pagination";
import { toastError } from "@/lib/hooks/toast-utils";
import type { PageQuery } from "@/lib/primitives/types";

/** Query parameters without the cursor/pageSize, which the hook manages. */
type ListQuery = Omit<PageQuery, "cursor" | "pageSize">;

/** Options accepted by {@link useCursorPagination}. */
interface UseCursorPaginationOptions<T extends { id: string }> {
  /** Fetches one page; receives the current query, cursor, and page size. */
  fetchPage: (params: PageQuery) => Promise<CursorPage<T>>;
  /** Search/sort/filter inputs. Changing this resets to the first page. */
  query?: ListQuery;
  /** Rows requested per page. */
  pageSize?: number;
  /** Bump to force a refresh from the first page (e.g. after a mutation). */
  refreshTrigger?: number;
  /** Rows rendered server-side, skipping the initial client fetch. */
  initialRows?: T[];
  /** Cursor matching {@link initialRows} for the next page. */
  initialCursor?: string | null;
  /** Toast description shown when the first page fails to load. */
  loadErrorMessage?: string;
  /** Toast description shown when appending a page fails. */
  loadMoreErrorMessage?: string;
}

/** State and actions returned by {@link useCursorPagination}. */
interface UseCursorPaginationReturn<T> {
  /** Accumulated rows across all fetched pages. */
  items: T[];
  /** Patches the accumulated rows in place (e.g. to mark a row read). */
  setItems: Dispatch<SetStateAction<T[]>>;
  /** Whether another page is available. */
  hasMore: boolean;
  /** Whether any fetch (initial or append) is in flight. */
  isLoading: boolean;
  /** Whether the very first page has not resolved yet. */
  isInitialLoad: boolean;
  /** Whether an append (load-more) request is in flight. */
  isLoadingMore: boolean;
  /** Fetches and appends the next page. No-op while loading or exhausted. */
  loadMore: () => void;
  /** Refetches from the first page, discarding accumulated rows. */
  refresh: () => void;
}

/**
 * Drives keyset ("seek") cursor pagination for infinite-scroll lists.
 *
 * Fetches the first page on mount (or hydrates from `initialRows`), appends
 * subsequent pages via {@link loadMore}, and resets whenever `query` changes.
 * Roll forwards safely under concurrent keystrokes by ignoring responses from
 * superseded generations and de-duplicating rows on merge.
 *
 * @param options - Fetch function, query inputs, and pagination settings.
 * @returns The accumulated items and pagination controls.
 * @typeParam T - The row shape; must carry a unique string `id`.
 */
export function useCursorPagination<T extends { id: string }>({
  fetchPage,
  query,
  pageSize = 20,
  refreshTrigger,
  initialRows,
  initialCursor = null,
  loadErrorMessage = "The list could not be loaded. Please check your connection and try again.",
  loadMoreErrorMessage = "Additional items could not be loaded. Please try again.",
}: UseCursorPaginationOptions<T>): UseCursorPaginationReturn<T> {
  const [items, setItems] = useState<T[]>(initialRows ?? []);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialRows !== undefined ? initialCursor !== null : true);
  const [isInitialLoad, setIsInitialLoad] = useState(initialRows === undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const skipInitialFetch = useRef(initialRows !== undefined);
  const generationRef = useRef(0);

  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  const queryKey = useMemo(() => JSON.stringify(query ?? {}), [query]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }

    let cancelled = false;
    ++generationRef.current;
    setIsFetching(true);

    async function fetchFirstPage() {
      try {
        const result = await fetchPageRef.current({ ...queryRef.current, pageSize });
        if (cancelled) return;
        setItems(result.rows);
        setCursor(result.nextCursor);
        setHasMore(result.nextCursor !== null);
        setIsInitialLoad(false);
      } catch {
        if (cancelled) return;
        setIsInitialLoad(false);
        toastError("Failed to load data", loadErrorMessage);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    void fetchFirstPage();

    return () => {
      cancelled = true;
    };
  }, [queryKey, pageSize, refreshTrigger, refreshToken, loadErrorMessage]);

  const loadMore = useCallback(async () => {
    if (isFetching || isLoadingMore || !hasMore || !cursor) return;

    const generation = generationRef.current;
    setIsLoadingMore(true);
    try {
      const result = await fetchPageRef.current({
        ...queryRef.current,
        cursor,
        pageSize,
      });
      if (generation !== generationRef.current) return;
      setItems((prev) => appendPage(prev, result.rows));
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch {
      toastError("Failed to load more", loadMoreErrorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isFetching, isLoadingMore, hasMore, cursor, pageSize, loadMoreErrorMessage]);

  const refresh = useCallback(() => {
    skipInitialFetch.current = false;
    setRefreshToken((token) => token + 1);
  }, []);

  return {
    items,
    setItems,
    hasMore,
    isLoading: isFetching || isLoadingMore,
    isInitialLoad,
    isLoadingMore,
    loadMore: () => void loadMore(),
    refresh,
  };
}
