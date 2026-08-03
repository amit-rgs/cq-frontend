import React from 'react';
import { X, Users, Bed, Ruler, CigaretteOff, Wifi } from 'lucide-react';

export default function AddOnDetailModal({ open, onClose, addon, onAdd, onRemove, isSelected }) {
  if (!open || !addon) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col"
        style={{ maxHeight: '70vh', minHeight: 260 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-6 bg-white hover:bg-purple-100 rounded-full p-1 z-10"
        >
          <X className="h-7 w-7 text-purple-700" />
        </button>
        {/* Content wrapper is scrollable if content overflows */}
        <div className="flex-1 overflow-y-auto">
          {/* Big Image */}
          <img
            src={addon.image}
            alt={addon.title}
            className="rounded-t-2xl w-full h-[200px] object-cover"
          />
          {/* Subtitle */}
          <div className="px-10 pt-3 pb-2 font-medium text-gray-800 border-b">
            {addon.detailSubtitle || addon.subtitle}
          </div>
          {/* Amenity Icons Row */}
          {addon.amenities && (
            <div className="">
              {addon.amenities.guests && (
                <span className="flex items-center gap-1">
                  <Users className="w-5 h-5" /> {addon.amenities.guests}
                </span>
              )}
              {addon.amenities.beds && (
                <span className="flex items-center gap-1">
                  <Bed className="w-5 h-5" /> {addon.amenities.beds}
                </span>
              )}
              {addon.amenities.sqm && (
                <span className="flex items-center gap-1">
                  <Ruler className="w-5 h-5" /> {addon.amenities.sqm}
                </span>
              )}
              {addon.amenities.nonSmoking && (
                <span className="flex items-center gap-1">
                  <CigaretteOff className="w-5 h-5" /> Non-Smoking
                </span>
              )}
              {addon.amenities.wifi && (
                <span className="flex items-center gap-1">
                  <Wifi className="w-5 h-5" /> Free WiFi
                </span>
              )}
            </div>
          )}
          {/* Description */}
          <div className="px-10 pt-5 pb-2 text-gray-700">{addon.description}</div>
          {/* Features Grid */}
          {addon.features && (
            <div className="px-10 py-3">
              <div className="font-bold mb-1">Room Amenities</div>
              <div className="grid grid-cols-2 gap-y-1">
                {Object.entries(addon.features).map(([cat, vals], idx) => (
                  <div key={idx}>
                    <div className="font-semibold">{cat}</div>
                    <ul className="list-disc ml-5 text-gray-700 text-sm">
                      {vals.map((f, fid) => (
                        <li key={fid}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Price and Add/Remove Action: footer, not scrollable */}
        <div className="p-7 border-t flex justify-between items-center">
          <div>
            <div className="text-xs font-semibold mb-1 text-gray-600">ADD FOR</div>
            <div className="font-extrabold text-xl text-purple-700">
              +{addon.price?.toLocaleString()} INR
              <span className="font-normal text-base text-black"> {addon.unit} </span>
            </div>
            <div className="text-xs text-gray-500">per night</div>
          </div>
          <div>
            {isSelected ? (
              <button
                className="bg-purple-100 text-purple-700 px-8 py-2 rounded-lg font-semibold text-base border border-purple-700"
                onClick={() => {
                  onRemove(addon);
                  onClose();
                }}
              >
                Remove
              </button>
            ) : (
              <button
                className="bg-purple-700 text-white px-8 py-2 rounded-lg font-semibold text-base hover:bg-purple-800"
                onClick={() => {
                  onAdd(addon);
                  onClose();
                }}
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
