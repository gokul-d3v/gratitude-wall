import React from 'react';

export const StickyNoteCardSkeleton: React.FC = () => {
  return (
    <div className="sticky-note skeleton-card p-4 flex flex-col rounded-lg relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="skeleton-shimmer" />

      {/* Top Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar circle */}
        <div className="skeleton-block w-10 h-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          {/* Badge */}
          <div className="skeleton-block h-3 w-20 rounded-md" />
          {/* Name */}
          <div className="skeleton-block h-4 w-32 rounded-md" />
          {/* Time */}
          <div className="skeleton-block h-2.5 w-16 rounded-md" />
        </div>
      </div>

      {/* Message Body - 3 lines */}
      <div className="flex flex-col gap-2 flex-grow mt-2">
        <div className="skeleton-block h-3.5 w-full rounded-md" />
        <div className="skeleton-block h-3.5 w-5/6 rounded-md" />
        <div className="skeleton-block h-3.5 w-4/6 rounded-md" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {/* Like button placeholder */}
          <div className="skeleton-block h-5 w-10 rounded-full" />
          {/* Author */}
          <div className="skeleton-block h-3.5 w-20 rounded-md" />
        </div>
        {/* #gratitude */}
        <div className="skeleton-block h-3 w-14 rounded-md" />
      </div>
    </div>
  );
};
