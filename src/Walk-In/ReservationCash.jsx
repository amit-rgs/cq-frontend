import React, { useEffect, useState } from 'react';
import { LiaCheckCircle } from 'react-icons/lia';
import { FiInfo, FiChevronUp, FiChevronDown } from 'react-icons/fi';

import { QRCodeSVG } from 'qrcode.react';

const ReservationCash = () => {
  const [bookingData, setBookingData] = useState(null);
  const [qrData, setQrData] = useState('');
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [priceDetails, setPriceDetails] = useState({
    subtotal: 0,
    taxes: 0,
    total: 0,
    basePrice: 0,
    amenitiesTotal: 0,
  });
  const [showAdditionalGuests, setShowAdditionalGuests] = useState(true);
  const [additionalGuests, setAdditionalGuests] = useState([]);

  const toggleAdditionalGuests = () => {
    setShowAdditionalGuests(!showAdditionalGuests);
  };

  useEffect(() => {
    const storedData = {
      baseAmount: localStorage.getItem('baseAmount'),
      finalAmount: localStorage.getItem('finalAmount'),
      taxAmount: localStorage.getItem('taxAmount'),
      billingId: localStorage.getItem('billingId'),
      reservationId: localStorage.getItem('reservationId'),
      orderId: localStorage.getItem('orderId'),
      bookingDetails: JSON.parse(localStorage.getItem('bookingDetails')),
      priceDetails: JSON.parse(localStorage.getItem('priceDetails')),
    };
    setBookingData(storedData);

    // Extract additional guests from bookingDetails
    if (storedData.bookingDetails && storedData.bookingDetails.guest.additional_guests) {
      setAdditionalGuests(storedData.bookingDetails.guest.additional_guests);
    }

    if (storedData.priceDetails) {
      setPriceDetails(storedData.priceDetails);
    }

    if (storedData.bookingDetails) {
      const qrContent = JSON.stringify({
        reservationId: storedData.reservationId,
        orderId: storedData.orderId,
        guestName: `${storedData.bookingDetails.guest.firstname} ${storedData.bookingDetails.guest.lastname}`,
        checkIn: storedData.bookingDetails.booking.checkindate,
        checkOut: storedData.bookingDetails.booking.checkoutdate,
        roomType: storedData.bookingDetails.booking.room_type,
      });
      setQrData(qrContent);

      // Calculate number of nights
      const checkInDate = new Date(storedData.bookingDetails.booking.checkindate);
      const checkOutDate = new Date(storedData.bookingDetails.booking.checkoutdate);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      setNumberOfNights(nights);
    }
  }, []);

  const handlecheckin = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Format date to DD-MM-YYYY with leading zeros
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  if (!bookingData || !bookingData.bookingDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        Loading booking details...
      </div>
    );
  }

  const { booking, guest } = bookingData.bookingDetails;
  const taxAmount = priceDetails.taxes || 0;
  const cgst = (taxAmount / 2).toFixed(2);
  const sgst = (taxAmount / 2).toFixed(2);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 mt-16">
      <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gray-100 text-white p-8 flex justify-between items-start">
          <div>
            <div className="flex items-center mt-4">
              <LiaCheckCircle size={56} className="mr-3 mb-10 text-green-400" />
              <div>
                <h1 className="text-2xl text-black font-bold mt-1">Reservation Successful</h1>
                <p className="text-black mt-1">
                  Your reservation has been confirmed and a confirmation email has been sent to{' '}
                  {guest.emailid}
                </p>
                <div>
                  <p className="font-medium"></p>
                </div>
                <p className="text-lg text-black font-bold tracking-wider pt-4">
                  Reservation Number: {bookingData.orderId}
                </p>
              </div>
            </div>
          </div>
          <div className="ml-auto border border-black p-2 rounded">
            {qrData ? (
              <QRCodeSVG value={qrData} size={112} level="H" includeMargin={true} />
            ) : (
              <div className="w-28 h-28 flex items-center justify-center bg-gray-100">
                <span className="text-xs">Loading QR code...</span>
              </div>
            )}
            <p className="text-xs text-center mt-1 text-black">Scan for details</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200">
          {/* Column 1: Guest Details */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Guest Details</h2>
            <div className="grid grid-cols-2 gap-2">
              {/* Row 1 */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  First Name
                </p>
                <p className="font-semibold text-gray-900">
                  {guest.firstname.charAt(0).toUpperCase() + guest.firstname.slice(1).toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Last Name
                </p>
                <p className="font-semibold text-gray-900">
                  {guest.lastname.charAt(0).toUpperCase() + guest.lastname.slice(1).toLowerCase()}
                </p>
              </div>

              {/* Row 2 */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Phone Number
                </p>
                <p className="font-semibold text-gray-900">
                  {guest.countrycode} {guest.phonenumber}
                </p>
              </div>
              <div className="">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Profile Type
                </p>
                <p className="font-semibold text-gray-900">{guest.clienttype}</p>
              </div>

              {/* Row 3 - spans both columns */}
              <div className="col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="font-semibold text-gray-900">{guest.emailid}</p>
              </div>
            </div>

            {/* Additional Guests Section */}
            <div className="mt-6">
              <div
                className="flex items-center cursor-pointer mb-3"
                onClick={toggleAdditionalGuests}
              >
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mr-2">
                  Additional Guests ({additionalGuests.length})
                </h3>
                {additionalGuests.length > 0 &&
                  (showAdditionalGuests ? <FiChevronUp /> : <FiChevronDown />)}
              </div>

              {showAdditionalGuests && additionalGuests.length > 0 && (
                <div className="space-y-4 mt-3">
                  {additionalGuests.map((guest, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          First Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {guest.firstname?.charAt(0).toUpperCase() +
                            guest.firstname?.slice(1).toLowerCase() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Last Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {guest.lastname?.charAt(0).toUpperCase() +
                            guest.lastname?.slice(1).toLowerCase() || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Profile Type
                        </p>
                        <p className="font-semibold text-gray-900">{guest.clienttype || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Phone Number
                        </p>
                        <p className="font-semibold text-gray-900">
                          {guest.countrycode} {guest.phonenumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {additionalGuests.length === 0 && (
                <p className="text-sm text-gray-500 italic">No additional guests</p>
              )}
            </div>
          </div>

          {/* Column 2: Stay Details */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Stay Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check-in
                </p>
                <p className="font-semibold text-gray-900">
                  {booking.checkindate
                    ? new Date(booking.checkindate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}{' '}
                  (1:00 PM)
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check-out
                </p>
                <p className="font-semibold text-gray-900">
                  {booking.checkoutdate
                    ? new Date(booking.checkoutdate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}{' '}
                  (1:00 PM)
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Room Type
                </p>
                <p className="font-semibold text-gray-900">{booking.room_type}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Guests
                </p>
                <p className="font-semibold text-gray-900">{booking.number_of_guests}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  No of nights
                </p>
                <p className="font-semibold text-gray-900">{numberOfNights}</p>
              </div>
            </div>
          </div>

          {/* Column 3: Payment Details */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-600">Room Charges</span>
                <span className="font-semibold text-gray-900">
                  ₹
                  {new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(priceDetails.basePrice)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-600">Additional Services Total</span>
                <span className="font-semibold text-gray-900">
                  ₹
                  {new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(priceDetails.amenitiesTotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm font-bold text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₹
                  {new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(priceDetails.subtotal)}
                </span>
              </div>

              <div className="flex justify-between relative">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-600 mr-1">Taxes & Fees</span>
                  <div
                    className="relative"
                    onMouseEnter={() => setShowTaxBreakdown(true)}
                    onMouseLeave={() => setShowTaxBreakdown(false)}
                  >
                    <FiInfo className="text-gray-400 cursor-pointer" size={14} />
                    {showTaxBreakdown && (
                      <div className="absolute left-0 bottom-full mb-2 w-48 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
                        <div className="text-xs text-gray-600">
                          <div className="flex justify-between py-1">
                            <span>CGST (6%)</span>
                            <span>₹{cgst}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>SGST (6%)</span>
                            <span>₹{sgst}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹
                  {new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(priceDetails.taxes)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-gray-900">
                  ₹
                  {new Intl.NumberFormat('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(priceDetails.total)}
                </span>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Present this confirmation at check-in</li>
                  <li>• Check-in time is 1:00 PM</li>
                  <li>• Check-out time is 1:00 PM</li>
                  <li>• Government ID required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={handlecheckin}
            className="bg-purple-500 text-white px-16 py-3 rounded-md text-sm font-medium hover:bg-purple-700  shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform duration-200"
          >
            Continue to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationCash;

// import React, { useEffect, useState } from "react";
// import { LiaCheckCircle } from "react-icons/lia";
// import { FiInfo } from "react-icons/fi"; // Added info icon
// import ProgressSteps from "../CHECK-IN/Walk-In/ProgressSteps";
// import { QRCodeSVG } from "qrcode.react";

// const ReservationCash = () => {
//   const [bookingData, setBookingData] = useState(null);
//   const [qrData, setQrData] = useState("");
//   const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
//   const [numberOfNights, setNumberOfNights] = useState(0);

//   useEffect(() => {
//     const storedData = {
//       baseAmount: localStorage.getItem("baseAmount"),
//       finalAmount: localStorage.getItem("finalAmount"),
//       taxAmount: localStorage.getItem("taxAmount"),
//       billingId: localStorage.getItem("billingId"),
//       reservationId: localStorage.getItem("reservationId"),
//       orderId: localStorage.getItem("orderId"),
//       bookingDetails: JSON.parse(localStorage.getItem("bookingDetails")),
//     };
//     setBookingData(storedData);

//     if (storedData.bookingDetails) {
//       const qrContent = JSON.stringify({
//         reservationId: storedData.reservationId,
//         orderId: storedData.orderId,
//         guestName: `${storedData.bookingDetails.guest.firstname} ${storedData.bookingDetails.guest.lastname}`,
//         checkIn: storedData.bookingDetails.booking.checkindate,
//         checkOut: storedData.bookingDetails.booking.checkoutdate,
//         roomType: storedData.bookingDetails.booking.room_type
//       });
//       setQrData(qrContent);

//       // Calculate number of nights
//       const checkInDate = new Date(storedData.bookingDetails.booking.checkindate);
//       const checkOutDate = new Date(storedData.bookingDetails.booking.checkoutdate);
//       const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//       const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
//       setNumberOfNights(nights);
//     }
//   }, []);

//   const handleDone = () => {
//     localStorage.clear();
//     window.location.href = "/check-in/options";
//   };

//   const handlecheckin = () => {
//     localStorage.clear();
//     window.location.href = "reservation/options";
//   };

//   if (!bookingData || !bookingData.bookingDetails) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-white text-black">
//         Loading booking details...
//       </div>
//     );
//   }

//   const { booking, guest } = bookingData.bookingDetails;
//   const taxAmount = parseFloat(bookingData.taxAmount) || 0;
//   const cgst = (taxAmount / 2).toFixed(2);
//   const sgst = (taxAmount / 2).toFixed(2);

//   return (
//     <div className="min-h-screen bg-white flex items-center justify-center p-4 mt-16">
//       <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
//         <ProgressSteps currentStep={4} />
//         {/* Header */}
//         <div className="bg-gray-100 text-white p-8 flex justify-between items-start">
//           <div>
//             <div className="flex items-center mt-4">
//               <LiaCheckCircle size={56} className="mr-3 mb-10 text-green-400" />
//               <div>
//                 <h1 className="text-2xl text-black font-bold mt-1">Reservation Successful</h1>
//                 <p className="text-black mt-1">
//                   Your reservation has been confirmed and a confirmation email has been sent to {guest.emailid}.
//                 </p>
//                 <div>
//                   <p className="font-medium"></p>
//                 </div>
//                 <p className="text-lg text-black font-bold tracking-wider pt-4">Reservation Number: {bookingData.orderId}</p>
//               </div>
//             </div>
//           </div>
//           <div className="ml-auto border border-black p-2 rounded">
//             {qrData ? (
//               <QRCodeSVG
//                 value={qrData}
//                 size={112}
//                 level="H"
//                 includeMargin={true}
//               />
//             ) : (
//               <div className="w-28 h-28 flex items-center justify-center bg-gray-100">
//                 <span className="text-xs">Loading QR code...</span>
//               </div>
//             )}
//             <p className="text-xs text-center mt-1 text-black">
//               Scan for details
//             </p>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200">
//           {/* Column 1: Guest Details */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-4 flex items-center">
//               Guest Details
//             </h2>
//             <div className="space-y-4">
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
//                 <p className="font-medium">{guest.firstname} {guest.lastname}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Phone Number</p>
//                 <p className="font-medium">{guest.countrycode} {guest.phonenumber}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
//                 <p className="font-medium">{guest.emailid}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Booking Type</p>
//                 <p className="font-medium">{guest.clienttype}</p>
//               </div>
//             </div>
//           </div>

//           {/* Column 2: Guest Details */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-4 flex items-center">
//               Stay Details
//             </h2>
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 gap-4">
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">Check-in</p>
//                   <p className="font-medium">
//                     {new Date(booking.checkindate).toLocaleDateString('en-GB').replaceAll('/', '-')}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs text-gray-500 uppercase tracking-wider">Check-out</p>
//                   <p className="font-medium">
//                     {new Date(booking.checkoutdate).toLocaleDateString('en-GB').replaceAll('/', '-')}
//                   </p>
//                 </div>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Room Type</p>
//                 <p className="font-medium">{booking.room_type}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">Guests</p>
//                 <p className="font-medium">{booking.number_of_guests}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider">No of nights</p>
//                 <p className="font-medium">{numberOfNights}</p>
//               </div>
//             </div>
//           </div>

//           {/* Column 3: Payment Details */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-4 flex items-center">
//               Payment Summary
//             </h2>
//             <div className="space-y-4">
//               <div className="flex justify-between">
//                 <span className="text-sm text-gray-600">Room Charges</span>
//                 <span className="font-medium">₹{bookingData.baseAmount}</span>
//               </div>
//               <div className="flex justify-between relative">
//                 <div className="flex items-center">
//                   <span className="text-sm text-gray-600 mr-1">Taxes & Fees</span>
//                   <div
//                     className="relative"
//                     onMouseEnter={() => setShowTaxBreakdown(true)}
//                     onMouseLeave={() => setShowTaxBreakdown(false)}
//                   >
//                     <FiInfo className="text-gray-400 cursor-pointer" size={14} />
//                     {showTaxBreakdown && (
//                       <div className="absolute left-0 bottom-full mb-2 w-48 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
//                         <div className="text-xs text-gray-600">
//                           <div className="flex justify-between py-1">
//                             <span>CGST (6%)</span>
//                             <span>₹{cgst}</span>
//                           </div>
//                           <div className="flex justify-between py-1">
//                             <span>SGST (6%)</span>
//                             <span>₹{sgst}</span>
//                           </div>

//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <span className="font-medium">₹{bookingData.taxAmount}</span>
//               </div>
//               <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
//                 <span className="font-semibold">Total Amount</span>
//                 <span className="font-bold">₹{bookingData.finalAmount}</span>
//               </div>

//               <div className="mt-6 bg-gray-50 p-4 rounded-lg">
//                 <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
//                 <ul className="text-xs text-gray-600 space-y-1">
//                   <li>• Present this confirmation at check-in</li>
//                   <li>• Check-in time is 1:00 PM</li>
//                   <li>• Government ID required</li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center gap-6">
//           <button
//             onClick={handlecheckin}
//             className="bg-black text-white px-16 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
//           >
//             Continue to Check-In
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReservationCash;
