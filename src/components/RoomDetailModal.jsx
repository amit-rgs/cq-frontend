import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Users, Bed, Bath, Ruler } from 'lucide-react';

// Pass open, onClose, and room props
export default function RoomDetailModal({ open, onClose, room }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;

  const next = () => setIdx((i) => (i + 1) % room.images.length);
  const prev = () => setIdx((i) => (i - 1 + room.images.length) % room.images.length);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative p-0 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-7 bg-white hover:bg-gray-100 rounded-full p-1 z-20"
        >
          <X className="h-7 w-7" />
        </button>
        <div className="p-6 pt-8">
          <h2 className="font-bold text-2xl mb-5">{room.name}</h2>
          <div className="relative w-full mb-4">
            <img src={room.images[idx]} alt="" className="rounded-xl w-full h-64 object-cover" />
            {room.images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
                >
                  <ArrowLeft />
                </button>
                <button
                  onClick={next}
                  className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
                >
                  <ArrowRight />
                </button>
              </>
            )}
          </div>
          {/* Feature Icons Row */}
          <div className="rounded-xl border flex flex-wrap gap-6 items-center p-3 mb-5 bg-gray-50">
            <span className="flex items-center gap-2 text-gray-700">
              <Ruler className="w-5 h-5" /> 400 sq.ft (37 sq.mt)
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <Bed className="w-5 h-5" /> King Bed
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <Bath className="w-5 h-5" /> 1 Bathroom
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <Users className="w-5 h-5" /> Max {room.maxOccupancy} Guests
            </span>
            {room.poolView && (
              <span className="flex items-center gap-2 text-gray-700">🏊 Pool View</span>
            )}
          </div>
          {/* Description */}
          <div className="mb-3">
            <div className="font-bold mb-1">About the room</div>
            <div className="text-gray-800 text-sm">
              {room.detailDescription || room.description}
            </div>
          </div>
          {/* Amenities Heading (optional) */}
          <div>
            <div className="font-bold mb-1">Amenities</div>
            <div className="text-gray-700 text-sm flex flex-wrap gap-4">
              {room.amenities?.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
