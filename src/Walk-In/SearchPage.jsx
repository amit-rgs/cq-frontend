import React from 'react';
import PropertyList from './PropertyList';
import { useSelector } from 'react-redux';

const SearchPage = () => {
  // Get dates directly from Redux
  const checkInDate = useSelector((state) => state.selectedDates.checkInDate);
  const checkOutDate = useSelector((state) => state.selectedDates.checkOutDate);

  const calculateCorrectDates = (checkin, checkout) => {
    if (!checkin) return {};

    let checkinDate = new Date(checkin);
    let checkoutDate = new Date(checkout);

    if (!checkout || checkoutDate <= checkinDate) {
      checkoutDate = new Date(checkinDate);
      checkoutDate.setDate(checkinDate.getDate() + 1);
    }

    return {
      checkin_date: checkinDate.toISOString().split('T')[0],
      checkout_date: checkoutDate.toISOString().split('T')[0],
    };
  };

  const correctedDates = calculateCorrectDates(checkInDate, checkOutDate);

  return (
    <div className="min-h-screen p-4 mt-16 relative">
      {/* REMOVED RoomReserve component */}
      <PropertyList dates={correctedDates} />
    </div>
  );
};

export default SearchPage;

// import React from "react";
// import RoomReserve from "./RoomReserve";
// import PropertyList from "./PropertyList";
// import { useSelector } from "react-redux";

// const SearchPage = () => {
//   // Get dates directly from Redux
//   const checkInDate = useSelector((state) => state.selectedDates.checkInDate);
//   const checkOutDate = useSelector((state) => state.selectedDates.checkOutDate);

//   const calculateCorrectDates = (checkin, checkout) => {
//     if (!checkin) return {};

//     let checkinDate = new Date(checkin);
//     let checkoutDate = new Date(checkout);

//     if (!checkout || checkoutDate <= checkinDate) {
//       checkoutDate = new Date(checkinDate);
//       checkoutDate.setDate(checkinDate.getDate() + 1);
//     }

//     return {
//       checkin_date: checkinDate.toISOString().split("T")[0],
//       checkout_date: checkoutDate.toISOString().split("T")[0],
//     };
//   };

//   const correctedDates = calculateCorrectDates(checkInDate, checkOutDate);

//   return (
//     <div className="min-h-screen p-4 mt-16 relative">

//       <RoomReserve />
//       <PropertyList dates={correctedDates} />
//     </div>
//   );
// };

// export default SearchPage;
