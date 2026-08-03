import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { MdBedroomParent } from 'react-icons/md';
import { setModifyDates } from '../Walk-In/redux/action'; // Import the action

const RoomDates = () => {
  const dispatch = useDispatch();

  // Only use selectedModifyDates reducer
  const { checkInDate, checkOutDate, daysCount } = useSelector(
    (state) => state.selectedModifyDates
  );

  const { adults, children, rooms, childrenAges } = useSelector((state) => state.formDetails);

  // Get booking data from Redux
  const bookingData = useSelector((state) => state.booking.selectedBooking);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTravellersDropdown, setShowTravellersDropdown] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);

  const calendarRef = useRef(null);
  const travellersRef = useRef(null);
  const roomsRef = useRef(null);

  // Initialize dates from API data on component mount
  useEffect(() => {
    if (bookingData?.checkindate && bookingData?.checkoutdate) {
      const checkinDate = new Date(bookingData.checkindate);
      const checkoutDate = new Date(bookingData.checkoutdate);

      // Dispatch to setModifyDates reducer
      dispatch(setModifyDates([checkinDate, checkoutDate]));

      // Also set guests and rooms from booking data
      dispatch({
        type: 'SET_ADULTS',
        payload: bookingData.number_of_guests || 1,
      });
      dispatch({ type: 'SET_CHILDREN', payload: 0 });
      dispatch({ type: 'SET_CHILDREN_AGES', payload: [] });
      dispatch({ type: 'SET_ROOMS', payload: bookingData.rooms || 1 });
    } else {
      // Fallback: Today and tomorrow if no booking data
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dispatch(setModifyDates([today, tomorrow]));
    }
  }, [bookingData, dispatch]);

  const handleDateChange = (range) => {
    if (range.length === 2) {
      const [start, end] = range;
      const checkinDate = new Date(start);
      const checkoutDate = new Date(end);

      // Normalize dates
      checkinDate.setHours(0, 0, 0, 0);
      checkoutDate.setHours(0, 0, 0, 0);

      // Handle same-day selection
      if (checkinDate.getTime() === checkoutDate.getTime()) {
        checkoutDate.setDate(checkoutDate.getDate() + 1);
      }

      // Update the modify dates reducer
      dispatch(setModifyDates([checkinDate, checkoutDate]));
    }
  };

  const handleCounterChange = (e, type, value) => {
    e.stopPropagation();

    if (value >= 0) {
      if (type === 'children') {
        dispatch({ type: 'SET_CHILDREN', payload: value });
        const newChildrenAges = [...childrenAges];
        if (value > childrenAges.length) {
          while (newChildrenAges.length < value) {
            newChildrenAges.push(5);
          }
        } else {
          newChildrenAges.length = value;
        }
        dispatch({ type: 'SET_CHILDREN_AGES', payload: newChildrenAges });
      } else {
        dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
      }
    }
  };

  const handleAgeChange = (index, value) => {
    const updatedAges = [...childrenAges];
    updatedAges[index] = parseInt(value);
    dispatch({ type: 'SET_CHILDREN_AGES', payload: updatedAges });
  };

  const calculateNights = (startDate, endDate) => {
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      const nights = Math.floor(timeDiff / (1000 * 3600 * 24));
      return nights > 0 ? nights : 1;
    }
    return 0;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (
        showTravellersDropdown &&
        travellersRef.current &&
        !travellersRef.current.contains(event.target)
      ) {
        setShowTravellersDropdown(false);
      }
      if (showRoomsDropdown && roomsRef.current && !roomsRef.current.contains(event.target)) {
        setShowRoomsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, showTravellersDropdown, showRoomsDropdown]);

  // Format dates for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toDateString();
  };

  const today = new Date();
  const minDate = bookingData?.checkindate ? new Date(bookingData.checkindate) : today;

  const maxDate = new Date(minDate);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  return (
    <div className="mt-6 ">
      <div className="px-5">
        <h1 className="text-2xl text-black font-bold mb-1">
          {bookingData ? 'Modify Your Reservation' : 'Select Your Room'}
        </h1>
        <p className="">
          {bookingData
            ? 'Modify your stay details and change your room preferences'
            : 'Enter your stay details and reserve your preferred room'}
        </p>
      </div>
      <div className="px-5 rounded-lg mt-4 relative flex gap-3">
        {/* Date Selection */}
        <div
          className="flex flex-col border border-purple-500 p-3 rounded-md relative cursor-pointer w-1/3"
          onClick={() => {
            setShowCalendar(true);
            setShowTravellersDropdown(false);
            setShowRoomsDropdown(false);
          }}
        >
          <label className="text-gray-800 text-lg font-poppins font-bold">
            Check-in & Check-Out Dates
          </label>
          <div className="flex items-center space-x-3">
            <FaCalendarAlt size={20} className="text-purple-500" />
            <span className="text-gray-800 font-poppins text-base font-semibold">
              {checkInDate && checkOutDate
                ? `${formatDisplayDate(checkInDate)} - ${formatDisplayDate(checkOutDate)}`
                : 'Select Dates'}
            </span>
            <div className="absolute top-2 right-2 p-2 rounded-md text-xs text-white font-semibold bg-purple-500 ">
              {checkInDate && checkOutDate
                ? `(${daysCount} ${daysCount === 1 ? 'Night' : 'Nights'})`
                : ''}
            </div>
          </div>
          {showCalendar && (
            <div
              ref={calendarRef}
              className="absolute top-20 left-0 bg-white shadow-lg border rounded-md p-4 z-10 "
            >
              <Calendar
                onChange={handleDateChange}
                value={
                  checkInDate && checkOutDate ? [new Date(checkInDate), new Date(checkOutDate)] : []
                }
                selectRange={true}
                className="react-calendar p-2 mt-4 bg-white w-full sm:w-3/4 lg:w-1/2 md:1/3"
                minDate={minDate}
                maxDate={maxDate}
                prev2Label={null}
                next2Label={null}
                minDetail="year"
              />
            </div>
          )}
        </div>

        {/* Travellers Selection */}
        <div
          ref={travellersRef}
          className="flex flex-col border border-purple-500 p-3 rounded-md relative cursor-pointer w-1/3"
          onClick={() => {
            setShowTravellersDropdown(!showTravellersDropdown);
            setShowCalendar(false);
            setShowRoomsDropdown(false);
          }}
        >
          <label className="text-gray-800 text-lg font-poppins font-bold">Guests</label>
          <div className="flex items-center space-x-2">
            <FaUser className="text-purple-500" />
            <span className="text-gray-800 text-base font-poppins font-semibold">
              {adults} Adults{children > 0 ? `, ${children} Children` : ''}
            </span>
          </div>
          {showTravellersDropdown && (
            <div
              className="absolute top-20 left-0 bg-white shadow-lg font-poppins border rounded-md p-4 z-10 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {['adults', 'children'].map((type) => {
                const value = { adults, children }[type];
                const minValue = type === 'adults' ? 1 : 0;

                return (
                  <div key={type} className="flex justify-between items-center py-2">
                    <span className="text-black capitalize font-semibold">{type}</span>
                    <div className="flex items-center space-x-4">
                      <button
                        className={`px-4 py-2 rounded-full transition-colors ${
                          value <= minValue
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                        onClick={(e) => value > minValue && handleCounterChange(e, type, value - 1)}
                        disabled={value <= minValue}
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold">{value}</span>
                      <button
                        className="px-3.5 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        onClick={(e) => handleCounterChange(e, type, value + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Children Age Selection */}
              {children > 0 && (
                <div className="mt-1">
                  <p className="text-gray-500 text-sm mb-3">
                    You can add children below 5 years old
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {childrenAges.map((age, index) => (
                      <div key={index} className="flex flex-col">
                        <label className="text-sm text-gray-700 mb-1">Child {index + 1} Age</label>
                        <select
                          value={age}
                          onChange={(e) => handleAgeChange(index, e.target.value)}
                          className="border border-gray-300 rounded-md p-2"
                        >
                          {Array.from({ length: 5 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} {i === 0 ? 'year' : 'years'} old
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="w-full bg-purple-500 text-white px-4 py-2 mt-3 rounded-md font-poppins hover:bg-purple-600 transition"
                onClick={() => setShowTravellersDropdown(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Room Selection */}
        <div
          ref={roomsRef}
          className="flex flex-col border border-purple-500 p-3 rounded-md relative cursor-pointer w-1/3"
          onClick={() => {
            setShowRoomsDropdown(!showRoomsDropdown);
            setShowCalendar(false);
            setShowTravellersDropdown(false);
          }}
        >
          <label className="text-gray-800 text-lg font-poppins font-bold">Rooms</label>
          <div className="flex items-center space-x-2">
            <MdBedroomParent size={24} className="text-purple-500" />
            <span className="text-gray-800 font-poppins text-base font-semibold">
              {rooms} Room(s)
            </span>
          </div>
          {showRoomsDropdown && (
            <div className="absolute top-20 left-0 bg-white shadow-lg border rounded-md p-4 z-10 w-full">
              <div className="flex justify-between items-center py-2">
                <span className="text-black font-poppins capitalize font-semibold">Rooms</span>
                <div className="flex items-center space-x-4">
                  <button
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    onClick={(e) => handleCounterChange(e, 'rooms', Math.max(1, rooms - 1))}
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold">{rooms}</span>
                  <button
                    className={`px-3.5 py-2 rounded-full transition-colors ${
                      rooms >= 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    onClick={(e) => {
                      if (rooms < 1) {
                        handleCounterChange(e, 'rooms', rooms + 1);
                      }
                    }}
                    disabled={rooms >= 1}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-900 mt-2 bg-yellow-200 px-2 py-1 rounded-sm">
                Reservations are limited to one room each. To reserve multiple rooms, please create
                separate reservations
              </p>
              <button
                className="w-full bg-purple-500 text-white px-4 py-2 mt-3 font-poppins rounded-md hover:bg-purple-600 transition"
                onClick={() => setShowRoomsDropdown(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDates;

// import React, { useState, useEffect, useRef } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import { FaCalendarAlt, FaUser } from "react-icons/fa";
// import { useSelector, useDispatch } from "react-redux";
// import { MdBedroomParent } from "react-icons/md";
// import { setModifyDates } from "../Walk-In/redux/action";

// const RoomDates = () => {
//   const dispatch = useDispatch();

//   const { checkInDate, checkOutDate, daysCount } = useSelector(
//     (state) => state.selectedModifyDates
//   );

//   const { adults, children, rooms, childrenAges } = useSelector(
//     (state) => state.formDetails
//   );

//   const bookingData = useSelector((state) => state.booking.selectedBooking);

//   const [showCalendar, setShowCalendar] = useState(false);
//   const [showTravellersDropdown, setShowTravellersDropdown] = useState(false);
//   const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   const calendarRef = useRef(null);
//   const travellersRef = useRef(null);
//   const roomsRef = useRef(null);

//   // Check if mobile view
//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   useEffect(() => {
//     if (bookingData?.checkindate && bookingData?.checkoutdate) {
//       const checkinDate = new Date(bookingData.checkindate);
//       const checkoutDate = new Date(bookingData.checkoutdate);

//       dispatch(setModifyDates([checkinDate, checkoutDate]));

//       dispatch({
//         type: "SET_ADULTS",
//         payload: bookingData.number_of_guests || 1,
//       });
//       dispatch({ type: "SET_CHILDREN", payload: 0 });
//       dispatch({ type: "SET_CHILDREN_AGES", payload: [] });
//       dispatch({ type: "SET_ROOMS", payload: bookingData.rooms || 1 });
//     } else {
//       const today = new Date();
//       const tomorrow = new Date(today);
//       tomorrow.setDate(today.getDate() + 1);
//       dispatch(setModifyDates([today, tomorrow]));
//     }
//   }, [bookingData, dispatch]);

//   const handleDateChange = (range) => {
//     if (range.length === 2) {
//       const [start, end] = range;
//       const checkinDate = new Date(start);
//       const checkoutDate = new Date(end);

//       checkinDate.setHours(0, 0, 0, 0);
//       checkoutDate.setHours(0, 0, 0, 0);

//       if (checkinDate.getTime() === checkoutDate.getTime()) {
//         checkoutDate.setDate(checkoutDate.getDate() + 1);
//       }

//       dispatch(setModifyDates([checkinDate, checkoutDate]));
//       if (isMobile) {
//         setShowCalendar(false);
//       }
//     }
//   };

//   const handleCounterChange = (e, type, value) => {
//     e.stopPropagation();

//     if (value >= 0) {
//       if (type === "children") {
//         dispatch({ type: "SET_CHILDREN", payload: value });
//         const newChildrenAges = [...childrenAges];
//         if (value > childrenAges.length) {
//           while (newChildrenAges.length < value) {
//             newChildrenAges.push(5);
//           }
//         } else {
//           newChildrenAges.length = value;
//         }
//         dispatch({ type: "SET_CHILDREN_AGES", payload: newChildrenAges });
//       } else {
//         dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
//       }
//     }
//   };

//   const handleAgeChange = (index, value) => {
//     const updatedAges = [...childrenAges];
//     updatedAges[index] = parseInt(value);
//     dispatch({ type: "SET_CHILDREN_AGES", payload: updatedAges });
//   };

//   const closeCalendar = (e) => {
//     if (e) e.stopPropagation();
//     setShowCalendar(false);
//   };

//   const closeTravellersDropdown = (e) => {
//     if (e) e.stopPropagation();
//     setShowTravellersDropdown(false);
//   };

//   const closeRoomsDropdown = (e) => {
//     if (e) e.stopPropagation();
//     setShowRoomsDropdown(false);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         showCalendar &&
//         calendarRef.current &&
//         !calendarRef.current.contains(event.target)
//       ) {
//         setShowCalendar(false);
//       }
//       if (
//         showTravellersDropdown &&
//         travellersRef.current &&
//         !travellersRef.current.contains(event.target)
//       ) {
//         setShowTravellersDropdown(false);
//       }
//       if (
//         showRoomsDropdown &&
//         roomsRef.current &&
//         !roomsRef.current.contains(event.target)
//       ) {
//         setShowRoomsDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showCalendar, showTravellersDropdown, showRoomsDropdown]);

//   const formatDisplayDate = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     if (isMobile) {
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       });
//     }
//     return date.toDateString();
//   };

//   const today = new Date();
//   const minDate = bookingData?.checkindate
//     ? new Date(bookingData.checkindate)
//     : today;

//   const maxDate = new Date(minDate);
//   maxDate.setFullYear(maxDate.getFullYear() + 1);

//   return (
//     <div className="mt-4 md:mt-6">
//       <div className="px-4 md:px-5">
//         <h1 className="text-xl md:text-2xl text-black font-bold mb-1">
//           {bookingData ? "Modify Your Reservation" : "Select Your Room"}
//         </h1>
//         <p className="text-sm md:text-base text-gray-600">
//           {bookingData
//             ? "Modify your stay details and change your room preferences"
//             : "Enter your stay details and reserve your preferred room"}
//         </p>
//       </div>

//       {/* Mobile Layout - Vertical Stack */}
//       <div className="px-4 md:px-5 rounded-lg mt-4">
//         <div className="flex flex-col md:flex-row gap-3 md:gap-3">
//           {/* Date Selection */}
//           <div
//             className="flex flex-col border border-gray-300 p-3 rounded-md relative cursor-pointer w-full md:w-1/3"
//             onClick={() => {
//               setShowCalendar(true);
//               setShowTravellersDropdown(false);
//               setShowRoomsDropdown(false);
//             }}
//           >
//             <label className="text-gray-800 text-sm md:text-lg font-poppins font-bold">
//               Check-in & Check-Out
//             </label>
//             <div className="flex items-center justify-between space-x-3">
//               <div className="flex items-center space-x-2 flex-1">
//                 <FaCalendarAlt
//                   size={isMobile ? 16 : 20}
//                   className="text-gray-800 flex-shrink-0"
//                 />
//                 <span className="text-gray-800 font-poppins text-sm md:text-base font-semibold truncate">
//                   {checkInDate && checkOutDate
//                     ? `${formatDisplayDate(checkInDate)} - ${formatDisplayDate(
//                         checkOutDate
//                       )}`
//                     : "Select Dates"}
//                 </span>
//               </div>
//               <div className="bg-black px-2 py-1 rounded-md text-white text-xs font-semibold whitespace-nowrap">
//                 {checkInDate && checkOutDate
//                   ? `${daysCount} ${daysCount === 1 ? "Night" : "Nights"}`
//                   : ""}
//               </div>
//             </div>

//             {showCalendar && (
//               <div
//                 className={`${
//                   isMobile
//                     ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
//                     : "absolute top-20 left-0 z-10"
//                 }`}
//                 onClick={(e) => {
//                   // Only close if clicking the overlay background
//                   if (isMobile && e.target === e.currentTarget) {
//                     closeCalendar();
//                   }
//                 }}
//               >
//                 <div
//                   ref={calendarRef}
//                   className={`bg-white shadow-lg rounded-md p-4 ${
//                     isMobile ? "w-[95%] max-w-md mx-auto" : ""
//                   }`}
//                 >
//                   <Calendar
//                     onChange={handleDateChange}
//                     value={
//                       checkInDate && checkOutDate
//                         ? [new Date(checkInDate), new Date(checkOutDate)]
//                         : []
//                     }
//                     selectRange={true}
//                     className={`react-calendar p-2 mt-4 bg-white ${
//                       isMobile ? "w-full" : "w-full sm:w-3/4 lg:w-1/2"
//                     }`}
//                     minDate={minDate}
//                     maxDate={maxDate}
//                     prev2Label={null}
//                     next2Label={null}
//                     minDetail="year"
//                   />
//                   {isMobile && (
//                     <button
//                       className="w-full bg-black text-white px-4 py-2 mt-4 rounded-md hover:bg-gray-800 transition-colors"
//                       onClick={closeCalendar}
//                       type="button"
//                     >
//                       Close
//                     </button>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Travellers Selection */}
//           <div
//             ref={travellersRef}
//             className="flex flex-col border border-gray-300 p-3 rounded-md relative cursor-pointer w-full md:w-1/3"
//             onClick={() => {
//               setShowTravellersDropdown(!showTravellersDropdown);
//               setShowCalendar(false);
//               setShowRoomsDropdown(false);
//             }}
//           >
//             <label className="text-gray-800 text-sm md:text-lg font-poppins font-bold">
//               Guests
//             </label>
//             <div className="flex items-center space-x-2">
//               <FaUser
//                 className="text-gray-800 flex-shrink-0"
//                 size={isMobile ? 16 : 20}
//               />
//               <span className="text-gray-800 text-sm md:text-base font-poppins font-semibold truncate">
//                 {adults} Adult{adults !== 1 ? "s" : ""}
//                 {children > 0
//                   ? `, ${children} Child${children !== 1 ? "ren" : ""}`
//                   : ""}
//               </span>
//             </div>

//             {showTravellersDropdown && (
//               <div
//                 className={`${
//                   isMobile
//                     ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
//                     : "absolute top-20 left-0 bg-white shadow-lg border rounded-md p-4 z-10 w-full"
//                 }`}
//                 onClick={(e) => {
//                   if (isMobile && e.target === e.currentTarget) {
//                     closeTravellersDropdown();
//                   }
//                 }}
//               >
//                 <div
//                   className={`bg-white shadow-lg rounded-md p-4 ${
//                     isMobile
//                       ? "w-[95%] max-w-md mx-auto max-h-[90vh] overflow-y-auto"
//                       : "w-full"
//                   }`}
//                 >
//                   {["adults", "children"].map((type) => {
//                     const value = { adults, children }[type];
//                     const minValue = type === "adults" ? 1 : 0;

//                     return (
//                       <div
//                         key={type}
//                         className="flex justify-between items-center py-3 border-b border-gray-100"
//                       >
//                         <span className="text-black capitalize font-semibold">
//                           {type}
//                         </span>
//                         <div className="flex items-center space-x-3 md:space-x-4">
//                           <button
//                             className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-colors flex items-center justify-center ${
//                               value <= minValue
//                                 ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                                 : "bg-blue-100 text-blue-700 hover:bg-blue-200"
//                             }`}
//                             onClick={(e) =>
//                               value > minValue &&
//                               handleCounterChange(e, type, value - 1)
//                             }
//                             disabled={value <= minValue}
//                             type="button"
//                           >
//                             -
//                           </button>
//                           <span className="text-lg font-semibold min-w-[30px] text-center">
//                             {value}
//                           </span>
//                           <button
//                             className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center justify-center"
//                             onClick={(e) =>
//                               handleCounterChange(e, type, value + 1)
//                             }
//                             type="button"
//                           >
//                             +
//                           </button>
//                         </div>
//                       </div>
//                     );
//                   })}

//                   {/* Children Age Selection */}
//                   {children > 0 && (
//                     <div className="mt-4">
//                       <p className="text-gray-500 text-xs md:text-sm mb-3">
//                         You can add children below 17 years old
//                       </p>
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                         {childrenAges.map((age, index) => (
//                           <div key={index} className="flex flex-col">
//                             <label className="text-xs md:text-sm text-gray-700 mb-1">
//                               Child {index + 1} Age
//                             </label>
//                             <select
//                               value={age}
//                               onChange={(e) =>
//                                 handleAgeChange(index, e.target.value)
//                               }
//                               className="border border-gray-300 rounded-md p-2 text-sm"
//                             >
//                               {Array.from({ length: 17 }, (_, i) => (
//                                 <option key={i + 1} value={i + 1}>
//                                   {i + 1} {i === 0 ? "year" : "years"} old
//                                 </option>
//                               ))}
//                             </select>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   <button
//                     className="w-full bg-black text-white px-4 py-2 mt-4 rounded-md font-poppins hover:bg-gray-800 transition"
//                     onClick={closeTravellersDropdown}
//                     type="button"
//                   >
//                     Done
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Room Selection */}
//           <div
//             ref={roomsRef}
//             className="flex flex-col border border-gray-300 p-3 rounded-md relative cursor-pointer w-full md:w-1/3"
//             onClick={() => {
//               setShowRoomsDropdown(!showRoomsDropdown);
//               setShowCalendar(false);
//               setShowTravellersDropdown(false);
//             }}
//           >
//             <label className="text-gray-800 text-sm md:text-lg font-poppins font-bold">
//               Rooms
//             </label>
//             <div className="flex items-center space-x-2">
//               <MdBedroomParent
//                 size={isMobile ? 20 : 24}
//                 className="text-gray-800 flex-shrink-0"
//               />
//               <span className="text-gray-800 font-poppins text-sm md:text-base font-semibold">
//                 {rooms} Room{rooms !== 1 ? "s" : ""}
//               </span>
//             </div>

//             {showRoomsDropdown && (
//               <div
//                 className={`${
//                   isMobile
//                     ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
//                     : "absolute top-20 left-0 bg-white shadow-lg border rounded-md p-4 z-10 w-full"
//                 }`}
//                 onClick={(e) => {
//                   if (isMobile && e.target === e.currentTarget) {
//                     closeRoomsDropdown();
//                   }
//                 }}
//               >
//                 <div
//                   className={`bg-white shadow-lg rounded-md p-4 ${
//                     isMobile ? "w-[95%] max-w-md mx-auto" : "w-full"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center py-3">
//                     <span className="text-black font-poppins capitalize font-semibold">
//                       Rooms
//                     </span>
//                     <div className="flex items-center space-x-3 md:space-x-4">
//                       <button
//                         className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center justify-center"
//                         onClick={(e) =>
//                           handleCounterChange(
//                             e,
//                             "rooms",
//                             Math.max(1, rooms - 1)
//                           )
//                         }
//                         type="button"
//                       >
//                         -
//                       </button>
//                       <span className="text-lg font-semibold min-w-[30px] text-center">
//                         {rooms}
//                       </span>
//                       <button
//                         className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 text-gray-500 rounded-full cursor-not-allowed flex items-center justify-center"
//                         disabled={true}
//                         type="button"
//                       >
//                         +
//                       </button>
//                     </div>
//                   </div>
//                   <p className="text-xs md:text-sm text-gray-900 mt-3 bg-yellow-100 px-3 py-2 rounded-md">
//                     ⚠️ Reservations are limited to one room each. To reserve
//                     multiple rooms, please create separate reservations.
//                   </p>
//                   <button
//                     className="w-full bg-black text-white px-4 py-2 mt-4 font-poppins rounded-md hover:bg-gray-800 transition"
//                     onClick={closeRoomsDropdown}
//                     type="button"
//                   >
//                     Done
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoomDates;
