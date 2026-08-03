import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiX,
  FiBriefcase,
  FiMinusCircle,
} from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

// Guest data functions
const getGuestData = async () => {
  const accessToken = Cookies.get('access_token');
  if (!accessToken) return null;

  try {
    const guestId = Cookies.get('guest_id') || getGuestIdFromToken(accessToken);
    if (!guestId) return null;

    const profileResponse = await fetch(`${CQ_BASE_URL}/bq/api/profile?guest_id=${guestId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile API Error: ${profileResponse.statusText}`);
    }

    const profileData = await profileResponse.json();

    // Check if this is a corporate guest
    const isCorporateGuest = profileData.companyid && profileData.companyname;

    const isDecrypted = profileData.emailid && profileData.emailid.length < 50;

    if (isDecrypted) {
      return {
        first_name: profileData.firstname || '',
        last_name: profileData.lastname || '',
        email: profileData.emailid || '',
        phone_number: profileData.phonenumber || '',
        country_code: '+91',
        client_type: profileData.clienttype || 'Leisure',
        company_id: profileData.companyid || '',
        company_name: profileData.companyname || '',
        is_corporate: isCorporateGuest,
      };
    }

    const decryptedFields = await decryptUserData({
      email: profileData.emailid,
      phone_number: profileData.phonenumber,
      country_code: profileData.countrycode,
    });

    return {
      first_name: profileData.firstname || '',
      last_name: profileData.lastname || '',
      email: decryptedFields.email || profileData.emailid || '',
      phone_number: decryptedFields.phone_number || profileData.phonenumber || '',
      country_code: '+91',
      client_type: profileData.clienttype || 'Leisure',
      company_id: profileData.companyid || '',
      company_name: profileData.companyname || '',
      is_corporate: isCorporateGuest,
    };
  } catch (error) {
    console.error('Error fetching guest data:', error);
    return null;
  }
};

const getGuestIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
};

