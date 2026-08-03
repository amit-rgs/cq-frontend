import { useState, useEffect } from 'react';
import { CalendarDays, XCircle, CheckSquare, Search, FileText, ArrowUp } from 'lucide-react';

export default function Bookingdata() {
  const [activeTab, setActiveTab] = useState('UPCOMING');
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([
    {
      id: 1,
      title: 'Adi Yogi Campsite',
      status: 'Completed',
      location: 'Camp in Chopta',
      bookingId: 'NH75082408612880',
      checkIn: "17 Jun'25 Tue",
      checkOut: "18 Jun'25 Wed",
      checkInTime: 'Check In from 12:00 PM',
      checkOutTime: 'Check Out till 12:00 PM',
      details: '1 Entire Camp(s), 1 Night(s)',
      guests: 'Sagar + 2',
    },
  ]);

  // In a real app, this would come from an API
  useEffect(() => {
    // Simulating empty upcoming and cancelled bookings
    setUpcomingBookings([]);
    setCancelledBookings([]);
  }, []);

  const getCurrentBookings = () => {
    switch (activeTab) {
      case 'UPCOMING':
        return upcomingBookings;
      case 'CANCELLED':
        return cancelledBookings;
      case 'COMPLETED':
        return completedBookings;
      default:
        return [];
    }
  };

  const currentBookings = getCurrentBookings();
  const isEmpty = currentBookings.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-100 px-4 py-6 md:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center mb-8 md:mb-10 gap-4">
        <div className="flex items-center mr-14">
          <input
            type="text"
            placeholder="Search for a reservation"
            className="rounded-l-lg px-4 py-2 border border-gray-300 focus:outline-none"
          />
          <button className="bg-blue-600 px-4 py-2 rounded-r-lg text-white">
            <Search size={24} />
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 max-w-7xl mx-auto lg:mx-12">
        <div className="flex gap-4 md:gap-10 overflow-x-auto pb-4">
          <Tab
            icon={<CalendarDays size={18} />}
            label="UPCOMING"
            active={activeTab === 'UPCOMING'}
            onClick={() => setActiveTab('UPCOMING')}
          />
          <Tab
            icon={<XCircle size={18} />}
            label="CANCELLED"
            active={activeTab === 'CANCELLED'}
            onClick={() => setActiveTab('CANCELLED')}
          />
          <Tab
            icon={<CheckSquare size={18} />}
            label="COMPLETED"
            active={activeTab === 'COMPLETED'}
            onClick={() => setActiveTab('COMPLETED')}
          />
        </div>

        {/* Content Area */}
        <div className="mt-8">
          {isEmpty ? (
            <EmptyState tab={activeTab} onPlanTrip={() => console.log('Plan a trip clicked')} />
          ) : (
            currentBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          )}
        </div>
      </div>

      {/* Back To Top - Only show when there's content */}
      {!isEmpty && (
        <button className="fixed bottom-8 right-12 md:right-20 bg-white shadow-lg px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-2 text-blue-600 font-medium hover:shadow-xl transition hover:bg-gray-50">
          <ArrowUp size={18} />
          <span className="hidden md:inline">Back To Top</span>
        </button>
      )}
    </div>
  );
}

function Tab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer pb-3 whitespace-nowrap ${
        active
          ? 'text-black border-b-4 border-blue-600 font-semibold'
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {icon}
      <span className="text-sm md:text-base">{label}</span>
    </button>
  );
}

