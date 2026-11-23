import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Cleanly aligned Pagination bar for listing pages.
 * Keeps all page buttons in a single symmetrical dock with uniform width and height.
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current 1-based page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total count of filtered items
 * @param {number} props.visibleCount - Count of items currently displayed
 * @param {Function} props.onPageChange - Callback when switching page numbers
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  visibleCount,
  onPageChange,
}) {
  if (totalPages <= 1 && visibleCount >= totalItems) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i += 1) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-xs font-mono-code text-zinc-400">
        Showing <span className="text-red-400 font-semibold">{visibleCount}</span> of{' '}
        <span className="text-white font-semibold">{totalItems}</span> API records (Page{' '}
        <span className="text-white font-semibold">{currentPage}</span> of {totalPages})
      </div>

      {totalPages > 1 && (
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 w-9 rounded-xl text-xs font-mono-code font-bold inline-flex items-center justify-center transition cursor-pointer ${
                page === currentPage
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                  : 'text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
