import React from "react";

// Base skeleton component with shimmer animation
const SkeletonBase = ({ className = "", rounded = "md" }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className} rounded-${rounded}`}
    style={{
      animation: "shimmer 2s infinite linear",
    }}
  />
);

// Card skeleton for events, users, etc.
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <SkeletonBase className="h-6 w-3/4" />
        <SkeletonBase className="h-4 w-1/2" />
      </div>
      <SkeletonBase className="h-8 w-20" rounded="full" />
    </div>
    <SkeletonBase className="h-20 w-full" />
    <div className="flex gap-2">
      <SkeletonBase className="h-6 w-16" rounded="full" />
      <SkeletonBase className="h-6 w-16" rounded="full" />
      <SkeletonBase className="h-6 w-16" rounded="full" />
    </div>
  </div>
);

// List of cards skeleton
export const CardListSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Table skeleton for user lists, event lists
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    {/* Table Header */}
    <div className="bg-gray-50 p-4 border-b border-gray-200">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-5 w-24" />
        ))}
      </div>
    </div>
    {/* Table Rows */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="p-4">
          <div className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <SkeletonBase
                key={colIdx}
                className={`h-4 ${colIdx === 0 ? "w-32" : "w-20"}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Kanban board skeleton for taskboard
export const KanbanSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {["To Do", "In Progress", "Done"].map((status) => (
      <div key={status} className="bg-gray-50 rounded-lg p-4">
        <SkeletonBase className="h-6 w-24 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-md shadow p-4 space-y-2">
              <SkeletonBase className="h-5 w-full" />
              <SkeletonBase className="h-4 w-3/4" />
              <div className="flex justify-between items-center pt-2">
                <SkeletonBase className="h-6 w-16" rounded="full" />
                <SkeletonBase className="h-8 w-8" rounded="full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Profile Info Card */}
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonBase className="h-8 w-48" />
        <SkeletonBase className="h-10 w-28" rounded="md" />
      </div>
      <div className="space-y-4">
        <div>
          <SkeletonBase className="h-4 w-16 mb-2" />
          <SkeletonBase className="h-6 w-48" />
        </div>
        <div>
          <SkeletonBase className="h-4 w-16 mb-2" />
          <SkeletonBase className="h-6 w-64" />
        </div>
        <div>
          <SkeletonBase className="h-4 w-24 mb-2" />
          <SkeletonBase className="h-6 w-40" />
        </div>
      </div>
    </div>
    {/* Password Card */}
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-8 w-40" />
        <SkeletonBase className="h-10 w-36" rounded="md" />
      </div>
    </div>
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6">
          <SkeletonBase className="h-4 w-24 mb-3" />
          <SkeletonBase className="h-10 w-16 mb-2" />
          <SkeletonBase className="h-3 w-32" />
        </div>
      ))}
    </div>
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <SkeletonBase className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <SkeletonBase className="h-5 w-3/4 mb-2" />
                <SkeletonBase className="h-4 w-1/2" />
              </div>
              <SkeletonBase className="h-8 w-8" rounded="full" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <SkeletonBase className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex-1">
                <SkeletonBase className="h-5 w-3/4 mb-2" />
                <SkeletonBase className="h-4 w-1/2" />
              </div>
              <SkeletonBase className="h-8 w-8" rounded="full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Event detail skeleton
export const EventDetailSkeleton = () => (
  <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonBase className="h-10 w-3/4 mb-3" />
          <SkeletonBase className="h-5 w-32" rounded="full" />
        </div>
        <SkeletonBase className="h-10 w-24" rounded="md" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-5 w-32" />
        </div>
        <div>
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-5 w-32" />
        </div>
        <div>
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-5 w-24" />
        </div>
        <div>
          <SkeletonBase className="h-4 w-20 mb-2" />
          <SkeletonBase className="h-5 w-24" />
        </div>
      </div>

      <div>
        <SkeletonBase className="h-5 w-24 mb-3" />
        <SkeletonBase className="h-24 w-full" />
      </div>

      <div>
        <SkeletonBase className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <SkeletonBase className="h-10 w-10" rounded="full" />
              <div className="flex-1">
                <SkeletonBase className="h-4 w-32 mb-1" />
                <SkeletonBase className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Archive list skeleton
export const ArchiveListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <SkeletonBase className="h-10 w-10" rounded="md" />
            <div className="flex-1">
              <SkeletonBase className="h-5 w-48 mb-2" />
              <SkeletonBase className="h-4 w-64" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonBase className="h-8 w-8" rounded="md" />
            <SkeletonBase className="h-8 w-8" rounded="md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <SkeletonBase className="h-8 w-48 mb-6" />
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <SkeletonBase className="h-4 w-24 mb-2" />
          <SkeletonBase className="h-10 w-full" rounded="md" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonBase className="h-10 w-24" rounded="md" />
        <SkeletonBase className="h-10 w-24" rounded="md" />
      </div>
    </div>
  </div>
);

// Add shimmer animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}

export default {
  CardSkeleton,
  CardListSkeleton,
  TableSkeleton,
  KanbanSkeleton,
  ProfileSkeleton,
  DashboardSkeleton,
  EventDetailSkeleton,
  ArchiveListSkeleton,
  FormSkeleton,
};
