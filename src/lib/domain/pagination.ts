/** Default number of rows requested for a cursor-paginated list. */
export const DEFAULT_CURSOR_PAGE_SIZE = 20;

/** Maximum number of rows a cursor-paginated list may request. */
export const MAX_CURSOR_PAGE_SIZE = 50;

/** A single cursor page as returned by a list Server Action. */
export interface CursorPage<T> {
  /** Rows in display order for this page. */
  rows: T[];
  /** Opaque cursor for the next page, or `null` when exhausted. */
  nextCursor: string | null;
}

/** The boundary row key for a `(timestamp, id)` cursor. */
export interface TimestampCursor {
  /** Sort timestamp of the boundary row. */
  timestamp: Date;
  /** Unique id used to break timestamp ties. */
  id: string;
}

/**
 * Clamps a requested page size to the supported bounds.
 *
 * @param pageSize - Requested page size, or `undefined` for the default.
 * @returns A page size between 1 and {@link MAX_CURSOR_PAGE_SIZE}.
 */
export function resolveCursorPageSize(pageSize: number | undefined): number {
  return Math.min(Math.max(pageSize ?? DEFAULT_CURSOR_PAGE_SIZE, 1), MAX_CURSOR_PAGE_SIZE);
}

/**
 * Decodes a `(timestamp, id)` cursor produced by {@link encodeTimestampCursor}.
 *
 * @param cursor - Opaque cursor from a previous page.
 * @returns The decoded boundary key, or `null` when absent or malformed.
 */
export function decodeTimestampCursor(cursor: string | undefined): TimestampCursor | null {
  if (!cursor) return null;
  const parts = decodeCursor(cursor);
  const timestampMs = parts ? Number(parts[0]) : Number.NaN;
  const id = parts && typeof parts[1] === "string" ? parts[1] : null;
  if (!Number.isFinite(timestampMs) || !id) return null;
  return { timestamp: new Date(timestampMs), id };
}

/**
 * Encodes the `(timestamp, id)` key of the last row in a page.
 *
 * @param row - Boundary row carrying the timestamp and id.
 * @returns A base64url-encoded cursor for the next page.
 */
export function encodeTimestampCursor(row: TimestampCursor): string {
  return encodeCursor([row.timestamp.getTime(), row.id]);
}

/**
 * Appends a fetched page of rows onto an accumulated list, skipping rows that
 * are already present. Infinite-scroll accumulators can otherwise render the
 * same row twice when the underlying data shifts between page fetches (e.g. a
 * row is deleted), producing duplicate React keys.
 *
 * @param prev - Rows accumulated so far, in display order.
 * @param rows - Newly fetched page of rows.
 * @returns The merged list, or `prev` unchanged when the page adds nothing new.
 */
export function appendPage<T extends { id: string }>(prev: T[], rows: T[]): T[] {
  if (rows.length === 0) return prev;
  const seen = new Set(prev.map((row) => row.id));
  const fresh: T[] = [];
  for (const row of rows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      fresh.push(row);
    }
  }
  if (fresh.length === 0) return prev;
  return [...prev, ...fresh];
}

/**
 * Encodes the ordered key parts of the last row in a page into an opaque,
 * URL-safe cursor string.
 *
 * Keyset ("seek") pagination carries the sort key(s) of the boundary row rather
 * than an offset, so appended or removed rows between page fetches never shift
 * the window. Consumers treat the result as opaque and pass it back verbatim.
 *
 * @param parts - The sort key values of the boundary row, in sort order.
 * @returns A base64url-encoded cursor string.
 * @typeParam The parts are primitives (strings or numbers).
 */
export function encodeCursor(parts: (string | number)[]): string {
  return btoa(JSON.stringify(parts)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/**
 * Decodes an opaque cursor produced by {@link encodeCursor}.
 *
 * @param cursor - The cursor string previously returned by {@link encodeCursor}.
 * @returns The key parts, or `null` when the cursor is malformed or tampered with.
 */
export function decodeCursor(cursor: string): (string | number)[] | null {
  try {
    const base64 = cursor.replaceAll("-", "+").replaceAll("_", "/");
    const parsed: unknown = JSON.parse(atob(base64));
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (part): part is string | number => typeof part === "string" || typeof part === "number",
    );
  } catch {
    return null;
  }
}
