import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Wifi,
  UtensilsCrossed,
  Snowflake,
  ParkingSquare,
  Bath,
  Tv,
  Coffee,
  AlertTriangle,
  X,
  ArrowLeft,
  ArrowRight,
  Users,
  Bed,
  Ruler,
} from 'lucide-react';

const ICONS = {
  wifi: <Wifi className="w-5 h-5 text-purple-700" />,
  restaurant: <UtensilsCrossed className="w-5 h-5 text-purple-700" />,
  ac: <Snowflake className="w-5 h-5 text-purple-700" />,
  parking: <ParkingSquare className="w-5 h-5 text-purple-700" />,
  bath: <Bath className="w-5 h-5 text-purple-700" />,
  tv: <Tv className="w-5 h-5 text-purple-700" />,
  coffee: <Coffee className="w-5 h-5 text-purple-700" />,
};

function RoomDetailModal({ open, onClose, room }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;

  const next = () => setIdx((i) => (i + 1) % room.images.length);
  const prev = () => setIdx((i) => (i - 1 + room.images.length) % room.images.length);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-0 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-6 bg-white hover:bg-gray-100 rounded-full p-1 z-10"
        >
          <X className="h-7 w-7" />
        </button>
        <div className="p-6 pt-10">
          <h2 className="font-bold text-2xl mb-4">{room.roomtypename}</h2>
          <div className="relative w-full mb-4">
            <img
              src={room.images[idx]}
              alt={`${room.roomtypename} image`}
              className="rounded-xl w-full h-60 object-cover"
            />
            {room.images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
                >
                  <ArrowLeft />
                </button>
                <button
                  onClick={next}
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
                >
                  <ArrowRight />
                </button>
              </>
            )}
          </div>
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
              <Users className="w-5 h-5" /> Max {room.max_occupancy} Guests
            </span>
          </div>
          <div className="mb-3">
            <div className="font-bold mb-1">About the room</div>
            <div className="text-gray-800 text-sm">
              {room.detailDescription || room.description}
            </div>
          </div>
          <div>
            <div className="font-bold mb-1">Amenities</div>
            <div className="text-gray-700 text-sm flex flex-wrap gap-4">
              {room.amenities?.map((a) => (
                <span key={a.id ?? a}>{a.name ?? a}</span>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <div className="font-bold mb-1">Services</div>
            <div className="text-gray-700 text-sm flex flex-wrap gap-4">
              {room.service_categories?.map((s) => (
                <span key={s.id ?? s}>{s.name ?? s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomCard({
  room,
  nights = 1,
  roomsCount = 1,
  adults,
  children,
  checkin,
  checkout,
  onSelect,
}) {
  const [active, setActive] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Calculate price per night with fallbacks
  const pricePerNight =
    typeof room.total_dynamic_price === 'number'
      ? room.total_dynamic_price / nights / roomsCount
      : room.baseprice || room.price || 0;

  const total =
    typeof room.total_dynamic_price === 'number'
      ? room.total_dynamic_price
      : (room.baseprice || room.price || 0) * nights * roomsCount;

  const next = () => setActive((a) => (a + 1) % room.images.length);
  const prev = () => setActive((a) => (a - 1 + room.images.length) % room.images.length);

  const handleSelect = () => {
    // Store room data in localStorage
    const roomData = {
      roomId: room.roomtypeid,
      roomName: room.roomtypename,
      roomDescription: room.description,
      roomImages: room.images,
      maxOccupancy: room.max_occupancy || room.maxOccupancy,
      amenities: room.amenities,
      services: room.service_categories,
      basePrice: room.baseprice,
      dynamicPrice: room.total_dynamic_price,
      pricePerNight: pricePerNight,
      totalPrice: total,
      availableRooms: room.left || room.available_rooms || 10,
      // Store additional booking info
      checkin,
      checkout,
      adults,
      children,
      roomsCount,
      nights,
      // Timestamp for data freshness
      selectedAt: new Date().toISOString(),
    };

    localStorage.setItem('selectedRoom', JSON.stringify(roomData));

    // Also store individual items for easier access
    // localStorage.setItem('selectedRoomId', room.roomtypeid);
    // localStorage.setItem('selectedRoomName', room.roomtypename);
    localStorage.setItem('selectedRoomPrice', total.toString());
    localStorage.setItem('selectedRoomPerNight', pricePerNight.toString());

    // Call the original onSelect handler (for navigation)
    onSelect();
  };

  return (
    <>
      <div className="flex flex-col md:flex-row rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden max-w-full min-h-[220px] md:min-h-[260px] hover:shadow-2xl transition">
        {/* Images */}
        <div
          className="relative w-full md:w-2/5 flex-shrink-0 cursor-pointer flex flex-col min-h-[220px]"
          style={{ minHeight: '220px' }}
          onClick={() => setShowModal(true)}
        >
          <img
            src={room.images[active]}
            alt={`${room.roomtypename} image`}
            className="object-cover w-full h-full md:min-h-[260px] transition duration-200"
            style={{ minHeight: '220px' }}
          />
          {room.images.length > 1 && (
            <>
              <button
                className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/80 hover:bg-purple-100 p-1 rounded-full shadow-sm transition z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
              >
                <ChevronLeft />
              </button>
              <button
                className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 hover:bg-purple-100 p-1 rounded-full shadow-sm transition z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
              >
                <ChevronRight />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                {room.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx === active ? 'bg-purple-700' : 'bg-gray-300'
                    } transition`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-6 pr-6 pl-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[1.33rem] font-extrabold text-gray-800 leading-tight">
                {room.roomtypename}
              </h3>
              <div className="flex-shrink-0 flex items-center gap-1 text-red-600 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Only {room.left ?? room.available_rooms ?? 10} rooms left
              </div>
            </div>

            <div className="text-neutral-700 mb-3">{room.description}</div>

            <div className="flex gap-8 text-sm flex-wrap">
              <div>
                <span className="font-bold block mb-1">Amenities:</span>
                {room.amenities?.map((item, i) => (
                  <div key={item.id ?? i} className="text-gray-700">
                    • {item.name}
                  </div>
                ))}
              </div>
              <div>
                <span className="font-bold block mb-1">Services:</span>
                {room.service_categories?.map((s, i) => (
                  <div key={s.id ?? i} className="text-gray-700">
                    • {s.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <span className="font-bold">Max occupancy:</span>{' '}
              <span className="text-sm text-gray-700">
                {room.max_occupancy ?? room.maxOccupancy} Guests
              </span>
            </div>
          </div>
          <hr className="my-4 border-gray-200" />

          <div className="flex justify-between items-end gap-5 mt-4">
            <div>
              <div className="font-semibold text-sm text-gray-700 tracking-tight">
                ₹{Number(pricePerNight).toLocaleString()}
                <span className=" text-xs font-medium text-gray-700">/night</span>
              </div>

              <div className=" flex items-baseline font-bold text-black text-xl mt-1">
                ₹{Number(total).toLocaleString()}
                <div className="text-[10px] text-gray-500 ml-2 ">Excluding taxes and fees</div>
              </div>
            </div>
            <button
              className="bg-purple-700 text-white px-7 py-2 rounded-lg font-semibold text-base hover:bg-purple-800 transition shadow"
              onClick={handleSelect}
            >
              Select
            </button>
          </div>
        </div>
      </div>
      <RoomDetailModal open={showModal} onClose={() => setShowModal(false)} room={room} />
    </>
  );
}

// import React, { useState } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Wifi,
//   UtensilsCrossed,
//   Snowflake,
//   ParkingSquare,
//   Bath,
//   Tv,
//   Coffee,
//   AlertTriangle,
//   X,
//   ArrowLeft,
//   ArrowRight,
//   Users,
//   Bed,
//   Ruler,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const ICONS = {
//   wifi: <Wifi className="w-5 h-5 text-purple-700" />,
//   restaurant: <UtensilsCrossed className="w-5 h-5 text-purple-700" />,
//   ac: <Snowflake className="w-5 h-5 text-purple-700" />,
//   parking: <ParkingSquare className="w-5 h-5 text-purple-700" />,
//   bath: <Bath className="w-5 h-5 text-purple-700" />,
//   tv: <Tv className="w-5 h-5 text-purple-700" />,
//   coffee: <Coffee className="w-5 h-5 text-purple-700" />,
// };

// function RoomDetailModal({ open, onClose, room }) {
//   const [idx, setIdx] = useState(0);
//   if (!open) return null;

//   const next = () => setIdx((i) => (i + 1) % room.images.length);
//   const prev = () =>
//     setIdx((i) => (i - 1 + room.images.length) % room.images.length);

//   return (
//     <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
//       <div className="bg-white rounded-2xl max-w-2xl w-full p-0 shadow-2xl relative overflow-hidden">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-6 bg-white hover:bg-gray-100 rounded-full p-1 z-10"
//         >
//           <X className="h-7 w-7" />
//         </button>
//         <div className="p-6 pt-10">
//           <h2 className="font-bold text-2xl mb-4">{room.name}</h2>
//           <div className="relative w-full mb-4">
//             <img
//               src={room.images[idx]}
//               alt={`${room.name} image`}
//               className="rounded-xl w-full h-60 object-cover"
//             />
//             {room.images.length > 1 && (
//               <>
//                 <button
//                   onClick={prev}
//                   className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
//                 >
//                   <ArrowLeft />
//                 </button>
//                 <button
//                   onClick={next}
//                   className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 p-1 rounded-full shadow"
//                 >
//                   <ArrowRight />
//                 </button>
//               </>
//             )}
//           </div>
//           <div className="rounded-xl border flex flex-wrap gap-6 items-center p-3 mb-5 bg-gray-50">
//             <span className="flex items-center gap-2 text-gray-700">
//               <Ruler className="w-5 h-5" /> 400 sq.ft (37 sq.mt)
//             </span>
//             <span className="flex items-center gap-2 text-gray-700">
//               <Bed className="w-5 h-5" /> King Bed
//             </span>
//             <span className="flex items-center gap-2 text-gray-700">
//               <Bath className="w-5 h-5" /> 1 Bathroom
//             </span>
//             <span className="flex items-center gap-2 text-gray-700">
//               <Users className="w-5 h-5" /> Max {room.maxOccupancy} Guests
//             </span>
//           </div>
//           <div className="mb-3">
//             <div className="font-bold mb-1">About the room</div>
//             <div className="text-gray-800 text-sm">
//               {room.detailDescription || room.description}
//             </div>
//           </div>
//           <div>
//             <div className="font-bold mb-1">Amenities</div>
//             <div className="text-gray-700 text-sm flex flex-wrap gap-4">
//               {room.amenities?.map((a) => (
//                 <span key={a.id ?? a}>{a.name ?? a}</span>
//               ))}
//             </div>
//           </div>
//           <div className="mt-3">
//             <div className="font-bold mb-1">Services</div>
//             <div className="text-gray-700 text-sm flex flex-wrap gap-4">
//               {room.service_categories?.map((s) => (
//                 <span key={s.id ?? s}>{s.name ?? s}</span>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function RoomCard({
//   room,
//   nights = 1,
//   roomsCount = 1,
//   adults,
//   children,
//   checkin,
//   checkout,
//   onSelect,
// }) {
//   const [active, setActive] = useState(0);
//   const [showModal, setShowModal] = useState(false);

//   // Calculate price per night with fallbacks
//   const pricePerNight =
//     typeof room.total_dynamic_price === "number"
//       ? room.total_dynamic_price / nights / roomsCount
//       : room.baseprice || room.price || 0;

//   const total =
//     typeof room.total_dynamic_price === "number"
//       ? room.total_dynamic_price
//       : (room.baseprice || room.price || 0) * nights * roomsCount;

//   const next = () => setActive((a) => (a + 1) % room.images.length);
//   const prev = () =>
//     setActive((a) => (a - 1 + room.images.length) % room.images.length);

//   return (
//     <>
//       <div className="flex flex-col md:flex-row rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden max-w-full min-h-[220px] md:min-h-[260px] hover:shadow-2xl transition">
//         {/* Images */}
//         <div
//           className="relative w-full md:w-2/5 flex-shrink-0 cursor-pointer flex flex-col min-h-[220px]"
//           style={{ minHeight: "220px" }}
//           onClick={() => setShowModal(true)}
//         >
//           <img
//             src={room.images[active]}
//             alt={`${room.name} image`}
//             className="object-cover w-full h-full md:min-h-[260px] transition duration-200"
//             style={{ minHeight: "220px" }}
//           />
//           {room.images.length > 1 && (
//             <>
//               <button
//                 className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/80 hover:bg-purple-100 p-1 rounded-full shadow-sm transition z-10"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   prev();
//                 }}
//                 aria-label="Previous"
//               >
//                 <ChevronLeft />
//               </button>
//               <button
//                 className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 hover:bg-purple-100 p-1 rounded-full shadow-sm transition z-10"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   next();
//                 }}
//                 aria-label="Next"
//               >
//                 <ChevronRight />
//               </button>
//               <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
//                 {room.images.map((_, idx) => (
//                   <div
//                     key={idx}
//                     className={`w-2 h-2 rounded-full ${
//                       idx === active ? "bg-purple-700" : "bg-gray-300"
//                     } transition`}
//                   />
//                 ))}
//               </div>
//             </>
//           )}
//         </div>

//         {/* Details */}
//         <div className="flex-1 min-w-0 flex flex-col justify-between py-6 pr-6 pl-6">
//           <div>
//             <div className="flex items-center justify-between mb-1">
//               <h3 className="text-[1.33rem] font-extrabold text-gray-800 leading-tight">
//                 {room.roomtypename}
//               </h3>
//               <div className="flex-shrink-0 flex items-center gap-1 text-red-600 font-semibold text-sm">
//                 <AlertTriangle className="w-4 h-4" />
//                 Only {room.left ?? room.available_rooms ?? 10} rooms left
//               </div>
//             </div>

//             <div className="text-neutral-700 mb-3">{room.description}</div>

//             <div className="flex gap-8 text-sm flex-wrap">
//               <div>
//                 <span className="font-bold block mb-1">Amenities:</span>
//                 {room.amenities?.map((item, i) => (
//                   <div key={item.id ?? i} className="text-gray-700">
//                     • {item.name}
//                   </div>
//                 ))}
//               </div>
//               <div>
//                 <span className="font-bold block mb-1">Services:</span>
//                 {room.service_categories?.map((s, i) => (
//                   <div key={s.id ?? i} className="text-gray-700">
//                     • {s.name}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mt-3">
//               <span className="font-bold">Max occupancy:</span>{" "}
//               <span className="text-sm text-gray-700">
//                 {room.max_occupancy ?? room.maxOccupancy} Guests
//               </span>
//             </div>
//           </div>
//           <hr className="my-4 border-gray-200" />

//           <div className="flex justify-between items-end gap-5 mt-4">
//             <div>
//               <div className="font-semibold text-sm text-gray-700 tracking-tight">
//                 ₹{Number(pricePerNight).toLocaleString()}
//                 <span className=" text-xs font-medium text-gray-700">
//                   /night
//                 </span>
//               </div>

//               <div className=" flex items-baseline font-bold text-black text-xl mt-1">
//                 ₹{Number(total).toLocaleString()}
//                 {/* <span className="text-xs text-gray-600 ml-2">
//                   ({nights} night{nights > 1 ? "s" : ""} × {roomsCount} room
//                   {roomsCount > 1 ? "s" : ""})
//                 </span> */}
//                 <div className="text-[10px] text-gray-500 ml-2 ">
//                   Excluding taxes and fees
//                 </div>
//               </div>
//             </div>
//             <button
//               className="bg-purple-700 text-white px-7 py-2 rounded-lg font-semibold text-base hover:bg-purple-700 transition shadow"
//               onClick={onSelect}
//             >
//               Select
//             </button>
//           </div>
//         </div>
//       </div>
//       <RoomDetailModal
//         open={showModal}
//         onClose={() => setShowModal(false)}
//         room={room}
//       />
//     </>
//   );
// }
