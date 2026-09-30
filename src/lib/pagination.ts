/** Shared list page size for inventory-style surfaces (Leads, Prioridades). */
export const LIST_PAGE_SIZE = 25;

/** Minha fila: max rows rendered per urgency section when filter=all. */
export const MY_QUEUE_SECTION_RENDER_LIMIT = 20;

/** Minha fila: page size when a single filter is active. */
export const MY_QUEUE_FILTER_PAGE_SIZE = 25;

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

/**
 * Parse 1-based page from URL. Invalid / missing → 1.
 */
export function parsePageParam(
  value: string | string[] | number | undefined,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.floor(n);
}

/**
 * Clamp requested page into [1, totalPages]. Empty result sets use page 1.
 */
export function clampPage(page: number, totalItems: number, pageSize: number): {
  page: number;
  totalPages: number;
  skip: number;
  take: number;
} {
  const size = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    totalPages,
    skip: (safePage - 1) * size,
    take: size,
  };
}

export function paginationState(
  page: number,
  totalItems: number,
  pageSize: number,
): PaginationState {
  const clamped = clampPage(page, totalItems, pageSize);
  return {
    page: clamped.page,
    pageSize,
    totalItems,
    totalPages: clamped.totalPages,
  };
}
