import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiDownload,
  FiX,
  FiCalendar,
  FiUsers,
  FiHome,
  FiCheckCircle,
  FiUser,
  FiUserPlus,
  FiInfo,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { FiFileText } from 'react-icons/fi';
import { AiOutlineWarning } from 'react-icons/ai';

const SingleBookingView = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationResponse, setCancellationResponse] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [userEmail, setUserEmail] = useState('sagardadhich82@gmail.com');
  const [booking, setBooking] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);

        // Check if booking data was passed via navigation state
        if (location.state?.booking) {
          setBooking(location.state.booking);
          setCurrentBooking(location.state.booking);
          setLoading(false);
          return;
        }

        // If no state data, fetch from API
        const email = 'sagardadhich82@gmail.com';
        const includeEnhancements = true;

        const apiUrl = `https://localhost:8000/bq/api/bookings/categorized?email=${encodeURIComponent(
          email
        )}&include_enhancements=${includeEnhancements}`;

        const response = await fetch(apiUrl, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Search for the specific booking in all categories
        const allBookings = [
          ...(data.upcoming || []),
          ...(data.current || []),
          ...(data.completed || []),
          ...(data.cancelled || []),
        ];

        const foundBooking = allBookings.find(
          (b) =>
            b.bookingid === parseInt(bookingId) ||
            b.orderid === parseInt(bookingId) ||
            b.orderid.toString() === bookingId
        );

        if (foundBooking) {
          setBooking(foundBooking);
          setCurrentBooking(foundBooking);
        } else {
          throw new Error('Booking not found');
        }
      } catch (err) {
        console.error('Booking fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, location.state]);

  // Fix the HTML structure in the confirmation popup
  const ConfirmationContent = () => (
    <div className="text-gray-900 text-lg leading-relaxed">
      <p>Are you sure you want to cancel your reservation?</p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-left">
        <div className="flex items-start">
          <FiInfo className="text-black mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-black font-medium text-sm mb-1">Refund Information</p>
            <p className="text-black text-sm">
              If your reservation includes refundable amounts, they will be automatically refunded
              to your original payment method within 5-7 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace('₹', '₹ ');
  };

  const handleSendInvoice = async () => {
    if (!currentBooking) return;

    try {
      setSendingInvoice(true);

      const response = await fetch(
        `https://localhost:8000/bq/api/invoice/email/${
          currentBooking.orderid
        }?recipient_email=${encodeURIComponent(userEmail)}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Email sending failed with status ${response.status}`);
      }

      const data = await response.json();
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice. Please try again.');
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleConfirmCancellation = () => {
    setIsConfirmationPopupOpen(false);
    processCancellation();
  };

  const processCancellation = async () => {
    if (!cancellingBooking || !cancellationReason) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/bq/api/cancel-booking/?orderid=${cancellingBooking.orderid}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellation_reason: cancellationReason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Cancellation failed with status ${response.status}`);
      }

      const data = await response.json();
      setCancellationResponse({
        ...data,
        success: data.success || false,
      });

      // Update booking status after cancellation
      if (data.success) {
        setBooking((prev) => ({
          ...prev,
          booking_status: 'Cancelled',
        }));
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      setCancellationResponse({
        success: false,
        message: 'Cancellation failed. Please try again.',
        refund_amount: 0,
        cancellation_charges: 0,
        service_fee: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    if (!cancellationReason) {
      alert('Please provide a cancellation reason.');
      return;
    }

    setIsConfirmationPopupOpen(true);
  };

  const resetCancellationFlow = () => {
    setCancellationReason('');
    setCancellationResponse(null);
    setCancellingBooking(null);
    setIsCancelPopupOpen(false);
    setIsConfirmationPopupOpen(false);
  };

  const CancellationPolicyCard = ({ booking }) => {
    const primaryGuest = booking?.guests?.find((g) => g.is_primary);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FiInfo className="mr-2 text-blue-500" />
            Reservation Details
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Guest Information
              </h4>
              <div className="flex items-start">
                <FiUser className="mt-1 mr-2 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    {primaryGuest?.firstname} {primaryGuest?.lastname}
                  </p>
                  {primaryGuest?.emailid && (
                    <p className="text-xs text-gray-500">{primaryGuest.emailid}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Stay Details
              </h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <FiCalendar className="mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">
                    {formatDate(booking.checkindate)} to {formatDate(booking.checkoutdate)}
                  </span>
                </div>
                <div className="flex items-center">
                  <FiUsers className="mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">
                    {booking.number_of_guests || 1} guest
                    {booking.number_of_guests !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Cancellation Policy
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                Cancellations must be made at least 24 hours prior to arrival to avoid a penalty of
                one night's room rate plus tax. No-shows will be charged the full reservation
                amount.
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderGuestInfo = (guests) => {
    if (!guests || guests.length === 0) return null;

    const primaryGuest = guests.find((g) => g.is_primary);
    const additionalGuests = guests.filter((g) => !g.is_primary);

    return (
      <div className="mt-4 border-t pt-3">
        <div className="flex items-center mb-2">
          <FiUser className="mr-2 text-gray-500" />
          <span className="font-medium">Primary Guest:</span>
          <span className="ml-2">
            {primaryGuest?.firstname} {primaryGuest?.lastname}
          </span>
        </div>

        {additionalGuests.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center mb-2">
              <FiUserPlus className="mr-2 text-gray-500" />
              <span className="font-medium">Additional Guests:</span>
            </div>
            <ul className="ml-6 list-disc text-transform: capitalize">
              {additionalGuests.map((guest, index) => (
                <li key={index}>
                  {guest.firstname} {guest.lastname}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderEnhancements = (enhancements, booking) => {
    if (!enhancements || typeof enhancements !== 'object') return null;

    const formatCurrencyWithDecimals = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(amount)
        .replace('₹', '₹ ');
    };

    return (
      <div className="mt-4 border-t pt-3">
        <div className="mb-3">
          <h4 className="font-medium mb-2">Room Charges:</h4>
          <div className="ml-4 space-y-1">
            <div className="flex justify-between">
              <span>
                {' '}
                {booking.room_type} (x{booking.length_of_stay})
              </span>
              <div className="flex flex-col items-end">
                <span>{formatCurrencyWithDecimals(booking.final_amount)}</span>
                <span className="text-[9px] text-gray-500">Including taxes and fees</span>
              </div>
            </div>
          </div>
        </div>

        <h4 className="font-medium mb-2">Enhancements:</h4>
        <div className="space-y-3">
          {enhancements.food?.items?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium">Food Items:</h5>
              <ul className="ml-4 space-y-1">
                {enhancements.food.items.map((item, i) => {
                  const totalBase = enhancements.food.total.base_amount;
                  const totalTax = enhancements.food.total.tax_amount || 0;
                  const taxPerItem =
                    totalBase > 0
                      ? ((item.base_price * item.selected_quantity) / totalBase) * totalTax
                      : 0;

                  const itemFinalAmount = item.base_price * item.selected_quantity + taxPerItem;

                  return (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.name} (x{item.selected_quantity})
                      </span>
                      <div className="flex flex-col items-end">
                        <span>{formatCurrencyWithDecimals(itemFinalAmount)}</span>
                        <span className="text-[9px] text-gray-500">Including taxes and fees</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {enhancements.amenities?.items?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium">Amenities:</h5>
              <ul className="ml-4 space-y-1">
                {enhancements.amenities.items.map((item, i) => {
                  const totalBase = enhancements.amenities.total.base_amount;
                  const totalTax = enhancements.amenities.total.tax_amount || 0;
                  const taxPerItem =
                    totalBase > 0
                      ? ((item.base_price * item.selected_quantity) / totalBase) * totalTax
                      : 0;

                  const itemFinalAmount = item.base_price * item.selected_quantity + taxPerItem;

                  return (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.name} (x{item.selected_quantity})
                      </span>
                      <div className="flex flex-col items-end">
                        <span>{formatCurrencyWithDecimals(itemFinalAmount)}</span>
                        <span className="text-[9px] text-gray-500">Including taxes and fees</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {enhancements.room_services?.items?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium">Room Services:</h5>
              <ul className="ml-4 space-y-1">
                {enhancements.room_services.items.map((item, i) => {
                  const totalBase = enhancements.room_services.total.base_amount;
                  const totalTax = enhancements.room_services.total.tax_amount || 0;
                  const taxPerItem =
                    totalBase > 0
                      ? ((item.base_price * item.selected_quantity) / totalBase) * totalTax
                      : 0;

                  const itemFinalAmount = item.base_price * item.selected_quantity + taxPerItem;

                  return (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.name} (x{item.selected_quantity})
                      </span>
                      <div className="flex flex-col items-end">
                        <span>{formatCurrencyWithDecimals(itemFinalAmount)}</span>
                        <span className="text-[9px] text-gray-500">Including taxes and fees</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getBookingStatusDisplay = (booking) => {
    const status = booking.booking_status;
    const payment = booking.payment_status;

    if (status === 'Soft') {
      return payment !== 'Paid' ? 'Reserved (Payment Required)' : 'Reserved';
    }

    if (status === 'Hard') {
      return 'Checked In';
    }

    if (status === 'Cancelled') {
      return 'Cancelled';
    }

    return booking.booking_status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatToTwoDecimal = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(value).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <AiOutlineWarning className="text-red-500 text-5xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Unable to load booking</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/view-reservation')}
          className="px-4 py-2 bg-black text-white rounded hover:text-gray-300"
        >
          View All Reservations
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <AiOutlineWarning className="text-yellow-500 text-5xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Booking not found</h1>
        <p className="text-gray-600 mb-6">The requested booking could not be found.</p>
        <button
          onClick={() => navigate('/view-reservation')}
          className="px-4 py-2 bg-black text-white rounded hover:text-gray-300"
        >
          View All Reservations
        </button>
      </div>
    );
  }

  const isCancelled = booking.booking_status === 'Cancelled';
  const isCompleted = ['Completed', 'Checked Out'].includes(booking.booking_status);
  const isUpcoming =
    ['Soft', 'Confirmed', 'Reserved'].includes(booking.booking_status) &&
    new Date(booking.checkindate) > new Date();
  const isCurrent =
    ['Hard', 'Checked In'].includes(booking.booking_status) ||
    (new Date(booking.checkindate) <= new Date() && new Date(booking.checkoutdate) >= new Date());

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/view-reservation')}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <FiArrowLeft className="mr-2" /> Back to All Reservations
        </button>
        <h1 className="text-2xl font-bold">Reservation Details</h1>
        <div></div> {/* Empty div for spacing */}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="p-6 cursor-pointer" onClick={toggleExpanded}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-2xl">{booking.room_type}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Reservation Number: {booking.orderid}
                  </p>
                </div>
                <div className="text-right">
                  <span className="flex items-center text-2xl font-bold">
                    ₹{formatToTwoDecimal(booking.total_final_amount || booking.final_amount)}
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    Including taxes & fees
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Check-in</p>
                  <p className="font-medium text-lg">{formatDate(booking.checkindate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Check-out</p>
                  <p className="font-medium text-lg">{formatDate(booking.checkoutdate)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Number of nights</p>
                  <p className="font-medium text-lg">{booking.length_of_stay}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="flex items-center">
                    {isCancelled ? (
                      <span className="text-red-600 font-medium text-lg">Cancelled</span>
                    ) : isCompleted ? (
                      <>
                        <FiCheckCircle className="text-green-500 mr-2" />
                        <span className="text-green-600 font-medium text-lg">Completed</span>
                      </>
                    ) : (
                      <span className="font-medium text-lg">
                        {getBookingStatusDisplay(booking)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center">
              <button className="text-gray-500 hover:text-gray-700 p-2">
                {expanded ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t px-6 py-6 animate-slideDown">
            <div className="mb-6">
              <p className="text-xs text-gray-500">Property</p>
              <p className="font-medium text-lg">{booking.property_name}</p>
            </div>

            {renderGuestInfo(booking.guests)}

            {booking.enhancements && renderEnhancements(booking.enhancements, booking)}
          </div>
        )}

        <div className="px-6 py-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              {isCompleted && (
                <button
                  className="text-black flex items-center hover:text-gray-500 px-4 py-3 rounded-lg border border-gray-300 hover:bg-white bg-white shadow-sm"
                  onClick={() => {
                    setCurrentBooking(booking);
                    setIsPopupOpen(true);
                  }}
                >
                  <FiDownload className="mr-2" /> Download Invoice
                </button>
              )}
            </div>

            <div>
              {(isUpcoming || isCurrent) && !isCancelled && (
                <div className="space-x-4 flex">
                  <button
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-base font-medium shadow-md"
                    onClick={() => {
                      setCancellingBooking(booking);
                      setIsCancelPopupOpen(true);
                    }}
                  >
                    Cancel Reservation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {isConfirmationPopupOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all duration-300">
            <div className="text-center mb-6">
              <AiOutlineWarning className="mx-auto text-red-600 text-6xl mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Confirm Cancellation</h3>
              <ConfirmationContent />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmationPopupOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-medium border text-white bg-black hover:text-gray-300 hover:border-gray-400 transition-all shadow-sm"
              >
                No, Keep Reservation
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:text-gray-300 shadow-md hover:shadow-lg transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Download Popup */}
      {isPopupOpen && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition"
            >
              <FiX size={26} />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 bg-black rounded-full shadow-md mb-4">
                <FiFileText className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your payment receipt is ready</h2>
            </div>

            <div className="text-center mb-6 px-2">
              <p className="text-gray-500 leading-relaxed text-sm">
                Your payment receipt will be sent to{' '}
                <span className="font-medium text-gray-700">{userEmail}</span>
                {'. '}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 w-full">
              <button
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
                className={`w-full bg-black text-white font-medium py-3 rounded-md shadow-md transition ${
                  sendingInvoice ? 'opacity-70 cursor-not-allowed' : 'hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {sendingInvoice ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FiDownload className="text-lg" />
                      <span>Send</span>
                    </>
                  )}
                </div>
              </button>

              <button
                onClick={() => setIsPopupOpen(false)}
                className="w-full bg-red-500 text-white font-medium py-3 rounded-md shadow-md hover:text-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Popup */}
      {isCancelPopupOpen && cancellingBooking && !isConfirmationPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div
            className="bg-white rounded-2xl relative overflow-hidden shadow-2xl max-w-lg w-full"
            style={{
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              onClick={resetCancellationFlow}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-2 rounded-full transition-colors z-10 bg-white/80"
            >
              <FiX className="h-5 w-5" />
            </button>

            <div className="overflow-y-auto flex-1">
              {cancellationResponse ? (
                <div>
                  {/* Success Header */}
                  <div className="px-6 py-3 bg-white">
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-xl font-bold text-gray-900 mt-2">
                        {cancellationResponse.success
                          ? 'Reservation Cancelled Successfully'
                          : 'Cancellation Failed'}
                      </h3>
                      <p className="text-gray-600 mb-2 text-xs">{cancellationResponse.message}</p>

                      {/* Reservation Number Badge */}
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-xs text-gray-500 font-medium">RESERVATION NUMBER</p>
                        <p className="text-lg font-mono font-bold text-gray-900">
                          {cancellingBooking.orderid}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Refund Summary */}
                  {cancellationResponse.success && (
                    <div className="px-6 py-3">
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-gray-900 border-b">
                          Refund Summary
                        </h4>

                        {/* Amount Breakdown */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total Amount</span>
                            <span className="font-semibold">
                              ₹
                              {formatToTwoDecimal(
                                cancellationResponse['Total Amount'] ||
                                  cancellationResponse.Total_Amount ||
                                  0
                              )}
                            </span>
                          </div>
                          {/* Cancellation Charges */}
                          <div className="flex justify-between">
                            <span className=" text-gray-700">Cancellation Charges</span>
                            <span className="font-semibold">
                              ₹{formatToTwoDecimal(cancellationResponse.cancellation_charges || 0)}
                            </span>
                          </div>

                          {/* Service Fee */}
                          <div className="flex justify-between mb-2">
                            <span className=" text-gray-700">Service Fee</span>
                            <span className="font-semibold">
                              ₹{formatToTwoDecimal(cancellationResponse.service_fee || 0)}
                            </span>
                          </div>

                          {/* Deductions */}
                          {(cancellationResponse.cancellation_charges > 0 ||
                            cancellationResponse.service_fee > 0) && (
                            <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                              <h5 className="text-sm font-medium text-red-800 mb-2">
                                Deductions Applied
                              </h5>
                              <div className="space-y-2">
                                {cancellationResponse.cancellation_charges > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-red-700">Cancellation Charges</span>
                                    <span className="font-medium text-red-700">
                                      -₹
                                      {formatToTwoDecimal(
                                        cancellationResponse.cancellation_charges
                                      )}
                                    </span>
                                  </div>
                                )}
                                {cancellationResponse.service_fee > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-red-700">Service Fee</span>
                                    <span className="font-medium text-red-700">
                                      -₹{formatToTwoDecimal(cancellationResponse.service_fee)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Refundable Amenities - Expandable Section */}
                          {cancellationResponse.refundable_amenities_total > 0 && (
                            <div className="border border-gray-200 rounded-lg ">
                              <details className="group">
                                <summary className="flex justify-between items-center p-2 cursor-pointer list-none">
                                  <div>
                                    <span className="font-sm text-gray-700">
                                      Refundable Amenities
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      +₹
                                      {formatToTwoDecimal(
                                        cancellationResponse.refundable_amenities_total
                                      )}
                                    </span>
                                  </div>
                                  <FiChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-2 pb-2 border-t border-gray-200">
                                  <div className="mt-3 space-y-3">
                                    {cancellationResponse.amenities_breakdown
                                      ?.filter((amenity) => amenity.refundable)
                                      .map((amenity, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-900">
                                              {amenity.amenity_name}
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                              ₹{formatToTwoDecimal(amenity.amount)}
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                                            <div>
                                              Base: ₹{formatToTwoDecimal(amenity.base_amount)}
                                            </div>
                                            <div>
                                              Tax: ₹{formatToTwoDecimal(amenity.tax_amount)}
                                            </div>
                                          </div>
                                          {amenity.urgent_amount > 0 && (
                                            <div className="text-xs text-gray-700 mt-1">
                                              Urgent: ₹{formatToTwoDecimal(amenity.urgent_amount)}
                                            </div>
                                          )}
                                          <div className="flex items-center mt-2">
                                            <FiCheckCircle className="h-3 w-3 text-gray-600 mr-1" />
                                            <span className="text-xs text-gray-600 font-medium">
                                              Fully Refundable
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Non-Refundable Amenities - Expandable Section */}
                          {cancellationResponse.amenities_breakdown?.filter(
                            (amenity) => !amenity.refundable
                          ).length > 0 && (
                            <div className="border border-gray-200 rounded-lg">
                              <details className="group">
                                <summary className="flex justify-between items-center p-2 cursor-pointer list-none">
                                  <div>
                                    <span className="font-sm text-gray-700">
                                      Non-Refundable Charges
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      ₹
                                      {formatToTwoDecimal(
                                        cancellationResponse.amenities_breakdown
                                          .filter((amenity) => !amenity.refundable)
                                          .reduce((sum, amenity) => sum + (amenity.amount || 0), 0)
                                      )}
                                    </span>
                                  </div>
                                  <FiChevronDown className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-2 pb-2 border-t border-gray-200">
                                  <div className="mt-3 space-y-2">
                                    {cancellationResponse.amenities_breakdown
                                      .filter((amenity) => !amenity.refundable)
                                      .map((amenity, index) => (
                                        <div
                                          key={index}
                                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                                        >
                                          <div>
                                            <span className="text-sm font-medium text-gray-900">
                                              {amenity.amenity_name}
                                            </span>
                                            <div className="text-xs text-gray-700">
                                              Base: ₹{formatToTwoDecimal(amenity.base_amount)} +
                                              Tax: ₹{formatToTwoDecimal(amenity.tax_amount)}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-semibold text-gray-900">
                                              ₹{formatToTwoDecimal(amenity.amount)}
                                            </span>
                                            <div className="flex items-center justify-end mt-1">
                                              <FiX className="h-3 w-3 text-gray-600 mr-1" />
                                              <span className="text-xs text-red-600">
                                                Non-refundable
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Final Refund Amount */}
                          <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold text-gray-900">Final Refund Amount</span>
                              <span className="text-xl font-bold text-gray-900">
                                ₹
                                {formatToTwoDecimal(
                                  cancellationResponse.final_refund ||
                                    cancellationResponse.refund_amount ||
                                    0
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 flex items-center">
                              <FiInfo className="h-4 w-4 mr-1" />
                              This amount will be refunded to your original payment method within
                              5-7 business days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Cancellation Form */
                <div className="max-w-2xl mx-auto w-full">
                  {/* Header */}
                  <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-50 border-b border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Cancel Reservation</h3>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4">
                    <CancellationPolicyCard booking={cancellingBooking} />

                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reason for Cancellation *
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all placeholder:text-sm"
                          placeholder="Please share your reason for cancelling this reservation. This helps us improve our services."
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your feedback is valuable to us. Please provide specific details if
                          possible.
                        </p>
                      </div>

                      {/* Refund Information */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <FiInfo className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-sm text-gray-900 mb-1">Refund Information</p>
                            <p className="text-sm text-gray-700">
                              Refundable amounts will be processed to your original payment method.
                              Non-refundable charges include applicable taxes and service fees as
                              per our cancellation policy.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!cancellationResponse ? (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={resetCancellationFlow}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancellationReason || loading}
                  className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                    !cancellationReason || loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            ) : (
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
                <button
                  onClick={resetCancellationFlow}
                  className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleBookingView;