const decryptUserData = async (encryptedData) => {
  try {
    if (encryptedData.email && encryptedData.email.length < 50) {
      return encryptedData;
    }

    const accessToken = Cookies.get('access_token');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${CQ_BASE_URL}/bq/api/decrypt-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        encrypted_fields: {
          email: encryptedData.email,
          phone_number: encryptedData.phone_number,
          country_code: encryptedData.country_code,
        },
      }),
    });

    if (response.status === 401) {
      return encryptedData;
    }

    if (!response.ok) {
      throw new Error(`Decryption failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

const AccountBookingPayments = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [guestData, setGuestData] = useState(null);
  const [isCorporateGuest, setIsCorporateGuest] = useState(false);

  // Fetch guest data on component mount
  useEffect(() => {
    const fetchGuestData = async () => {
      const guestInfo = await getGuestData();
      setGuestData(guestInfo);
      setIsCorporateGuest(guestInfo?.is_corporate || false);
    };

    fetchGuestData();
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CQ_BASE_URL}/bq/api/payments/bookings/cash`);
        const data = await response.json();

        const foundBooking = data.find((b) => b.booking_id === bookingId);

        if (foundBooking) {
          setBooking(foundBooking);
        } else {
          setError('Booking not found');
        }
      } catch (err) {
        setError('Failed to fetch booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        toast.error('Error loading Razorpay script. Please try again.');
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  // Get all payable billings (excluding adjustments)
  const getPayableBillings = () => {
    if (!booking?.billings) return [];

    return booking.billings.filter(
      (billing) => billing.is_payable === true && billing.is_adjustment === false
    );
  };

  // Get unpaid billings that can be paid
  const getUnpaidBillings = () => {
    const payableBillings = getPayableBillings();

    return payableBillings.filter((billing) => {
      const successfulPayments =
        billing.payments?.filter((payment) => payment.payment_status === 'Success') || [];

      const totalPaid = successfulPayments.reduce(
        (sum, payment) => sum + (parseFloat(payment.amount_paid) || 0),
        0
      );

      const amountDue = parseFloat(billing.final_amount) || 0;
      return totalPaid < amountDue;
    });
  };

  const handlePayNowClick = (billing) => {
    // Don't allow payment for adjustments or non-payable items
    if (billing.is_adjustment === true || billing.is_payable === false) {
      toast.info('This item is not payable');
      return;
    }
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  const handlePayAllUnpaid = () => {
    const unpaidBillings = getUnpaidBillings();
    if (unpaidBillings.length === 0) {
      toast.info('All bills are already paid');
      return;
    }
    setSelectedBilling(null);
    setShowPaymentModal(true);
  };

  const handlePaymentOption = async (paymentMethod) => {
    setShowPaymentModal(false);

    if (paymentMethod === 'payLater') {
      toast.info('You can pay at the front desk during checkout.');
      return;
    }

    if (paymentMethod === 'billToCompany') {
      toast.info(
        `Bill to company option selected. Charges will be billed to ${guestData?.company_name || 'your company'}.`
      );
      return;
    }

    if (paymentMethod === 'payNow') {
      if (!razorpayLoaded) {
        toast.error('Payment system is not ready. Please try again.');
        return;
      }

      try {
        setIsProcessing(true);

        // Determine if we're paying a single billing or all unpaid
        const unpaidBillings = selectedBilling ? [selectedBilling] : getUnpaidBillings();

        if (unpaidBillings.length === 0) {
          toast.info('No unpaid bills to process');
          return;
        }

        // Get billing IDs ONLY - NO AMOUNT CALCULATION
        const billingIds = unpaidBillings.map((billing) => billing.billing_id);

        console.log('Sending billing IDs to API:', billingIds);

        const apiUrl = `${CQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify(billingIds),
        });

        if (!response.ok) throw new Error('Failed to create payment order');

        const orderData = await response.json();

        if (orderData?.razorpay_order_id) {
          // Use ONLY the API amount - NO FRONTEND CALCULATION
          const apiAmount = orderData.amount; // This is in paise from API
          const amountInRupees = (apiAmount / 100).toFixed(2); // Convert to rupees for display

          console.log('Using API amount:', {
            fromApi: apiAmount,
            inRupees: amountInRupees,
          });

          const options = {
            key: RAZORPAY_KEY,
            amount: apiAmount, // DIRECTLY use API amount
            currency: 'INR',
            name: 'Pagoda Hotel',
            description: `Payment for booking ${bookingId} - ₹${amountInRupees}`,
            order_id: orderData.razorpay_order_id,
            handler: async function (response) {
              const paymentDetails = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                billing_ids: billingIds,
                booking_id: bookingId,
                amount: apiAmount, // Use the same API amount for verification
              };

              try {
                const verificationResponse = await fetch(
                  `${CQ_BASE_URL}/bq/api/razorpay/verify_payment_multiple`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                    body: JSON.stringify(paymentDetails),
                  }
                );

                if (verificationResponse.ok) {
                  toast.success('Payment successful and verified!');
                  setTimeout(() => window.location.reload(), 2000);
                } else {
                  toast.error('Payment verification failed.');
                }
              } catch (error) {
                console.error('Verification error:', error);
                toast.error('Error verifying payment. Please try again.');
              }
            },
            prefill: {
              name: booking?.guest_name || 'Guest',
              email: guestData?.email || '',
              contact:
                (guestData?.phone_number && typeof guestData.phone_number === 'string'
                  ? guestData.phone_number.replace(/\D/g, '')
                  : '') || '',
            },
            theme: {
              color: '#3399cc',
            },
            modal: {
              ondismiss: function () {
                toast.info('Payment cancelled by user');
              },
            },
            notes: {
              booking_id: bookingId,
              amount: `₹${amountInRupees} (from API)`,
            },
          };

          // Show toast with API amount
          toast.info(`Processing payment of ₹${amountInRupees} (calculated by server)`, {
            autoClose: 2000,
          });

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Error processing payment. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };
  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      setIsCancelling(true);
      const response = await fetch(
        `${CQ_BASE_URL}/bq/api/cancel-booking/?orderid=${booking.order_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancellation_reason: cancellationReason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to cancel booking');
      }

      const result = await response.json();
      toast.success(result.message || 'Booking cancelled successfully');
      setShowCancelModal(false);
      setCancellationReason('');
      // Refresh booking data
      const updatedResponse = await fetch(`${CQ_BASE_URL}/bq/api/payments/bookings/cash`);
      const updatedData = await updatedResponse.json();
      const updatedBooking = updatedData.find((b) => b.booking_id === bookingId);
      setBooking(updatedBooking);
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-xl shadow-sm text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Booking</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center mx-auto"
          >
            <FiArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white rounded-xl shadow-sm text-center">
          <div className="text-gray-400 text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Booking Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the booking you're looking for.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
          >
            <FiArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isBookingCancelled = booking.booking_status === 'Cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="flex items-center mb-8 mt-20">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-black font-semibold hover:text-gray-700 transition-colors text-xl"
          >
            <FiArrowLeft className="mr-2" /> Back to reservations
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Reservation Number
            </h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{booking.order_id}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Guest Details
            </h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {booking.guest_name
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status</h3>

            {booking.booking_status === 'Hard' ? (
              <span className="mt-1 text-2xl font-semibold text-gray-900">Checked In</span>
            ) : booking.booking_status === 'Soft' ? (
              booking.is_room_rent_paid === true || booking.is_room_rent_paid === 'true' ? (
                <span className="mt-1 text-2xl font-semibold text-gray-900">Reserved</span>
              ) : (
                <span className="mt-1 text-2xl font-semibold text-gray-600">Payment Required</span>
              )
            ) : (
              <span className="mt-1 text-2xl font-semibold text-gray-900">
                {booking.booking_status}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Details</h3>

            {/* Summary Stats - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">
                  ₹
                  {Number(booking.total_billed || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Amount Paid</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">
                  ₹
                  {Number(booking.total_paid || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-gray-100 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500">Amount Due</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">
                  ₹
                  {Number(booking.net_payable || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* Responsive Table with Card View for Mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Type
                    </th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Amount
                    </th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Fee
                    </th>
                    <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {booking.billings.map((billing) => {
                    const isAdjustment = billing.is_adjustment === true;
                    const amount = parseFloat(billing.final_amount) || 0;

                    const successfulPayments =
                      billing.payments?.filter((payment) => payment.payment_status === 'Success') ||
                      [];

                    const totalPaid = successfulPayments.reduce(
                      (sum, payment) => sum + (parseFloat(payment.amount_paid) || 0),
                      0
                    );

                    const isPaid = totalPaid >= Math.abs(amount);
                    const isPartial = successfulPayments.length > 0 && !isPaid;

                    return (
                      <tr key={billing.billing_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {billing.billing_type}
                              </div>
                              {isAdjustment && (
                                <div className="text-xs text-gray-500 mt-1">Adjustment</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹
                            {Number(billing.base_amount || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹
                            {Number(billing.tax_amount || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ₹
                            {Number(billing.service_fee || 0).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {amount >= 0 ? '₹' : '-₹'}
                            {Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {booking.billings.map((billing) => {
                const isAdjustment = billing.is_adjustment === true;
                const amount = parseFloat(billing.final_amount) || 0;

                const successfulPayments =
                  billing.payments?.filter((payment) => payment.payment_status === 'Success') || [];

                const totalPaid = successfulPayments.reduce(
                  (sum, payment) => sum + (parseFloat(payment.amount_paid) || 0),
                  0
                );

                const isPaid = totalPaid >= Math.abs(amount);
                const isPartial = successfulPayments.length > 0 && !isPaid;

                return (
                  <div key={billing.billing_id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {billing.billing_type}
                        </div>
                        {isAdjustment && (
                          <div className="text-xs text-gray-500 mt-1">Adjustment</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total Amount</div>
                        <div className="text-base font-bold text-gray-900">
                          {amount >= 0 ? '₹' : '-₹'}
                          {Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Base Amount</div>
                        <div className="text-gray-900">
                          ₹
                          {Number(billing.base_amount || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Tax</div>
                        <div className="text-gray-900">
                          ₹
                          {Number(billing.tax_amount || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Service Fee</div>
                        <div className="text-gray-900">
                          ₹
                          {Number(billing.service_fee || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Optional: Show payment status for mobile */}
                    {(isPaid || isPartial) && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500">Payment Status</div>
                        <div className="text-sm font-medium">
                          {isPaid ? (
                            <span className="text-green-600">✓ Paid</span>
                          ) : isPartial ? (
                            <span className="text-yellow-600">Partially Paid</span>
                          ) : (
                            <span className="text-red-600">Unpaid</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="border border-gray-200 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Guest</h4>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <p className="font-semibold text-gray-900">
                        {booking.guest_name
                          .split(' ')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </p>
                    </div>
                  </div>
                  {guestData && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Email</h4>
                        <div className="bg-gray-50 p-2 rounded-md">
                          <p className="font-medium text-gray-900">{guestData.email}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Phone</h4>
                        <div className="bg-gray-50 p-2 rounded-md">
                          <p className="font-medium text-gray-900">
                            {guestData.country_code} {guestData.phone_number}
                          </p>
                        </div>
                      </div>
                      {isCorporateGuest && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Company</h4>
                          <div className="bg-gray-50 p-2 rounded-md">
                            <p className="font-medium text-gray-900">{guestData.company_name}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 border border-gray-200 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

                {/* Adjustments Notice */}
                {booking.has_adjustments && booking.total_adjustment_amount && (
                  <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-800">
                      <strong>Note:</strong> This reservation includes adjustments.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-gray-900">
                      ₹
                      {Number(booking.total_billed || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {booking.has_adjustments && booking.total_adjustment_amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Adjustments:</span>
                      <span className="font-medium text-gray-900">
                        -₹
                        {Math.abs(booking.total_adjustment_amount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-gray-900">
                      ₹
                      {Number(booking.total_paid || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600 font-semibold">Amount Due:</span>
                      <span className="font-bold text-lg text-gray-900">
                        {booking.net_payable > 0 ? '₹' : booking.net_payable < 0 ? '-₹' : '₹'}
                        {Math.abs(booking.net_payable || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {booking.net_payable < 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        This booking has a credit balance
                      </p>
                    )}
                  </div>

                  {booking.credit_balance > 0 && (
                    <div className="flex justify-between items-center text-gray-900">
                      <span className="text-gray-600">Credit Balance:</span>
                      <span className="font-medium">
                        ₹
                        {Number(booking.credit_balance).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pay All Unpaid Button */}
                {booking.net_payable > 0 && !isBookingCancelled && (
                  <button
                    onClick={handlePayAllUnpaid}
                    disabled={isProcessing || isBookingCancelled}
                    className={`w-full mt-6 py-3 px-3 rounded-md font-medium flex items-center justify-center ${
                      isProcessing || isBookingCancelled
                        ? 'bg-purple-500 cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600  transition-colors'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${Number(booking.net_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )}
                  </button>
                )}

                {booking.is_fully_paid_or_over && booking.net_payable <= 0 && (
                  <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <p className="text-gray-800 text-center font-medium flex items-center justify-center">
                      <FiCheckCircle className="inline mr-2 text-gray-600" />
                      This booking is fully paid
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          {(() => {
            const allPayments = booking.billings
              .flatMap((billing) =>
                (billing.payments || []).map((payment) => ({
                  ...payment,
                  billing_type: billing.billing_type,
                  billing_id: billing.billing_id,
                  billing_display_label: billing.display_label,
                }))
              )
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

            if (allPayments.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">No payment history available</div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allPayments.map((payment, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.billing_type}
                          </div>
                          {payment.billing_display_label && (
                            <div className="text-xs text-gray-500">
                              {payment.billing_display_label}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ₹
                          {Number(payment.amount_paid).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {payment.transaction_id || (
                            <span className="font-semibold text-black text-center">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {payment.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-70 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg text-center shadow-md transform transition-all duration-200">
            <h3 className="text-2xl font-semibold font-poppins mb-2 text-gray-900">
              Hello, valued customer
            </h3>
            <p className="text-gray-500 mb-3 font-poppins font-semibold">We're glad you're here</p>

            <h3 className="text-lg font-semibold mb-5 text-gray-900 border-t pt-2 font-poppins">
              Complete your payment using one of the below options
            </h3>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              {/* Pay Later option for leisure guests */}
              {!isCorporateGuest && (
                <button
                  onClick={() => handlePaymentOption('payLater')}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  <FiClock className="mr-2" /> Pay Later
                </button>
              )}

              {/* Bill to Company option for corporate guests */}
              {isCorporateGuest && (
                <button
                  onClick={() => handlePaymentOption('billToCompany')}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-all duration-200 font-medium flex items-center justify-center"
                >
                  <FiBriefcase className="mr-2" /> Bill to Company
                </button>
              )}

              <button
                onClick={() => handlePaymentOption('payNow')}
                className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-all duration-200 font-medium flex items-center justify-center"
              >
                <FiCreditCard className="mr-2" /> Pay Now
              </button>
            </div>

            <p className="text-gray-500 text-md font-poppins font-semibold mt-6">
              Thank you for your trust in our service
            </p>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-70 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-md relative">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setCancellationReason('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>

            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Cancel Booking</h3>
            <div className="mb-4">
              <label
                className="block text-md font-medium text-gray-700 mb-1"
                htmlFor="reservation-number"
              >
                Reservation number
              </label>
              <input
                id="reservation-number"
                type="text"
                value={booking.order_id}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="cancellationReason"
                className="block text-md font-medium text-gray-700 mb-2"
              >
                Reason for cancellation
              </label>
              <textarea
                id="cancellationReason"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Please provide the reason for cancellation"
                value={cancellationReason}
                onChange={(e) => {
                  const input = e.target.value;
                  if (input.length <= 500) {
                    setCancellationReason(input);
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {cancellationReason.length > 0 && cancellationReason.length < 10 ? (
                  <p className="text-sm text-gray-500">Please enter at least 10 characters.</p>
                ) : (
                  <div /> // Empty div to preserve spacing
                )}
                <p className="text-sm text-gray-700">{cancellationReason.length} / 500</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                disabled={isCancelling}
              >
                Cancel
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Processing...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default AccountBookingPayments;

// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   FiArrowLeft,
//   FiCreditCard,
//   FiCheckCircle,
//   FiClock,
//   FiDollarSign,
//   FiX,
// } from "react-icons/fi";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const BQ_BASE_URL = process.env.REACT_APP_BQ_BASE_URL;

// const AccountBookingPayments = () => {
//   const { bookingId } = useParams();
//   const navigate = useNavigate();
//   const [booking, setBooking] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [razorpayLoaded, setRazorpayLoaded] = useState(false);
//   const [selectedBilling, setSelectedBilling] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [cancellationReason, setCancellationReason] = useState("");
//   const [isCancelling, setIsCancelling] = useState(false);

//   useEffect(() => {
//     const fetchBookingDetails = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(
//           `${BQ_BASE_URL}/bq/api/payments/bookings/cash`
//         );
//         const data = await response.json();

//         const foundBooking = data.find((b) => b.booking_id === bookingId);

//         if (foundBooking) {
//           setBooking(foundBooking);
//         } else {
//           setError("Booking not found");
//         }
//       } catch (err) {
//         setError("Failed to fetch booking details");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBookingDetails();
//   }, [bookingId]);

//   useEffect(() => {
//     const loadRazorpayScript = () => {
//       if (window.Razorpay) {
//         setRazorpayLoaded(true);
//         return;
//       }

//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.async = true;
//       script.onload = () => setRazorpayLoaded(true);
//       script.onerror = () => {
//         toast.error("Error loading Razorpay script. Please try again.");
//       };
//       document.body.appendChild(script);
//     };

//     loadRazorpayScript();
//   }, []);

//   const getUnpaidBillings = () => {
//     if (!booking?.billings) return [];

//     return booking.billings.filter((billing) => {
//       const successfulPayments =
//         billing.payments?.filter(
//           (payment) => payment.payment_status === "Success"
//         ) || [];

//       const totalPaid = successfulPayments.reduce(
//         (sum, payment) => sum + (parseFloat(payment.amount_paid) || 0),
//         0
//       );

//       const amountDue = parseFloat(billing.final_amount) || 0;
//       return totalPaid < amountDue;
//     });
//   };

//   const handlePayNowClick = (billing) => {
//     setSelectedBilling(billing);
//     setShowPaymentModal(true);
//   };

//   const handlePayAllUnpaid = () => {
//     const unpaidBillings = getUnpaidBillings();
//     if (unpaidBillings.length === 0) {
//       toast.info("All bills are already paid");
//       return;
//     }
//     setSelectedBilling(null); // Indicates this is a "pay all" operation
//     setShowPaymentModal(true);
//   };

//   const handlePaymentOption = async (paymentMethod) => {
//     setShowPaymentModal(false);

//     if (paymentMethod === "payLater") {
//       toast.info("You can pay at the front desk during checkout.");
//       return;
//     }

//     if (!razorpayLoaded) {
//       toast.error("Payment system is not ready. Please try again.");
//       return;
//     }

//     try {
//       setIsProcessing(true);

//       // Determine if we're paying a single billing or all unpaid
//       const unpaidBillings = selectedBilling
//         ? [selectedBilling]
//         : getUnpaidBillings();

//       if (unpaidBillings.length === 0) {
//         toast.info("No unpaid bills to process");
//         return;
//       }

//       const billingIds = unpaidBillings.map((b) => b.billing_id);
//       const apiUrl = `${BQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify(billingIds),
//       });

//       if (!response.ok) throw new Error("Failed to create payment order");

//       const orderData = await response.json();

//       if (orderData?.razorpay_order_id) {
//         // Calculate total amount from all unpaid billings
//         const totalAmount = unpaidBillings.reduce((sum, billing) => {
//           return sum + (parseFloat(billing.final_amount) || 0);
//         }, 0);

//         const options = {
//           key: REACT_APP_RAZORPAY_KEY,
//           amount: totalAmount * 100, // Convert to paise
//           currency: "INR",
//           name: "Pagoda Hotel",
//           description:
//             unpaidBillings.length === 1
//               ? `Payment for ${unpaidBillings[0].billing_type}`
//               : `Payment for ${unpaidBillings.length} unpaid services`,
//           order_id: orderData.razorpay_order_id,
//           handler: async function (response) {
//             const paymentDetails = {
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               billing_ids: billingIds,
//               booking_id: bookingId,
//             };

//             try {
//               const verificationResponse = await fetch(
//                 `${BQ_BASE_URL}/bq/api/razorpay/verify_payment_multiple`,
//                 {
//                   method: "POST",
//                   headers: {
//                     "Content-Type": "application/json",
//                     Accept: "application/json",
//                   },
//                   body: JSON.stringify(paymentDetails),
//                 }
//               );

//               if (verificationResponse.ok) {
//                 toast.success("Payment successful and verified!");
//                 setTimeout(() => window.location.reload(), 2000);
//               } else {
//                 toast.error("Payment verification failed.");
//               }
//             } catch (error) {
//               console.error("Verification error:", error);
//               toast.error("Error verifying payment. Please try again.");
//             }
//           },
//           prefill: {
//             name: booking?.guest_name || "Guest",
//             email: booking?.guest_email || "",
//             contact: booking?.guest_phone?.replace(/\D/g, "") || "",
//           },
//           theme: {
//             color: "#3399cc",
//           },
//         };

//         const rzp = new window.Razorpay(options);
//         rzp.open();
//       }
//     } catch (error) {
//       console.error("Payment error:", error);
//       toast.error("Error processing payment. Please try again.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleCancelBooking = async () => {
//     if (!cancellationReason.trim()) {
//       toast.error("Please provide a cancellation reason");
//       return;
//     }

//     try {
//       setIsCancelling(true);
//       const response = await fetch(
//         `${BQ_BASE_URL}/bq/api/cancel-booking/?orderid=${booking.order_id}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ cancellation_reason: cancellationReason }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to cancel booking");
//       }

//       const result = await response.json();
//       toast.success(result.message || "Booking cancelled successfully");
//       setShowCancelModal(false);
//       setCancellationReason("");
//       // Refresh booking data
//       const updatedResponse = await fetch(
//         `${BQ_BASE_URL}/bq/api/payments/bookings/cash`
//       );
//       const updatedData = await updatedResponse.json();
//       const updatedBooking = updatedData.find(
//         (b) => b.booking_id === bookingId
//       );
//       setBooking(updatedBooking);
//     } catch (error) {
//       console.error("Cancellation error:", error);
//       toast.error(error.message || "Failed to cancel booking");
//     } finally {
//       setIsCancelling(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading booking details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="max-w-md p-6 bg-white rounded-xl shadow-sm text-center">
//           <div className="text-red-500 text-4xl mb-4">⚠️</div>
//           <h2 className="text-xl font-semibold text-gray-800 mb-2">
//             Error Loading Booking
//           </h2>
//           <p className="text-gray-600 mb-6">{error}</p>
//           <button
//             onClick={() => navigate(-1)}
//             className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center mx-auto"
//           >
//             <FiArrowLeft className="mr-2" /> Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!booking) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="max-w-md p-6 bg-white rounded-xl shadow-sm text-center">
//           <div className="text-gray-400 text-4xl mb-4">🔍</div>
//           <h2 className="text-xl font-semibold text-gray-800 mb-2">
//             No Booking Found
//           </h2>
//           <p className="text-gray-600 mb-6">
//             We couldn't find the booking you're looking for.
//           </p>
//           <button
//             onClick={() => navigate(-1)}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
//           >
//             <FiArrowLeft className="mr-2" /> Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Calculate total amount and pending amount
//   const totalAmount = booking.billings.reduce((sum, billing) => {
//     return sum + (parseFloat(billing.final_amount) || 0);
//   }, 0);
//   const pendingAmount = booking.billings.reduce((sum, billing) => {
//     const isPaid = billing.payments?.[0]?.payment_status === "Success";
//     return isPaid ? sum : sum + (parseFloat(billing.final_amount) || 0);
//   }, 0);

//   const isBookingCancelled = booking.booking_status === "Cancelled";

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
//       <div className=" mx-auto">
//         <div className="flex items-center mb-8 mt-20">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center text-black font-semibold hover:text-gray-700 transition-colors text-xl"
//           >
//             <FiArrowLeft className="mr-2" /> Back to reservations
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//           <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
//             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Reservation Number
//             </h3>
//             <p className="mt-1 text-2xl font-semibold text-gray-900">
//               {booking.order_id}
//             </p>
//           </div>

//           {/* Guest Information Section */}
//           <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
//             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Guest Details
//             </h3>
//             <p className="mt-1 text-2xl font-semibold text-gray-900">
//               {booking.guest_name
//                 .split(" ")
//                 .map(
//                   (word) =>
//                     word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
//                 )
//                 .join(" ")}
//             </p>
//           </div>

//           <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
//             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Status
//             </h3>

//             {booking.booking_status === "Hard" ? (
//               <span className="mt-1 text-2xl font-semibold text-gray-900">
//                 Checked In
//               </span>
//             ) : booking.booking_status === "Soft" ? (
//               booking.is_room_rent_paid === true ||
//               booking.is_room_rent_paid === "true" ? (
//                 <span className="mt-1 text-2xl font-semibold text-gray-900">
//                   Reserved
//                 </span>
//               ) : (
//                 <span className="mt-1 text-2xl font-semibold text-red-600">
//                   Payment Required
//                 </span>
//               )
//             ) : (
//               <span className="mt-1 text-2xl font-semibold text-gray-900">
//                 {booking.booking_status}
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Action Buttons
//         <div className="flex justify-end mb-6 gap-4">
//           {!isBookingCancelled && booking.booking_status !== "Hard" && (
//             <button
//               onClick={() => setShowCancelModal(true)}
//               className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
//             >
//               Cancel Booking
//             </button>
//           )}
//         </div> */}

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ">
//           <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Billing Details
//             </h3>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Service
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Amount
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Status
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                       Action
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {booking.billings.map((billing, index) => {
//                     // Improved payment status check - looks at all payments, not just first one
//                     const successfulPayments =
//                       billing.payments?.filter(
//                         (payment) => payment.payment_status === "Success"
//                       ) || [];

//                     const totalPaid = successfulPayments.reduce(
//                       (sum, payment) =>
//                         sum + (parseFloat(payment.amount_paid) || 0),
//                       0
//                     );

//                     const amountDue = parseFloat(billing.final_amount) || 0;
//                     const isPaid = totalPaid >= amountDue;
//                     const isPartial = successfulPayments.length > 0 && !isPaid;

//                     return (
//                       <tr
//                         key={index}
//                         className="hover:bg-gray-50 transition-colors"
//                       >
//                         <td className="px-6 py-2 whitespace-nowrap">
//                           <div className="text-sm font-medium text-gray-900">
//                             {billing.billing_type === "Room Rent"
//                               ? "Room Charges"
//                               : billing.billing_type}
//                           </div>
//                         </td>

//                         <td className="px-6 py-2 whitespace-nowrap">
//                           <div className="text-sm text-gray-900">
//                             ₹
//                             {Number(billing.final_amount ?? 0).toLocaleString(
//                               "en-IN",
//                               { minimumFractionDigits: 2 }
//                             )}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             (₹
//                             {Number(billing.base_amount ?? 0).toLocaleString(
//                               "en-IN",
//                               { minimumFractionDigits: 2 }
//                             )}{" "}
//                             + ₹
//                             {Number(billing.tax_amount ?? 0).toLocaleString(
//                               "en-IN",
//                               { minimumFractionDigits: 2 }
//                             )}{" "}
//                             tax)
//                           </div>
//                         </td>

//                         <td className="px-6 py-2 whitespace-nowrap">
//                           <span className="px-2.5 py-0.5 rounded-full text-xs font-medium">
//                             {isPaid ? (
//                               <span className="flex items-center text-green-800">
//                                 <FiCheckCircle className="mr-1" /> Paid
//                               </span>
//                             ) : isPartial ? (
//                               <span className="flex items-center text-yellow-600">
//                                 <FiClock className="mr-1" /> Partially Paid
//                               </span>
//                             ) : (
//                               <span className="flex items-center text-gray-600">
//                                 <FiClock className="mr-1" /> Pending
//                               </span>
//                             )}
//                           </span>
//                         </td>

//                         <td className="px-3 py-2 whitespace-nowrap text-left text-sm font-medium">
//                           {isPaid ||
//                           booking.booking_status === "Checkedout" ||
//                           isBookingCancelled ? (
//                             <span className="inline-flex items-center px-2.5 py-2 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//                               No Actions
//                             </span>
//                           ) : (
//                             <button
//                               onClick={() => handlePayNowClick(billing)}
//                               className="text-blue-600 hover:text-blue-900 flex items-center text-sm"
//                             >
//                               <FiCreditCard className="mr-1" /> Pay Now
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//           <div className="">
//             <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
//               <div className="border border-gray-200 bg-white p-6 rounded-xl shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Guest Information
//                 </h3>

//                 <div className="space-y-2">
//                   {/* Primary Guest */}
//                   <div>
//                     <h4 className="text-sm font-medium text-gray-700 mb-2">
//                       Primary Guest
//                     </h4>
//                     <div className="bg-gray-50 p-2 rounded-md">
//                       <p className="font-semibold text-gray-900">
//                         {booking.guest_name
//                           .split(" ")
//                           .map(
//                             (word) =>
//                               word.charAt(0).toUpperCase() +
//                               word.slice(1).toLowerCase()
//                           )
//                           .join(" ")}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Additional Guests */}
//                   {booking.additional_guests?.length > 0 && (
//                     <div>
//                       <h4 className="text-sm font-medium text-gray-700 mb-2">
//                         Additional Guests ({booking.additional_guests.length}{" "}
//                         guest)
//                       </h4>
//                       <div className="space-y-2">
//                         {booking.additional_guests.map((guest, index) => (
//                           <div key={index} className=" p-2 rounded-md">
//                             <p className="font-medium text-gray-900">
//                               {guest.firstname} {guest.lastname}
//                             </p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="space-y-4 border border-gray-200 bg-white p-6 rounded-xl shadow-sm">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Payment Summary
//                 </h3>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Total Amount:</span>
//                   <span className="font-medium">
//                     ₹
//                     {totalAmount.toLocaleString("en-IN", {
//                       minimumFractionDigits: 2,
//                     })}
//                   </span>
//                 </div>

//                 {/* Fixed Pending Amount Calculation with NaN handling */}
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Pending Amount:</span>
//                   <span className="font-medium text-red-600">
//                     ₹
//                     {booking.billings
//                       .reduce((sum, billing) => {
//                         const successfulPayments =
//                           billing.payments?.filter(
//                             (payment) => payment.payment_status === "Success"
//                           ) || [];

//                         const totalPaid = successfulPayments.reduce(
//                           (sum, payment) =>
//                             sum + (parseFloat(payment.amount_paid) || 0),
//                           0
//                         );

//                         const amountDue = parseFloat(billing.final_amount) || 0;
//                         const unpaidAmount = amountDue - totalPaid;

//                         return (
//                           sum +
//                           (isNaN(unpaidAmount) ? 0 : Math.max(0, unpaidAmount))
//                         );
//                       }, 0)
//                       .toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                   </span>
//                 </div>

//                 {/* Paid Amount Calculation with NaN handling */}
//                 <div className="flex justify-between pt-4 border-t border-gray-200">
//                   <span className="text-gray-600">Paid Amount:</span>
//                   <span className="font-medium text-green-600">
//                     ₹
//                     {booking.billings
//                       .reduce((sum, billing) => {
//                         const successfulPayments =
//                           billing.payments?.filter(
//                             (payment) => payment.payment_status === "Success"
//                           ) || [];

//                         return (
//                           sum +
//                           successfulPayments.reduce(
//                             (sum, payment) =>
//                               sum + (parseFloat(payment.amount_paid) || 0),
//                             0
//                           )
//                         );
//                       }, 0)
//                       .toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                   </span>
//                 </div>

//                 {/* Pay All Unpaid Button */}
//                 {getUnpaidBillings().length > 0 && !isBookingCancelled && (
//                   <button
//                     onClick={handlePayAllUnpaid}
//                     disabled={isProcessing || isBookingCancelled}
//                     className={`w-full mt-4 py-2 px-3 rounded-md font-medium flex items-center justify-center ${
//                       isProcessing || isBookingCancelled
//                         ? "bg-gray-400 cursor-not-allowed"
//                         : "bg-black text-white hover:text-gray-300"
//                     }`}
//                   >
//                     {isProcessing ? (
//                       <>
//                         <svg
//                           className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                           ></circle>
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                           ></path>
//                         </svg>
//                         Processing...
//                       </>
//                     ) : (
//                       <>Pay All Unpaid</>
//                     )}
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Payment History
//           </h3>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Service
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Method
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {booking.billings.flatMap((billing) =>
//                   (billing.payments || []).map((payment, idx) => (
//                     <tr
//                       key={`${billing.billing_id}-${idx}`}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {new Date(payment.payment_date).toLocaleDateString()}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {billing.billing_type === "Room Rent"
//                           ? "Room Charges"
//                           : billing.billing_type}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         ₹
//                         {(+payment.amount_paid).toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </td>

//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
//                         {payment.payment_method.toLowerCase()}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span
//                           className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                             payment.payment_status === "Success"
//                               ? "bg-green-100 text-green-800"
//                               : "bg-yellow-100 text-yellow-800"
//                           }`}
//                         >
//                           {payment.payment_status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {showPaymentModal && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-70 z-50">
//           <div className="bg-white p-6 rounded-lg w-full max-w-lg text-center shadow-md transform transition-all duration-200">
//             <h3 className="text-2xl font-semibold font-poppins mb-2 text-gray-900">
//               Hello, valued customer
//             </h3>
//             <p className="text-gray-500 mb-3 font-poppins font-semibold">
//               We're glad you're here
//             </p>

//             <h3 className="text-lg font-semibold mb-5 text-gray-900 border-t pt-2 font-poppins">
//               Complete your payment using one of the below options
//             </h3>

//             <div className="flex justify-center gap-4 mt-4">
//               <button
//                 onClick={() => handlePaymentOption("payLater")}
//                 className="bg-gray-200 text-gray-800 px-10 py-2 rounded-md hover:bg-gray-300 transition-all duration-200 font-medium flex items-center"
//               >
//                 <FiClock className="mr-2" /> Pay Later
//               </button>
//               <button
//                 onClick={() => handlePaymentOption("payNow")}
//                 className="bg-green-500 text-white px-10 py-2 rounded-md hover:bg-green-600 transition-all duration-200 font-medium flex items-center"
//               >
//                 <FiCreditCard className="mr-2" /> Pay Now
//               </button>
//             </div>

//             <p className="text-gray-500 text-md font-poppins font-semibold mt-6">
//               Thank you for your trust in our service
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Cancel Booking Modal */}
//       {showCancelModal && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-70 z-50">
//           <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-md relative">
//             <button
//               onClick={() => {
//                 setShowCancelModal(false);
//                 setCancellationReason("");
//               }}
//               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//             >
//               <FiX size={24} />
//             </button>

//             <h3 className="text-2xl font-semibold text-gray-900 mb-4">
//               Cancel Booking
//             </h3>
//             <div className="mb-4">
//               <label
//                 className="block text-md font-medium text-gray-700 mb-1"
//                 htmlFor="reservation-number"
//               >
//                 Reservation number
//               </label>
//               <input
//                 id="reservation-number"
//                 type="text"
//                 value={booking.order_id}
//                 disabled
//                 className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700 cursor-not-allowed"
//               />
//             </div>

//             <div className="mb-6">
//               <label
//                 htmlFor="cancellationReason"
//                 className="block text-md font-medium text-gray-700 mb-2"
//               >
//                 Reason for cancellation
//               </label>
//               <textarea
//                 id="cancellationReason"
//                 rows={5}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
//                 placeholder="Please provide the reason for cancellation"
//                 value={cancellationReason}
//                 onChange={(e) => {
//                   const input = e.target.value;
//                   if (input.length <= 500) {
//                     setCancellationReason(input);
//                   }
//                 }}
//               />
//               <div className="flex justify-between items-center mt-1">
//                 {cancellationReason.length > 0 &&
//                 cancellationReason.length < 10 ? (
//                   <p className="text-sm text-red-500">
//                     Please enter at least 10 characters.
//                   </p>
//                 ) : (
//                   <div /> // Empty div to preserve spacing
//                 )}
//                 <p className="text-sm text-gray-700">
//                   {cancellationReason.length} / 500
//                 </p>
//               </div>
//             </div>

//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => {
//                   setShowCancelModal(false);
//                   setCancellationReason("");
//                 }}
//                 className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
//                 disabled={isCancelling}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleCancelBooking}
//                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
//                 disabled={isCancelling}
//               >
//                 {isCancelling ? (
//                   <>
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Processing...
//                   </>
//                 ) : (
//                   "Confirm Cancellation"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <ToastContainer />
//     </div>
//   );
// };

// export default AccountBookingPayments;
