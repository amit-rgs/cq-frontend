import React, { useEffect, useState } from 'react';
import { LiaCheckCircle } from 'react-icons/lia';
import { FiInfo, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const ReservationSuccessful = () => {
  const [bookingData, setBookingData] = useState(null);
  const [qrData, setQrData] = useState('');
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    enhancedStayTotal: 0,
    subtotal: 0,
    taxAmount: 0,
    totalPrice: 0,
    roomTax: 0,
    enhancedStayTax: 0,
  });
  const [showAdditionalGuests, setShowAdditionalGuests] = useState(true);
  const [additionalGuests, setAdditionalGuests] = useState([]);

  const toggleAdditionalGuests = () => {
    setShowAdditionalGuests(!showAdditionalGuests);
  };

  useEffect(() => {
    // Get priceDetails from localStorage
    const storedPriceDetails = localStorage.getItem('priceDetails');
    let parsedPriceDetails = {};

    if (storedPriceDetails) {
      try {
        parsedPriceDetails = JSON.parse(storedPriceDetails);
        setPriceDetails((prev) => ({
          ...prev,
          basePrice: parsedPriceDetails.basePrice || 0,
          enhancedStayTotal: parsedPriceDetails.enhancedStayTotal || 0,
          subtotal: parsedPriceDetails.subtotal || 0,
          taxAmount: parsedPriceDetails.taxAmount || 0,
          totalPrice: parsedPriceDetails.totalPrice || 0,
          roomTax: parsedPriceDetails.roomTax || 0,
          enhancedStayTax: parsedPriceDetails.enhancedStayTax || 0,
        }));
      } catch (error) {
        console.error('Error parsing priceDetails:', error);
      }
    }

    // Get booking details from localStorage
    const reservationData = localStorage.getItem('reservationData');
    const bookingDetails = localStorage.getItem('bookingDetails');
    const reservationId = localStorage.getItem('reservationId');
    const orderId = localStorage.getItem('orderId');
    const qrcodeData = localStorage.getItem('qrcode');

    if (reservationData && bookingDetails) {
      try {
        const parsedReservationData = JSON.parse(reservationData);
        const parsedBookingDetails = JSON.parse(bookingDetails);

        const storedData = {
          reservationId: reservationId || parsedReservationData.primary_booking_id,
          orderId: orderId || parsedReservationData.order_id,
          billingId: parsedReservationData.billing?.billing_id,
          bookingDetails: parsedBookingDetails,
          priceDetails: parsedPriceDetails,
        };

        setBookingData(storedData);

        // Extract additional guests if available
        if (parsedReservationData.guests) {
          // Filter out primary guest
          const additionalGuestsList = parsedReservationData.guests.filter(
            (guest) => !guest.is_primary
          );
          setAdditionalGuests(additionalGuestsList);
        }

        // Set QR code data from localStorage
        if (qrcodeData) {
          setQrData(qrcodeData);
        }

        // Calculate number of nights
        if (parsedBookingDetails && parsedBookingDetails.booking) {
          const checkInDate = new Date(parsedBookingDetails.booking.checkindate);
          const checkOutDate = new Date(parsedBookingDetails.booking.checkoutdate);
          const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
          const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
          setNumberOfNights(nights);
        }
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
  }, []);

  const handleDone = () => {
    localStorage.clear();
    window.location.href = '/check-in/options';
  };

  const handleCheckin = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  if (!bookingData || !bookingData.bookingDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        Loading booking details...
      </div>
    );
  }

  const { booking, guest } = bookingData.bookingDetails;

  // Calculate tax breakdown (assuming 50-50 split between CGST and SGST)
  const taxAmount = priceDetails.taxAmount || 0;
  const cgst = (taxAmount / 2).toFixed(2);
  const sgst = (taxAmount / 2).toFixed(2);

  return (
    <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4">
      {/* Header */}
      <div className="bg-gray-100 text-white p-8 flex justify-between items-start">
        <div>
          <div className="flex items-center mt-4">
            <LiaCheckCircle size={56} className="mr-3 mb-10 text-green-400" />
            <div>
              <h1 className="text-3xl text-black font-bold mt-1">Reservation Successful</h1>
              <p className="text-black mt-1">
                Your reservation has been confirmed and a confirmation email has been sent to{' '}
                {guest.emailid}
              </p>
              <p className="text-lg text-black font-bold tracking-wider pt-4">
                Reservation Number: {bookingData.reservationId}
              </p>
            </div>
          </div>
        </div>
        <div className="ml-auto border border-black p-2 rounded">
          {qrData ? (
            <img
              src={`data:image/png;base64,${qrData}`}
              alt="QR Code"
              className="w-36 h-36 object-contain"
            />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center bg-gray-100">
              <span className="text-xs text-black">Loading QR code...</span>
            </div>
          )}
          <p className="text-xs text-center mt-1 text-black">Scan for details</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200 mb-10">
        {/* Column 1: Guest Details */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Guest Details</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">First Name</p>
              <p className="font-medium">
                {guest.firstname?.charAt(0).toUpperCase() +
                  guest.firstname?.slice(1).toLowerCase() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Name</p>
              <p className="font-medium">
                {guest.lastname?.charAt(0).toUpperCase() + guest.lastname?.slice(1).toLowerCase() ||
                  'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="font-medium">
                {guest.countrycode || '+91'} {guest.phonenumber || 'N/A'}
              </p>
            </div>
            <div className="">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Profile Type</p>
              <p className="font-medium">{guest.clienttype || guest.profile_type || 'N/A'}</p>
            </div>

            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
              <p className="font-medium">{guest.emailid || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Country</p>
              <p className="font-medium">{guest.country || 'India'}</p>
            </div>

            {guest.companyname && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Company</p>
                <p className="font-medium">{guest.companyname}</p>
              </div>
            )}
          </div>

          {/* Additional Guests Section */}
          <div className="mt-6">
            <div className="flex items-center cursor-pointer mb-3" onClick={toggleAdditionalGuests}>
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
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        First Name
                      </p>
                      <p className="font-medium">
                        {guest.first_name?.charAt(0).toUpperCase() +
                          guest.first_name?.slice(1).toLowerCase() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Last Name
                      </p>
                      <p className="font-medium">
                        {guest.last_name?.charAt(0).toUpperCase() +
                          guest.last_name?.slice(1).toLowerCase() || 'N/A'}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                      <p className="font-medium">{guest.email || 'N/A'}</p>
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
          <h2 className="text-2xl font-semibold mb-6">Stay Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Check-in</p>
              <p className="font-medium">
                {booking.checkindate
                  ? new Date(booking.checkindate)
                      .toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      .replaceAll('/', '-')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Check-out</p>
              <p className="font-medium">
                {booking.checkoutdate
                  ? new Date(booking.checkoutdate)
                      .toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      .replaceAll('/', '-')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Room Type</p>
              <p className="font-medium">
                {booking.room_type
                  ?.split(' ')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rooms</p>
              <p className="font-medium">{booking.quantity || 1}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Guests</p>
              <p className="font-medium">{booking.number_of_guests || 1}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nights</p>
              <p className="font-medium">{numberOfNights || 1}</p>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <div className="col-span-2 mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Special Requests
                </p>
                <p className="font-medium text-sm bg-gray-50 p-3 rounded">
                  {booking.special_requests}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Payment Details */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">Payment Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Room Charges</span>
              <span className="font-medium">
                ₹
                {new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(priceDetails.basePrice || 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Additional Services</span>
              <span className="font-medium">
                ₹
                {new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(priceDetails.enhancedStayTotal || 0)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium">
                ₹
                {new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(priceDetails.subtotal || 0)}
              </span>
            </div>

            <div className="flex justify-between relative">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-1">Taxes & Fees</span>
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
                        <div className="flex justify-between py-1 border-t border-gray-200 mt-1 pt-1">
                          <span className="font-medium">Total Tax</span>
                          <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="font-medium">
                ₹
                {new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(priceDetails.taxAmount || 0)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold">
                ₹
                {new Intl.NumberFormat('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(priceDetails.totalPrice || 0)}
              </span>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Present this confirmation and valid government ID at check-in</li>
                <li>• Check-in time is 11:00 AM</li>
                <li>• Check-out time is 1:00 PM</li>
                <li>• Early check-in/Late check-out subject to availability</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center gap-6">
        <button
          onClick={handleCheckin}
          className="bg-black text-white px-16 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ReservationSuccessful;

// import React, { useEffect, useState } from "react";
// import { LiaCheckCircle } from "react-icons/lia";
// import { FiInfo, FiChevronUp, FiChevronDown } from "react-icons/fi";
// import qr from "../assets/QR.png";

// const ReservationSuccessful = () => {
//   const [bookingData, setBookingData] = useState(null);
//   const [qrData, setQrData] = useState("");
//   const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
//   const [numberOfNights, setNumberOfNights] = useState(0);
//   const [priceDetails, setPriceDetails] = useState({
//     subtotal: 0,
//     taxes: 0,
//     total: 0,
//     basePrice: 0,
//     amenitiesTotal: 0,
//   });
//   const [showAdditionalGuests, setShowAdditionalGuests] = useState(true);
//   const [additionalGuests, setAdditionalGuests] = useState([]);

//   const toggleAdditionalGuests = () => {
//     setShowAdditionalGuests(!showAdditionalGuests);
//   };

//   useEffect(() => {
//     // Try to get consolidated data first
//     const consolidatedData = localStorage.getItem("lastSuccessfulBooking");

//     if (consolidatedData) {
//       const parsedData = JSON.parse(consolidatedData);

//       const storedData = {
//         baseAmount: parsedData.priceDetails?.basePrice || 0,
//         finalAmount: parsedData.priceDetails?.total || 0,
//         taxAmount: parsedData.priceDetails?.taxes || 0,
//         billingId: parsedData.billingId,
//         reservationId: parsedData.reservationId,
//         orderId: parsedData.orderId,
//         bookingDetails: parsedData.bookingDetails,
//         priceDetails: parsedData.priceDetails,
//         rawData: parsedData.rawData,
//       };

//       setBookingData(storedData);

//       // Extract additional guests from bookingDetails
//       if (
//         storedData.bookingDetails &&
//         storedData.bookingDetails.guest.additional_guests
//       ) {
//         setAdditionalGuests(storedData.bookingDetails.guest.additional_guests);
//       }

//       if (storedData.priceDetails) {
//         setPriceDetails(storedData.priceDetails);
//       }

//       // Generate QR code
//       const qrContent = JSON.stringify({
//         reservationId: storedData.reservationId,
//         orderId: storedData.orderId,
//         guestName: `${storedData.bookingDetails.guest.firstname} ${storedData.bookingDetails.guest.lastname}`,
//         checkIn: storedData.bookingDetails.booking.checkindate,
//         checkOut: storedData.bookingDetails.booking.checkoutdate,
//         roomType: storedData.bookingDetails.booking.room_type,
//         totalAmount: storedData.priceDetails?.total,
//         timestamp: parsedData.timestamp,
//       });
//       setQrData(qrContent);

//       // Calculate number of nights
//       if (storedData.bookingDetails) {
//         const checkInDate = new Date(
//           storedData.bookingDetails.booking.checkindate
//         );
//         const checkOutDate = new Date(
//           storedData.bookingDetails.booking.checkoutdate
//         );
//         const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//         const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
//         setNumberOfNights(nights);
//       }
//     } else {
//       // Fallback to legacy storage
//       const storedData = {
//         baseAmount: localStorage.getItem("baseAmount"),
//         finalAmount: localStorage.getItem("finalAmount"),
//         taxAmount: localStorage.getItem("taxAmount"),
//         billingId: localStorage.getItem("billingId"),
//         reservationId: localStorage.getItem("reservationId"),
//         orderId: localStorage.getItem("orderId"),
//         bookingDetails: JSON.parse(
//           localStorage.getItem("bookingDetails") || "{}"
//         ),
//         priceDetails: JSON.parse(localStorage.getItem("priceDetails") || "{}"),
//       };
//       setBookingData(storedData);

//       // Extract additional guests from bookingDetails
//       if (
//         storedData.bookingDetails &&
//         storedData.bookingDetails.guest?.additional_guests
//       ) {
//         setAdditionalGuests(storedData.bookingDetails.guest.additional_guests);
//       }

//       if (storedData.priceDetails) {
//         setPriceDetails(storedData.priceDetails);
//       }

//       if (storedData.bookingDetails) {
//         const qrContent = JSON.stringify({
//           reservationId: storedData.reservationId,
//           orderId: storedData.orderId,
//           guestName: `${storedData.bookingDetails.guest.firstname} ${storedData.bookingDetails.guest.lastname}`,
//           checkIn: storedData.bookingDetails.booking.checkindate,
//           checkOut: storedData.bookingDetails.booking.checkoutdate,
//           roomType: storedData.bookingDetails.booking.room_type,
//         });
//         setQrData(qrContent);

//         // Calculate number of nights
//         const checkInDate = new Date(
//           storedData.bookingDetails.booking.checkindate
//         );
//         const checkOutDate = new Date(
//           storedData.bookingDetails.booking.checkoutdate
//         );
//         const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//         const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
//         setNumberOfNights(nights);
//       }
//     }
//   }, []);

//   const handleDone = () => {
//     localStorage.clear();
//     window.location.href = "/check-in/options";
//   };

//   const handleCheckin = () => {
//     localStorage.clear();
//     window.location.href = "/";
//   };

//   if (!bookingData || !bookingData.bookingDetails) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-white text-black">
//         Loading booking details...
//       </div>
//     );
//   }

//   const { booking, guest } = bookingData.bookingDetails;
//   const taxAmount = priceDetails.taxes || 0;
//   const cgst = (taxAmount / 2).toFixed(2);
//   const sgst = (taxAmount / 2).toFixed(2);

//   return (
//     <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4">
//       {/* Header */}
//       <div className="bg-gray-100 text-white p-8 flex justify-between items-start">
//         <div>
//           <div className="flex items-center mt-4">
//             <LiaCheckCircle size={56} className="mr-3 mb-10 text-green-400" />
//             <div>
//               <h1 className="text-3xl text-black font-bold mt-1">
//                 Reservation Successful
//               </h1>
//               <p className="text-black   mt-1">
//                 Your reservation has been confirmed and a confirmation email has
//                 been sent to {guest.emailid}
//               </p>
//               <div>
//                 <p className="font-medium"></p>
//               </div>
//               <p className="text-lg text-black font-bold tracking-wider pt-4">
//                 Reservation Number: {bookingData.reservationId}
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="ml-auto border border-black p-2 rounded">
//           {qrData ? (
//             <img src={qr} alt="QR Code" className="w-36 h-36 object-contain" />
//           ) : (
//             <div className="w-28 h-28 flex items-center justify-center bg-gray-100">
//               <span className="text-xs">Loading QR code...</span>
//             </div>
//           )}
//           <p className="text-xs text-center mt-1 text-black">
//             Scan for details
//           </p>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200 mb-10">
//         {/* Column 1: Guest Details */}
//         <div className="p-6">
//           <h2 className="text-2xl font-semibold mb-6">Guest Details</h2>
//           <div className="grid grid-cols-2 gap-2">
//             {/* Row 1 */}
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 First Name
//               </p>
//               <p className="font-medium">
//                 {guest.firstname?.charAt(0).toUpperCase() +
//                   guest.firstname?.slice(1).toLowerCase() || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Last Name
//               </p>
//               <p className="font-medium">
//                 {guest.lastname?.charAt(0).toUpperCase() +
//                   guest.lastname?.slice(1).toLowerCase() || "N/A"}
//               </p>
//             </div>

//             {/* Row 2 */}
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Phone Number
//               </p>
//               <p className="font-medium">
//                 {guest.countrycode || "+91"} {guest.phonenumber || "N/A"}
//               </p>
//             </div>
//             <div className="">
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Profile Type
//               </p>
//               <p className="font-medium">
//                 {guest.clienttype || guest.profile_type || "N/A"}
//               </p>
//             </div>

//             {/* Row 3 */}
//             <div className="col-span-2">
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Email
//               </p>
//               <p className="font-medium">{guest.emailid || "N/A"}</p>
//             </div>

//             {/* Row 4 */}
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Country
//               </p>
//               <p className="font-medium">{guest.country || "India"}</p>
//             </div>

//             {guest.companyname && (
//               <div>
//                 <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                   Company
//                 </p>
//                 <p className="font-medium">{guest.companyname}</p>
//               </div>
//             )}
//           </div>

//           {/* Additional Guests Section */}
//           <div className="mt-6">
//             <div
//               className="flex items-center cursor-pointer mb-3"
//               onClick={toggleAdditionalGuests}
//             >
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mr-2">
//                 Additional Guests ({additionalGuests.length})
//               </h3>
//               {additionalGuests.length > 0 &&
//                 (showAdditionalGuests ? <FiChevronUp /> : <FiChevronDown />)}
//             </div>

//             {showAdditionalGuests && additionalGuests.length > 0 && (
//               <div className="space-y-4 mt-3">
//                 {additionalGuests.map((guest, index) => (
//                   <div
//                     key={index}
//                     className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md"
//                   >
//                     <div>
//                       <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                         First Name
//                       </p>
//                       <p className="font-medium">
//                         {guest.firstname?.charAt(0).toUpperCase() +
//                           guest.firstname?.slice(1).toLowerCase() || "N/A"}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                         Last Name
//                       </p>
//                       <p className="font-medium">
//                         {guest.lastname?.charAt(0).toUpperCase() +
//                           guest.lastname?.slice(1).toLowerCase() || "N/A"}
//                       </p>
//                     </div>

//                     <div className="col-span-2">
//                       <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                         Email
//                       </p>
//                       <p className="font-medium">{guest.emailid || "N/A"}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {additionalGuests.length === 0 && (
//               <p className="text-sm text-gray-500 italic">
//                 No additional guests
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Column 2: Stay Details */}
//         <div className="p-6">
//           <h2 className="text-2xl font-semibold mb-6">Stay Details</h2>
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Check-in
//               </p>
//               <p className="font-medium">
//                 {booking.checkindate
//                   ? new Date(booking.checkindate)
//                       .toLocaleDateString("en-IN", {
//                         month: "short",
//                         day: "numeric",
//                         year: "numeric",
//                       })
//                       .replaceAll("/", "-")
//                   : "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Check-out
//               </p>
//               <p className="font-medium">
//                 {booking.checkoutdate
//                   ? new Date(booking.checkoutdate)
//                       .toLocaleDateString("en-IN", {
//                         month: "short",
//                         day: "numeric",
//                         year: "numeric",
//                       })
//                       .replaceAll("/", "-")
//                   : "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Room Type
//               </p>
//               <p className="font-medium">
//                 {booking.room_type
//                   ?.split(" ")
//                   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//                   .join(" ") || "N/A"}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Rooms
//               </p>
//               <p className="font-medium">{booking.quantity || 1}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Total Guests
//               </p>
//               <p className="font-medium">{booking.number_of_guests || 1}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                 Nights
//               </p>
//               <p className="font-medium">{numberOfNights || 1}</p>
//             </div>

//             {/* Special Requests */}
//             {booking.special_requests && (
//               <div className="col-span-2 mt-4">
//                 <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
//                   Special Requests
//                 </p>
//                 <p className="font-medium text-sm bg-gray-50 p-3 rounded">
//                   {booking.special_requests}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Column 3: Payment Details */}
//         <div className="p-6">
//           <h2 className="text-2xl  font-semibold mb-6 flex items-center">
//             Payment Summary
//           </h2>
//           <div className="space-y-2">
//             <div className="flex justify-between">
//               <span className="text-sm text-gray-600">Room Charges</span>
//               <span className="font-medium">
//                 ₹
//                 {new Intl.NumberFormat("en-IN", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 }).format(priceDetails.basePrice || 0)}
//               </span>
//             </div>

//             <div className="flex justify-between">
//               <span className="text-sm text-gray-600">Additional Services</span>
//               <span className="font-medium">
//                 ₹
//                 {new Intl.NumberFormat("en-IN", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 }).format(priceDetails.amenitiesTotal || 0)}
//               </span>
//             </div>

//             <div className="flex justify-between border-t border-gray-200 pt-2">
//               <span className="text-sm text-gray-600">Subtotal</span>
//               <span className="font-medium">
//                 ₹
//                 {new Intl.NumberFormat("en-IN", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 }).format(priceDetails.subtotal || 0)}
//               </span>
//             </div>

//             <div className="flex justify-between relative">
//               <div className="flex items-center">
//                 <span className="text-sm text-gray-600 mr-1">Taxes & Fees</span>
//                 <div
//                   className="relative"
//                   onMouseEnter={() => setShowTaxBreakdown(true)}
//                   onMouseLeave={() => setShowTaxBreakdown(false)}
//                 >
//                   <FiInfo className="text-gray-400 cursor-pointer" size={14} />
//                   {showTaxBreakdown && (
//                     <div className="absolute left-0 bottom-full mb-2 w-48 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
//                       <div className="text-xs text-gray-600">
//                         <div className="flex justify-between py-1">
//                           <span>CGST (6%)</span>
//                           <span>₹{cgst}</span>
//                         </div>
//                         <div className="flex justify-between py-1">
//                           <span>SGST (6%)</span>
//                           <span>₹{sgst}</span>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <span className="font-medium">
//                 ₹
//                 {new Intl.NumberFormat("en-IN", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 }).format(priceDetails.taxes || 0)}
//               </span>
//             </div>

//             <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
//               <span className="font-semibold">Total Amount</span>
//               <span className="font-bold">
//                 ₹
//                 {new Intl.NumberFormat("en-IN", {
//                   minimumFractionDigits: 2,
//                   maximumFractionDigits: 2,
//                 }).format(priceDetails.total || 0)}
//               </span>
//             </div>

//             <div className="mt-6 bg-gray-50 p-4 rounded-lg">
//               <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
//               <ul className="text-xs text-gray-600 space-y-1">
//                 <li>
//                   • Present this confirmation and valid government ID at
//                   check-in
//                 </li>
//                 <li>• Check-in time is 1:00 PM</li>
//                 <li>• Check-out time is 1:00 PM</li>
//                 <li>• Early check-in/Late check-out subject to availability</li>
//               </ul>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-center gap-6">
//         <button
//           onClick={handleCheckin}
//           className="bg-black text-white px-16 py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
//         >
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ReservationSuccessful;
