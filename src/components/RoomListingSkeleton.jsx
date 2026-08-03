import React from 'react';

export default function RoomListingSkeleton() {
  return (
    <div className="flex flex-col md:flex-row border border-gray-200 rounded-2xl bg-white shadow-sm p-5 min-h-[240px] animate-pulse">
      <div className="md:w-72 w-full flex-shrink-0 flex items-center justify-center">
        <div className="rounded-xl bg-gray-200 w-full h-48 md:h-44" />
      </div>
      <div className="flex-1 pl-0 md:pl-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 rounded bg-gray-200 mb-1" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded mb-4 mt-2" />
          <div className="flex gap-2 mb-2">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-24 bg-gray-100 mb-2 rounded" />
        </div>
        <div className="flex justify-between items-end gap-4 mt-2">
          <div>
            <div className="mb-2 h-6 w-20 rounded bg-gray-200" />
            <div className="h-2 w-16 bg-gray-100 rounded" />
          </div>
          <div className="h-10 w-24 bg-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
