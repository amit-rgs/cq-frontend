import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCard from '../components/RoomCrad';
import RoomListingSkeleton from '../components/RoomListingSkeleton';
import Footer from '../components/Footer';
import PropertyRules from '../components/PropertyRules';
import HotelLocation from '../components/HotelLocation';
import axios from 'axios';

const ROOM_TYPES_API = 'http://localhost:8000/bq/api/roomtypes/';
const DYNAMIC_PRICE_API = 'http://localhost:8000/bq/api/get-dynamic-price/';

export default function RoomSelection() {
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState([]);
  const [dynamicPriceData, setDynamicPriceData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get stored search info
  const checkin = localStorage.getItem('checkin');
  const checkout = localStorage.getItem('checkout');
  const adults = Number(localStorage.getItem('adults')) || 1;
  const children = Number(localStorage.getItem('children')) || 0;
  const roomsCount = Number(localStorage.getItem('rooms')) || 1;

  // Calculate number of nights
  let nights = 1;
  if (checkin && checkout) {
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diffMs = d2 - d1;
    nights = diffMs > 0 ? Math.ceil(diffMs / (1000 * 3600 * 24)) : 1;
  }

  // Clear previous room selection when page loads
  useEffect(() => {
    localStorage.removeItem('selectedRoom');
    localStorage.removeItem('selectedRoomId');
    localStorage.removeItem('selectedRoomName');
    localStorage.removeItem('selectedRoomPrice');
    localStorage.removeItem('selectedRoomPerNight');
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!checkin || !checkout) {
        setError('Please select check-in and check-out dates.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        // Fetch room types
        const roomTypesResp = await axios.get(ROOM_TYPES_API);
        const roomsData = Array.isArray(roomTypesResp.data) ? roomTypesResp.data : [];

        // Fetch dynamic prices
        const params = new URLSearchParams({
          checkin_date: checkin.substring(0, 10),
          checkout_date: checkout.substring(0, 10),
        });

        const priceResp = await axios.get(`${DYNAMIC_PRICE_API}?${params.toString()}`);

        // Merge total_dynamic_price and other data
        const mergedRooms = roomsData.map((room) => {
          const priceInfo = priceResp.data.dynamic_prices?.[room.roomtypename];
          return {
            ...room,
            total_dynamic_price: priceInfo?.total_dynamic_price ?? room.baseprice,
            images:
              room.image_urls && room.image_urls.length
                ? room.image_urls
                : ['https://via.placeholder.com/400x260?text=No+Image'],
            left: room.available_rooms ?? 10,
          };
        });

        setRoomTypes(mergedRooms);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load data from backend.');
        setLoading(false);
      }
    }
    fetchData();
  }, [checkin, checkout]);

  const handleRoomSelect = (room, totalPrice) => {
    // Data is already stored in localStorage by RoomCard
    navigate('/addons', {
      state: {
        room,
        checkin,
        checkout,
        adults,
        children,
        rooms: roomsCount,
        selectedAddOns: [],
        addonsTotal: 0,
        total: totalPrice,
      },
    });
  };

  return (
    <>
      <div className="m-6">
        <h2 className="font-bold text-3xl mb-1 text-gray-900">Select Your Room</h2>

        {/* Single line summary */}
        <div className="text-gray-700 font-medium mb-8 text-base">
          {adults} Adult{adults !== 1 ? 's' : ''}
          {children > 0 && (
            <>
              {' '}
              &bull; {children} Child{children !== 1 ? 'ren' : ''}
            </>
          )}
          &bull; {roomsCount} Room{roomsCount > 1 ? 's' : ''}
          &bull; {nights} Night{nights > 1 ? 's' : ''}
        </div>

        {error && <div className="text-red-600 font-bold my-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16 mb-14">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <RoomListingSkeleton key={i} />)
            : roomTypes.map((room) => (
                <RoomCard
                  key={room.roomtypeid}
                  room={room}
                  nights={nights}
                  roomsCount={roomsCount}
                  adults={adults}
                  children={children}
                  checkin={checkin}
                  checkout={checkout}
                  onSelect={() => handleRoomSelect(room, room.total_dynamic_price)}
                />
              ))}
        </div>
        <PropertyRules />
        <HotelLocation />
      </div>
      <Footer />
    </>
  );
}

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import RoomCard from "../components/RoomCrad";
// import RoomListingSkeleton from "../components/RoomListingSkeleton";
// import Footer from "../components/Footer";
// import PropertyRules from "../components/PropertyRules";
// import HotelLocation from "../components/HotelLocation";
// import axios from "axios";

