import { describe, it, expect } from 'vitest';
import {
  buildPaginationMeta,
  createPaginatedResponse,
  parsePaginationParams,
} from '../../backend/core/pagination';

describe('Pagination Standard Unit Tests', () => {
  it('should calculate pagination metadata correctly', () => {
    const meta = buildPaginationMeta(2, 10, 35);

    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.totalItems).toBe(35);
    expect(meta.totalPages).toBe(4);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPrevPage).toBe(true);
  });

  it('should handle edge cases: single page', () => {
    const meta = buildPaginationMeta(1, 20, 5);

    expect(meta.page).toBe(1);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });

  it('should parse URL search params with safe defaults', () => {
    const params = new URLSearchParams('page=3&limit=25&sortBy=nome&sortOrder=asc');
    const query = parsePaginationParams(params);

    expect(query.page).toBe(3);
    expect(query.limit).toBe(25);
    expect(query.sortBy).toBe('nome');
    expect(query.sortOrder).toBe('asc');
  });

  it('should apply default values when query params are absent', () => {
    const params = new URLSearchParams('');
    const query = parsePaginationParams(params);

    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
    expect(query.sortOrder).toBe('desc');
  });

  it('should create standardized paginated response object', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const response = createPaginatedResponse(items, 2, 1, 10, 'req-pag-001');

    expect(response.success).toBe(true);
    expect(response.data).toEqual(items);
    expect(response.pagination.totalItems).toBe(2);
    expect(response.requestId).toBe('req-pag-001');
    expect(response.timestamp).toBeDefined();
  });
});
