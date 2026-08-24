'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '../types';

interface PaginationBarProps {
  pagination: PaginationMeta;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
}

export function PaginationBar({ pagination, onPageChange, onLimitChange }: PaginationBarProps) {
  const { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } = pagination;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs shadow-xs">
      <div className="text-slate-500 font-medium">
        Mostrando <span className="font-bold text-slate-800">{Math.min(totalItems, (page - 1) * limit + 1)}</span> a{' '}
        <span className="font-bold text-slate-800">{Math.min(totalItems, page * limit)}</span> de{' '}
        <span className="font-bold text-slate-800">{totalItems}</span> registros
      </div>

      <div className="flex items-center space-x-2">
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={5}>5 / pág</option>
            <option value={10}>10 / pág</option>
            <option value={20}>20 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        )}

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Página Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-md">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Próxima Página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