// const ROOM_TYPES_API = "http://localhost:8000/bq/api/roomtypes/";
// const DYNAMIC_PRICE_API = "http://localhost:8000/bq/api/get-dynamic-price/";

// export default function RoomSelection() {
//   const [loading, setLoading] = useState(true);
//   const [roomTypes, setRoomTypes] = useState([]);
//   const [dynamicPriceData, setDynamicPriceData] = useState(null);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   // Get stored search info
//   const checkin = localStorage.getItem("checkin");
//   const checkout = localStorage.getItem("checkout");
//   const adults = Number(localStorage.getItem("adults")) || 1;
//   const children = Number(localStorage.getItem("children")) || 0;
//   const roomsCount = Number(localStorage.getItem("rooms")) || 1;

//   // Calculate number of nights
//   let nights = 1;
//   if (checkin && checkout) {
//     const d1 = new Date(checkin);
//     const d2 = new Date(checkout);
//     const diffMs = d2 - d1;
//     nights = diffMs > 0 ? Math.ceil(diffMs / (1000 * 3600 * 24)) : 1;
//   }

//   useEffect(() => {
//     async function fetchData() {
//       if (!checkin || !checkout) {
//         setError("Please select check-in and check-out dates.");
//         setLoading(false);
//         return;
//       }
//       try {
//         setLoading(true);
//         setError("");
//         // Fetch room types
//         const roomTypesResp = await axios.get(ROOM_TYPES_API);
//         const roomsData = Array.isArray(roomTypesResp.data) ? roomTypesResp.data : [];

//         // Fetch dynamic prices
//         const params = new URLSearchParams({
//           checkin_date: checkin.substring(0, 10),
//           checkout_date: checkout.substring(0, 10),
//         });

//         const priceResp = await axios.get(
//           `${DYNAMIC_PRICE_API}?${params.toString()}`
//         );

//         // Merge total_dynamic_price and other data
//         const mergedRooms = roomsData.map((room) => {
//           const priceInfo = priceResp.data.dynamic_prices?.[room.roomtypename];
//           return {
//             ...room,
//             total_dynamic_price:
//               priceInfo?.total_dynamic_price ?? room.baseprice,
//             images:
//               room.image_urls && room.image_urls.length
//                 ? room.image_urls
//                 : ["https://via.placeholder.com/400x260?text=No+Image"],
//             left: room.available_rooms ?? 10,
//           };
//         });

//         setRoomTypes(mergedRooms);
//         setLoading(false);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load data from backend.");
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [checkin, checkout]);

//   const handleRoomSelect = (room, totalPrice) => {
//     navigate("/addons", {
//       state: {
//         room,
//         checkin,
//         checkout,
//         adults,
//         children,
//         rooms: roomsCount,
//         selectedAddOns: [],
//         addonsTotal: 0,
//         total: totalPrice,
//       },
//     });
//   };

//   return (
//     <>
//       <div className="m-6">
//         <h2 className="font-bold text-3xl mb-1 text-gray-900">Select Your Room</h2>

//         {/* Single line summary */}
//         <div className="text-gray-700 font-medium mb-8 text-base">
//           {adults} Adult{adults !== 1 ? "s" : ""}
//           {children > 0 && (
//             <> &bull; {children} Child{children !== 1 ? "ren" : ""}</>
//           )}
//           &bull; {roomsCount} Room{roomsCount > 1 ? "s" : ""}
//           &bull; {nights} Night{nights > 1 ? "s" : ""}
//         </div>

//         {error && <div className="text-red-600 font-bold my-4">{error}</div>}

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16 mb-14">
//           {loading
//             ? Array.from({ length: 4 }).map((_, i) => (
//                 <RoomListingSkeleton key={i} />
//               ))
//             : roomTypes.map((room) => (
//                 <RoomCard
//                   key={room.roomtypeid}
//                   room={room}
//                   nights={nights}
//                   roomsCount={roomsCount}
//                   adults={adults}
//                   children={children}
//                   checkin={checkin}
//                   checkout={checkout}
//                   onSelect={() =>
//                     handleRoomSelect(room, room.total_dynamic_price)
//                   }
//                 />
//               ))}
//         </div>
//         <PropertyRules />
//         <HotelLocation />
//       </div>
//       <Footer />
//     </>
//   );
// }
