import React from 'react';
import { useSelector } from 'react-redux';
import RoomDates from './RoomDates';
import PropertyRooms from './PropertyRooms';
import { useNavigate } from 'react-router-dom';

const EditRoomDetails = () => {
  // Get both booking data and current selected dates from Redux
  const selectedBooking = useSelector((state) => state.booking.selectedBooking);
  const { checkInDate, checkOutDate } = useSelector((state) => state.selectedModifyDates);
  const navigate = useNavigate();

  // Calculate dates - prioritize current selected dates over booking dates
  // Calculate dates - prioritize current selected dates over booking dates
  const calculateCorrectDates = () => {
    // Use currently selected dates if available, otherwise fall back to booking dates
    const checkinToUse = checkInDate || selectedBooking?.checkindate;
    const checkoutToUse = checkOutDate || selectedBooking?.checkoutdate;

    if (!checkinToUse) return null;

    // Parse dates without timezone issues
    const parseDateSafe = (dateString) => {
      if (!dateString) return null;
      // If it's already in YYYY-MM-DD format, return as-is
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      // If it's a full ISO string, extract just the date part
      if (typeof dateString === 'string' && dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      // For Date objects, get the local date components
      if (dateString instanceof Date) {
        const year = dateString.getFullYear();
        const month = String(dateString.getMonth() + 1).padStart(2, '0');
        const day = String(dateString.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return dateString;
    };

    const checkinDateStr = parseDateSafe(checkinToUse);
    let checkoutDateStr = parseDateSafe(checkoutToUse);

    // Ensure checkout is after checkin
    if (!checkoutDateStr || checkoutDateStr <= checkinDateStr) {
      const checkinDate = new Date(checkinDateStr);
      const checkoutDate = new Date(checkinDate);
      checkoutDate.setDate(checkinDate.getDate() + 1);

      const year = checkoutDate.getFullYear();
      const month = String(checkoutDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkoutDate.getDate()).padStart(2, '0');
      checkoutDateStr = `${year}-${month}-${day}`;
    }

    return {
      checkin_date: checkinDateStr,
      checkout_date: checkoutDateStr,
    };
  };

  const correctedDates = calculateCorrectDates();

  if (!selectedBooking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="w-16 h-16 mx-auto text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Oops! Session Expired</h2>
          <p className="text-gray-600 mt-2">
            It looks like your reservation information wasn't saved. Please return to view your
            reservations and try again.
          </p>
          <button
            onClick={() => navigate('/profile_guest_options')}
            className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-950"
          >
            Return to reservations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 mt-16 relative">
      <RoomDates />
      <PropertyRooms
        dates={correctedDates}
        booking={selectedBooking}
        key={`${correctedDates?.checkin_date}-${correctedDates?.checkout_date}`} // Force re-render on date change
      />
    </div>
  );
};

export default EditRoomDetails;

// import React from "react";
// import { useSelector } from "react-redux";
// import ReservationSteps from "./ReservationSteps";
// import RoomDates from "./RoomDates";
// import PropertyRooms from "./PropertyRooms";
// import { useNavigate } from "react-router-dom";

// const EditRoomDetails = () => {
//   // Get both booking data and current selected dates from Redux
//   const selectedBooking = useSelector((state) => state.booking.selectedBooking);
//   const { checkInDate, checkOutDate } = useSelector((state) => state.selectedModifyDates);
//   const navigate = useNavigate();

//   // Calculate dates - prioritize current selected dates over booking dates
//   // Calculate dates - prioritize current selected dates over booking dates
// const calculateCorrectDates = () => {
//   // Use currently selected dates if available, otherwise fall back to booking dates
//   const checkinToUse = checkInDate || selectedBooking?.checkindate;
//   const checkoutToUse = checkOutDate || selectedBooking?.checkoutdate;

//   if (!checkinToUse) return null;

//   // Parse dates without timezone issues
//   const parseDateSafe = (dateString) => {
//     if (!dateString) return null;
//     // If it's already in YYYY-MM-DD format, return as-is
//     if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
//       return dateString;
//     }
//     // If it's a full ISO string, extract just the date part
//     if (typeof dateString === 'string' && dateString.includes('T')) {
//       return dateString.split('T')[0];
//     }
//     // For Date objects, get the local date components
//     if (dateString instanceof Date) {
//       const year = dateString.getFullYear();
//       const month = String(dateString.getMonth() + 1).padStart(2, '0');
//       const day = String(dateString.getDate()).padStart(2, '0');
//       return `${year}-${month}-${day}`;
//     }
//     return dateString;
//   };

//   const checkinDateStr = parseDateSafe(checkinToUse);
//   let checkoutDateStr = parseDateSafe(checkoutToUse);

//   // Ensure checkout is after checkin
//   if (!checkoutDateStr || checkoutDateStr <= checkinDateStr) {
//     const checkinDate = new Date(checkinDateStr);
//     const checkoutDate = new Date(checkinDate);
//     checkoutDate.setDate(checkinDate.getDate() + 1);

//     const year = checkoutDate.getFullYear();
//     const month = String(checkoutDate.getMonth() + 1).padStart(2, '0');
//     const day = String(checkoutDate.getDate()).padStart(2, '0');
//     checkoutDateStr = `${year}-${month}-${day}`;
//   }

//   return {
//     checkin_date: checkinDateStr,
//     checkout_date: checkoutDateStr,
//   };
// };

//   const correctedDates = calculateCorrectDates();

//  if (!selectedBooking) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
//         <div className="max-w-lg bg-white rounded-lg shadow-md p-6 text-center">
//           <svg
//             className="w-16 h-16 mx-auto text-yellow-500"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//             />
//           </svg>
//           <h2 className="text-2xl font-bold text-gray-800 mt-4">
//             Oops! Session Expired
//           </h2>
//           <p className="text-gray-600 mt-2">
//             It looks like your reservation information wasn't saved. Please return to view
//             your reservations and try again.
//           </p>
//           <button
//             onClick={() => navigate("/profile_guest_options")}
//             className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-950"
//           >
//             Return to reservations
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-4 mt-16 relative">
//       {/* <ReservationSteps currentStep={1} /> */}
//       <RoomDates />
//       <PropertyRooms
//         dates={correctedDates}
//         booking={selectedBooking}
//         key={`${correctedDates?.checkin_date}-${correctedDates?.checkout_date}`} // Force re-render on date change
//       />
//     </div>
//   );
// };

// export default EditRoomDetails;
