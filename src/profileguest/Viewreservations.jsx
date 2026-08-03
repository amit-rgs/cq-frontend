import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
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
import { FaRupeeSign } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
import { toast } from 'react-toastify';
import { AiOutlineWarning } from 'react-icons/ai';
import { useDispatch } from 'react-redux';
import { setSelectedBooking } from './redux/action';
import SignatureModal from './SignatureModal';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
const SECRET_KEY = 'pass!@389';

// Utility function to parse JWT token
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Get user email from token
const getEmailFromToken = async (token) => {
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.sub) return null;

    const response = await fetch(`${CQ_BASE_URL}/bq/api/profile?guest_id=${payload.sub}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.emailid || null;
  } catch (error) {
    console.error('Error getting email from token:', error);
    return null;
  }
};

// Enhanced getUserData with multiple fallback methods - updated to also return phone
const getUserData = async () => {
  let userData = { email: null, phone: null };

  // Method 1: Check encrypted cookie
  const encryptedData = Cookies.get('user');
  if (encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (data?.email) {
        userData.email = data.email;
      }
      if (data?.phone || data?.phonenumber) {
        userData.phone = data.phone || data.phonenumber;
      }
      if (userData.email || userData.phone) {
        return userData;
      }
    } catch (error) {
      console.error('Cookie decryption failed:', error);
    }
  }

  // Method 2: Check access token
  const accessToken = Cookies.get('access_token');
  if (accessToken) {
    try {
      // Check if email is directly in the token
      const payload = parseJwt(accessToken);
      if (payload?.email) {
        userData.email = payload.email;
      }

      // Try to get phone from token or profile
      if (payload?.phone || payload?.phonenumber) {
        userData.phone = payload.phone || payload.phonenumber;
      }

      // Fetch complete profile to get phone if not available
      if (payload?.sub && !userData.phone) {
        const response = await fetch(`${CQ_BASE_URL}/bq/api/profile?guest_id=${payload.sub}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          userData.email = userData.email || profileData.emailid;
          userData.phone = userData.phone || profileData.phonenumber || profileData.phone;
        }
      }

      if (userData.email || userData.phone) {
        return userData;
      }
    } catch (error) {
      console.error('Token-based auth failed:', error);
    }
  }

  // Method 3: Check for guest token
  const guestToken = Cookies.get('guest_token');
  if (guestToken) {
    try {
      const payload = parseJwt(guestToken);
      if (payload?.email) {
        userData.email = payload.email;
      }
      if (payload?.phone || payload?.phonenumber) {
        userData.phone = payload.phone || payload.phonenumber;
      }
      if (userData.email || userData.phone) {
        return userData;
      }
    } catch (error) {
      console.error('Guest token parsing failed:', error);
    }
  }

  console.error('All user data methods failed');
  return null;
};

