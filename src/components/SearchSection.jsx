import React, { useState, useRef, useEffect } from 'react';
import { Search, Users, MapPin } from 'lucide-react';
import CustomDateRangePicker from './CustomDateRangePicker';
import { useNavigate } from 'react-router-dom';

// Hook for closing popover on outside click
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// Destination popover component
const DestinationPopover = ({ show, onClose, onSelect }) => {
  const ref = useRef();

  // Sample destinations - you can replace with actual data
  const destinations = [
    { id: 1, name: 'Pagoda Hotel', location: 'City Center' },
    { id: 2, name: 'Sunset Resort', location: 'Beach Front' },
    { id: 3, name: 'Mountain Lodge', location: 'Alpine Region' },
    { id: 4, name: 'Urban Suites', location: 'Downtown' },
    { id: 5, name: 'Riverside Inn', location: 'Waterfront' },
  ];

  useOnClickOutside(ref, onClose);

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-[70%] md:left-0 min-w-[320px] bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50"
    >
      <div className="flex flex-col gap-2">
        <div className="mb-2">
          <h3 className="font-bold text-lg mb-1">Popular Destinations</h3>
          <p className="text-sm text-gray-500">Select a destination to search</p>
        </div>

        {destinations.map((dest) => (
          <button
            key={dest.id}
            type="button"
            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition flex items-center gap-3"
            onClick={() => {
              onSelect(dest.name);
              onClose();
            }}
          >
            <MapPin size={18} className="text-purple-600" />
            <div className="flex flex-col">
              <span className="font-medium">{dest.name}</span>
              <span className="text-sm text-gray-500">{dest.location}</span>
            </div>
          </button>
        ))}

        <button
          type="button"
          className="mt-4 w-full bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold hover:bg-purple-800 transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Guests popover component
const GuestsPopover = ({
  show,
  onClose,
  adults,
  setAdults,
  childrenCount,
  setChildrenCount,
  childAges,
  setChildAges,
  rooms,
  setRooms,
}) => {
  const ref = useRef();

  useOnClickOutside(ref, onClose);

  useEffect(() => {
    if (childrenCount > childAges.length) {
      setChildAges((old) => [...old, ...Array(childrenCount - old.length).fill('0')]);
    } else if (childrenCount < childAges.length) {
      setChildAges((old) => old.slice(0, childrenCount));
    }
  }, [childrenCount, setChildAges, childAges.length]);

  if (!show) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-[70%] md:left-1/2 md:-translate-x-1/2 min-w-[320px] bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50"
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Rooms</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setRooms((v) => Math.max(1, v - 1))}
            >
              −
            </button>
            <span className="min-w-[24px] text-center">{rooms}</span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setRooms((v) => v + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">Adults</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setAdults((v) => Math.max(1, v - 1))}
              disabled={adults <= 1}
            >
              −
            </button>
            <span className="min-w-[24px] text-center">{adults}</span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setAdults((v) => v + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium text-sm">Children</span>
            <br />
            <span className="text-gray-500 text-xs">Ages 0 to 17</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setChildrenCount((v) => Math.max(0, v - 1))}
              disabled={childrenCount <= 0}
            >
              −
            </button>
            <span className="min-w-[24px] text-center">{childrenCount}</span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
              onClick={() => setChildrenCount((v) => Math.min(6, v + 1))}
            >
              +
            </button>
          </div>
        </div>

        {Array(childrenCount)
          .fill(0)
          .map((_, idx) => (
            <div key={idx}>
              <label className="block text-xs font-semibold mb-1">Child {idx + 1} age</label>
              <select
                value={childAges[idx] || '0'}
                onChange={(e) => {
                  const ages = [...childAges];
                  ages[idx] = e.target.value;
                  setChildAges(ages);
                }}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="0">Under 1</option>
                {Array(17)
                  .fill(0)
                  .map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        <button
          type="button"
          className="mt-2 w-full bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold hover:bg-purple-800 transition"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default function SearchSection() {
  // Initialize with today and tomorrow as default dates
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [range, setRange] = useState({
    from: today,
    to: tomorrow,
  });

  const [destination, setDestination] = useState('');
  const [destinationPopoverOpen, setDestinationPopoverOpen] = useState(false);
  const [guestsPopoverOpen, setGuestsPopoverOpen] = useState(false);
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [childAges, setChildAges] = useState([]);
  const [rooms, setRooms] = useState(1);

  const guestsSummary = `${adults} Adult${adults !== 1 ? 's' : ''}${
    childrenCount > 0 ? `, ${childrenCount} Child${childrenCount > 1 ? 'ren' : ''}` : ''
  } | ${rooms} Room${rooms !== 1 ? 's' : ''}`;

  const navigate = useNavigate();

  const handleBookNow = (e) => {
    e.preventDefault();

    // Save data to localStorage
    if (destination) localStorage.setItem('destination', destination);
    if (range.from) localStorage.setItem('checkin', range.from.toISOString());
    if (range.to) localStorage.setItem('checkout', range.to.toISOString());
    localStorage.setItem('adults', adults);
    localStorage.setItem('children', childrenCount);
    localStorage.setItem('childAges', JSON.stringify(childAges));
    localStorage.setItem('rooms', rooms);

    // Navigate to select-room page with query params
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    params.append('checkin', range.from?.toISOString() || '');
    params.append('checkout', range.to?.toISOString() || '');
    params.append('adults', adults);
    params.append('children', childrenCount);
    params.append('childAges', childAges.join(','));
    params.append('rooms', rooms);
    navigate(`/select-room?${params.toString()}`);
  };

  // Function to handle destination selection
  const handleDestinationSelect = (dest) => {
    setDestination(dest);
  };

  return (
    <div className="bg-white w-full flex flex-col rounded-1xl">
      <form
        onSubmit={handleBookNow}
        className="w-full flex flex-col md:flex-row gap-4 p-4 items-stretch shadow-none border border-gray-200 bg-white"
      >
        <div className="flex flex-1 gap-8">
          {/* Destination input - flex-1 */}
          <div className="relative flex-1 min-w-0 flex flex-col justify-end">
            <label className="block text-black font-bold text-base mb-1">Destination</label>
            <button
              type="button"
              className="w-full text-left border-2 border-gray-200 p-5 text-md font-semibold transition flex items-center bg-white"
              onClick={() => setDestinationPopoverOpen(true)}
              tabIndex={0}
              aria-haspopup="dialog"
              aria-expanded={destinationPopoverOpen}
            >
              <MapPin size={20} className="mr-4 text-gray-600" />
              <span>{destination || 'Where are you going?'}</span>
            </button>
            <DestinationPopover
              show={destinationPopoverOpen}
              onClose={() => setDestinationPopoverOpen(false)}
              onSelect={handleDestinationSelect}
            />
          </div>

          {/* Date Picker - flex-1 */}
          <div className="flex-1 min-w-0">
            <CustomDateRangePicker value={range} onChange={setRange} />
          </div>

          {/* Guests popover - flex-1 */}
          <div className="relative flex-1 min-w-0 flex flex-col justify-end">
            <label className="block text-black font-bold text-base mb-1">Guests</label>
            <button
              type="button"
              className="w-full text-left border-2 border-gray-200 p-5 text-md font-semibold transition flex items-center bg-white"
              onClick={() => setGuestsPopoverOpen((v) => !v)}
              tabIndex={0}
              aria-haspopup="dialog"
              aria-expanded={guestsPopoverOpen}
            >
              <Users size={20} className="mr-4 text-gray-600" />
              <span>{guestsSummary}</span>
            </button>
            <GuestsPopover
              show={guestsPopoverOpen}
              onClose={() => setGuestsPopoverOpen(false)}
              adults={adults}
              setAdults={setAdults}
              childrenCount={childrenCount}
              setChildrenCount={setChildrenCount}
              childAges={childAges}
              setChildAges={setChildAges}
              rooms={rooms}
              setRooms={setRooms}
            />
          </div>
        </div>

        {/* Search button */}
        <div className="flex pr-5 items-center min-w-[200px]">
          <button
            type="submit"
            className="w-full mt-6 bg-purple-700 text-white ml-3 p-5 flex items-center justify-center gap-2 text-xl font-bold hover:bg-purple-800 transition"
          >
            <Search size={22} />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}

// import React, { useState, useRef, useEffect } from "react";
// import { Search, Users } from "lucide-react";
// import CustomDateRangePicker from "./CustomDateRangePicker"; // Adjust path if needed
// import { useNavigate } from "react-router-dom";

// // Hook for closing popover on outside click
// function useOnClickOutside(ref, handler) {
//   useEffect(() => {
//     const listener = (event) => {
//       if (!ref.current || ref.current.contains(event.target)) return;
//       handler();
//     };
//     document.addEventListener("mousedown", listener);
//     return () => document.removeEventListener("mousedown", listener);
//   }, [ref, handler]);
// }

// // Guests popover component
// const GuestsPopover = ({
//   show,
//   onClose,
//   adults,
//   setAdults,
//   childrenCount,
//   setChildrenCount,
//   childAges,
//   setChildAges,
//   rooms,
//   setRooms,
// }) => {
//   const ref = useRef();

//   useOnClickOutside(ref, onClose);

//   useEffect(() => {
//     if (childrenCount > childAges.length) {
//       setChildAges((old) => [
//         ...old,
//         ...Array(childrenCount - old.length).fill("0"),
//       ]);
//     } else if (childrenCount < childAges.length) {
//       setChildAges((old) => old.slice(0, childrenCount));
//     }
//   }, [childrenCount, setChildAges, childAges.length]);

//   if (!show) return null;

//   return (
//     <div
//       ref={ref}
//       className="absolute left-0 top-[110%] md:left-1/2 md:-translate-x-1/2 min-w-[320px] bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50"
//     >
//       <div className="flex flex-col gap-5">
//         <div className="flex justify-between items-center">
//           <span className="font-medium text-sm">Rooms</span>
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setRooms((v) => Math.max(1, v - 1))}
//             >
//               −
//             </button>
//             <span className="min-w-[24px] text-center">{rooms}</span>
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setRooms((v) => v + 1)}
//             >
//               +
//             </button>
//           </div>
//         </div>

//         <div className="flex justify-between items-center">
//           <span className="font-medium text-sm">Adults</span>
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setAdults((v) => Math.max(1, v - 1))}
//               disabled={adults <= 1}
//             >
//               −
//             </button>
//             <span className="min-w-[24px] text-center">{adults}</span>
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setAdults((v) => v + 1)}
//             >
//               +
//             </button>
//           </div>
//         </div>

//         <div className="flex justify-between items-center">
//           <div>
//             <span className="font-medium text-sm">Children</span>
//             <br />
//             <span className="text-gray-500 text-xs">Ages 0 to 17</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setChildrenCount((v) => Math.max(0, v - 1))}
//               disabled={childrenCount <= 0}
//             >
//               −
//             </button>
//             <span className="min-w-[24px] text-center">{childrenCount}</span>
//             <button
//               type="button"
//               className="w-7 h-7 flex items-center justify-center border border-gray-400 rounded-full text-xl font-bold"
//               onClick={() => setChildrenCount((v) => Math.min(6, v + 1))}
//             >
//               +
//             </button>
//           </div>
//         </div>

//         {Array(childrenCount)
//           .fill(0)
//           .map((_, idx) => (
//             <div key={idx}>
//               <label className="block text-xs font-semibold mb-1">
//                 Child {idx + 1} age
//               </label>
//               <select
//                 value={childAges[idx] || "0"}
//                 onChange={(e) => {
//                   const ages = [...childAges];
//                   ages[idx] = e.target.value;
//                   setChildAges(ages);
//                 }}
//                 className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
//               >
//                 <option value="0">Under 1</option>
//                 {Array(17)
//                   .fill(0)
//                   .map((_, i) => (
//                     <option key={i + 1} value={i + 1}>
//                       {i + 1}
//                     </option>
//                   ))}
//               </select>
//             </div>
//           ))}
//         <button
//           type="button"
//           className="mt-2 w-full bg-purple-700 text-white rounded-lg px-6 py-2 font-semibold hover:bg-purple-800 transition"
//           onClick={onClose}
//         >
//           Done
//         </button>
//       </div>
//     </div>
//   );
// };

// export default function SearchSection() {
//   // Initialize with today and tomorrow as default dates
//   const today = new Date();
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);

//   const [range, setRange] = useState({
//     from: today,
//     to: tomorrow,
//   });

//   const [popoverOpen, setPopoverOpen] = useState(false);
//   const [adults, setAdults] = useState(2);
//   const [childrenCount, setChildrenCount] = useState(0);
//   const [childAges, setChildAges] = useState([]);
//   const [rooms, setRooms] = useState(1);

//   const guestsSummary = `${adults} Adult${adults !== 1 ? "s" : ""}${
//     childrenCount > 0
//       ? `, ${childrenCount} Child${childrenCount > 1 ? "ren" : ""}`
//       : ""
//   } | ${rooms} Room${rooms !== 1 ? "s" : ""}`;

//   const navigate = useNavigate();

//   const handleBookNow = (e) => {
//     e.preventDefault();

//     // Save data to localStorage
//     if (range.from) localStorage.setItem("checkin", range.from.toISOString());
//     if (range.to) localStorage.setItem("checkout", range.to.toISOString());
//     localStorage.setItem("adults", adults);
//     localStorage.setItem("children", childrenCount);
//     localStorage.setItem("childAges", JSON.stringify(childAges));
//     localStorage.setItem("rooms", rooms);

//     // Navigate to select-room page with query params (optional, but good practice)
//     const params = new URLSearchParams();
//     params.append("checkin", range.from?.toISOString() || "");
//     params.append("checkout", range.to?.toISOString() || "");
//     params.append("adults", adults);
//     params.append("children", childrenCount);
//     params.append("childAges", childAges.join(","));
//     params.append("rooms", rooms);
//     navigate(`/select-room?${params.toString()}`);
//   };

//   return (
//     <div className="bg-white w-full  flex flex-col rounded-1xl">
//       <form
//         onSubmit={handleBookNow}
//         className="w-full flex flex-col md:flex-row gap-4 p-4  items-stretch shadow-none border border-gray-200 bg-white"
//       >
//         <div className="flex flex-1 gap-8">
//           {/* Date Picker - flex-1 */}
//           <div className="flex-1 min-w-0">
//             <CustomDateRangePicker value={range} onChange={setRange} />
//           </div>
//           {/* Guests popover - flex-1 */}
//           <div className="relative flex-1 min-w-0 flex flex-col justify-end ">
//             <label className="block text-black font-bold text-base mb-1">
//               Guests
//             </label>
//             <button
//               type="button"

//               className="w-full text-left border-2  border-gray-200  p-2  text-md font-semibold transition flex items-center bg-white"
//               onClick={() => setPopoverOpen((v) => !v)}
//               tabIndex={0}
//               aria-haspopup="dialog"
//               aria-expanded={popoverOpen}
//             >
//               <Users size={20} className=" mr-4 text-gray-600" />
//               <span>{guestsSummary}</span>
//             </button>
//             <GuestsPopover
//               show={popoverOpen}
//               onClose={() => setPopoverOpen(false)}
//               adults={adults}
//               setAdults={setAdults}
//               childrenCount={childrenCount}
//               setChildrenCount={setChildrenCount}
//               childAges={childAges}
//               setChildAges={setChildAges}
//               rooms={rooms}
//               setRooms={setRooms}
//             />
//           </div>
//         </div>
//         {/* Search button */}
//         <div className="flex pr-5 items-center min-w-[200px]">
//           <button
//             type="submit"
//             className="w-full mt-6 bg-purple-700 text-white  ml-3  p-2 flex items-center justify-center gap-2 text-xl font-bold hover:bg-purple-800 transition"
//           >
//             <Search size={22} />
//             Search
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
