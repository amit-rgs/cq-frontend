import { useState } from 'react';
import jsPDF from 'jspdf';
import { FiArrowLeft, FiDownload, FiX, FiCalendar, FiUsers, FiHome } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
const SECRET_KEY = 'pass!@389';

const getUserData = () => {
  const encryptedData = Cookies.get('user');
  if (!encryptedData) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    return null;
  }
};

const BookingHistory = ({ bookings }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const navigate = useNavigate();

  const handleBookAgain = () => {
    navigate('/walk-in/room-reservation');
    window.location.reload(); // Forces a hard reload
  };

  const handleInvoiceClick = (booking, e) => {
    e.stopPropagation();
    setCurrentBooking(booking);
    setIsPopupOpen(true);
  };

  const handleRowClick = (booking) => {
    navigate(`/bookings/${booking.bookingid}`, { state: { booking } });
  };

  const handleDownloadInvoice = async () => {
    const user = getUserData();
    if (!user?.guest_id) {
      console.error('No guest ID found!');
      return;
    }

    try {
      const response = await fetch(
        `${CQ_BASE_URL}/bq/api/profile/bookings/?guestid=${user.guest_id}`
      );
      if (!response.ok) throw new Error('Failed to fetch booking data');

      const data = await response.json();
      if (!data?.bookings?.length) {
        console.error('No bookings found for this guest!');
        return;
      }

      const booking = data.bookings[0];
      const billingDetails = booking.billing || [];
      const doc = new jsPDF();

      // PDF generation code remains the same
      // ... (your existing PDF generation code)

      doc.save(`invoice_${booking.bookingid}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  const totalPages = Math.ceil((bookings?.length || 0) / bookingsPerPage);
  const startIndex = (currentPage - 1) * bookingsPerPage;
  const selectedBookings = bookings?.slice(startIndex, startIndex + bookingsPerPage);

  return (
    <div className="min-h-screen  py-5 px-4 sm:px-6 lg:px-16">
      <div className=" mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reservation History</h1>
          <button
            onClick={handleBookAgain}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            <FiHome className="mr-2 font-semibold" /> New Reservation
          </button>
        </div>

        {bookings?.length > 0 ? (
          <>
            <div className="bg-white shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Reservation Number
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Room
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center">
                          <FiCalendar className="mr-1" /> Check-in
                        </span>
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center">
                          <FiCalendar className="mr-1" /> Check-out
                        </span>
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        <span className="flex items-center">
                          <FiUsers className="mr-1" /> Guests
                        </span>
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        No of Nights
                      </th>
                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        <span className="flex items-center">
                          <FaRupeeSign className="mr-1" /> Amount
                        </span>
                      </th>

                      <th className="px-2 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Reservation Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBookings.map((booking) => {
                      // Safely calculate total amount
                      const totalAmount =
                        booking.billing?.reduce((sum, bill) => {
                          return sum + (Number(bill.finalamount) || 0);
                        }, 0) || 0;

                      return (
                        <tr
                          key={booking.bookingid}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(booking)}
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.orderid}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {booking.room?.roomnumber || 'N/A'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.checkindate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(booking.checkoutdate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </td>

                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {booking.numberofguests || 'N/A'}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {booking.lengthofstay || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ₹
                            {totalAmount.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          {/* In your booking table or display component */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {booking.booking_status === 'Hard' ? (
                              <span className="mt-1 text-md text-gray-900">Checked In</span>
                            ) : booking.booking_status === 'Soft' ? (
                              booking.is_room_rent_paid ? (
                                <span className="mt-1 text-md text-gray-900">Reserved</span>
                              ) : (
                                <span className="mt-1 text-md text-red-500 font-medium">
                                  Payment Required
                                </span>
                              )
                            ) : (
                              <span className="mt-1 text-md text-gray-900">
                                {booking.booking_status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center px-4 py-2 rounded-lg  ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiArrowLeft className="mr-2" /> Previous
              </button>
              <span className="text-base text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next <FiArrowLeft className="ml-2 transform rotate-180" />
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 mb-4">
              <FiHome className="h-12 w-12 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No reservation found</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't made any reservations yet. Start planning your next stay with us!
            </p>
            <button
              onClick={handleBookAgain}
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Reserve Now
            </button>
          </div>
        )}

        {/* Invoice Popup */}
        {isPopupOpen && currentBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative">
              <button
                onClick={() => setIsPopupOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <FiDownload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Invoice Ready</h3>
                  <p className="text-gray-600">
                    Your invoice for booking #{currentBooking.bookingid} is ready to download.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Room Type:</span>
                    <span className="font-medium">{currentBooking.roomtypename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-gray-900">
                      ₹{currentBooking.billing?.[0]?.finalamount || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                  >
                    <FiDownload className="mr-2" /> Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