function EmptyState({ tab, onPlanTrip }) {
  return (
    <div className="text-center py-12 md:py-10">
      <div className="mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="text-gray-400" size={32} />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-2">
          Looks empty, you've no {tab.toLowerCase()} reservation.
        </h3>
        <p className="text-gray-500 text-sm md:text-base">
          When you book a trip, you will see your reservation here.
        </p>
      </div>
      <button
        onClick={onPlanTrip}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition inline-flex items-center gap-2"
      >
        PLAN A TRIP
      </button>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border">
            <FileText className="text-gray-600" size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{booking.title}</h2>
            <p className="text-sm text-gray-500">
              {booking.status} • {booking.location} • Reservation ID - {booking.bookingId}
            </p>
          </div>
        </div>

        <button className="bg-blue-500 hover:bg-blue-600 transition text-white px-4 py-2 md:px-6 md:py-2 rounded-full font-medium text-sm md:text-base w-full md:w-auto">
          VIEW & MANAGE RESERVATION
        </button>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6 text-sm">
        <div>
          <p className="text-gray-500">CHECK-IN</p>
          <p className="font-semibold">{booking.checkIn}</p>
          <p className="text-orange-500 text-sm">{booking.checkInTime}</p>
        </div>

        <div>
          <p className="text-gray-500">CHECK-OUT</p>
          <p className="font-semibold">{booking.checkOut}</p>
          <p className="text-gray-500 text-sm">{booking.checkOutTime}</p>
        </div>

        <div>
          <p className="text-blue-600 font-medium">{booking.details}</p>
          <p className="text-gray-500 mt-1">{booking.guests}</p>
        </div>

        <div className="flex items-center">
          <button className="text-blue-600 flex items-center gap-2 font-medium hover:text-blue-700">
            <FileText size={16} />
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// import { CalendarDays, XCircle, CheckSquare, Search, FileText, ArrowUp } from "lucide-react";

// export default function Bookingdata() {
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-100 px-6 py-6">

//       {/* Top Bar */}
//       <div className="flex justify-end  items-center mb-10">
//         {/* <p className="text-gray-600 text-sm">
//           My Account <span className="mx-1">{">"}</span> My Trips
//         </p> */}

//     <div className="flex items-center mr-16">
//       <input
//         type="text"
//         placeholder="Search for a booking"
//         className="rounded-l-lg px-4 py-2 border border-gray-300 focus:outline-none"
//       />
//       <button className="bg-blue-600 px-4 py-2 rounded-r-lg text-white">
//         <Search size={24} />
//       </button>
//     </div>
//   </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-xl shadow-md p-6 max-w-7xl ml-12">
//         <div className="flex gap-10  pb-4">
//           <Tab icon={<CalendarDays size={18} />} label="UPCOMING" />
//           <Tab icon={<XCircle size={18} />} label="CANCELLED" />
//           <Tab
//             icon={<CheckSquare size={18} />}
//             label="COMPLETED"
//             active
//           />
//         </div>

//         {/* Booking Card */}
//         <div className="mt-8 bg-white border rounded-xl shadow-sm p-6">
//           <div className="flex justify-between items-center">
//             <div className="flex items-start gap-4">
//               <div className="w-12 h-12 flex items-center justify-center rounded-full border">
//                 <FileText className="text-gray-600" />
//               </div>

//               <div>
//                 <h2 className="text-lg font-semibold">Adi Yogi Campsite</h2>
//                 <p className="text-sm text-gray-500">
//                   Completed • Camp in Chopta • Booking ID - NH75082408612880
//                 </p>
//               </div>
//             </div>

//             <button className="bg-blue-500 hover:bg-blue-600 transition text-white px-6 py-2 rounded-full font-medium">
//               VIEW & MANAGE BOOKING
//             </button>
//           </div>

//           {/* Details */}
//           <div className="grid grid-cols-4 gap-6 mt-6 text-sm">
//             <div>
//               <p className="text-gray-500">CHECK-IN</p>
//               <p className="font-semibold">17 Jun’25 Tue</p>
//               <p className="text-orange-500">Check In from 12:00 PM</p>
//             </div>

//             <div>
//               <p className="text-gray-500">CHECK-OUT</p>
//               <p className="font-semibold">18 Jun’25 Wed</p>
//               <p className="text-gray-500">Check Out till 12:00 PM</p>
//             </div>

//             <div>
//               <p className="text-blue-600 font-medium">
//                 1 Entire Camp(s), 1 Night(s)
//               </p>
//               <p className="text-gray-500 mt-1">Sagar + 2</p>
//             </div>

//             <div className="flex items-center">
//               <button className="text-blue-600 flex items-center gap-2 font-medium">
//                 <FileText size={16} />
//                 Download Invoice
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Back To Top */}
//       <button className="fixed bottom-8 right-8 bg-white shadow-lg px-6 py-3 mr-16 rounded-full flex items-center gap-2 text-blue-600 font-medium">
//         <ArrowUp size={18} />
//         Back To Top
//       </button>
//     </div>
//   );
// }

// function Tab({ icon, label, active }) {
//   return (
//     <div
//       className={`flex items-center gap-2 cursor-pointer pb-3 ${
//         active
//           ? "text-black border-b-4 border-blue-600 font-semibold"
//           : "text-gray-400"
//       }`}
//     >
//       {icon}
//       <span>{label}</span>
//     </div>
//   );
// }