// Helper function to transform API data to expected format
const transformBookingData = (apiBooking) => {
  // Transform additional_guests properly
  const transformAdditionalGuests = (guestsArray) => {
    if (!guestsArray || !Array.isArray(guestsArray)) return [];

    return guestsArray.map((guest) => ({
      firstname: guest.firstname || '',
      lastname: guest.lastname || '',
      emailid: guest.emailid || '',
      countrycode: guest.countrycode || '+91',
      phonenumber: guest.phonenumber || '',
      country: guest.country || 'Unknown',
      clienttype: guest.clienttype || 'Leisure',
      is_primary: guest.is_primary || false,
    }));
  };

  // Transform enhancements_detailed to match the expected format
  const transformEnhancements = (enhancements) => {
    const transformed = {
      food: { items: [] },
      amenities: { items: [] },
      room_services: { items: [] },
    };

    // Transform food items
    if (enhancements.food && Array.isArray(enhancements.food)) {
      transformed.food.items = enhancements.food.map((item) => ({
        id: `food_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: item.name,
        base_price: item.unit_price,
        selected_quantity: item.quantity,
        value: 5, // Default tax value
        value_type: 'P', // Percentage
        refundable: false,
        tax_amount: item.tax_amount || 0,
        total_amount: item.total_amount || 0,
      }));
    }

    // Transform amenity items
    if (enhancements.amenities && Array.isArray(enhancements.amenities)) {
      transformed.amenities.items = enhancements.amenities.map((item) => ({
        id: `amenity_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: item.name,
        base_price: item.unit_price,
        selected_quantity: item.quantity,
        value: 12, // Default tax value
        value_type: 'P', // Percentage
        refundable: false,
        tax_amount: item.tax_amount || 0,
        total_amount: item.total_amount || 0,
        urgency: item.urgency || 'Normal',
        instructions: item.instructions || null,
      }));
    }

    // Transform room service items
    if (enhancements.room_service && Array.isArray(enhancements.room_service)) {
      transformed.room_services.items = enhancements.room_service.map((item) => ({
        id: `room_service_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: item.name,
        base_price: item.unit_price,
        selected_quantity: item.quantity,
        value: 12, // Default tax value
        value_type: 'P', // Percentage
        refundable: false,
        tax_amount: item.tax_amount || 0,
        total_amount: item.total_amount || 0,
        urgency: item.urgency || 'Normal',
        instructions: item.instructions || null,
      }));
    }

    return transformed;
  };

  // Transform guests array
  const transformGuests = (guests, primaryGuest) => {
    if (!guests || !Array.isArray(guests)) return [];

    return guests.map((guest) => ({
      guestid: guest.guestid,
      firstname: guest.firstname,
      lastname: guest.lastname,
      emailid: guest.emailid,
      countrycode: guest.countrycode,
      phonenumber: guest.phonenumber,
      clienttype: guest.clienttype,
      is_primary: guest.guestid === primaryGuest?.guestid,
    }));
  };

  // Calculate total final amount
  const calculateTotalFinalAmount = (booking) => {
    const roomAmount = booking.room_final_amount || 0;
    const foodAmount = booking.enhancements_total?.food || 0;
    const amenitiesAmount = booking.enhancements_total?.amenities || 0;
    const roomServiceAmount = booking.enhancements_total?.room_service || 0;

    return roomAmount + foodAmount + amenitiesAmount + roomServiceAmount;
  };

  return {
    // Basic booking info
    bookingid: apiBooking.bookingid,
    orderid: apiBooking.orderid,
    checkindate: apiBooking.checkindate,
    checkoutdate: apiBooking.checkoutdate,
    room_type: apiBooking.room_type,
    room_number: apiBooking.room_number,
    booking_status: apiBooking.booking_status,
    special_requests: apiBooking.special_requests || '',
    property_name: apiBooking.property_name,
    number_of_guests: apiBooking.number_of_guests,
    length_of_stay: apiBooking.length_of_stay,

    // Guest information
    guests: transformGuests(apiBooking.guests, apiBooking.primary_guest),

    // ADD THIS - Additional guests from API
    additional_guests: transformAdditionalGuests(apiBooking.additional_guests),

    // Financial information
    base_amount: apiBooking.base_amount,
    tax_amount: apiBooking.tax_amount,
    discount: apiBooking.discount || 0,
    service_fee: apiBooking.service_fee || 0,
    final_amount: apiBooking.final_amount,
    payment_status: apiBooking.payment_status,
    billing_status: apiBooking.billing_status,
    total_paid: apiBooking.total_paid || apiBooking.paid_amount || 0,
    total_due: apiBooking.total_due || apiBooking.due_amount || 0,
    total_pending: apiBooking.total_pending || apiBooking.pending_amount || 0,

    // Room charges
    room_base_amount: apiBooking.room_base_amount,
    room_tax_amount: apiBooking.room_tax_amount,
    room_discount_amount: apiBooking.room_discount_amount || 0,
    room_service_fee: apiBooking.room_service_fee || 0,
    room_final_amount: apiBooking.room_final_amount,
    room_source: apiBooking.room_source,
    room_note: apiBooking.room_note,

    // Enhancements
    enhancements: apiBooking.enhancements || [],
    enhancements_total: apiBooking.enhancements_total || {
      amenities: 0,
      room_service: 0,
      food: 0,
    },
    enhancements_detailed: apiBooking.enhancements_detailed
      ? transformEnhancements(apiBooking.enhancements_detailed)
      : {
          food: { items: [] },
          amenities: { items: [] },
          room_services: { items: [] },
        },

    // Additional fields for Redux compatibility
    total_final_amount: calculateTotalFinalAmount(apiBooking),
    corporate_discount_applied: apiBooking.corporate_discount_applied || false,
    total_refund_amount: apiBooking.total_refund_amount || 0,
    refunds: apiBooking.refunds || [],
    pending_payments: apiBooking.pending_payments || [],

    // Primary guest for easy access
    primary_guest: apiBooking.primary_guest,
  };
};

const ViewReservation = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationResponse, setCancellationResponse] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('UPCOMING');
  const [bookings, setBookings] = useState({
    upcoming: [],
    current: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [showServiceFeeInfo, setShowServiceFeeInfo] = useState(false);
  const [error, setError] = useState(null);
  const [hasReservations, setHasReservations] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const bookingsPerPage = 2;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userEmail, setUserEmail] = useState('');

  // Signature states
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [hasExistingSignature, setHasExistingSignature] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);

  // Check if signature exists for a booking
  // Replace your existing checkSignatureExists with this:
  const checkSignatureExists = async (orderId) => {
    if (!orderId) {
      console.log('No order ID provided');
      setHasExistingSignature(false);
      setSignatureData(null);
      return false;
    }

    console.log('Checking signature for order:', orderId);

    try {
      const accessToken = Cookies.get('access_token');
      const response = await fetch(`${CQ_BASE_URL}/bq/api/get-signature/${orderId}?format=base64`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
      });

      console.log('Signature check response status:', response.status);

      if (response.status === 200) {
        const data = await response.json();
        console.log('Signature found:', data);
        if (data.success && data.signature) {
          setHasExistingSignature(true);
          setSignatureData(data.signature);
          return true;
        }
      } else if (response.status === 404) {
        console.log('No signature found for order:', orderId);
        setHasExistingSignature(false);
        setSignatureData(null);
        return false;
      } else {
        console.log('Unexpected response status:', response.status);
        setHasExistingSignature(false);
        setSignatureData(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking signature:', error);
      setHasExistingSignature(false);
      setSignatureData(null);
      return false;
    }
    return false;
  };

  // Save signature to backend
  const saveSignatureToBackend = async (signatureDataURL, orderId, guestName) => {
    try {
      const response = await fetch(signatureDataURL);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('order_id', orderId);
      formData.append('guest_name', guestName);
      formData.append('signature', blob, `signature_${Date.now()}.png`);
      formData.append('storage_type', 'cloud');

      const accessToken = Cookies.get('access_token');
      const saveResponse = await fetch(`${CQ_BASE_URL}/bq/api/save-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken || ''}`,
        },
        body: formData,
      });

      if (saveResponse.ok) {
        const result = await saveResponse.json();
        console.log('Signature saved successfully:', result);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving signature:', error);
      return false;
    }
  };

  // Handle signature confirmation
  const handleSignatureConfirm = async (signatureDataURL) => {
    setSignatureData(signatureDataURL);
    setShowSignatureModal(false);

    // Save signature to backend
    if (currentBooking && signatureDataURL) {
      const primaryGuest = currentBooking.guests?.find((g) => g.is_primary);
      const guestName = primaryGuest
        ? `${primaryGuest.firstname} ${primaryGuest.lastname}`
        : 'Guest';

      const saved = await saveSignatureToBackend(
        signatureDataURL,
        currentBooking.orderid,
        guestName
      );

      if (saved) {
        setHasExistingSignature(true);
        // After saving signature, send the invoice
        await sendInvoiceWithSignature();
      } else {
        toast.error('Failed to save signature. Please try again.', {
          position: 'top-center',
          autoClose: 3000,
        });
      }
    }
  };

  // Send invoice with signature check
  const sendInvoiceWithSignature = async () => {
    if (!currentBooking) return;

    try {
      setSendingInvoice(true);
      const orderId = currentBooking.orderid;
      const accessToken = Cookies.get('access_token');

      // Send invoice email
      const emailResponse = await fetch(
        `${CQ_BASE_URL}/bq/api/invoice/email/${orderId}?recipient_email=${encodeURIComponent(
          userEmail
        )}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken || ''}`,
          },
        }
      );

      if (!emailResponse.ok) {
        throw new Error(`Email sending failed with status ${emailResponse.status}`);
      }

      const emailData = await emailResponse.json();

      // Show success message
      if (hasExistingSignature) {
        toast.success(
          <div>
            <strong>✓ Invoice Sent Successfully!</strong>
            <br />
            Your signed invoice has been sent to {userEmail}
            <br />
            <span className="text-xs text-green-600">✓ Digital signature included</span>
          </div>,
          {
            position: 'top-center',
            autoClose: 5000,
          }
        );
      } else {
        toast.success(
          <div>
            <strong>✓ Invoice Sent Successfully!</strong>
            <br />
            Your invoice has been sent to {userEmail}
          </div>,
          {
            position: 'top-center',
            autoClose: 5000,
          }
        );
      }

      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice. Please try again.', {
        position: 'top-center',
        autoClose: 4000,
      });
    } finally {
      setSendingInvoice(false);
    }
  };

  // Main handleSendInvoice function
  const handleSendInvoice = async () => {
    if (!currentBooking) return;

    try {
      setSendingInvoice(true);
      const orderId = currentBooking.orderid;

      // Re-check signature before sending (in case it was added in meantime)
      const signatureExists = await checkSignatureExists(orderId);

      if (signatureExists) {
        // Signature exists, send invoice directly
        await sendInvoiceWithSignature();
      } else {
        // No signature found, ask user if they want to add one
        const shouldAddSignature = window.confirm(
          'No digital signature found for this booking.\n\nWould you like to add a signature to your invoice?\n\n• Click OK to add signature\n• Click Cancel to send invoice without signature'
        );

        if (shouldAddSignature) {
          // Close the invoice popup first
          setIsPopupOpen(false);
          // Show signature modal
          setShowSignatureModal(true);
          setSendingInvoice(false);
        } else {
          // Send without signature
          await sendInvoiceWithSignature();
        }
      }
    } catch (error) {
      console.error('Error in handleSendInvoice:', error);
      toast.error('Failed to process invoice request. Please try again.', {
        position: 'top-center',
        autoClose: 4000,
      });
      setSendingInvoice(false);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const userData = await getUserData();
        console.log('User data retrieved:', userData);

        if (!userData?.email && !userData?.phone) {
          throw new Error('Could not retrieve user email or phone');
        }

        if (userData?.email) {
          setUserEmail(userData.email);
        }

        // Try to fetch by email first if available
        let apiUrl;
        let response;
        let data;
        let foundBookings = false;

        // Method 1: Try with email if available
        if (userData?.email) {
          console.log('Trying to fetch bookings with email:', userData.email);
          apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?email=${encodeURIComponent(
            userData.email
          )}&include_cancelled=true`;

          response = await fetch(apiUrl, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${Cookies.get('access_token') || ''}`,
            },
          });

          if (response.ok) {
            data = await response.json();

            // Check if we got bookings with this email
            if (data.status === 'success' && data.data) {
              const hasBookings =
                (data.data.upcoming && data.data.upcoming.length > 0) ||
                (data.data.current && data.data.current.length > 0) ||
                (data.data.completed && data.data.completed.length > 0) ||
                (data.data.cancelled && data.data.cancelled.length > 0);

              if (hasBookings) {
                console.log('Found bookings with email:', userData.email);
                processBookingsData(data);
                foundBookings = true;
              }
            }
          }
        }

        // Method 2: If no bookings found with email and we have phone, try with phone
        if (!foundBookings && userData?.phone) {
          console.log('No bookings found with email, trying phone:', userData.phone);
          apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?phone=${encodeURIComponent(
            userData.phone
          )}&include_cancelled=true`;

          response = await fetch(apiUrl, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${Cookies.get('access_token') || ''}`,
            },
          });

          if (response.ok) {
            data = await response.json();
            if (data.status === 'success' && data.data) {
              const hasBookings =
                (data.data.upcoming && data.data.upcoming.length > 0) ||
                (data.data.current && data.data.current.length > 0) ||
                (data.data.completed && data.data.completed.length > 0) ||
                (data.data.cancelled && data.data.cancelled.length > 0);

              if (hasBookings) {
                console.log('Found bookings with phone:', userData.phone);
                processBookingsData(data);
                foundBookings = true;
              }
            }
          }
        }

        // If both email and phone failed or no bookings found
        if (!foundBookings) {
          // Check if we have any data from either method
          if (data && data.status === 'success' && data.data) {
            // This means the API call succeeded but returned empty arrays
            const transformedBookings = {
              upcoming: [],
              current: [],
              completed: [],
              cancelled: [],
            };

            console.log('No bookings found with email or phone');
            setBookings(transformedBookings);
            setHasReservations(false);
          } else {
            throw new Error('No bookings found with email or phone');
          }
        }
      } catch (err) {
        console.error('Booking fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to process bookings data
    const processBookingsData = (data) => {
      if (data.status === 'success' && data.data) {
        const transformedBookings = {
          upcoming: (data.data.upcoming || []).map(transformBookingData),
          current: (data.data.current || []).map(transformBookingData),
          completed: (data.data.completed || []).map(transformBookingData),
          cancelled: (data.data.cancelled || []).map(transformBookingData),
        };

        console.log('Transformed Bookings:', transformedBookings);

        setBookings(transformedBookings);

        const hasAnyReservations =
          transformedBookings.upcoming.length > 0 ||
          transformedBookings.current.length > 0 ||
          transformedBookings.completed.length > 0 ||
          transformedBookings.cancelled.length > 0;

        setHasReservations(hasAnyReservations);
      } else {
        throw new Error(data.message || 'Failed to fetch bookings');
      }
    };

    fetchBookings();
  }, [cancellationResponse]);

  useEffect(() => {
    if (!loading && !hasReservations && !error) {
      navigate('/walk-in/room-reservation');
    }
  }, [loading, hasReservations, error, navigate]);

  const toggleExpanded = (bookingId) => {
    setExpandedBookings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const options = {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        weekday: 'short',
      };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting display date:', dateString, error);
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(numAmount)
      .replace('₹', '₹ ');
  };

  const handleConfirmCancellation = () => {
    setIsConfirmationPopupOpen(false);
    processCancellation();
  };

  // UPDATED: Modified cancellation function to match new API requirements
  const processCancellation = async () => {
    if (!cancellingBooking || !cancellationReason) return;

    try {
      setLoading(true);

      // UPDATED: Removed cancel_all_pending as it's not required in the new API
      const response = await fetch(
        `${CQ_BASE_URL}/bq/api/modify/${cancellingBooking.bookingid}/cancel`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Cookies.get('access_token') || ''}`,
          },
          body: JSON.stringify({
            cancellation_reason: cancellationReason,
            // REMOVED: cancel_all_pending as it's not in the new API request
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Cancellation failed with status ${response.status}`);
      }

      const data = await response.json();

      // Store the full response for debugging
      console.log('Cancellation API Response:', data);

      if (data.status === 'success') {
        // Handle successful cancellation with the new response format
        setCancellationResponse({
          ...data,
          success: true,
          // Backward compatibility fields
          final_refund: data.data?.total_refund || 0,
          refund_amount: data.data?.total_refund || 0,
          cancellation_charges: data.data?.room_penalty || 0,
          service_fee: data.data?.total_service_fee || 0,
        });
      } else {
        // Handle error response
        setCancellationResponse({
          success: false,
          message: data.message || 'Cancellation failed',
          status: 'error',
          data: {
            total_refund: 0,
            room_penalty: 0,
            total_service_fee: 0,
            net_impact: 0,
          },
        });
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      setCancellationResponse({
        success: false,
        message: 'Cancellation failed. Please try again.',
        status: 'error',
        data: {
          total_refund: 0,
          room_penalty: 0,
          total_service_fee: 0,
          net_impact: 0,
        },
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

    // Refresh bookings after cancellation
    if (cancellationResponse?.success) {
      // Trigger a refresh of bookings data
      const fetchBookings = async () => {
        try {
          const userData = await getUserData();
          if (userData?.email || userData?.phone) {
            let apiUrl;

            // Try email first
            if (userData.email) {
              apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?email=${encodeURIComponent(
                userData.email
              )}&include_cancelled=true`;
            } else if (userData.phone) {
              apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?phone=${encodeURIComponent(
                userData.phone
              )}&include_cancelled=true`;
            }

            if (apiUrl) {
              const response = await fetch(apiUrl, {
                headers: {
                  Accept: 'application/json',
                  Authorization: `Bearer ${Cookies.get('access_token') || ''}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.data) {
                  const transformedBookings = {
                    upcoming: (data.data.upcoming || []).map(transformBookingData),
                    current: (data.data.current || []).map(transformBookingData),
                    completed: (data.data.completed || []).map(transformBookingData),
                    cancelled: (data.data.cancelled || []).map(transformBookingData),
                  };
                  setBookings(transformedBookings);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error refreshing bookings after cancellation:', err);
        }
      };
      fetchBookings();
    }
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

    // Helper function to calculate tax for an item
    const calculateItemTax = (item) => {
      return item.tax_amount || 0;
    };

    const formatCurrencyWithDecimals = (amount) => {
      const numAmount = parseFloat(amount) || 0;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(numAmount)
        .replace('₹', '₹ ');
    };

    // Get tax info based on item properties
    const getTaxInfo = (item) => {
      if (item.tax_amount && item.tax_amount > 0) {
        return {
          hasTax: true,
          message: 'Including taxes',
        };
      }
      return {
        hasTax: false,
        message: 'No taxes applied',
      };
    };

    // Check if service fee exists and is greater than 0
    const hasServiceFee = booking.room_service_fee && booking.room_service_fee > 0;

    // Function to show service fee info
    const showServiceFeeInfo = () => {
      alert(
        `Room Service Fee: ${formatCurrencyWithDecimals(
          booking.room_service_fee
        )}\n\nThis fee covers handling and processing charges for your room booking.`
      );
    };

    return (
      <div className="mt-4 border-t pt-3">
        <div className="mb-3">
          <h4 className="font-medium mb-2">Room Charges:</h4>
          <div className="ml-4 space-y-1">
            <div className="flex justify-between">
              <span>
                {booking.room_type} x {booking.length_of_stay} day(s)
              </span>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span>{formatCurrencyWithDecimals(booking.room_final_amount)}</span>
                  {/* Show info icon only if service fee exists */}
                  {hasServiceFee && (
                    <button
                      onClick={showServiceFeeInfo}
                      className="text-blue-500 hover:text-blue-700 focus:outline-none ml-1"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title="View service fee details"
                    >
                      <FiInfo size={14} />
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-gray-500">Including taxes and fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Display enhancements if they exist */}
        {(enhancements.food?.items?.length > 0 ||
          enhancements.amenities?.items?.length > 0 ||
          enhancements.room_services?.items?.length > 0) && (
          <div>
            <h4 className="font-medium mb-2">Additional Enhancements:</h4>
            <div className="space-y-3">
              {enhancements.food?.items?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Food Items:</h5>
                  <ul className="ml-4 space-y-2">
                    {enhancements.food.items.map((item, i) => {
                      const itemFinalAmount = item.total_amount || 0;
                      const taxInfo = getTaxInfo(item);

                      return (
                        <li key={i} className="flex justify-between">
                          <span className="text-sm">
                            {item.name} (x{item.selected_quantity})
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {formatCurrencyWithDecimals(itemFinalAmount)}
                            </span>
                            <span className="text-[10px] text-gray-500">{taxInfo.message}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {enhancements.amenities?.items?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Amenities:</h5>
                  <ul className="ml-4 space-y-2">
                    {enhancements.amenities.items.map((item, i) => {
                      const itemFinalAmount = item.total_amount || 0;
                      const taxInfo = getTaxInfo(item);

                      return (
                        <li key={i} className="flex justify-between">
                          <span className="text-sm">
                            {item.name} (x{item.selected_quantity})
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {formatCurrencyWithDecimals(itemFinalAmount)}
                            </span>
                            <span className="text-[10px] text-gray-500">{taxInfo.message}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {enhancements.room_services?.items?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700">Room Services:</h5>
                  <ul className="ml-4 space-y-2">
                    {enhancements.room_services.items.map((item, i) => {
                      const itemFinalAmount = item.total_amount || 0;
                      const taxInfo = getTaxInfo(item);

                      return (
                        <li key={i} className="flex justify-between">
                          <span className="text-sm">
                            {item.name} (x{item.selected_quantity})
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              {formatCurrencyWithDecimals(itemFinalAmount)}
                            </span>
                            <span className="text-[10px] text-gray-500">{taxInfo.message}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getBookingStatusDisplay = (booking) => {
    const status = booking.booking_status?.toLowerCase();
    const payment = booking.payment_status?.toLowerCase();

    if (status === 'soft') {
      return payment !== 'paid' ? 'Reserved (Payment Required)' : 'Reserved';
    }

    if (status === 'hard') {
      return 'Checked In';
    }

    if (status === 'checkedout') {
      return 'Completed';
    }

    return (
      booking.booking_status?.replace(/_/g, ' ')?.replace(/\b\w/g, (char) => char.toUpperCase()) ||
      'Unknown'
    );
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'UPCOMING':
        return bookings.upcoming;
      case 'CURRENT':
        return bookings.current;
      case 'COMPLETED':
        return bookings.completed;
      case 'CANCELLED':
        return bookings.cancelled;
      default:
        return [];
    }
  };

  const filteredBookings = getFilteredBookings();
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  );

  const isCheckinDatePassed = (checkinDate) => {
    if (!checkinDate) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkin = new Date(checkinDate);
      checkin.setHours(0, 0, 0, 0);

      return checkin < today;
    } catch (error) {
      console.error('Error checking checkin date:', checkinDate, error);
      return false;
    }
  };

  const isPastBooking = (checkoutDate) => {
    if (!checkoutDate) return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkout = new Date(checkoutDate);
      checkout.setHours(0, 0, 0, 0);

      return checkout < today;
    } catch (error) {
      console.error('Error checking checkout date:', checkoutDate, error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const formatToTwoDecimal = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return Number(parseFloat(value) || 0).toFixed(2);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <AiOutlineWarning className="text-red-500 text-5xl mb-4" />
        <h1 className="text-2xl font-bold mb-2">Unable to load reservations</h1>
        <p className="text-gray-600 mb-6">
          {error === 'No bookings found with email or phone'
            ? 'No reservations found with your email or phone number. Please check your contact information or make a new reservation.'
            : error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!hasReservations) {
    return null;
  }

  // Helper function to get policy category description
  const getPolicyCategoryDescription = (category) => {
    switch (category) {
      case 1:
        return 'Free Cancellation';
      case 2:
        return 'Moderate Cancellation Policy';
      case 3:
        return 'Restricted Cancellation Policy';
      case 4:
        return 'Non-Refundable';
      default:
        return 'Standard Policy';
    }
  };

  // Helper function to get financial type description
  const getFinancialTypeDescription = (type) => {
    const descriptions = {
      cancellation_charge_1night_unpaid: '1-night cancellation charge (unpaid booking)',
      cancellation_charge_1night: '1-night cancellation charge',
      free_cancellation_unpaid: 'Free cancellation (unpaid booking)',
      full_refund: 'Full refund',
      non_refundable_no_refund: 'Non-refundable',
      frozen_no_refund: 'Frozen - no refund',
    };
    return descriptions[type] || type;
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Manage your reservations</h1>
        <button
          onClick={() => navigate('/walk-in/room-reservation')}
          className="flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
        >
          <FiHome className="mr-2" /> New Reservation
        </button>
      </div>

      <div className="flex border-b mb-6 overflow-x-auto">
        {['UPCOMING', 'CURRENT', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-purple-500 text-purple-500 font-medium'
                : 'text-black hover:text-purple-700'
            }`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
              setExpandedBookings(new Set());
            }}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {paginatedBookings.length > 0 ? (
        <>
          <div className="space-y-4">
            {paginatedBookings.map((booking) => {
              const isExpanded = expandedBookings.has(booking.bookingid);
              const allowModify =
                booking.booking_status?.toLowerCase() === 'soft' &&
                !isPastBooking(booking.checkoutdate) &&
                !isCheckinDatePassed(booking.checkindate);

              return (
                <div
                  key={booking.bookingid}
                  className="border rounded-lg overflow-hidden bg-white transition-all duration-300"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpanded(booking.bookingid)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {booking.room_type || 'Unknown Room Type'}
                          </h3>
                          <div className="text-right">
                            <span className="flex items-center text-lg font-medium">
                              ₹{formatToTwoDecimal(booking.net_billed || booking.final_amount)}
                            </span>
                            <span className="flex items-center text-xs text-gray-500">
                              Including taxes
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                          Reservation Number: {booking.orderid}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Check-in</p>
                            <p className="font-medium">{formatDate(booking.checkindate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Check-out</p>
                            <p className="font-medium">{formatDate(booking.checkoutdate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Number of nights</p>
                            <p className="font-medium">{booking.length_of_stay || 1}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <div className="flex items-center whitespace-nowrap">
                              {activeTab === 'CANCELLED' ? (
                                <span className="text-red-600 font-medium text-sm">Cancelled</span>
                              ) : activeTab === 'COMPLETED' ? (
                                <>
                                  <FiCheckCircle className="text-green-500 mr-1" />
                                  <span className="text-green-600 font-medium text-sm">
                                    Completed
                                  </span>
                                </>
                              ) : (
                                <span className="font-medium text-sm">
                                  {getBookingStatusDisplay(booking)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center">
                        <button className="text-gray-500 hover:text-gray-700 p-2">
                          {isExpanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-4 animate-slideDown">
                      <div className="mb-4">
                        <p className="text-xs text-gray-500">Property</p>
                        <p className="font-medium">{booking.property_name}</p>
                      </div>

                      {renderGuestInfo(booking.guests)}

                      {booking.enhancements_detailed &&
                        renderEnhancements(booking.enhancements_detailed, booking)}
                    </div>
                  )}

                  <div className="px-4 py-4 flex justify-between items-center">
                    <div>
                      {activeTab === 'COMPLETED' && (
                        <button
                          className="text-purple-500 flex items-center hover:text-purple-600 px-3 py-2 rounded border border-purple-300 "
                          onClick={async (e) => {
                            e.stopPropagation();
                            setCurrentBooking(booking);
                            // Check signature for this booking when opening popup
                            await checkSignatureExists(booking.orderid);
                            setIsPopupOpen(true);
                          }}
                        >
                          <FiDownload className="mr-2" /> Download Invoice
                        </button>
                      )}
                    </div>

                    <div>
                      {(activeTab === 'UPCOMING' || activeTab === 'CURRENT') && (
                        <div className="space-x-2 flex">
                          {allowModify && (
                            <button
                              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Pass ALL booking data including additional_guests to Redux
                                const bookingWithAdditionalGuests = {
                                  ...booking,
                                  // Ensure additional_guests is included
                                  additional_guests: booking.additional_guests || [],
                                };

                                dispatch(setSelectedBooking(bookingWithAdditionalGuests));
                                localStorage.setItem(
                                  'selectedBooking',
                                  JSON.stringify(bookingWithAdditionalGuests)
                                );
                                navigate('/edit-reservation/update-roomdetails');
                              }}
                            >
                              Modify Reservation
                            </button>
                          )}
                          {booking.booking_status?.toLowerCase() !== 'hard' && (
                            <button
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancellingBooking(booking);
                                setIsCancelPopupOpen(true);
                              }}
                            >
                              Cancel Reservation
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className={`flex items-center px-4 py-2 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 cursor-not-allowed text-purple-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <FiArrowLeft className="mr-2" /> Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className={`flex items-center px-4 py-2 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 cursor-not-allowed  text-purple-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Next <FiArrowLeft className="ml-2 rotate-180" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border">
          <AiOutlineWarning className="text-yellow-500 text-4xl mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            No {activeTab.toLowerCase()} reservations found
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have any {activeTab.toLowerCase()} reservation at this time.
          </p>
          <button
            onClick={() => navigate('/walk-in/room-reservation')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Reserve a Room
          </button>
        </div>
      )}

      {/* Signature Modal */}
      {/* Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          // Reopen invoice popup after closing signature modal without saving
          setIsPopupOpen(true);
        }}
        onSave={handleSignatureConfirm}
        guestName={currentBooking?.guests?.find((g) => g.is_primary)?.firstname || 'Guest'}
        amount={formatCurrency(currentBooking?.final_amount || 0)}
      />

      {/* Invoice Download Popup - UPDATED */}
      {/* Invoice Download Popup - UPDATED */}
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
              <div className="mx-auto flex items-center justify-center h-16 w-16 bg-purple-500 rounded-full shadow-md mb-4">
                <FiFileText className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your invoice is ready</h2>
            </div>

            <div className="text-center mb-6 px-2">
              <p className="text-gray-500 leading-relaxed text-sm">
                Your invoice will be sent to{' '}
                <span className="font-medium text-gray-700">{userEmail}</span>
                {'. '}
              </p>
              <div
                className={`mt-3 p-3 rounded-lg text-sm ${
                  hasExistingSignature
                    ? 'bg-gray-50 text-gray-900 border border-gray-200'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <FiInfo className="inline mr-2" />
                {hasExistingSignature ? (
                  <span>✓ Digital signature found! It will be included in your invoice.</span>
                ) : (
                  <span>
                    No signature found. You can add one now or send invoice without signature.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 w-full">
              <button
                onClick={handleSendInvoice}
                disabled={sendingInvoice}
                className={`w-full bg-purple-500 text-white font-medium py-3 rounded-md shadow-md transition ${
                  sendingInvoice ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-600'
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
                      <span>Send Invoice</span>
                    </>
                  )}
                </div>
              </button>

              <button
                onClick={() => setIsPopupOpen(false)}
                className="w-full bg-red-500 text-white font-medium py-3 rounded-md shadow-md hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>

            {/* Add signature button if no signature exists */}
            {!hasExistingSignature && !sendingInvoice && (
              <button
                onClick={() => {
                  setIsPopupOpen(false);
                  setShowSignatureModal(true);
                }}
                className="w-full mt-3 bg-purple-500 text-white font-medium py-4 rounded-md shadow-md hover:bg-purple-600 transition text-sm"
              >
                Add Signature to Invoice
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {isConfirmationPopupOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all duration-300 ">
            <div className="text-center mb-6">
              <AiOutlineWarning className="mx-auto text-red-600 text-6xl mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Confirm Cancellation</h3>
              <p className="text-gray-900 text-lg leading-relaxed">
                Are you sure you want to cancel your reservation? <br />
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-left">
                  <div className="flex items-start">
                    <FiInfo className="text-black mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-black font-medium text-sm mb-1">
                        Cancellation Information
                      </p>
                      <p className="text-black text-sm">
                        • All pending services will be automatically cancelled
                        <br />
                        • Refundable amounts will be processed within 5-7 business days
                        <br />• Cancellation charges will apply as per policy
                      </p>
                    </div>
                  </div>
                </div>
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmationPopupOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-medium border  text-white bg-purple-500  hover:bg-purple-600 transition-all shadow-sm"
              >
                No, Keep Reservation
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white  shadow-md hover:shadow-lg transition-all"
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Popup - UPDATED FOR NEW API RESPONSE */}
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
                <div className="p-6">
                  {/* Success Header */}
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4">
                      {cancellationResponse.success ? (
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <FiCheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                      ) : (
                        <AiOutlineWarning className="mx-auto text-red-600 text-6xl mb-4" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {cancellationResponse.success
                        ? 'Reservation Cancelled Successfully'
                        : 'Cancellation Failed'}
                    </h3>
                    <p className="text-gray-600 mb-6">{cancellationResponse.message}</p>

                    {/* Reservation Number Badge */}
                    <div className="inline-flex flex-col items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-xs text-gray-500 font-medium mb-1">RESERVATION NUMBER</p>
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {cancellationResponse.data?.booking_id || cancellingBooking.orderid}
                      </p>
                    </div>
                  </div>

                  {/* UPDATED: Display the new API response format */}
                  {cancellationResponse.success && cancellationResponse.data && (
                    <div className="space-y-6">
                      {/* Financial Breakdown */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                          Financial Summary
                        </h4>

                        {/* Room Charges */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-gray-700">Cancellation Charges</span>
                            </div>
                            <span className="font-semibold text-red-600">
                              ₹{formatToTwoDecimal(cancellationResponse.data.room_penalty)}
                            </span>
                          </div>

                          {/* Refund Breakdown */}
                          <div className="">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-700">Additional Service Refunds</span>
                              <span className="font-semibold text-gray-950">
                                ₹{formatToTwoDecimal(cancellationResponse.data.service_refund)}
                              </span>
                            </div>

                            {cancellationResponse.data.non_refundable_service_retained > 0 && (
                              <div className="flex justify-between items-center mt-1 text-sm">
                                <span className="text-gray-600">
                                  Non-refundable services retained
                                </span>
                                <span className="text-red-500">
                                  ₹
                                  {formatToTwoDecimal(
                                    cancellationResponse.data.non_refundable_service_retained
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Totals */}
                          <div className="space-y-2 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 font-medium">Total Refund</span>
                              <span className="text-xl font-bold text-green-600">
                                ₹{formatToTwoDecimal(cancellationResponse.data.total_refund)}
                              </span>
                            </div>
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

                      {/* Cancellation Information */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AiOutlineWarning className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="font-sm text-yellow-800 mb-1">Important Information</p>
                            <p className="text-sm text-yellow-700">
                              • All pending services (amenities, room services, food orders) will be
                              automatically cancelled
                              <br />
                              • Cancellation charges will apply as per policy
                              <br />
                              • Refundable amounts will be processed within 5-7 business days
                              <br />• A detailed breakdown will be shown after cancellation
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
                  className="px-8 py-3 bg-purple-500 text-white rounded-lg font-medium hover: hover:bg-purple-600 transition-colors shadow-lg"
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

export default ViewReservation;

// import { useState, useEffect } from "react";
// import {
//   FiArrowLeft,
//   FiDownload,
//   FiX,
//   FiCalendar,
//   FiUsers,
//   FiHome,
//   FiCheckCircle,
//   FiUser,
//   FiUserPlus,
//   FiInfo,
//   FiChevronDown,
//   FiChevronUp,
// } from "react-icons/fi";
// import { FiFileText } from "react-icons/fi";
// import { FaRupeeSign } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import Cookies from "js-cookie";
// import CryptoJS from "crypto-js";
// import { AiOutlineWarning } from "react-icons/ai";
// import { useDispatch } from "react-redux";
// import { setSelectedBooking } from "./redux/action";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
// const SECRET_KEY = "pass!@389";

// // Utility function to parse JWT token
// const parseJwt = (token) => {
//   try {
//     return JSON.parse(atob(token.split(".")[1]));
//   } catch (e) {
//     return null;
//   }
// };

// // Get user email from token
// const getEmailFromToken = async (token) => {
//   try {
//     const payload = parseJwt(token);
//     if (!payload || !payload.sub) return null;

//     const response = await fetch(
//       `${CQ_BASE_URL}/bq/api/profile?guest_id=${payload.sub}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//       },
//     );

//     if (!response.ok) return null;

//     const data = await response.json();
//     return data.emailid || null;
//   } catch (error) {
//     console.error("Error getting email from token:", error);
//     return null;
//   }
// };

// // Enhanced getUserData with multiple fallback methods - updated to also return phone
// const getUserData = async () => {
//   let userData = { email: null, phone: null };

//   // Method 1: Check encrypted cookie
//   const encryptedData = Cookies.get("user");
//   if (encryptedData) {
//     try {
//       const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
//       const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//       if (data?.email) {
//         userData.email = data.email;
//       }
//       if (data?.phone || data?.phonenumber) {
//         userData.phone = data.phone || data.phonenumber;
//       }
//       if (userData.email || userData.phone) {
//         return userData;
//       }
//     } catch (error) {
//       console.error("Cookie decryption failed:", error);
//     }
//   }

//   // Method 2: Check access token
//   const accessToken = Cookies.get("access_token");
//   if (accessToken) {
//     try {
//       // Check if email is directly in the token
//       const payload = parseJwt(accessToken);
//       if (payload?.email) {
//         userData.email = payload.email;
//       }

//       // Try to get phone from token or profile
//       if (payload?.phone || payload?.phonenumber) {
//         userData.phone = payload.phone || payload.phonenumber;
//       }

//       // Fetch complete profile to get phone if not available
//       if (payload?.sub && !userData.phone) {
//         const response = await fetch(
//           `${CQ_BASE_URL}/bq/api/profile?guest_id=${payload.sub}`,
//           {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//               Accept: "application/json",
//             },
//           }
//         );

//         if (response.ok) {
//           const profileData = await response.json();
//           userData.email = userData.email || profileData.emailid;
//           userData.phone = userData.phone || profileData.phonenumber || profileData.phone;
//         }
//       }

//       if (userData.email || userData.phone) {
//         return userData;
//       }
//     } catch (error) {
//       console.error("Token-based auth failed:", error);
//     }
//   }

//   // Method 3: Check for guest token
//   const guestToken = Cookies.get("guest_token");
//   if (guestToken) {
//     try {
//       const payload = parseJwt(guestToken);
//       if (payload?.email) {
//         userData.email = payload.email;
//       }
//       if (payload?.phone || payload?.phonenumber) {
//         userData.phone = payload.phone || payload.phonenumber;
//       }
//       if (userData.email || userData.phone) {
//         return userData;
//       }
//     } catch (error) {
//       console.error("Guest token parsing failed:", error);
//     }
//   }

//   console.error("All user data methods failed");
//   return null;
// };

// // Helper function to transform API data to expected format
// const transformBookingData = (apiBooking) => {
//   // Transform additional_guests properly
//   const transformAdditionalGuests = (guestsArray) => {
//     if (!guestsArray || !Array.isArray(guestsArray)) return [];

//     return guestsArray.map(guest => ({
//       firstname: guest.firstname || "",
//       lastname: guest.lastname || "",
//       emailid: guest.emailid || "",
//       countrycode: guest.countrycode || "+91",
//       phonenumber: guest.phonenumber || "",
//       country: guest.country || "Unknown",
//       clienttype: guest.clienttype || "Leisure",
//       is_primary: guest.is_primary || false
//     }));
//   };

//   // Transform enhancements_detailed to match the expected format
//   const transformEnhancements = (enhancements) => {
//     const transformed = {
//       food: { items: [] },
//       amenities: { items: [] },
//       room_services: { items: [] },
//     };

//     // Transform food items
//     if (enhancements.food && Array.isArray(enhancements.food)) {
//       transformed.food.items = enhancements.food.map((item) => ({
//         id: `food_${item.name.replace(/\s+/g, "_").toLowerCase()}`,
//         name: item.name,
//         base_price: item.unit_price,
//         selected_quantity: item.quantity,
//         value: 5, // Default tax value
//         value_type: "P", // Percentage
//         refundable: false,
//         tax_amount: item.tax_amount || 0,
//         total_amount: item.total_amount || 0,
//       }));
//     }

//     // Transform amenity items
//     if (enhancements.amenities && Array.isArray(enhancements.amenities)) {
//       transformed.amenities.items = enhancements.amenities.map((item) => ({
//         id: `amenity_${item.name.replace(/\s+/g, "_").toLowerCase()}`,
//         name: item.name,
//         base_price: item.unit_price,
//         selected_quantity: item.quantity,
//         value: 12, // Default tax value
//         value_type: "P", // Percentage
//         refundable: false,
//         tax_amount: item.tax_amount || 0,
//         total_amount: item.total_amount || 0,
//         urgency: item.urgency || "Normal",
//         instructions: item.instructions || null,
//       }));
//     }

//     // Transform room service items
//     if (enhancements.room_service && Array.isArray(enhancements.room_service)) {
//       transformed.room_services.items = enhancements.room_service.map(
//         (item) => ({
//           id: `room_service_${item.name.replace(/\s+/g, "_").toLowerCase()}`,
//           name: item.name,
//           base_price: item.unit_price,
//           selected_quantity: item.quantity,
//           value: 12, // Default tax value
//           value_type: "P", // Percentage
//           refundable: false,
//           tax_amount: item.tax_amount || 0,
//           total_amount: item.total_amount || 0,
//           urgency: item.urgency || "Normal",
//           instructions: item.instructions || null,
//         }),
//       );
//     }

//     return transformed;
//   };

//   // Transform guests array
//   const transformGuests = (guests, primaryGuest) => {
//     if (!guests || !Array.isArray(guests)) return [];

//     return guests.map((guest) => ({
//       guestid: guest.guestid,
//       firstname: guest.firstname,
//       lastname: guest.lastname,
//       emailid: guest.emailid,
//       countrycode: guest.countrycode,
//       phonenumber: guest.phonenumber,
//       clienttype: guest.clienttype,
//       is_primary: guest.guestid === primaryGuest?.guestid,
//     }));
//   };

//   // Calculate total final amount
//   const calculateTotalFinalAmount = (booking) => {
//     const roomAmount = booking.room_final_amount || 0;
//     const foodAmount = booking.enhancements_total?.food || 0;
//     const amenitiesAmount = booking.enhancements_total?.amenities || 0;
//     const roomServiceAmount = booking.enhancements_total?.room_service || 0;

//     return roomAmount + foodAmount + amenitiesAmount + roomServiceAmount;
//   };

//   return {
//     // Basic booking info
//     bookingid: apiBooking.bookingid,
//     orderid: apiBooking.orderid,
//     checkindate: apiBooking.checkindate,
//     checkoutdate: apiBooking.checkoutdate,
//     room_type: apiBooking.room_type,
//     room_number: apiBooking.room_number,
//     booking_status: apiBooking.booking_status,
//     special_requests: apiBooking.special_requests || "",
//     property_name: apiBooking.property_name,
//     number_of_guests: apiBooking.number_of_guests,
//     length_of_stay: apiBooking.length_of_stay,

//     // Guest information
//     guests: transformGuests(apiBooking.guests, apiBooking.primary_guest),

//     // ADD THIS - Additional guests from API
//     additional_guests: transformAdditionalGuests(apiBooking.additional_guests),

//     // Financial information
//     base_amount: apiBooking.base_amount,
//     tax_amount: apiBooking.tax_amount,
//     discount: apiBooking.discount || 0,
//     service_fee: apiBooking.service_fee || 0,
//     final_amount: apiBooking.final_amount,
//     payment_status: apiBooking.payment_status,
//     billing_status: apiBooking.billing_status,
//     total_paid: apiBooking.total_paid || apiBooking.paid_amount || 0,
//     total_due: apiBooking.total_due || apiBooking.due_amount || 0,
//     total_pending: apiBooking.total_pending || apiBooking.pending_amount || 0,

//     // Room charges
//     room_base_amount: apiBooking.room_base_amount,
//     room_tax_amount: apiBooking.room_tax_amount,
//     room_discount_amount: apiBooking.room_discount_amount || 0,
//     room_service_fee: apiBooking.room_service_fee || 0,
//     room_final_amount: apiBooking.room_final_amount,
//     room_source: apiBooking.room_source,
//     room_note: apiBooking.room_note,

//     // Enhancements
//     enhancements: apiBooking.enhancements || [],
//     enhancements_total: apiBooking.enhancements_total || {
//       amenities: 0,
//       room_service: 0,
//       food: 0,
//     },
//     enhancements_detailed: apiBooking.enhancements_detailed
//       ? transformEnhancements(apiBooking.enhancements_detailed)
//       : {
//           food: { items: [] },
//           amenities: { items: [] },
//           room_services: { items: [] },
//         },

//     // Additional fields for Redux compatibility
//     total_final_amount: calculateTotalFinalAmount(apiBooking),
//     corporate_discount_applied: apiBooking.corporate_discount_applied || false,
//     total_refund_amount: apiBooking.total_refund_amount || 0,
//     refunds: apiBooking.refunds || [],
//     pending_payments: apiBooking.pending_payments || [],

//     // Primary guest for easy access
//     primary_guest: apiBooking.primary_guest,
//   };
// };

// const ViewReservation = () => {
//   const [isPopupOpen, setIsPopupOpen] = useState(false);
//   const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
//   const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
//   const [cancellationReason, setCancellationReason] = useState("");
//   const [cancellationResponse, setCancellationResponse] = useState(null);
//   const [cancellingBooking, setCancellingBooking] = useState(null);
//   const [currentBooking, setCurrentBooking] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [activeTab, setActiveTab] = useState("UPCOMING");
//   const [bookings, setBookings] = useState({
//     upcoming: [],
//     current: [],
//     completed: [],
//     cancelled: [],
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hasReservations, setHasReservations] = useState(false);
//   const [sendingInvoice, setSendingInvoice] = useState(false);
//   const [expandedBookings, setExpandedBookings] = useState(new Set());
//   const bookingsPerPage = 2;
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [userEmail, setUserEmail] = useState("");

//   useEffect(() => {
//     const fetchBookings = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const userData = await getUserData();
//         console.log("User data retrieved:", userData);

//         if (!userData?.email && !userData?.phone) {
//           throw new Error("Could not retrieve user email or phone");
//         }

//         if (userData?.email) {
//           setUserEmail(userData.email);
//         }

//         // Try to fetch by email first if available
//         let apiUrl;
//         let response;
//         let data;
//         let foundBookings = false;

//         // Method 1: Try with email if available
//         if (userData?.email) {
//           console.log("Trying to fetch bookings with email:", userData.email);
//           apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?email=${encodeURIComponent(
//             userData.email,
//           )}&include_cancelled=true`;

//           response = await fetch(apiUrl, {
//             headers: {
//               Accept: "application/json",
//               Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
//             },
//           });

//           if (response.ok) {
//             data = await response.json();

//             // Check if we got bookings with this email
//             if (data.status === "success" && data.data) {
//               const hasBookings =
//                 (data.data.upcoming && data.data.upcoming.length > 0) ||
//                 (data.data.current && data.data.current.length > 0) ||
//                 (data.data.completed && data.data.completed.length > 0) ||
//                 (data.data.cancelled && data.data.cancelled.length > 0);

//               if (hasBookings) {
//                 console.log("Found bookings with email:", userData.email);
//                 processBookingsData(data);
//                 foundBookings = true;
//               }
//             }
//           }
//         }

//         // Method 2: If no bookings found with email and we have phone, try with phone
//         if (!foundBookings && userData?.phone) {
//           console.log("No bookings found with email, trying phone:", userData.phone);
//           apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?phone=${encodeURIComponent(
//             userData.phone
//           )}&include_cancelled=true`;

//           response = await fetch(apiUrl, {
//             headers: {
//               Accept: "application/json",
//               Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
//             },
//           });

//           if (response.ok) {
//             data = await response.json();
//             if (data.status === "success" && data.data) {
//               const hasBookings =
//                 (data.data.upcoming && data.data.upcoming.length > 0) ||
//                 (data.data.current && data.data.current.length > 0) ||
//                 (data.data.completed && data.data.completed.length > 0) ||
//                 (data.data.cancelled && data.data.cancelled.length > 0);

//               if (hasBookings) {
//                 console.log("Found bookings with phone:", userData.phone);
//                 processBookingsData(data);
//                 foundBookings = true;
//               }
//             }
//           }
//         }

//         // If both email and phone failed or no bookings found
//         if (!foundBookings) {
//           // Check if we have any data from either method
//           if (data && data.status === "success" && data.data) {
//             // This means the API call succeeded but returned empty arrays
//             const transformedBookings = {
//               upcoming: [],
//               current: [],
//               completed: [],
//               cancelled: [],
//             };

//             console.log("No bookings found with email or phone");
//             setBookings(transformedBookings);
//             setHasReservations(false);
//           } else {
//             throw new Error("No bookings found with email or phone");
//           }
//         }

//       } catch (err) {
//         console.error("Booking fetch error:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     // Helper function to process bookings data
//     const processBookingsData = (data) => {
//       if (data.status === "success" && data.data) {
//         const transformedBookings = {
//           upcoming: (data.data.upcoming || []).map(transformBookingData),
//           current: (data.data.current || []).map(transformBookingData),
//           completed: (data.data.completed || []).map(transformBookingData),
//           cancelled: (data.data.cancelled || []).map(transformBookingData),
//         };

//         console.log("Transformed Bookings:", transformedBookings);

//         setBookings(transformedBookings);

//         const hasAnyReservations =
//           transformedBookings.upcoming.length > 0 ||
//           transformedBookings.current.length > 0 ||
//           transformedBookings.completed.length > 0 ||
//           transformedBookings.cancelled.length > 0;

//         setHasReservations(hasAnyReservations);
//       } else {
//         throw new Error(data.message || "Failed to fetch bookings");
//       }
//     };

//     fetchBookings();
//   }, [cancellationResponse]);

//   // REMOVED: The auto-redirection useEffect - now we show message on the same page

//   const toggleExpanded = (bookingId) => {
//     setExpandedBookings((prev) => {
//       const newSet = new Set(prev);
//       if (newSet.has(bookingId)) {
//         newSet.delete(bookingId);
//       } else {
//         newSet.add(bookingId);
//       }
//       return newSet;
//     });
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, "0");
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const year = date.getFullYear();
//       return `${day}-${month}-${year}`;
//     } catch (error) {
//       console.error("Error formatting date:", dateString, error);
//       return dateString;
//     }
//   };

//   const formatDisplayDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const options = {
//         day: "numeric",
//         month: "short",
//         year: "2-digit",
//         weekday: "short",
//       };
//       return new Date(dateString).toLocaleDateString("en-US", options);
//     } catch (error) {
//       console.error("Error formatting display date:", dateString, error);
//       return dateString;
//     }
//   };

//   const formatCurrency = (amount) => {
//     const numAmount = parseFloat(amount) || 0;
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })
//       .format(numAmount)
//       .replace("₹", "₹ ");
//   };

//   const handleSendInvoice = async () => {
//     if (!currentBooking) return;

//     try {
//       setSendingInvoice(true);

//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/invoice/email/${
//           currentBooking.orderid
//         }?recipient_email=${encodeURIComponent(userEmail)}`,
//         {
//           method: "POST",
//           headers: {
//             accept: "application/json",
//           },
//         },
//       );

//       if (!response.ok) {
//         throw new Error(`Email sending failed with status ${response.status}`);
//       }

//       const data = await response.json();
//       setIsPopupOpen(false);
//     } catch (error) {
//       console.error("Error sending invoice:", error);
//       alert("Failed to send invoice. Please try again.");
//     } finally {
//       setSendingInvoice(false);
//     }
//   };

//   const handleConfirmCancellation = () => {
//     setIsConfirmationPopupOpen(false);
//     processCancellation();
//   };

//   // UPDATED: Modified cancellation function to match new API requirements
//   const processCancellation = async () => {
//     if (!cancellingBooking || !cancellationReason) return;

//     try {
//       setLoading(true);

//       // UPDATED: Removed cancel_all_pending as it's not required in the new API
//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/modify/${cancellingBooking.bookingid}/cancel`,
//         {
//           method: "POST",
//           headers: {
//             accept: "application/json",
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
//           },
//           body: JSON.stringify({
//             cancellation_reason: cancellationReason,
//             // REMOVED: cancel_all_pending as it's not in the new API request
//           }),
//         },
//       );

//       if (!response.ok) {
//         throw new Error(`Cancellation failed with status ${response.status}`);
//       }

//       const data = await response.json();

//       // Store the full response for debugging
//       console.log("Cancellation API Response:", data);

//       if (data.status === "success") {
//         // Handle successful cancellation with the new response format
//         setCancellationResponse({
//           ...data,
//           success: true,
//           // Backward compatibility fields
//           final_refund: data.data?.total_refund || 0,
//           refund_amount: data.data?.total_refund || 0,
//           cancellation_charges: data.data?.room_penalty || 0,
//           service_fee: data.data?.total_service_fee || 0,
//         });
//       } else {
//         // Handle error response
//         setCancellationResponse({
//           success: false,
//           message: data.message || "Cancellation failed",
//           status: "error",
//           data: {
//             total_refund: 0,
//             room_penalty: 0,
//             total_service_fee: 0,
//             net_impact: 0,
//           },
//         });
//       }
//     } catch (error) {
//       console.error("Cancellation error:", error);
//       setCancellationResponse({
//         success: false,
//         message: "Cancellation failed. Please try again.",
//         status: "error",
//         data: {
//           total_refund: 0,
//           room_penalty: 0,
//           total_service_fee: 0,
//           net_impact: 0,
//         },
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelBooking = () => {
//     if (!cancellationReason) {
//       alert("Please provide a cancellation reason.");
//       return;
//     }

//     setIsConfirmationPopupOpen(true);
//   };

//   const resetCancellationFlow = () => {
//     setCancellationReason("");
//     setCancellationResponse(null);
//     setCancellingBooking(null);
//     setIsCancelPopupOpen(false);
//     setIsConfirmationPopupOpen(false);

//     // Refresh bookings after cancellation
//     if (cancellationResponse?.success) {
//       // Trigger a refresh of bookings data
//       const fetchBookings = async () => {
//         try {
//           const userData = await getUserData();
//           if (userData?.email || userData?.phone) {
//             let apiUrl;

//             // Try email first
//             if (userData.email) {
//               apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?email=${encodeURIComponent(
//                 userData.email,
//               )}&include_cancelled=true`;
//             } else if (userData.phone) {
//               apiUrl = `${CQ_BASE_URL}/bq/api/guest/categorized?phone=${encodeURIComponent(
//                 userData.phone
//               )}&include_cancelled=true`;
//             }

//             if (apiUrl) {
//               const response = await fetch(apiUrl, {
//                 headers: {
//                   Accept: "application/json",
//                   Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
//                 },
//               });

//               if (response.ok) {
//                 const data = await response.json();
//                 if (data.status === "success" && data.data) {
//                   const transformedBookings = {
//                     upcoming: (data.data.upcoming || []).map(transformBookingData),
//                     current: (data.data.current || []).map(transformBookingData),
//                     completed: (data.data.completed || []).map(transformBookingData),
//                     cancelled: (data.data.cancelled || []).map(transformBookingData),
//                   };
//                   setBookings(transformedBookings);
//                 }
//               }
//             }
//           }
//         } catch (err) {
//           console.error("Error refreshing bookings after cancellation:", err);
//         }
//       };
//       fetchBookings();
//     }
//   };

//   const CancellationPolicyCard = ({ booking }) => {
//     const primaryGuest = booking?.guests?.find((g) => g.is_primary);

//     return (
//       <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
//         <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
//           <h3 className="text-sm font-medium text-gray-700 flex items-center">
//             <FiInfo className="mr-2 text-blue-500" />
//             Reservation Details
//           </h3>
//         </div>
//         <div className="p-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
//                 Guest Information
//               </h4>
//               <div className="flex items-start">
//                 <FiUser className="mt-1 mr-2 text-gray-400 flex-shrink-0" />
//                 <div>
//                   <p className="font-medium text-gray-900">
//                     {primaryGuest?.firstname} {primaryGuest?.lastname}
//                   </p>
//                   {primaryGuest?.emailid && (
//                     <p className="text-xs text-gray-500">
//                       {primaryGuest.emailid}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div>
//               <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
//                 Stay Details
//               </h4>
//               <div className="space-y-1">
//                 <div className="flex items-center">
//                   <FiCalendar className="mr-2 text-gray-400 flex-shrink-0" />
//                   <span className="text-sm">
//                     {formatDate(booking.checkindate)} to{" "}
//                     {formatDate(booking.checkoutdate)}
//                   </span>
//                 </div>
//                 <div className="flex items-center">
//                   <FiUsers className="mr-2 text-gray-400 flex-shrink-0" />
//                   <span className="text-sm">
//                     {booking.number_of_guests || 1} guest
//                     {booking.number_of_guests !== 1 ? "s" : ""}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 pt-4 border-t border-gray-200">
//             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
//               Cancellation Policy
//             </h4>
//             <ul className="text-sm text-gray-600 space-y-2">
//               <li className="flex items-start">
//                 <span className="text-red-500 mr-2">•</span>
//                 Cancellations must be made at least 24 hours prior to arrival to
//                 avoid a penalty of one night's room rate plus tax. No-shows will
//                 be charged the full reservation amount.
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderGuestInfo = (guests) => {
//     if (!guests || guests.length === 0) return null;

//     const primaryGuest = guests.find((g) => g.is_primary);
//     const additionalGuests = guests.filter((g) => !g.is_primary);

//     return (
//       <div className="mt-4 border-t pt-3">
//         <div className="flex items-center mb-2">
//           <FiUser className="mr-2 text-gray-500" />
//           <span className="font-medium">Primary Guest:</span>
//           <span className="ml-2">
//             {primaryGuest?.firstname} {primaryGuest?.lastname}
//           </span>
//         </div>

//         {additionalGuests.length > 0 && (
//           <div className="mt-2">
//             <div className="flex items-center mb-2">
//               <FiUserPlus className="mr-2 text-gray-500" />
//               <span className="font-medium">Additional Guests:</span>
//             </div>
//             <ul className="ml-6 list-disc text-transform: capitalize">
//               {additionalGuests.map((guest, index) => (
//                 <li key={index}>
//                   {guest.firstname} {guest.lastname}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderEnhancements = (enhancements, booking) => {
//     if (!enhancements || typeof enhancements !== "object") return null;

//     // Helper function to calculate tax for an item
//     const calculateItemTax = (item) => {
//       return item.tax_amount || 0;
//     };

//     const formatCurrencyWithDecimals = (amount) => {
//       const numAmount = parseFloat(amount) || 0;
//       return new Intl.NumberFormat("en-IN", {
//         style: "currency",
//         currency: "INR",
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })
//         .format(numAmount)
//         .replace("₹", "₹ ");
//     };

//     // Get tax info based on item properties
//     const getTaxInfo = (item) => {
//       if (item.tax_amount && item.tax_amount > 0) {
//         return {
//           hasTax: true,
//           message: "Including taxes",
//         };
//       }
//       return {
//         hasTax: false,
//         message: "No taxes applied",
//       };
//     };

//     return (
//       <div className="mt-4 border-t pt-3">
//         <div className="mb-3">
//           <h4 className="font-medium mb-2">Room Charges:</h4>
//           <div className="ml-4 space-y-1">
//             <div className="flex justify-between">
//               <span>
//                 {booking.room_type} x {booking.length_of_stay} day(s)
//               </span>
//               <div className="flex flex-col items-end">
//                 <span>
//                   {formatCurrencyWithDecimals(booking.room_final_amount)}
//                 </span>
//                 <span className="text-[9px] text-gray-500">
//                   Including taxes and fees
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Display enhancements if they exist */}
//         {(enhancements.food?.items?.length > 0 ||
//           enhancements.amenities?.items?.length > 0 ||
//           enhancements.room_services?.items?.length > 0) && (
//           <div>
//             <h4 className="font-medium mb-2">Additional Enhancements:</h4>
//             <div className="space-y-3">
//               {enhancements.food?.items?.length > 0 && (
//                 <div>
//                   <h5 className="text-sm font-medium text-gray-700">
//                     Food Items:
//                   </h5>
//                   <ul className="ml-4 space-y-2">
//                     {enhancements.food.items.map((item, i) => {
//                       const itemFinalAmount = item.total_amount || 0;
//                       const taxInfo = getTaxInfo(item);

//                       return (
//                         <li key={i} className="flex justify-between">
//                           <span className="text-sm">
//                             {item.name} (x{item.selected_quantity})
//                           </span>
//                           <div className="flex flex-col items-end">
//                             <span className="font-medium">
//                               {formatCurrencyWithDecimals(itemFinalAmount)}
//                             </span>
//                             <span className="text-[10px] text-gray-500">
//                               {taxInfo.message}
//                             </span>
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               )}

//               {enhancements.amenities?.items?.length > 0 && (
//                 <div>
//                   <h5 className="text-sm font-medium text-gray-700">
//                     Amenities:
//                   </h5>
//                   <ul className="ml-4 space-y-2">
//                     {enhancements.amenities.items.map((item, i) => {
//                       const itemFinalAmount = item.total_amount || 0;
//                       const taxInfo = getTaxInfo(item);

//                       return (
//                         <li key={i} className="flex justify-between">
//                           <span className="text-sm">
//                             {item.name} (x{item.selected_quantity})
//                           </span>
//                           <div className="flex flex-col items-end">
//                             <span className="font-medium">
//                               {formatCurrencyWithDecimals(itemFinalAmount)}
//                             </span>
//                             <span className="text-[10px] text-gray-500">
//                               {taxInfo.message}
//                             </span>
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               )}

//               {enhancements.room_services?.items?.length > 0 && (
//                 <div>
//                   <h5 className="text-sm font-medium text-gray-700">
//                     Room Services:
//                   </h5>
//                   <ul className="ml-4 space-y-2">
//                     {enhancements.room_services.items.map((item, i) => {
//                       const itemFinalAmount = item.total_amount || 0;
//                       const taxInfo = getTaxInfo(item);

//                       return (
//                         <li key={i} className="flex justify-between">
//                           <span className="text-sm">
//                             {item.name} (x{item.selected_quantity})
//                           </span>
//                           <div className="flex flex-col items-end">
//                             <span className="font-medium">
//                               {formatCurrencyWithDecimals(itemFinalAmount)}
//                             </span>
//                             <span className="text-[10px] text-gray-500">
//                               {taxInfo.message}
//                             </span>
//                           </div>
//                         </li>
//                       );
//                     })}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const getBookingStatusDisplay = (booking) => {
//     const status = booking.booking_status?.toLowerCase();
//     const payment = booking.payment_status?.toLowerCase();

//     if (status === "soft") {
//       return payment !== "paid" ? "Reserved (Payment Required)" : "Reserved";
//     }

//     if (status === "hard") {
//       return "Checked In";
//     }

//     if (status === "checkedout") {
//       return "Completed";
//     }

//     return (
//       booking.booking_status
//         ?.replace(/_/g, " ")
//         ?.replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown"
//     );
//   };

//   const getFilteredBookings = () => {
//     switch (activeTab) {
//       case "UPCOMING":
//         return bookings.upcoming;
//       case "CURRENT":
//         return bookings.current;
//       case "COMPLETED":
//         return bookings.completed;
//       case "CANCELLED":
//         return bookings.cancelled;
//       default:
//         return [];
//     }
//   };

//   const filteredBookings = getFilteredBookings();
//   const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
//   const paginatedBookings = filteredBookings.slice(
//     (currentPage - 1) * bookingsPerPage,
//     currentPage * bookingsPerPage,
//   );

//   const isCheckinDatePassed = (checkinDate) => {
//     if (!checkinDate) return false;
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const checkin = new Date(checkinDate);
//       checkin.setHours(0, 0, 0, 0);

//       return checkin < today;
//     } catch (error) {
//       console.error("Error checking checkin date:", checkinDate, error);
//       return false;
//     }
//   };

//   const isPastBooking = (checkoutDate) => {
//     if (!checkoutDate) return false;
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       const checkout = new Date(checkoutDate);
//       checkout.setHours(0, 0, 0, 0);

//       return checkout < today;
//     } catch (error) {
//       console.error("Error checking checkout date:", checkoutDate, error);
//       return false;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-gray-900"></div>
//       </div>
//     );
//   }

//   const formatToTwoDecimal = (value) => {
//     if (value === null || value === undefined || isNaN(value)) return "0.00";
//     return Number(parseFloat(value) || 0).toFixed(2);
//   };

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
//         <AiOutlineWarning className="text-red-500 text-5xl mb-4" />
//         <h1 className="text-2xl font-bold mb-2">Unable to load reservations</h1>
//         <p className="text-gray-600 mb-6">
//           {error === "No bookings found with email or phone"
//             ? "No reservations found with your email or phone number. Please check your contact information or make a new reservation."
//             : error}
//         </p>
//         <button
//           onClick={() => window.location.reload()}
//           className="px-4 py-2 bg-black text-white rounded hover:text-gray-300"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   // Helper function to get policy category description
//   const getPolicyCategoryDescription = (category) => {
//     switch(category) {
//       case 1: return "Free Cancellation";
//       case 2: return "Moderate Cancellation Policy";
//       case 3: return "Restricted Cancellation Policy";
//       case 4: return "Non-Refundable";
//       default: return "Standard Policy";
//     }
//   };

//   // Helper function to get financial type description
//   const getFinancialTypeDescription = (type) => {
//     const descriptions = {
//       "cancellation_charge_1night_unpaid": "1-night cancellation charge (unpaid booking)",
//       "cancellation_charge_1night": "1-night cancellation charge",
//       "free_cancellation_unpaid": "Free cancellation (unpaid booking)",
//       "full_refund": "Full refund",
//       "non_refundable_no_refund": "Non-refundable",
//       "frozen_no_refund": "Frozen - no refund"
//     };
//     return descriptions[type] || type;
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-4 ">
//       <div className="flex items-center justify-between mb-8 mt-10">
//         <h1 className="text-2xl font-bold">Manage your reservations</h1>
//         <button
//           onClick={() => navigate("/walk-in/room-reservation")}
//           className="flex items-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
//         >
//           <FiHome className="mr-2" /> New Reservation
//         </button>
//       </div>

//       <div className="flex border-b mb-6 overflow-x-auto">
//         {["UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].map((tab) => (
//           <button
//             key={tab}
//             className={`px-4 py-2 whitespace-nowrap ${
//               activeTab === tab
//                 ? "border-b-2 border-black font-medium"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//             onClick={() => {
//               setActiveTab(tab);
//               setCurrentPage(1);
//               setExpandedBookings(new Set());
//             }}
//           >
//             {tab.charAt(0) + tab.slice(1).toLowerCase()}
//           </button>
//         ))}
//       </div>

//       {/* Show message when there are no reservations */}
//       {!hasReservations ? (
//         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border">
//           <div className="bg-gray-100 rounded-full p-6 mb-6">
//             <FiCalendar className="text-gray-400 text-5xl" />
//           </div>
//           <h2 className="text-2xl font-semibold text-gray-800 mb-3">
//             No Reservations Found
//           </h2>
//           <p className="text-gray-500 text-center mb-8 max-w-md">
//             You don't have any reservations yet. Start your journey with us by creating a new reservation.
//           </p>
//           <button
//             onClick={() => navigate("/walk-in/room-reservation")}
//             className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 flex items-center gap-2 shadow-md"
//           >
//             <FiHome className="text-lg" />
//             Make a Reservation
//           </button>
//         </div>
//       ) : paginatedBookings.length > 0 ? (
//         <>
//           <div className="space-y-4">
//             {paginatedBookings.map((booking) => {
//               const isExpanded = expandedBookings.has(booking.bookingid);
//               const allowModify =
//                 booking.booking_status?.toLowerCase() === "soft" &&
//                 !isPastBooking(booking.checkoutdate) &&
//                 !isCheckinDatePassed(booking.checkindate);

//               return (
//                 <div
//                   key={booking.bookingid}
//                   className="border rounded-lg overflow-hidden bg-white transition-all duration-300"
//                 >
//                   <div
//                     className="p-4 cursor-pointer"
//                     onClick={() => toggleExpanded(booking.bookingid)}
//                   >
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="flex items-center justify-between mb-2">
//                           <h3 className="font-semibold text-lg">
//                             {booking.room_type || "Unknown Room Type"}
//                           </h3>
//                           <div className="text-right">
//                             <span className="flex items-center text-lg font-medium">
//                               ₹
//                               {formatToTwoDecimal(
//                                 booking.net_billed ||
//                                   booking.final_amount,
//                               )}
//                             </span>
//                             <span className="flex items-center text-xs text-gray-500">
//                               Including taxes
//                             </span>
//                           </div>
//                         </div>

//                         <p className="text-sm text-gray-500 mb-3">
//                           Reservation Number: {booking.orderid}
//                         </p>

//                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                           <div>
//                             <p className="text-xs text-gray-500">Check-in</p>
//                             <p className="font-medium">
//                               {formatDate(booking.checkindate)}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-xs text-gray-500">Check-out</p>
//                             <p className="font-medium">
//                               {formatDate(booking.checkoutdate)}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-xs text-gray-500">
//                               Number of nights
//                             </p>
//                             <p className="font-medium">
//                               {booking.length_of_stay || 1}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-xs text-gray-500">Status</p>
//                             <div className="flex items-center whitespace-nowrap">
//                               {activeTab === "CANCELLED" ? (
//                                 <span className="text-red-600 font-medium text-sm">
//                                   Cancelled
//                                 </span>
//                               ) : activeTab === "COMPLETED" ? (
//                                 <>
//                                   <FiCheckCircle className="text-green-500 mr-1" />
//                                   <span className="text-green-600 font-medium text-sm">
//                                     Completed
//                                   </span>
//                                 </>
//                               ) : (
//                                 <span className="font-medium text-sm">
//                                   {getBookingStatusDisplay(booking)}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="ml-4 flex items-center">
//                         <button className="text-gray-500 hover:text-gray-700 p-2">
//                           {isExpanded ? (
//                             <FiChevronUp size={20} />
//                           ) : (
//                             <FiChevronDown size={20} />
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   {isExpanded && (
//                     <div className="border-t px-4 py-4 animate-slideDown">
//                       <div className="mb-4">
//                         <p className="text-xs text-gray-500">Property</p>
//                         <p className="font-medium">{booking.property_name}</p>
//                       </div>

//                       {renderGuestInfo(booking.guests)}

//                       {booking.enhancements_detailed &&
//                         renderEnhancements(
//                           booking.enhancements_detailed,
//                           booking,
//                         )}
//                     </div>
//                   )}

//                   <div className="px-4 py-4 flex justify-between items-center">
//                     <div>
//                       {activeTab === "COMPLETED" && (
//                         <button
//                           className="text-black flex items-center hover:text-gray-500 px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setCurrentBooking(booking);
//                             setIsPopupOpen(true);
//                           }}
//                         >
//                           <FiDownload className="mr-2" /> Download Invoice
//                         </button>
//                       )}
//                     </div>

//                     <div>
//                       {(activeTab === "UPCOMING" ||
//                         activeTab === "CURRENT") && (
//                         <div className="space-x-2 flex">
//                           {allowModify && (
//                             <button
//                               className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 // Pass ALL booking data including additional_guests to Redux
//                                 const bookingWithAdditionalGuests = {
//                                   ...booking,
//                                   // Ensure additional_guests is included
//                                   additional_guests: booking.additional_guests || []
//                                 };

//                                 dispatch(setSelectedBooking(bookingWithAdditionalGuests));
//                                 localStorage.setItem(
//                                   "selectedBooking",
//                                   JSON.stringify(bookingWithAdditionalGuests)
//                                 );
//                                 navigate(
//                                   "/edit-reservation/update-roomdetails",
//                                 );
//                               }}
//                             >
//                               Modify Reservation
//                             </button>
//                           )}
//                           {booking.booking_status?.toLowerCase() !== "hard" && (
//                             <button
//                               className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setCancellingBooking(booking);
//                                 setIsCancelPopupOpen(true);
//                               }}
//                             >
//                               Cancel Reservation
//                             </button>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {totalPages > 1 && (
//             <div className="flex justify-between items-center mt-6">
//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//                 className={`flex items-center px-4 py-2 rounded ${
//                   currentPage === 1
//                     ? "bg-gray-200 cursor-not-allowed"
//                     : "bg-gray-100 hover:bg-gray-200"
//                 }`}
//               >
//                 <FiArrowLeft className="mr-2" /> Previous
//               </button>
//               <span>
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() =>
//                   setCurrentPage((p) => Math.min(p + 1, totalPages))
//                 }
//                 className={`flex items-center px-4 py-2 rounded ${
//                   currentPage === totalPages
//                     ? "bg-gray-200 cursor-not-allowed"
//                     : "bg-gray-100 hover:bg-gray-200"
//                 }`}
//               >
//                 Next <FiArrowLeft className="ml-2 rotate-180" />
//               </button>
//             </div>
//           )}
//         </>
//       ) : (
//         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border">
//           <AiOutlineWarning className="text-yellow-500 text-4xl mb-4" />
//           <h2 className="text-xl font-semibold mb-2">
//             No {activeTab.toLowerCase()} reservations found
//           </h2>
//           <p className="text-gray-600 mb-4">
//             You don't have any {activeTab.toLowerCase()} reservation at this
//             time.
//           </p>
//           <button
//             onClick={() => navigate("/walk-in/room-reservation")}
//             className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
//           >
//             Reserve a Room
//           </button>
//         </div>
//       )}

//       {/* Confirmation Popup */}
//       {isConfirmationPopupOpen && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all duration-300 ">
//             <div className="text-center mb-6">
//               <AiOutlineWarning className="mx-auto text-red-600 text-6xl mb-4 animate-pulse" />
//               <h3 className="text-2xl font-bold text-gray-900 mb-3">
//                 Confirm Cancellation
//               </h3>
//               <p className="text-gray-900 text-lg leading-relaxed">
//                 Are you sure you want to cancel your reservation? <br />
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-left">
//                   <div className="flex items-start">
//                     <FiInfo className="text-black mt-0.5 mr-2 flex-shrink-0" />
//                     <div>
//                       <p className="text-black font-medium text-sm mb-1">
//                         Cancellation Information
//                       </p>
//                       <p className="text-black text-sm">
//                         • All pending services will be automatically cancelled<br />
//                         • Refundable amounts will be processed within 5-7 business days<br />
//                         • Cancellation charges will apply as per policy
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </p>
//             </div>

//             <div className="flex justify-end space-x-4">
//               <button
//                 onClick={() => setIsConfirmationPopupOpen(false)}
//                 className="px-6 py-2 rounded-lg text-sm font-medium border  text-white bg-black hover:text-gray-300 hover:border-gray-400 transition-all shadow-sm"
//               >
//                 No, Keep Reservation
//               </button>
//               <button
//                 onClick={handleConfirmCancellation}
//                 className="px-6 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:text-gray-300 shadow-md hover:shadow-lg transition-all"
//               >
//                 Yes, Cancel Reservation
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Invoice Download Popup */}
//       {isPopupOpen && currentBooking && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
//             <button
//               onClick={() => setIsPopupOpen(false)}
//               className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition"
//             >
//               <FiX size={26} />
//             </button>

//             <div className="text-center mb-6">
//               <div className="mx-auto flex items-center justify-center h-16 w-16 bg-black rounded-full shadow-md mb-4">
//                 <FiFileText className="text-white text-3xl" />
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 Your payment receipt is ready
//               </h2>
//             </div>

//             <div className="text-center mb-6 px-2">
//               <p className="text-gray-500 leading-relaxed text-sm">
//                 Your payment receipt will be sent to{" "}
//                 <span className="font-medium text-gray-700">{userEmail}</span>
//                 {". "}
//               </p>
//             </div>

//             <div className="flex items-center justify-center gap-4 w-full">
//               <button
//                 onClick={handleSendInvoice}
//                 disabled={sendingInvoice}
//                 className={`w-full bg-black text-white font-medium py-3 rounded-md shadow-md transition ${
//                   sendingInvoice
//                     ? "opacity-70 cursor-not-allowed"
//                     : "hover:text-gray-300"
//                 }`}
//               >
//                 <div className="flex items-center justify-center gap-2">
//                   {sendingInvoice ? (
//                     <>
//                       <svg
//                         className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       <span>Sending...</span>
//                     </>
//                   ) : (
//                     <>
//                       <FiDownload className="text-lg" />
//                       <span>Send</span>
//                     </>
//                   )}
//                 </div>
//               </button>

//               <button
//                 onClick={() => setIsPopupOpen(false)}
//                 className="w-full bg-red-500 text-white font-medium py-3 rounded-md shadow-md hover:text-gray-200 transition"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Cancellation Popup - UPDATED FOR NEW API RESPONSE */}
//       {isCancelPopupOpen && cancellingBooking && !isConfirmationPopupOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
//           <div
//             className="bg-white rounded-2xl relative overflow-hidden shadow-2xl max-w-lg w-full"
//             style={{
//               maxHeight: "90vh",
//               display: "flex",
//               flexDirection: "column",
//             }}
//           >
//             <button
//               onClick={resetCancellationFlow}
//               className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-2 rounded-full transition-colors z-10 bg-white/80"
//             >
//               <FiX className="h-5 w-5" />
//             </button>

//             <div className="overflow-y-auto flex-1">
//               {cancellationResponse ? (
//                 <div className="p-6">
//                   {/* Success Header */}
//                   <div className="text-center mb-8">
//                     <div className="mx-auto mb-4">
//                       {cancellationResponse.success ? (
//                         <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//                           <FiCheckCircle className="h-10 w-10 text-green-600" />
//                         </div>
//                       ) : (
//                         <AiOutlineWarning className="mx-auto text-red-600 text-6xl mb-4" />
//                       )}
//                     </div>
//                     <h3 className="text-2xl font-bold text-gray-900 mb-2">
//                       {cancellationResponse.success
//                         ? "Reservation Cancelled Successfully"
//                         : "Cancellation Failed"}
//                     </h3>
//                     <p className="text-gray-600 mb-6">
//                       {cancellationResponse.message}
//                     </p>

//                     {/* Reservation Number Badge */}
//                     <div className="inline-flex flex-col items-center px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
//                       <p className="text-xs text-gray-500 font-medium mb-1">
//                         RESERVATION NUMBER
//                       </p>
//                       <p className="text-lg font-mono font-bold text-gray-900">
//                         {cancellationResponse.data?.booking_id || cancellingBooking.orderid}
//                       </p>
//                     </div>
//                   </div>

//                   {/* UPDATED: Display the new API response format */}
//                   {cancellationResponse.success && cancellationResponse.data && (
//                     <div className="space-y-6">

//                       {/* Financial Breakdown */}
//                       <div className="space-y-4">
//                         <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
//                           Financial Summary
//                         </h4>

//                         {/* Room Charges */}
//                         <div className="space-y-3">
//                           <div className="flex justify-between items-center">
//                             <div>
//                               <span className="text-gray-700">Cancellation Charges</span>
//                             </div>
//                             <span className="font-semibold text-red-600">
//                               ₹{formatToTwoDecimal(cancellationResponse.data.room_penalty)}
//                             </span>
//                           </div>

//                           {/* Refund Breakdown */}
//                           <div className="">
//                             <div className="flex justify-between items-center mb-2">
//                               <span className="text-gray-700">Additional Service Refunds</span>
//                               <span className="font-semibold text-gray-950">
//                                 ₹{formatToTwoDecimal(cancellationResponse.data.service_refund)}
//                               </span>
//                             </div>

//                             {cancellationResponse.data.non_refundable_service_retained > 0 && (
//                               <div className="flex justify-between items-center mt-1 text-sm">
//                                 <span className="text-gray-600">Non-refundable services retained</span>
//                                 <span className="text-red-500">
//                                   ₹{formatToTwoDecimal(cancellationResponse.data.non_refundable_service_retained)}
//                                 </span>
//                               </div>
//                             )}
//                           </div>

//                           {/* Totals */}
//                           <div className="space-y-2 pt-4 border-t border-gray-200">
//                             <div className="flex justify-between items-center">
//                               <span className="text-gray-700 font-medium">Total Refund</span>
//                               <span className="text-xl font-bold text-green-600">
//                                 ₹{formatToTwoDecimal(cancellationResponse.data.total_refund)}
//                               </span>
//                             </div>

//                           </div>
//                         </div>
//                       </div>

//                       {/* Final Message */}
//                       <div className={`p-4 rounded-lg border ${
//                         cancellationResponse.data.total_refund > 0
//                           ? 'bg-green-50 border-green-200'
//                           : 'bg-gray-50 border-gray-200'
//                       }`}>
//                         <div className="flex justify-between items-center mb-2">
//                           <span className="font-bold text-gray-900 text-lg">
//                             {cancellationResponse.data.total_refund > 0
//                               ? "Final Refund Amount"
//                               : "No Refund Applicable"}
//                           </span>
//                           <span className={`text-2xl font-bold ${
//                             cancellationResponse.data.total_refund > 0
//                               ? 'text-green-600'
//                               : 'text-gray-600'
//                           }`}>
//                             ₹{formatToTwoDecimal(cancellationResponse.data.total_refund)}
//                           </span>
//                         </div>
//                         <p className="text-sm text-gray-700 flex items-start">
//                           <FiInfo className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
//                           {cancellationResponse.data.total_refund > 0
//                             ? "This amount will be refunded to your original payment method within 5-7 business days. All pending services have been cancelled."
//                             : "No refund applicable as per cancellation policy. All pending services have been cancelled."}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 /* Cancellation Form */
//                 <div className="max-w-2xl mx-auto w-full">
//                   {/* Header */}
//                   <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-50 border-b border-gray-200">
//                     <h3 className="text-2xl font-bold text-gray-900 mb-3">
//                       Cancel Reservation
//                     </h3>
//                   </div>

//                   {/* Content */}
//                   <div className="px-6 py-4">
//                     <CancellationPolicyCard booking={cancellingBooking} />

//                     <div className="mt-6 space-y-4">
//                       <div>
//                         <label className="block text-sm font-semibold text-gray-700 mb-2">
//                           Reason for Cancellation *
//                         </label>
//                         <textarea
//                           rows={4}
//                           className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all placeholder:text-sm"
//                           placeholder="Please share your reason for cancelling this reservation. This helps us improve our services."
//                           value={cancellationReason}
//                           onChange={(e) =>
//                             setCancellationReason(e.target.value)
//                           }
//                           required
//                         />
//                         <p className="text-xs text-gray-500 mt-1">
//                           Your feedback is valuable to us. Please provide
//                           specific details if possible.
//                         </p>
//                       </div>

//                       {/* Cancellation Information */}
//                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//                         <div className="flex items-start">
//                           <AiOutlineWarning className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
//                           <div>
//                             <p className="font-sm text-yellow-800 mb-1">
//                               Important Information
//                             </p>
//                             <p className="text-sm text-yellow-700">
//                               • All pending services (amenities, room services, food orders) will be automatically cancelled<br />
//                               • Cancellation charges will apply as per policy<br />
//                               • Refundable amounts will be processed within 5-7 business days<br />
//                               • A detailed breakdown will be shown after cancellation
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Action Buttons */}
//             {!cancellationResponse ? (
//               <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
//                 <button
//                   onClick={resetCancellationFlow}
//                   className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
//                 >
//                   Go Back
//                 </button>
//                 <button
//                   onClick={handleCancelBooking}
//                   disabled={!cancellationReason || loading}
//                   className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
//                     !cancellationReason || loading
//                       ? "bg-gray-400 cursor-not-allowed"
//                       : "bg-red-600 hover:bg-red-700 shadow-lg"
//                   }`}
//                 >
//                   {loading ? (
//                     <span className="flex items-center justify-center">
//                       <svg
//                         className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : (
//                     "Confirm Cancellation"
//                   )}
//                 </button>
//               </div>
//             ) : (
//               <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
//                 <button
//                   onClick={resetCancellationFlow}
//                   className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg"
//                 >
//                   Close
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ViewReservation;
