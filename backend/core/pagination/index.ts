import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  requestId: string;
  timestamp: string;
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
  requestId: string = 'req-unknown'
): PaginatedResult<T> {
  return {
    success: true,
    data: items,
    pagination: buildPaginationMeta(page, limit, totalItems),
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export function parsePaginationParams(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): PaginationQuery {
  const params: Record<string, unknown> = {};

  if (searchParams instanceof URLSearchParams) {
    if (searchParams.has('page')) params.page = searchParams.get('page');
    if (searchParams.has('limit')) params.limit = searchParams.get('limit');
    if (searchParams.has('sortBy')) params.sortBy = searchParams.get('sortBy');
    if (searchParams.has('sortOrder')) params.sortOrder = searchParams.get('sortOrder');
  } else {
    params.page = searchParams.page;
    params.limit = searchParams.limit;
    params.sortBy = searchParams.sortBy;
    params.sortOrder = searchParams.sortOrder;
  }

  return paginationQuerySchema.parse(params);
}

export const extractPaginationParams = parsePaginationParams;

export function buildPaginatedResponse<T>(
  items: T[],
  params: { page: number; limit: number }
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: paginatedItems,
    total,
    page,
    limit,
    totalPages,
  };
}
