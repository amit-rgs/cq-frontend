import React, { useState, useEffect } from 'react';
import { FiInfo } from 'react-icons/fi';
import { FiChevronRight, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import SpecialRequest from './SpecialRequest';
import { ImCheckmark } from 'react-icons/im';
import { MdOutlineBedroomChild } from 'react-icons/md';
import LegalDocumentsPopup from './LegalDocumentsPop';
import CancellationPolicy from './CancellationPolicy';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// const REACT_APP_RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const countries = [
  { name: 'India', code: 'IN', flag: 'https://flagcdn.com/w320/in.png' },
  {
    name: 'United States',
    code: 'US',
    flag: 'https://flagcdn.com/w320/us.png',
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    flag: 'https://flagcdn.com/w320/gb.png',
  },
  { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/w320/au.png' },
  { name: 'Canada', code: 'CA', flag: 'https://flagcdn.com/w320/ca.png' },
  { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/w320/jp.png' },
];

const PaymentPage = () => {
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState('Leisure');
  const [countryCode, setCountryCode] = useState('+91');
  const [guestValidationErrors, setGuestValidationErrors] = useState({});
  const [popupOpen, setPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reservationPopupOpen, setReservationPopupOpen] = useState(false);
  const [reservationMessage, setReservationMessage] = useState('');
  const [reservationError, setReservationError] = useState(null);
  const [reservationId, setReservationId] = useState('');
  const [specialRequestOpen, setSpecialRequestOpen] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [checkboxError, setCheckboxError] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.name === 'India') || countries[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Acme Corporation');
  const [companyId, setCompanyId] = useState('CORP12345');
  const [isCorporateGuest, setIsCorporateGuest] = useState(false);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
  });
  const [guestErrors, setGuestErrors] = useState([]);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [unifiedBillingId, setUnifiedBillingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLegalPopup, setShowLegalPopup] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAddGuestCountry, setSelectedAddGuestCountry] = useState(countries[0]);
  const [guestDropdownStates, setGuestDropdownStates] = useState({});

  // Data from localStorage
  const [bookingData, setBookingData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [enhancedStayItems, setEnhancedStayItems] = useState(null);
  const [formDetails, setFormDetails] = useState(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      // Get checkin data
      const checkin = localStorage.getItem('checkin');
      const checkout = localStorage.getItem('checkout');
      const adults = parseInt(localStorage.getItem('adults')) || 0;
      const children = parseInt(localStorage.getItem('children')) || 0;
      const childAges = JSON.parse(localStorage.getItem('childAges') || '[]');
      const rooms = parseInt(localStorage.getItem('rooms')) || 0;

      // Get selected room data
      const selectedRoomStr = localStorage.getItem('selectedRoom');
      const selectedRoomData = selectedRoomStr ? JSON.parse(selectedRoomStr) : null;

      // Get enhanced stay items
      const enhancedStayItemsStr = localStorage.getItem('enhancedStayItems');
      const enhancedStayItemsData = enhancedStayItemsStr ? JSON.parse(enhancedStayItemsStr) : null;

      // Calculate days count
      let daysCount = 0;
      if (checkin && checkout) {
        const checkInDate = new Date(checkin);
        const checkOutDate = new Date(checkout);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        daysCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      // Set form details
      const formDetails = {
        rooms: rooms,
        adults: adults,
        children: children,
        infants: 0, // Not in localStorage, default to 0
        childrenAges: childAges,
      };

      // Set booking data
      const bookingData = {
        checkInDate: checkin,
        checkOutDate: checkout,
        daysCount: daysCount || 1,
      };

      setBookingData(bookingData);
      setSelectedRoom(selectedRoomData);
      setEnhancedStayItems(enhancedStayItemsData);
      setFormDetails(formDetails);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        toast.error('Error loading Razorpay script. Please try again.');
      };
      document.body.appendChild(script);
    };

    if (!window.Razorpay) {
      loadRazorpayScript();
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const validateName = (value) => {
    const trimmed = value.trim();

    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 60) {
      return 'Name cannot exceed 60 characters';
    }

    if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
      const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
      if (invalidChars) {
        return `Names cannot have digits`;
      }
      return "Only letters, spaces, hyphens (-) and apostrophes (') are allowed";
    }

    if (/['-]{2,}/.test(trimmed)) {
      return "Cannot have consecutive special characters (-- or '')";
    }
    if (/^['-]/.test(trimmed)) {
      return 'Only letters are allowed (no special characters)';
    }
    if (/['-]$/.test(trimmed)) {
      return 'Only letters are allowed (no special characters)';
    }

    const words = trimmed.split(/\s+/);
    for (const word of words) {
      if (word.length > 20) {
        return `"${word}" is too long (max 20 letters)`;
      }
      if (word.length < 2 && /[A-Za-z]/.test(word)) {
        return `"${word}" is too short (min 2 letters)`;
      }
    }

    if (trimmed.includes('  ')) {
      return 'Cannot have multiple spaces between words';
    }

    return '';
  };

  const validatePhone = (number) => /^\d{10}$/.test(number);
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const toggleGuestDropdown = (index) => {
    setGuestDropdownStates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const togglePopup = () => setPopupOpen(!popupOpen);

  const countryCodes = [
    { code: '+91' },
    { code: '+1' },
    { code: '+44' },
    { code: '+61' },
    { code: '+81' },
  ];
  const countryCodeEnum = countryCodes.map((item) => item.code);

  const handleClientTypeChange = (e) => {
    const newClientType = e.target.value;
    setClientType(newClientType);

    if (newClientType === 'Corporate' && companyId && companyName) {
      setIsCorporateGuest(true);
    } else if (newClientType === 'Leisure') {
      setIsCorporateGuest(false);
    }
  };

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    const error = validateName(value);
    setErrors((prev) => ({ ...prev, firstName: error }));
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    const error = validateName(value);
    setErrors((prev) => ({ ...prev, lastName: error }));
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    setErrors((prev) => ({
      ...prev,
      phoneNumber: validatePhone(value) ? '' : 'Phone number must be exactly 10 digits',
    }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(value) ? '' : 'Please enter a valid email address',
    }));
  };

  // Manual validation function
  const validateForm = () => {
    const validationErrors = {};
    let isValid = true;

    // First Name validation
    if (!firstName.trim()) {
      validationErrors.firstName = 'First Name is required';
      isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(firstName)) {
      validationErrors.firstName = 'First name should contain only letters';
      isValid = false;
    }

    // Last Name validation
    if (!lastName.trim()) {
      validationErrors.lastName = 'Last Name is required';
      isValid = false;
    } else if (!/^[A-Za-z\s'-]+$/.test(lastName)) {
      validationErrors.lastName = 'Last name should contain only letters';
      isValid = false;
    }

    // Phone Number validation
    if (!phoneNumber) {
      validationErrors.phoneNumber = 'Phone Number is required';
      isValid = false;
    } else if (!/^\d+$/.test(phoneNumber)) {
      validationErrors.phoneNumber = 'Phone number must contain only digits';
      isValid = false;
    } else if (phoneNumber.length !== 10) {
      validationErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      isValid = false;
    }

    // Email validation
    if (!email) {
      validationErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Country Code validation
    if (!countryCode) {
      validationErrors.countryCode = 'Country Code is required';
      isValid = false;
    } else if (!countryCodeEnum.includes(countryCode)) {
      validationErrors.countryCode = 'Invalid country code';
      isValid = false;
    }

    setGuestValidationErrors(validationErrors);
    return isValid;
  };

  // Create Unified Billing API call
  const createUnifiedBilling = async (bookingId) => {
    try {
      // Prepare enhanced stay items for unified billing
      const items = [];

      if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
        enhancedStayItems.items.forEach((item) => {
          // Create the proper structure based on item type
          const unifiedItem = {
            item_type: item.type || 'enhanced_stay',
            itemid: item.id || Math.floor(Math.random() * 1000),
            quantity: item.quantity || 1,
            urgencylevel: 'Normal',
            scheduledtime: new Date().toISOString(),
            specialinstructions: item.specialInstructions || '',
          };

          // If it's a food item, structure might be different
          if (item.type === 'food') {
            unifiedItem.item_type = 'food';
            unifiedItem.items = [
              {
                foodid: item.id,
                quantity: item.quantity,
              },
            ];
            // Remove itemid for food items if backend expects different structure
            delete unifiedItem.itemid;
          }

          items.push(unifiedItem);
        });
      }

      const payload = {
        bookingid: bookingId,
        items: items,
      };

      console.log('Unified Billing Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`http://localhost:8000/bq/api/create-unified-billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Unified Billing Error Response:', errorData);
        throw new Error(
          errorData.detail ||
            errorData.message ||
            `Unified billing failed: ${response.statusText} (${response.status})`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating unified billing:', error);
      // Throw a more readable error
      throw new Error(`Failed to create unified billing: ${error.message}`);
    }
  };

  // Updated handleBooking function:
  const handleBooking = async () => {
    if (!isAcknowledged) {
      setCheckboxError(true);
      toast.error('Please acknowledge the terms and conditions to proceed');
      return;
    }

    // Validate primary guest form
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    // Validate additional guests
    const hasInvalidAdditionalGuests = additionalGuests.some((guest, index) => {
      return (
        !guest.firstName ||
        !guest.lastName ||
        (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
        Object.values(guestErrors[index] || {}).some(Boolean)
      );
    });

    if (hasInvalidAdditionalGuests) {
      toast.error('Please fill all required fields for additional guests correctly');
      return;
    }

    setIsLoading(true);
    setCheckboxError(false);

    try {
      // ====== STORE PRICE DETAILS IN LOCALSTORAGE BEFORE API CALL ======
      const priceDetails = {
        basePrice: basePrice,
        enhancedStayTotal: enhancedStayTotal,
        taxAmount: taxAmount,
        totalPrice: totalPrice,
        roomTax: roomTax,
        enhancedStayTax: enhancedStayTax,
        roomsCount: roomsCount,
        nights: nights,
        basePricePerRoom: basePricePerRoom,
        subtotal: basePrice + enhancedStayTotal,
      };

      // Store price details in localStorage
      localStorage.setItem('priceDetails', JSON.stringify(priceDetails));
      // ====== END STORE PRICE DETAILS ======

      // Format dates for API
      const formattedCheckInDate = bookingData?.checkInDate
        ? new Date(bookingData.checkInDate).toISOString().split('T')[0]
        : 'N/A';
      const formattedCheckOutDate = bookingData?.checkOutDate
        ? new Date(bookingData.checkOutDate).toISOString().split('T')[0]
        : 'N/A';

      // Prepare booking details payload
      const bookingDetails = {
        guest: {
          firstname: firstName,
          lastname: lastName,
          phonenumber: phoneNumber ? parseInt(phoneNumber) : null,
          emailid: email,
          countrycode: countryCode,
          clienttype: clientType,
          country: selectedCountry?.name || 'India',
          ...(clientType === 'Corporate' && {
            company_name: companyName,
            company_id: companyId,
          }),
          // Additional guests
          ...(additionalGuests.length > 0 && {
            additional_guests: additionalGuests.map((guest) => ({
              firstname: guest.firstName,
              lastname: guest.lastName,
              phonenumber: guest.phoneNumber ? parseInt(guest.phoneNumber) : null,
              emailid: guest.email || null,
              countrycode: guest.countryCode || '+91',
              clienttype: 'Leisure',
              country: guest.country?.name || 'India',
            })),
          }),
        },
        booking: {
          reservationmadeon: formattedCheckInDate,
          checkindate: formattedCheckInDate,
          checkoutdate: formattedCheckOutDate,
          room_type: selectedRoom?.roomName || selectedRoom?.roomtypename || 'N/A',
          number_of_guests:
            (formDetails?.adults || 0) + (formDetails?.children || 0) + (formDetails?.infants || 0),
          quantity: formDetails?.rooms || 1,
          special_requests: specialRequest || '',
        },
      };

      // Store booking details in localStorage
      localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));

      // Step 1: Create the reservation using walk-in API
      const reservationResponse = await fetch(
        `http://localhost:8000/bq/api/create-reservation-walkin-new/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(bookingDetails),
        }
      );

      if (!reservationResponse.ok) {
        const errorData = await reservationResponse.json();
        throw errorData;
      }

      const reservationData = await reservationResponse.json();
      console.log('Reservation Data:', reservationData);

      // ====== STORE ALL RESERVATION DATA IN LOCALSTORAGE ======
      // Store reservation ID
      setReservationId(reservationData.primary_booking_id);
      localStorage.setItem('reservationId', reservationData.primary_booking_id);

      // Store order ID
      localStorage.setItem('orderId', reservationData.order_id);

      // Store billing ID
      localStorage.setItem('billingId', reservationData.billing.billing_id);

      // Store entire reservation data
      localStorage.setItem('reservationData', JSON.stringify(reservationData));

      // ====== STORE QR CODE IN LOCALSTORAGE ======
      if (
        reservationData.qrcodes &&
        Array.isArray(reservationData.qrcodes) &&
        reservationData.qrcodes.length > 0
      ) {
        // Store the first QR code (or all if needed)
        localStorage.setItem('qrcode', reservationData.qrcodes[0]);

        // If you need all QR codes, store them as an array
        localStorage.setItem('allQrCodes', JSON.stringify(reservationData.qrcodes));
      }

      // Store guest details if available
      if (reservationData.guests && Array.isArray(reservationData.guests)) {
        localStorage.setItem('guestDetails', JSON.stringify(reservationData.guests));
      }

      // Store additional reservation metadata
      localStorage.setItem('reservationStatus', 'confirmed');
      localStorage.setItem('reservationDate', new Date().toISOString());
      // ====== END STORE RESERVATION DATA ======

      // Step 2: Create unified billing if there are enhanced stay items
      let unifiedBillingId = null;
      if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
        try {
          const unifiedBillingResponse = await createUnifiedBilling(
            reservationData.primary_booking_id
          );
          console.log('Unified Billing Response:', unifiedBillingResponse);

          // Store unified billing data
          unifiedBillingId = unifiedBillingResponse.billingid;
          setUnifiedBillingId(unifiedBillingId);
          localStorage.setItem('unifiedBillingId', unifiedBillingId);
          localStorage.setItem('unifiedBillingData', JSON.stringify(unifiedBillingResponse));
        } catch (unifiedBillingError) {
          console.error('Unified billing error:', unifiedBillingError);
          // Continue with reservation even if unified billing fails
          toast.warning(
            'Reservation created but enhanced items billing failed. Please contact support.'
          );
        }
      }

      // Show success message
      setReservationMessage(
        `Booking successful! Reservation ID: ${reservationData.primary_booking_id}`
      );
      setReservationError('');
      setReservationPopupOpen(true);

      // ====== VERIFY DATA STORED IN LOCALSTORAGE ======
      console.log('LocalStorage after successful booking:');
      console.log('Price Details:', JSON.parse(localStorage.getItem('priceDetails')));
      console.log('QR Code stored:', localStorage.getItem('qrcode') ? 'Yes' : 'No');
      console.log('Reservation ID:', localStorage.getItem('reservationId'));
      console.log('Order ID:', localStorage.getItem('orderId'));
      // ====== END VERIFICATION ======
    } catch (error) {
      console.error('Booking Error:', error);

      let errorMessage = 'An error occurred during booking';
      let errorDetails = null;

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (error.detail && typeof error.detail === 'object' && error.detail.message) {
          errorMessage = error.detail.message;
          errorDetails = error.detail;
        } else if (error.detail && typeof error.detail === 'object') {
          errorMessage = JSON.stringify(error.detail);
        }
      } else if (error.errors) {
        errorMessage = Object.values(error.errors).join(', ');
      }

      setReservationError({
        message: errorMessage,
        details: errorDetails || error,
      });
      setReservationPopupOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentOption = async (paymentMethod) => {
    if (!razorpayLoaded) {
      toast.error('Razorpay script is not loaded yet.');
      return;
    }

    if (paymentMethod === 'payNow') {
      try {
        setIsProcessing(true);

        // Get reservation data from localStorage
        const reservationDataStr = localStorage.getItem('reservationData');
        if (!reservationDataStr) {
          toast.error('Reservation data not found. Please create a reservation first.');
          setIsProcessing(false);
          return;
        }

        const reservationData = JSON.parse(reservationDataStr);

        // Get the correct reservation ID
        const bookingId = reservationData.primary_booking_id || reservationData.booking_id;

        if (!bookingId) {
          toast.error('Booking ID not found. Please try again.');
          setIsProcessing(false);
          return;
        }

        console.log('Using booking ID for payment:', bookingId);

        // Get billing IDs
        const reservationBillingId = localStorage.getItem('billingId');
        const unifiedBillingId = localStorage.getItem('unifiedBillingId');

        if (!reservationBillingId) {
          toast.error('Billing details not found. Please try again.');
          setIsProcessing(false);
          return;
        }

        // Prepare billing IDs for payment
        const billingIds = [reservationBillingId];
        if (unifiedBillingId) {
          billingIds.push(unifiedBillingId);
        }

        const apiUrl = `http://localhost:8000/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

        console.log('Payment API URL:', apiUrl);
        console.log('Billing IDs:', billingIds);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(billingIds),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Payment order creation failed: ${response.statusText}`
          );
        }

        const orderData = await response.json();

        if (orderData && orderData.razorpay_order_id) {
          // Get the total amount from both billing sources
          const reservationData = JSON.parse(localStorage.getItem('reservationData'));
          const reservationBillingAmount = parseFloat(reservationData.billing.final_amount);

          const unifiedBillingData = unifiedBillingId
            ? JSON.parse(localStorage.getItem('unifiedBillingData'))
            : null;

          const unifiedBillingAmount = unifiedBillingData
            ? parseFloat(unifiedBillingData.final_amount)
            : 0;

          const totalAmount = reservationBillingAmount + unifiedBillingAmount;

          const options = {
            key: RAZORPAY_KEY, // Replace with your actual Razorpay key
            amount: totalAmount * 100, // Convert to paise
            currency: 'INR',
            name: 'Hotel Booking',
            description: 'Hotel Reservation Payment',
            order_id: orderData.razorpay_order_id,
            handler: async function (response) {
              const paymentDetails = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                billing_ids: billingIds,
                booking_id: bookingId,
              };

              try {
                const verificationResponse = await fetch(
                  `http://localhost:8000/bq/api/razorpay/verify_payment_multiple`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                    body: JSON.stringify(paymentDetails),
                  }
                );

                if (!verificationResponse.ok) {
                  throw new Error('Payment verification failed');
                }

                const verificationData = await verificationResponse.json();

                if (verificationData.status === 'success') {
                  toast.success('Payment successful and verified!');

                  // Update both billing records
                  await Promise.all([
                    fetch(`http://localhost:8000/bq/api/update-billing-status`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        billing_id: reservationBillingId,
                        status: 'paid',
                        payment_method: 'razorpay',
                        payment_reference: response.razorpay_payment_id,
                      }),
                    }),
                    ...(unifiedBillingId
                      ? [
                          fetch(`http://localhost:8000/bq/api/update-billing-status`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              billing_id: unifiedBillingId,
                              status: 'paid',
                              payment_method: 'razorpay',
                              payment_reference: response.razorpay_payment_id,
                            }),
                          }),
                        ]
                      : []),
                  ]);

                  // Redirect to success page
                  window.location.href = '/payment-success';
                } else {
                  toast.error('Payment verification failed. Please contact support.');
                }
              } catch (error) {
                console.error('Verification error:', error);
                toast.error('Error verifying payment. Please try again.');
              } finally {
                setIsProcessing(false);
              }
            },
            prefill: {
              name: `${firstName} ${lastName}`,
              email: email,
              contact: String(phoneNumber),
            },
            theme: {
              color: '#3399cc',
            },
            notes: {
              bookingId: bookingId,
              billingIds: billingIds.join(','),
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error(error.message || 'Error processing payment. Please try again.');
        setIsProcessing(false);
      }
    } else if (paymentMethod === 'payLater') {
      // For corporate guests, show "Bill to Company", for others "Pay at Front Desk"
      if (isCorporateGuest) {
        try {
          setIsProcessing(true);
          toast.info('Booking will be billed to your company.');
          window.location.href = '/reservation-succesful';
        } catch (error) {
          toast.error('Error processing corporate billing. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      } else {
        try {
          setIsProcessing(true);
          toast.info('Payment deferred. Please pay at the front desk.');
          window.location.href = '/reservation-succesful';
        } catch (error) {
          toast.error('Error processing check-in. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const handleAddAdditionalGuest = () => {
    if (!formDetails || additionalGuests.length >= formDetails.adults - 1) return;

    const newGuest = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      countryCode: '+91',
      country: selectedCountry,
    };

    setAdditionalGuests([...additionalGuests, newGuest]);

    setTimeout(() => {
      const guestContainer = document.querySelector('.guest-list-container');
      if (guestContainer) {
        guestContainer.scrollTop = guestContainer.scrollHeight;
      }
    }, 100);
  };

  const handleAdditionalGuestChange = (index, field, value) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value,
    };
    setAdditionalGuests(updatedGuests);

    let errorMsg = '';
    if ((field === 'firstName' || field === 'lastName') && !/^[A-Za-z]+$/.test(value)) {
      errorMsg = `${field === 'firstName' ? 'First' : 'Last'} name should contain only letters.`;
    }

    if (field === 'phoneNumber') {
      if (!/^\d+$/.test(value)) {
        errorMsg = 'Phone number must contain digits only.';
      } else if (value.length !== 10 && value.length > 0) {
        errorMsg = 'Phone number must be exactly 10 digits long.';
      }
    }

    const updatedErrors = [...guestErrors];
    updatedErrors[index] = {
      ...updatedErrors[index],
      [field]: errorMsg,
    };
    setGuestErrors(updatedErrors);
  };

  const removeAdditionalGuest = (index) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests.splice(index, 1);
    setAdditionalGuests(updatedGuests);

    const updatedErrors = [...guestErrors];
    updatedErrors.splice(index, 1);
    setGuestErrors(updatedErrors);
  };

  const saveAdditionalGuests = () => {
    const hasErrors = additionalGuests.some((guest, index) => {
      return (
        !guest.firstName ||
        !guest.lastName ||
        (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
        Object.values(guestErrors[index] || {}).some(Boolean)
      );
    });

    if (hasErrors) {
      toast.error('Please fill all required fields for additional guests correctly');
      return;
    }

    // Ensure all additional guests have country data
    const updatedGuests = additionalGuests.map((guest) => ({
      ...guest,
      country: guest.country || selectedCountry,
    }));

    setAdditionalGuests(updatedGuests);
    toast.success('Additional guests saved successfully!');
  };

  const fallbackImages = [
    'https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg',
  ];

  const nextImage = () => {
    const images = selectedRoom?.roomImages || selectedRoom?.roomImages || fallbackImages;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = selectedRoom?.roomImages || selectedRoom?.roomImages || fallbackImages;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Calculate prices based on actual data
  const basePricePerRoom = selectedRoom?.basePrice || selectedRoom?.pricePerNight || 6500;
  const roomsCount = formDetails?.rooms || 1;
  const nights = bookingData?.daysCount || 1;
  const basePrice = basePricePerRoom * roomsCount * nights;

  // Calculate taxes for room (12% GST)
  const roomTax = basePrice * 0.12;

  // Calculate enhanced stay items total and tax
  let enhancedStayTotal = 0;
  let enhancedStayTax = 0;

  if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
    enhancedStayItems.items.forEach((item) => {
      const itemTotal = item.item_total || item.price * item.quantity;
      enhancedStayTotal += itemTotal;
      enhancedStayTax += itemTotal * 0.18; // 18% GST for enhanced stay items
    });
  }

  const taxAmount = roomTax + enhancedStayTax;
  const totalPrice = basePrice + enhancedStayTotal + taxAmount;

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (!bookingData || !selectedRoom || !formDetails) {
    return (
      <div className="w-full px-10 py-4 mt-4 bg-white max-w-8xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading booking details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-10 py-4 mt-4 bg-white max-w-8xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-6 ml-4">Reserve and Pay</h1>

      <div className="flex flex-col md:flex-row gap-6 mx-4">
        {/* Left Column (2/3 width) */}
        <div className="w-full md:w-2/3">
          {/* Fully Refundable Card */}
          <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mt-1 md:text[12px] lg:text-[14px]">
                    Room 1: {formDetails.adults} Adult
                    {formDetails.adults !== 1 ? 's' : ''}
                    {formDetails.children > 0 &&
                      `, ${formDetails.children} Child${formDetails.children !== 1 ? 'ren' : ''}`}
                    , {selectedRoom?.roomName || 'Deluxe Room'}
                    {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                      <>
                        , with{' '}
                        {selectedRoom.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 mr-1 text-green-600"
                          >
                            <ImCheckmark className="text-green-500 ml-1" />
                            {amenity.name}
                            {index !== selectedRoom.amenities.length - 1 && ','}
                          </span>
                        ))}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 px-3 py-1 rounded-md">
                <div className="text-sm font-bold text-gray-900">
                  <span className="text-sm font-semibold text-gray-600">Total :</span> ₹
                  {totalPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 pb-1">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-black mt-0.5 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Fully refundable until 24 hours before check-in date
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    You can change or cancel this stay if plans change, Please refer to our{' '}
                    <span
                      className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      onClick={() => setShowCancellationPolicy(true)}
                    >
                      cancellation policy
                    </span>{' '}
                  </p>
                  <CancellationPolicy
                    isOpen={showCancellationPolicy}
                    onClose={() => setShowCancellationPolicy(false)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Guest Details Card */}
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Guest Details</h2>

            {/* Primary Guest Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">Room 1:</span>
                <span className="text-sm text-gray-700">
                  {formDetails.adults} Adult{formDetails.adults > 1 ? 's' : ''}
                  {formDetails.childrenAges.length > 0 ? (
                    <>
                      , {formDetails.childrenAges.length} Child
                      {formDetails.childrenAges.length > 1 ? 'ren' : ''} (
                      {formDetails.childrenAges.map((age, index) => (
                        <span key={index}>
                          {age} yr{age > 1 ? 's' : ''}
                          {index !== formDetails.childrenAges.length - 1 && ', '}
                        </span>
                      ))}
                      )
                    </>
                  ) : (
                    ''
                  )}
                  {selectedRoom?.roomName && `, ${selectedRoom.roomName}`}
                  {selectedRoom?.amenities?.length > 0 && (
                    <>
                      , with{' '}
                      {selectedRoom.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 mr-2 text-green-600 font-medium"
                        >
                          <ImCheckmark className="text-green-500 ml-1" />
                          {amenity.name}
                          {index !== selectedRoom.amenities.length - 1 && ','}
                        </span>
                      ))}
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First name*
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      placeholder="Enter first name"
                      onChange={handleFirstNameChange}
                      className="w-full p-2 border text-transform: capitalize  border-gray-300 rounded-md text-sm"
                    />
                    <div className="h-2">
                      {errors.firstName && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.firstName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last name*
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      placeholder="Enter last name"
                      onChange={handleLastNameChange}
                      className="w-full p-2 border text-transform: capitalize border-gray-300 rounded-md text-sm"
                    />
                    <div className="h-2">
                      {errors.lastName && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile number*
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="+91">+91 (IND)</option>
                        <option value="+1">+1 (US)</option>
                      </select>
                      <input
                        type="number"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Please enter a valid phone number"
                      />
                    </div>
                    <div className="h-2">
                      {errors.phoneNumber && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      type="text"
                      value={email}
                      placeholder="Enter email"
                      onChange={handleEmailChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="h-2">
                      {errors.email && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {/* Profile Type */}
                  <div className="mb-1">
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Profile Type*
                    </label>
                    <select
                      value={clientType}
                      onChange={handleClientTypeChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      disabled={isCorporateGuest}
                    >
                      <option value="Leisure">Leisure</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>

                  {/* Country Select (with flags) */}
                  <div className="mb-1 relative">
                    <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                      Country*
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
                      >
                        <span className="flex items-center gap-2">
                          <img
                            src={selectedCountry.flag}
                            alt={selectedCountry.name}
                            className="w-5 h-4 object-cover rounded-sm"
                          />
                          {selectedCountry.name}
                        </span>
                        <span className="ml-2 font-semibold">v</span>
                      </button>

                      {isOpen && (
                        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                          {countries.map((country) => (
                            <div
                              key={country.code}
                              onClick={() => {
                                setSelectedCountry(country);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                            >
                              <img
                                src={country.flag}
                                alt={country.name}
                                className="w-5 h-4 object-cover rounded-sm"
                              />
                              {country.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Add Corporate Fields Section */}
                  {clientType === 'Corporate' && (
                    <div className=" p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Company Details</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name*
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                            placeholder="Enter company name"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company ID*
                          </label>
                          <input
                            type="text"
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                            placeholder="Enter company ID"
                            disabled
                          />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 bg-yellow-200 px-2 py-1 rounded-md mt-2">
                        Note: Corporate details can't be edited here. Update them in your profile to
                        reflect changes.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
                {additionalGuests.map((guest, index) => (
                  <div
                    key={index}
                    className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
                  >
                    <button
                      onClick={() => removeAdditionalGuest(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>

                    <h4 className="text-md font-semibold text-gray-700 mb-3">Guest {index + 2}</h4>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First name*
                        </label>
                        <input
                          type="text"
                          value={guest.firstName}
                          onChange={(e) =>
                            handleAdditionalGuestChange(index, 'firstName', e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter first name"
                        />
                        <div className="h-2">
                          {guestErrors[index]?.firstName && (
                            <p className="text-[10px] text-red-500 mt-1">
                              {guestErrors[index].firstName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last name*
                        </label>
                        <input
                          type="text"
                          value={guest.lastName}
                          onChange={(e) =>
                            handleAdditionalGuestChange(index, 'lastName', e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          placeholder="Enter last name"
                        />
                        <div className="h-2">
                          {guestErrors[index]?.lastName && (
                            <p className="text-[10px] text-red-500 mt-1">
                              {guestErrors[index].lastName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile number (optional)
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={guest.countryCode}
                            onChange={(e) =>
                              handleAdditionalGuestChange(index, 'countryCode', e.target.value)
                            }
                            className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="+91">+91 (IND)</option>
                            <option value="+1">+1 (US)</option>
                          </select>
                          <input
                            type="number"
                            value={guest.phoneNumber}
                            onChange={(e) =>
                              handleAdditionalGuestChange(index, 'phoneNumber', e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Please enter a valid mobile number"
                          />
                        </div>
                        <div className="h-2">
                          {guestErrors[index]?.phoneNumber && (
                            <p className="text-[10px] text-red-500 mt-1">
                              {guestErrors[index].phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mt-1 mb-1">
                          Country
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => toggleGuestDropdown(index)}
                            className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
                          >
                            <span className="flex items-center gap-2">
                              <img
                                src={guest.country?.flag || countries[0].flag}
                                alt={guest.country?.name || countries[0].name}
                                className="w-5 h-4 object-cover rounded-sm"
                              />
                              {guest.country?.name || countries[0].name}
                            </span>
                            <span className="ml-2 font-semibold">v</span>
                          </button>

                          {guestDropdownStates[index] && (
                            <div className="absolute bottom-full mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                              {countries.map((country) => (
                                <div
                                  key={country.code}
                                  onClick={() => {
                                    handleAdditionalGuestChange(index, 'country', country);
                                    toggleGuestDropdown(index);
                                  }}
                                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  <img
                                    src={country.flag}
                                    alt={country.name}
                                    className="w-5 h-4 object-cover rounded-sm"
                                  />
                                  {country.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-3">
                <div className="relative group w-fit">
                  <button
                    onClick={handleAddAdditionalGuest}
                    disabled={additionalGuests.length >= formDetails.adults - 1}
                    className={`flex items-center gap-2 pb-4 ${
                      additionalGuests.length >= formDetails.adults - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    <FiPlus className="w-4 h-4" />
                    Additional guest
                  </button>
                  {additionalGuests.length >= formDetails.adults - 1 && (
                    <div className="absolute whitespace-nowrap bottom-full mb-2 left-52 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      To add more guests, please increase the number of adults in your reservation
                    </div>
                  )}
                </div>

                {additionalGuests.length > 0 && (
                  <button
                    onClick={saveAdditionalGuests}
                    className="bg-black hover:bg-gray-700 text-white px-10 py-2 rounded-md text-sm font-medium ml-4"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            <div
              className="border-t pt-6 cursor-pointer"
              onClick={() => setSpecialRequestOpen(true)}
            >
              <h3 className="text-md font-bold text-gray-800 flex items-center justify-between">
                Special Requests (optional)
                <FiChevronRight className="text-gray-500" />
              </h3>
              {specialRequest && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {specialRequest.length > 60
                    ? `${specialRequest.substring(0, 60)}...`
                    : specialRequest}
                </p>
              )}
            </div>
          </div>

          {/* Selected Amenities Card */}
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selected Enhanced Items</h2>

            {enhancedStayItems?.items && enhancedStayItems.items.length > 0 ? (
              <ul className="space-y-2">
                {enhancedStayItems.items.map((item, index) => (
                  <li key={index} className="flex justify-between py-1">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      ₹
                      {(item.item_total || item.price * item.quantity).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No enhanced stay items selected.</p>
            )}
          </div>

          {/* Important Information Card  */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Important information</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li>
                Cancel your reservation at least 24 hours before your scheduled check-in time to
                avoid cancellation fees
              </li>
              <li>
                Cancellations made within 24 hours of the check-in time, as well as no-shows, will
                incur a charge equivalent to first night's stay.
              </li>
              <li>
                Guests are requested to present a valid government-issued photo ID at the time of
                check-in. Foreign nationals are requested to carry a valid passport and visa for
                verification.
              </li>
              <li>
                Guests may check in from 11:00 AM onwards and are requested to check out by 1:00 PM.
              </li>
              <li>
                Special requests (early check-in, late check-out, amenities) are subject to
                availability and may incur additional charges.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column (1/3 width) - Sticky Booking Summary */}
        <div className="w-full md:w-1/3">
          <div className="rounded-2xl border border-gray-200 shadow-sm bg-white sticky top-4">
            {/* Image slider section */}
            <div className="relative w-full h-60 overflow-hidden rounded-t-2xl">
              {(selectedRoom?.roomImages?.length > 0
                ? selectedRoom.roomImages
                : fallbackImages
              ).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Room ${index + 1}`}
                  className={`w-full h-full object-cover ${
                    index === currentImageIndex ? 'block' : 'hidden'
                  }`}
                />
              ))}
              {/* Slider controls */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                &lt;
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                &gt;
              </button>
            </div>

            {/* Room info section */}
            <div className="p-6">
              <div className="pt-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Check-in:</h3>
                    <p className="text-gray-600 text-sm ">
                      {formatDisplayDate(bookingData.checkInDate)} (11:00 AM)
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Check-out:</h3>
                    <p className="text-gray-600 text-sm">
                      {formatDisplayDate(bookingData.checkOutDate)} (1:00 PM)
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Price Details</h3>

                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>
                      {roomsCount} Room{roomsCount > 1 ? 's' : ''} × {nights} Night
                      {nights > 1 ? 's' : ''}
                    </span>
                    <span>
                      ₹
                      {basePrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {enhancedStayItems?.items && enhancedStayItems.items.length > 0 && (
                    <div className="">
                      <ul className="text-sm text-gray-700">
                        {enhancedStayItems.items.map((item, index) => (
                          <li key={index} className="flex justify-between py-1">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>
                              ₹
                              {(item.item_total || item.price * item.quantity).toLocaleString(
                                'en-IN',
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-700 mt-3 border-t pt-2">
                    <span className="font-semibold">Subtotal:</span>
                    <span>
                      ₹
                      {(basePrice + enhancedStayTotal).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="mt-3 mb-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-800">
                          Total Taxes and Charges
                        </span>
                        <button
                          onClick={() => setShowTaxDetails(!showTaxDetails)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showTaxDetails ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>

                      <span className="text-sm text-gray-700">
                        ₹
                        {taxAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {showTaxDetails && (
                      <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                        <div className="mb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1">
                              <span>Room Charges (12%)</span>
                              <div className="group relative">
                                <FiInfo className="text-gray-400 cursor-pointer" />
                                <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
                                  <div className="flex justify-between mb-1">
                                    <span>CGST (6%)</span>
                                    <span>
                                      ₹
                                      {(basePrice * 0.06).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SGST (6%)</span>
                                    <span>
                                      ₹
                                      {(basePrice * 0.06).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span>
                              ₹
                              {(basePrice * 0.12).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {enhancedStayItems?.items &&
                          enhancedStayItems.items.map((item, index) => {
                            const itemTotal = item.item_total || item.price * item.quantity;
                            const itemTax = itemTotal * 0.18;
                            return (
                              <div key={index} className="mb-2">
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-1">
                                    <span>{item.name} (18%)</span>
                                    <div className="group relative">
                                      <FiInfo className="text-gray-400 cursor-pointer" />
                                      <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
                                        <div className="flex justify-between mb-1">
                                          <span>CGST (9%)</span>
                                          <span>
                                            ₹
                                            {(itemTax / 2).toLocaleString('en-IN', {
                                              minimumFractionDigits: 2,
                                            })}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>SGST (9%)</span>
                                          <span>
                                            ₹
                                            {(itemTax / 2).toLocaleString('en-IN', {
                                              minimumFractionDigits: 2,
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <span>
                                    ₹
                                    {itemTax.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mt-auto">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Total</h3>
                    <span className="text-xl font-bold text-gray-800">
                      ₹
                      {totalPrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-start mt-4 mb-6 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    id="acknowledgement"
                    className="size-6 mr-1 mb-2"
                    checked={isAcknowledged}
                    onChange={(e) => setIsAcknowledged(e.target.checked)}
                  />
                  <label htmlFor="acknowledgement" className="mt-1">
                    By proceeding,I confirm that I have read and agree to the&nbsp;
                    <button
                      type="button"
                      onClick={() => setShowLegalPopup(true)}
                      className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
                    >
                      Terms and Conditions
                    </button>
                    &nbsp;and&nbsp;
                    <button
                      type="button"
                      onClick={() => setShowLegalPopup(true)}
                      className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>

                <LegalDocumentsPopup
                  isOpen={showLegalPopup}
                  onClose={() => setShowLegalPopup(false)}
                />
                {checkboxError && (
                  <p className="text-red-500 text-xs mb-2">
                    Please acknowledge the terms and conditions to proceed
                  </p>
                )}

                <button
                  onClick={handleBooking}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Reserve Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modals */}
      {/* Popup Modals */}
      {reservationPopupOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white border border-gray-300 w-4/5 sm:w-2/5 p-8 rounded-lg shadow-xl relative">
            <button
              className="absolute top-3 right-4 text-red-600 text-xl"
              onClick={() => setReservationPopupOpen(false)}
            >
              ✕
            </button>

            {reservationError ? (
              <div>
                <h2 className="text-center text-2xl font-bold text-red-600">Reservation Failed</h2>

                {/* Always render error.message as a string */}
                <div className="mt-4">
                  <h3 className="text-center text-lg font-semibold text-gray-600 mb-6">
                    We're sorry, but something went wrong during the booking process.
                  </h3>
                  <p className="text-center text-base font-semibold text-gray-500 mb-6">
                    <span className="text-red-600">
                      {typeof reservationError === 'object'
                        ? reservationError.message
                        : String(reservationError)}
                    </span>
                  </p>

                  {/* If there are details, show them properly */}
                  {reservationError &&
                    typeof reservationError === 'object' &&
                    reservationError.details && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <h4 className="font-semibold text-gray-700 mb-2">Error Details:</h4>
                        <div className="text-sm text-gray-600">
                          {reservationError.details.conflicts &&
                            Array.isArray(reservationError.details.conflicts) && (
                              <div className="mb-3">
                                <p className="font-medium">Conflicts:</p>
                                <ul className="list-disc pl-5 mt-1">
                                  {reservationError.details.conflicts.map((conflict, index) => (
                                    <li key={index}>
                                      {conflict.message || JSON.stringify(conflict)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {reservationError.details.resolution && (
                            <p className="mb-2">
                              <span className="font-medium">Resolution:</span>{' '}
                              {reservationError.details.resolution}
                            </p>
                          )}

                          {reservationError.details.contact_support && (
                            <p className="mb-2">
                              <span className="font-medium">Contact Support:</span>{' '}
                              {reservationError.details.contact_support}
                            </p>
                          )}

                          {reservationError.details.support_contact && (
                            <div className="mt-3">
                              <p className="font-medium">Support Contact:</p>
                              <p className="mt-1">
                                Phone: {reservationError.details.support_contact.phone || 'N/A'}
                              </p>
                              <p>
                                Email: {reservationError.details.support_contact.email || 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="text-center mt-4">
                    <p className="text-sm font-semibold text-gray-500">
                      Please try again or contact us for assistance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Success content remains the same */}
                <div className="mb-4 mt-5">
                  <p className="text-md font-semibold ">
                    Hello,{' '}
                    <span className="capitalize">
                      {firstName} {lastName}
                    </span>{' '}
                    you've reached last step of your reservation
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="rounded-lg">
                    <p className="text-md font-semibold text-gray-700">Reservation Number</p>
                    <p className="text-md font-mono">
                      {reservationId || localStorage.getItem('reservationId') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-md font-semibold text-gray-700">Check-in</p>
                    <p className="text-md">{formatDisplayDate(bookingData.checkInDate)}</p>
                  </div>
                  <div>
                    <p className="text-md font-semibold text-gray-700">Check-out</p>
                    <p className="text-md">{formatDisplayDate(bookingData.checkOutDate)}</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-2 rounded-md mb-6">
                  <p className="text-center text-md font-semibold text-black">
                    Please read a details carefully and make a payment of{' '}
                    <span className="text-blue-500">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>{' '}
                  </p>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => handlePaymentOption('payLater')}
                    className="w-full text-lg font-semibold bg-black text-white px-4 py-2 rounded-lg hover:text-gray-200"
                  >
                    {isCorporateGuest ? 'Bill to Company' : 'Pay at Front Desk'}
                  </button>

                  <button
                    onClick={() => handlePaymentOption('payNow')}
                    className="w-full text-lg font-semibold bg-gradient-to-r bg-black text-white px-4 py-2 rounded-lg hover:text-gray-300"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <SpecialRequest
        isOpen={specialRequestOpen}
        onClose={() => setSpecialRequestOpen(false)}
        request={specialRequest}
        setRequest={setSpecialRequest}
      />
      <ToastContainer />
    </div>
  );
};

export default PaymentPage;

// import React, { useState, useEffect } from "react";
// import { FiInfo } from "react-icons/fi";
// import {
//   FiChevronRight,
//   FiPlus,
//   FiMinus,
//   FiChevronDown,
//   FiChevronUp,
// } from "react-icons/fi";
// import SpecialRequest from "./SpecialRequest";
// import { ImCheckmark } from "react-icons/im";
// import { MdOutlineBedroomChild } from "react-icons/md";
// import LegalDocumentsPopup from "./LegalDocumentsPop";
// import CancellationPolicy from "./CancellationPolicy";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const countries = [
//   { name: "India", code: "IN", flag: "https://flagcdn.com/w320/in.png" },
//   {
//     name: "United States",
//     code: "US",
//     flag: "https://flagcdn.com/w320/us.png",
//   },
//   {
//     name: "United Kingdom",
//     code: "GB",
//     flag: "https://flagcdn.com/w320/gb.png",
//   },
//   { name: "Australia", code: "AU", flag: "https://flagcdn.com/w320/au.png" },
//   { name: "Canada", code: "CA", flag: "https://flagcdn.com/w320/ca.png" },
//   { name: "Japan", code: "JP", flag: "https://flagcdn.com/w320/jp.png" },
// ];

// const PaymentPage = () => {
//   // Form states
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [email, setEmail] = useState("");
//   const [clientType, setClientType] = useState("Leisure");
//   const [countryCode, setCountryCode] = useState("+91");
//   const [guestValidationErrors, setGuestValidationErrors] = useState({});
//   const [popupOpen, setPopupOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [reservationPopupOpen, setReservationPopupOpen] = useState(false);
//   const [reservationMessage, setReservationMessage] = useState("");
//   const [reservationError, setReservationError] = useState(null);
//   const [reservationId, setReservationId] = useState("");
//   const [specialRequestOpen, setSpecialRequestOpen] = useState(false);
//   const [specialRequest, setSpecialRequest] = useState("");
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isAcknowledged, setIsAcknowledged] = useState(false);
//   const [checkboxError, setCheckboxError] = useState(false);
//   const [showTaxDetails, setShowTaxDetails] = useState(false);
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find((country) => country.name === "India") || countries[0]
//   );
//   const [isOpen, setIsOpen] = useState(false);
//   const [companyName, setCompanyName] = useState("Acme Corporation");
//   const [companyId, setCompanyId] = useState("CORP12345");
//   const [isCorporateGuest, setIsCorporateGuest] = useState(false);

//   const [errors, setErrors] = useState({
//     firstName: "",
//     lastName: "",
//     phoneNumber: "",
//     email: "",
//   });
//   const [guestErrors, setGuestErrors] = useState([]);
//   const [additionalGuests, setAdditionalGuests] = useState([]);
//   const [razorpayLoaded, setRazorpayLoaded] = useState(false);
//   const [unifiedBillingId, setUnifiedBillingId] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showLegalPopup, setShowLegalPopup] = useState(false);
//   const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [selectedAddGuestCountry, setSelectedAddGuestCountry] = useState(
//     countries[0]
//   );
//   const [guestDropdownStates, setGuestDropdownStates] = useState({});

//   // Data from localStorage
//   const [bookingData, setBookingData] = useState(null);
//   const [selectedRoom, setSelectedRoom] = useState(null);
//   const [enhancedStayItems, setEnhancedStayItems] = useState(null);
//   const [formDetails, setFormDetails] = useState(null);

//   // Load data from localStorage on component mount
//   useEffect(() => {
//     try {
//       // Get checkin data
//       const checkin = localStorage.getItem("checkin");
//       const checkout = localStorage.getItem("checkout");
//       const adults = parseInt(localStorage.getItem("adults")) || 0;
//       const children = parseInt(localStorage.getItem("children")) || 0;
//       const childAges = JSON.parse(localStorage.getItem("childAges") || "[]");
//       const rooms = parseInt(localStorage.getItem("rooms")) || 0;

//       // Get selected room data
//       const selectedRoomStr = localStorage.getItem("selectedRoom");
//       const selectedRoomData = selectedRoomStr
//         ? JSON.parse(selectedRoomStr)
//         : null;

//       // Get enhanced stay items
//       const enhancedStayItemsStr = localStorage.getItem("enhancedStayItems");
//       const enhancedStayItemsData = enhancedStayItemsStr
//         ? JSON.parse(enhancedStayItemsStr)
//         : null;

//       // Calculate days count
//       let daysCount = 0;
//       if (checkin && checkout) {
//         const checkInDate = new Date(checkin);
//         const checkOutDate = new Date(checkout);
//         const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//         daysCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
//       }

//       // Set form details
//       const formDetails = {
//         rooms: rooms,
//         adults: adults,
//         children: children,
//         infants: 0, // Not in localStorage, default to 0
//         childrenAges: childAges,
//       };

//       // Set booking data
//       const bookingData = {
//         checkInDate: checkin,
//         checkOutDate: checkout,
//         daysCount: daysCount || 1,
//       };

//       setBookingData(bookingData);
//       setSelectedRoom(selectedRoomData);
//       setEnhancedStayItems(enhancedStayItemsData);
//       setFormDetails(formDetails);
//     } catch (error) {
//       console.error("Error loading data from localStorage:", error);
//     }
//   }, []);

//   // Load Razorpay script
//   useEffect(() => {
//     const loadRazorpayScript = () => {
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.async = true;
//       script.onload = () => setRazorpayLoaded(true);
//       script.onerror = () => {
//         toast.error("Error loading Razorpay script. Please try again.");
//       };
//       document.body.appendChild(script);
//     };

//     if (!window.Razorpay) {
//       loadRazorpayScript();
//     } else {
//       setRazorpayLoaded(true);
//     }
//   }, []);

//   const validateName = (value) => {
//     const trimmed = value.trim();

//     if (trimmed.length < 2) {
//       return "Name must be at least 2 characters";
//     }
//     if (trimmed.length > 60) {
//       return "Name cannot exceed 60 characters";
//     }

//     if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
//       const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
//       if (invalidChars) {
//         return `Names cannot have digits`;
//       }
//       return "Only letters, spaces, hyphens (-) and apostrophes (') are allowed";
//     }

//     if (/['-]{2,}/.test(trimmed)) {
//       return "Cannot have consecutive special characters (-- or '')";
//     }
//     if (/^['-]/.test(trimmed)) {
//       return "Only letters are allowed (no special characters)";
//     }
//     if (/['-]$/.test(trimmed)) {
//       return "Only letters are allowed (no special characters)";
//     }

//     const words = trimmed.split(/\s+/);
//     for (const word of words) {
//       if (word.length > 20) {
//         return `"${word}" is too long (max 20 letters)`;
//       }
//       if (word.length < 2 && /[A-Za-z]/.test(word)) {
//         return `"${word}" is too short (min 2 letters)`;
//       }
//     }

//     if (trimmed.includes("  ")) {
//       return "Cannot have multiple spaces between words";
//     }

//     return "";
//   };

//   const validatePhone = (number) => /^\d{10}$/.test(number);
//   const validateEmail = (email) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
//   };

//   const toggleGuestDropdown = (index) => {
//     setGuestDropdownStates((prev) => ({
//       ...prev,
//       [index]: !prev[index],
//     }));
//   };

//   const togglePopup = () => setPopupOpen(!popupOpen);

//   const countryCodes = [
//     { code: "+91" },
//     { code: "+1" },
//     { code: "+44" },
//     { code: "+61" },
//     { code: "+81" },
//   ];
//   const countryCodeEnum = countryCodes.map((item) => item.code);

//   const handleClientTypeChange = (e) => {
//     const newClientType = e.target.value;
//     setClientType(newClientType);

//     if (newClientType === "Corporate" && companyId && companyName) {
//       setIsCorporateGuest(true);
//     } else if (newClientType === "Leisure") {
//       setIsCorporateGuest(false);
//     }
//   };

//   const handleFirstNameChange = (e) => {
//     const value = e.target.value;
//     setFirstName(value);
//     const error = validateName(value);
//     setErrors((prev) => ({ ...prev, firstName: error }));
//   };

//   const handleLastNameChange = (e) => {
//     const value = e.target.value;
//     setLastName(value);
//     const error = validateName(value);
//     setErrors((prev) => ({ ...prev, lastName: error }));
//   };

//   const handlePhoneNumberChange = (e) => {
//     const value = e.target.value;
//     setPhoneNumber(value);
//     setErrors((prev) => ({
//       ...prev,
//       phoneNumber: validatePhone(value)
//         ? ""
//         : "Phone number must be exactly 10 digits",
//     }));
//   };

//   const handleEmailChange = (e) => {
//     const value = e.target.value;
//     setEmail(value);
//     setErrors((prev) => ({
//       ...prev,
//       email: validateEmail(value) ? "" : "Please enter a valid email address",
//     }));
//   };

//   // Manual validation function
//   const validateForm = () => {
//     const validationErrors = {};
//     let isValid = true;

//     // First Name validation
//     if (!firstName.trim()) {
//       validationErrors.firstName = "First Name is required";
//       isValid = false;
//     } else if (!/^[A-Za-z\s'-]+$/.test(firstName)) {
//       validationErrors.firstName = "First name should contain only letters";
//       isValid = false;
//     }

//     // Last Name validation
//     if (!lastName.trim()) {
//       validationErrors.lastName = "Last Name is required";
//       isValid = false;
//     } else if (!/^[A-Za-z\s'-]+$/.test(lastName)) {
//       validationErrors.lastName = "Last name should contain only letters";
//       isValid = false;
//     }

//     // Phone Number validation
//     if (!phoneNumber) {
//       validationErrors.phoneNumber = "Phone Number is required";
//       isValid = false;
//     } else if (!/^\d+$/.test(phoneNumber)) {
//       validationErrors.phoneNumber = "Phone number must contain only digits";
//       isValid = false;
//     } else if (phoneNumber.length !== 10) {
//       validationErrors.phoneNumber = "Phone number must be exactly 10 digits";
//       isValid = false;
//     }

//     // Email validation
//     if (!email) {
//       validationErrors.email = "Email is required";
//       isValid = false;
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       validationErrors.email = "Please enter a valid email address";
//       isValid = false;
//     }

//     // Country Code validation
//     if (!countryCode) {
//       validationErrors.countryCode = "Country Code is required";
//       isValid = false;
//     } else if (!countryCodeEnum.includes(countryCode)) {
//       validationErrors.countryCode = "Invalid country code";
//       isValid = false;
//     }

//     setGuestValidationErrors(validationErrors);
//     return isValid;
//   };

//   // Create Unified Billing API call
//   // Create Unified Billing API call
//   const createUnifiedBilling = async (bookingId) => {
//     try {
//       // Prepare enhanced stay items for unified billing
//       const items = [];

//       if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
//         enhancedStayItems.items.forEach((item) => {
//           // Create the proper structure based on item type
//           const unifiedItem = {
//             item_type: item.type || "enhanced_stay",
//             itemid: item.id || Math.floor(Math.random() * 1000),
//             quantity: item.quantity || 1,
//             urgencylevel: "Normal",
//             scheduledtime: new Date().toISOString(),
//             specialinstructions: item.specialInstructions || "",
//           };

//           // If it's a food item, structure might be different
//           if (item.type === "food") {
//             unifiedItem.item_type = "food";
//             unifiedItem.items = [
//               {
//                 foodid: item.id,
//                 quantity: item.quantity,
//               },
//             ];
//             // Remove itemid for food items if backend expects different structure
//             delete unifiedItem.itemid;
//           }

//           items.push(unifiedItem);
//         });
//       }

//       const payload = {
//         bookingid: bookingId,
//         items: items,
//       };

//       console.log("Unified Billing Payload:", JSON.stringify(payload, null, 2));

//       const response = await fetch(
//         `http://localhost:8000/bq/api/create-unified-billing`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Unified Billing Error Response:", errorData);
//         throw new Error(
//           errorData.detail ||
//             errorData.message ||
//             `Unified billing failed: ${response.statusText} (${response.status})`
//         );
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Error creating unified billing:", error);
//       // Throw a more readable error
//       throw new Error(`Failed to create unified billing: ${error.message}`);
//     }
//   };

//   const handleBooking = async () => {
//     if (!isAcknowledged) {
//       setCheckboxError(true);
//       toast.error("Please acknowledge the terms and conditions to proceed");
//       return;
//     }

//     // Validate primary guest form
//     if (!validateForm()) {
//       toast.error("Please fill all required fields correctly");
//       return;
//     }

//     // Validate additional guests
//     const hasInvalidAdditionalGuests = additionalGuests.some((guest, index) => {
//       return (
//         !guest.firstName ||
//         !guest.lastName ||
//         (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
//         Object.values(guestErrors[index] || {}).some(Boolean)
//       );
//     });

//     if (hasInvalidAdditionalGuests) {
//       toast.error(
//         "Please fill all required fields for additional guests correctly"
//       );
//       return;
//     }

//     setIsLoading(true);
//     setCheckboxError(false);

//     try {
//       // Format dates for API
//       const formattedCheckInDate = bookingData?.checkInDate
//         ? new Date(bookingData.checkInDate).toISOString().split("T")[0]
//         : "N/A";
//       const formattedCheckOutDate = bookingData?.checkOutDate
//         ? new Date(bookingData.checkOutDate).toISOString().split("T")[0]
//         : "N/A";

//       // Prepare booking details payload
//       const bookingDetails = {
//         guest: {
//           firstname: firstName,
//           lastname: lastName,
//           phonenumber: phoneNumber ? parseInt(phoneNumber) : null,
//           emailid: email,
//           countrycode: countryCode,
//           clienttype: clientType,
//           country: selectedCountry?.name || "India",
//           ...(clientType === "Corporate" && {
//             company_name: companyName,
//             company_id: companyId,
//           }),
//           // Additional guests
//           ...(additionalGuests.length > 0 && {
//             additional_guests: additionalGuests.map((guest) => ({
//               firstname: guest.firstName,
//               lastname: guest.lastName,
//               phonenumber: guest.phoneNumber
//                 ? parseInt(guest.phoneNumber)
//                 : null,
//               emailid: guest.email || null,
//               countrycode: guest.countryCode || "+91",
//               clienttype: "Leisure",
//               country: guest.country?.name || "India",
//             })),
//           }),
//         },
//         booking: {
//           reservationmadeon: formattedCheckInDate,
//           checkindate: formattedCheckInDate,
//           checkoutdate: formattedCheckOutDate,
//           room_type:
//             selectedRoom?.roomName || selectedRoom?.roomtypename || "N/A",
//           number_of_guests:
//             (formDetails?.adults || 0) +
//             (formDetails?.children || 0) +
//             (formDetails?.infants || 0),
//           quantity: formDetails?.rooms || 1,
//           special_requests: specialRequest || "",
//         },
//       };

//       // Store booking details in localStorage
//       localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));

//       // Step 1: Create the reservation using walk-in API
//       const reservationResponse = await fetch(
//         `http://localhost:8000/bq/api/create-reservation-walkin-new/`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(bookingDetails),
//         }
//       );

//       if (!reservationResponse.ok) {
//         const errorData = await reservationResponse.json();
//         throw errorData;
//       }

//       const reservationData = await reservationResponse.json();
//       console.log("Reservation Data:", reservationData);
//       setReservationId(reservationData.primary_booking_id);

//       // Store all reservation data in localStorage
//       localStorage.setItem("reservationId", reservationData.primary_booking_id);
//       localStorage.setItem("orderId", reservationData.order_id);
//       localStorage.setItem("billingId", reservationData.billing.billing_id);
//       localStorage.setItem("reservationData", JSON.stringify(reservationData));

//       if (
//         reservationData.qrcodes &&
//         Array.isArray(reservationData.qrcodes) &&
//         reservationData.qrcodes.length > 0
//       ) {
//         localStorage.setItem("qrcode", reservationData.qrcodes[0]);
//       }

//       if (reservationData.guests && Array.isArray(reservationData.guests)) {
//         localStorage.setItem(
//           "guestDetails",
//           JSON.stringify(reservationData.guests)
//         );
//       }

//       // Step 2: Create unified billing if there are enhanced stay items
//       let unifiedBillingId = null;
//       if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
//         try {
//           const unifiedBillingResponse = await createUnifiedBilling(
//             reservationData.primary_booking_id
//           );
//           console.log("Unified Billing Response:", unifiedBillingResponse);

//           // Store unified billing data
//           unifiedBillingId = unifiedBillingResponse.billingid;
//           setUnifiedBillingId(unifiedBillingId);
//           localStorage.setItem("unifiedBillingId", unifiedBillingId);
//           localStorage.setItem(
//             "unifiedBillingData",
//             JSON.stringify(unifiedBillingResponse)
//           );
//         } catch (unifiedBillingError) {
//           console.error("Unified billing error:", unifiedBillingError);
//           // Continue with reservation even if unified billing fails
//           toast.warning(
//             "Reservation created but enhanced items billing failed. Please contact support."
//           );
//         }
//       }

//       // Show success message
//       setReservationMessage(
//         `Booking successful! Reservation ID: ${reservationData.primary_booking_id}`
//       );
//       setReservationError("");
//       setReservationPopupOpen(true);
//     } catch (error) {
//       console.error("Booking Error:", error);

//       let errorMessage = "An error occurred during booking";
//       let errorDetails = null;

//       if (typeof error === "string") {
//         errorMessage = error;
//       } else if (error.message) {
//         errorMessage = error.message;
//       } else if (error.detail) {
//         if (typeof error.detail === "string") {
//           errorMessage = error.detail;
//         } else if (
//           error.detail &&
//           typeof error.detail === "object" &&
//           error.detail.message
//         ) {
//           errorMessage = error.detail.message;
//           errorDetails = error.detail;
//         } else if (error.detail && typeof error.detail === "object") {
//           errorMessage = JSON.stringify(error.detail);
//         }
//       } else if (error.errors) {
//         errorMessage = Object.values(error.errors).join(", ");
//       }

//       setReservationError({
//         message: errorMessage,
//         details: errorDetails || error,
//       });
//       setReservationPopupOpen(true);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePaymentOption = async (paymentMethod) => {
//     if (!razorpayLoaded) {
//       toast.error("Razorpay script is not loaded yet.");
//       return;
//     }

//     if (paymentMethod === "payNow") {
//       try {
//         setIsProcessing(true);
//         const bookingId = localStorage.getItem("reservationId");
//         const reservationBillingId = localStorage.getItem("billingId");
//         const unifiedBillingId = localStorage.getItem("unifiedBillingId");

//         if (!bookingId || !reservationBillingId) {
//           toast.error("Booking details not found. Please try again.");
//           setIsProcessing(false);
//           return;
//         }

//         // Prepare billing IDs for payment - include both reservation billing and unified billing
//         const billingIds = [reservationBillingId];
//         if (unifiedBillingId) {
//           billingIds.push(unifiedBillingId);
//         }

//         const apiUrl = `http://localhost:8000/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

//         const response = await fetch(apiUrl, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(billingIds),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(
//             errorData.detail ||
//               `Payment order creation failed: ${response.statusText}`
//           );
//         }

//         const orderData = await response.json();

//         if (orderData && orderData.razorpay_order_id) {
//           // Get the total amount from both billing sources
//           const reservationData = JSON.parse(
//             localStorage.getItem("reservationData")
//           );
//           const reservationBillingAmount = parseFloat(
//             reservationData.billing.final_amount
//           );

//           const unifiedBillingData = unifiedBillingId
//             ? JSON.parse(localStorage.getItem("unifiedBillingData"))
//             : null;

//           const unifiedBillingAmount = unifiedBillingData
//             ? parseFloat(unifiedBillingData.final_amount)
//             : 0;

//           const totalAmount = reservationBillingAmount + unifiedBillingAmount;

//           const options = {
//             key: REACT_APP_RAZORPAY_KEY, // Replace with your actual Razorpay key
//             amount: totalAmount * 100, // Convert to paise
//             currency: "INR",
//             name: "Hotel Booking",
//             description: "Hotel Reservation Payment",
//             order_id: orderData.razorpay_order_id,
//             handler: async function (response) {
//               const paymentDetails = {
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 billing_ids: billingIds,
//                 booking_id: bookingId,
//               };

//               try {
//                 const verificationResponse = await fetch(
//                   `http://localhost:8000/bq/api/razorpay/verify_payment_multiple`,
//                   {
//                     method: "POST",
//                     headers: {
//                       "Content-Type": "application/json",
//                       Accept: "application/json",
//                     },
//                     body: JSON.stringify(paymentDetails),
//                   }
//                 );

//                 if (!verificationResponse.ok) {
//                   throw new Error("Payment verification failed");
//                 }

//                 const verificationData = await verificationResponse.json();

//                 if (verificationData.status === "success") {
//                   toast.success("Payment successful and verified!");

//                   // Update both billing records
//                   await Promise.all([
//                     fetch(
//                       `http://localhost:8000/bq/api/update-billing-status`,
//                       {
//                         method: "POST",
//                         headers: {
//                           "Content-Type": "application/json",
//                         },
//                         body: JSON.stringify({
//                           billing_id: reservationBillingId,
//                           status: "paid",
//                           payment_method: "razorpay",
//                           payment_reference: response.razorpay_payment_id,
//                         }),
//                       }
//                     ),
//                     ...(unifiedBillingId
//                       ? [
//                           fetch(
//                             `http://localhost:8000/bq/api/update-billing-status`,
//                             {
//                               method: "POST",
//                               headers: {
//                                 "Content-Type": "application/json",
//                               },
//                               body: JSON.stringify({
//                                 billing_id: unifiedBillingId,
//                                 status: "paid",
//                                 payment_method: "razorpay",
//                                 payment_reference: response.razorpay_payment_id,
//                               }),
//                             }
//                           ),
//                         ]
//                       : []),
//                   ]);

//                   // Redirect to success page
//                   window.location.href = "/payment-success";
//                 } else {
//                   toast.error(
//                     "Payment verification failed. Please contact support."
//                   );
//                 }
//               } catch (error) {
//                 console.error("Verification error:", error);
//                 toast.error("Error verifying payment. Please try again.");
//               } finally {
//                 setIsProcessing(false);
//               }
//             },
//             prefill: {
//               name: `${firstName} ${lastName}`,
//               email: email,
//               contact: String(phoneNumber),
//             },
//             theme: {
//               color: "#3399cc",
//             },
//             notes: {
//               bookingId: bookingId,
//               billingIds: billingIds.join(","),
//             },
//           };

//           const rzp = new window.Razorpay(options);
//           rzp.open();
//         }
//       } catch (error) {
//         console.error("Payment error:", error);
//         toast.error(
//           error.message || "Error processing payment. Please try again."
//         );
//         setIsProcessing(false);
//       }
//     } else if (paymentMethod === "payLater") {
//       // For corporate guests, show "Bill to Company", for others "Pay at Front Desk"
//       if (isCorporateGuest) {
//         try {
//           setIsProcessing(true);
//           toast.info("Booking will be billed to your company.");
//           window.location.href = "/reservation-succesful";
//         } catch (error) {
//           toast.error("Error processing corporate billing. Please try again.");
//         } finally {
//           setIsProcessing(false);
//         }
//       } else {
//         try {
//           setIsProcessing(true);
//           toast.info("Payment deferred. Please pay at the front desk.");
//           window.location.href = "/reservation-succesful";
//         } catch (error) {
//           toast.error("Error processing check-in. Please try again.");
//         } finally {
//           setIsProcessing(false);
//         }
//       }
//     }
//   };

//   const handleAddAdditionalGuest = () => {
//     if (!formDetails || additionalGuests.length >= formDetails.adults - 1)
//       return;

//     const newGuest = {
//       firstName: "",
//       lastName: "",
//       phoneNumber: "",
//       email: "",
//       countryCode: "+91",
//       country: selectedCountry,
//     };

//     setAdditionalGuests([...additionalGuests, newGuest]);

//     setTimeout(() => {
//       const guestContainer = document.querySelector(".guest-list-container");
//       if (guestContainer) {
//         guestContainer.scrollTop = guestContainer.scrollHeight;
//       }
//     }, 100);
//   };

//   const handleAdditionalGuestChange = (index, field, value) => {
//     const updatedGuests = [...additionalGuests];
//     updatedGuests[index] = {
//       ...updatedGuests[index],
//       [field]: value,
//     };
//     setAdditionalGuests(updatedGuests);

//     let errorMsg = "";
//     if (
//       (field === "firstName" || field === "lastName") &&
//       !/^[A-Za-z]+$/.test(value)
//     ) {
//       errorMsg = `${
//         field === "firstName" ? "First" : "Last"
//       } name should contain only letters.`;
//     }

//     if (field === "phoneNumber") {
//       if (!/^\d+$/.test(value)) {
//         errorMsg = "Phone number must contain digits only.";
//       } else if (value.length !== 10 && value.length > 0) {
//         errorMsg = "Phone number must be exactly 10 digits long.";
//       }
//     }

//     const updatedErrors = [...guestErrors];
//     updatedErrors[index] = {
//       ...updatedErrors[index],
//       [field]: errorMsg,
//     };
//     setGuestErrors(updatedErrors);
//   };

//   const removeAdditionalGuest = (index) => {
//     const updatedGuests = [...additionalGuests];
//     updatedGuests.splice(index, 1);
//     setAdditionalGuests(updatedGuests);

//     const updatedErrors = [...guestErrors];
//     updatedErrors.splice(index, 1);
//     setGuestErrors(updatedErrors);
//   };

//   const saveAdditionalGuests = () => {
//     const hasErrors = additionalGuests.some((guest, index) => {
//       return (
//         !guest.firstName ||
//         !guest.lastName ||
//         (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
//         Object.values(guestErrors[index] || {}).some(Boolean)
//       );
//     });

//     if (hasErrors) {
//       toast.error(
//         "Please fill all required fields for additional guests correctly"
//       );
//       return;
//     }

//     // Ensure all additional guests have country data
//     const updatedGuests = additionalGuests.map((guest) => ({
//       ...guest,
//       country: guest.country || selectedCountry,
//     }));

//     setAdditionalGuests(updatedGuests);
//     toast.success("Additional guests saved successfully!");
//   };

//   const fallbackImages = [
//     "https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg",
//   ];

//   const nextImage = () => {
//     const images =
//       selectedRoom?.roomImages || selectedRoom?.roomImages || fallbackImages;
//     setCurrentImageIndex((prev) => (prev + 1) % images.length);
//   };

//   const prevImage = () => {
//     const images =
//       selectedRoom?.roomImages || selectedRoom?.roomImages || fallbackImages;
//     setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
//   };

//   const formatDateToDDMMYYYY = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "Invalid Date";
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = date.getFullYear();
//     return `${day}-${month}-${year}`;
//   };

//   // Calculate prices based on actual data
//   const basePricePerRoom =
//     selectedRoom?.basePrice || selectedRoom?.pricePerNight || 6500;
//   const roomsCount = formDetails?.rooms || 1;
//   const nights = bookingData?.daysCount || 1;
//   const basePrice = basePricePerRoom * roomsCount * nights;

//   // Calculate taxes for room (12% GST)
//   const roomTax = basePrice * 0.12;

//   // Calculate enhanced stay items total and tax
//   let enhancedStayTotal = 0;
//   let enhancedStayTax = 0;

//   if (enhancedStayItems?.items && enhancedStayItems.items.length > 0) {
//     enhancedStayItems.items.forEach((item) => {
//       const itemTotal = item.item_total || item.price * item.quantity;
//       enhancedStayTotal += itemTotal;
//       enhancedStayTax += itemTotal * 0.18; // 18% GST for enhanced stay items
//     });
//   }

//   const taxAmount = roomTax + enhancedStayTax;
//   const totalPrice = basePrice + enhancedStayTotal + taxAmount;

//   // Format date for display
//   const formatDisplayDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   // Loading state
//   if (!bookingData || !selectedRoom || !formDetails) {
//     return (
//       <div className="w-full px-10 py-4 mt-4 bg-white max-w-8xl mx-auto">
//         <div className="flex justify-center items-center h-64">
//           <div className="text-gray-600">Loading booking details...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full px-10 py-4 mt-4 bg-white max-w-8xl mx-auto">
//       <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-6 ml-4">
//         Reserve and Pay
//       </h1>

//       <div className="flex flex-col md:flex-row gap-6 mx-4">
//         {/* Left Column (2/3 width) */}
//         <div className="w-full md:w-2/3">
//           {/* Fully Refundable Card */}
//           <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
//             <div className="flex justify-between items-start mb-4">
//               <div className="flex items-start gap-2">
//                 <div className="bg-blue-100 p-2 rounded-full">
//                   <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-900 mt-1 md:text[12px] lg:text-[14px]">
//                     Room 1: {formDetails.adults} Adult
//                     {formDetails.adults !== 1 ? "s" : ""}
//                     {formDetails.children > 0 &&
//                       `, ${formDetails.children} Child${
//                         formDetails.children !== 1 ? "ren" : ""
//                       }`}
//                     , {selectedRoom?.roomName || "Deluxe Room"}
//                     {selectedRoom?.amenities &&
//                       selectedRoom.amenities.length > 0 && (
//                         <>
//                           , with{" "}
//                           {selectedRoom.amenities.map((amenity, index) => (
//                             <span
//                               key={index}
//                               className="inline-flex items-center gap-1 mr-1 text-green-600"
//                             >
//                               <ImCheckmark className="text-green-500 ml-1" />
//                               {amenity.name}
//                               {index !== selectedRoom.amenities.length - 1 &&
//                                 ","}
//                             </span>
//                           ))}
//                         </>
//                       )}
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-gray-100 px-3 py-1 rounded-md">
//                 <div className="text-sm font-bold text-gray-900">
//                   <span className="text-sm font-semibold text-gray-600">
//                     Total :
//                   </span>{" "}
//                   ₹
//                   {totalPrice.toLocaleString("en-IN", {
//                     minimumFractionDigits: 2,
//                   })}
//                 </div>
//               </div>
//             </div>

//             <div className="border-t border-gray-200 pt-2 pb-1">
//               <div className="flex items-start">
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5 text-black mt-0.5 mr-2 flex-shrink-0"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                     clipRule="evenodd"
//                   />
//                 </svg>

//                 <div>
//                   <p className="text-sm font-semibold text-gray-900">
//                     Fully refundable until 24 hours before check-in date
//                   </p>

//                   <p className="text-sm text-gray-600 mt-1">
//                     You can change or cancel this stay if plans change, Please
//                     refer to our{" "}
//                     <span
//                       className="text-blue-600 underline cursor-pointer hover:text-blue-800"
//                       onClick={() => setShowCancellationPolicy(true)}
//                     >
//                       cancellation policy
//                     </span>{" "}
//                   </p>
//                   <CancellationPolicy
//                     isOpen={showCancellationPolicy}
//                     onClose={() => setShowCancellationPolicy(false)}
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Guest Details Card */}
//           <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Guest Details
//             </h2>

//             {/* Primary Guest Section */}
//             <div className="mb-6">
//               <div className="flex items-center gap-2 mb-3">
//                 <span className="text-sm font-semibold text-gray-700">
//                   Room 1:
//                 </span>
//                 <span className="text-sm text-gray-700">
//                   {formDetails.adults} Adult{formDetails.adults > 1 ? "s" : ""}
//                   {formDetails.childrenAges.length > 0 ? (
//                     <>
//                       , {formDetails.childrenAges.length} Child
//                       {formDetails.childrenAges.length > 1 ? "ren" : ""} (
//                       {formDetails.childrenAges.map((age, index) => (
//                         <span key={index}>
//                           {age} yr{age > 1 ? "s" : ""}
//                           {index !== formDetails.childrenAges.length - 1 &&
//                             ", "}
//                         </span>
//                       ))}
//                       )
//                     </>
//                   ) : (
//                     ""
//                   )}
//                   {selectedRoom?.roomName && `, ${selectedRoom.roomName}`}
//                   {selectedRoom?.amenities?.length > 0 && (
//                     <>
//                       , with{" "}
//                       {selectedRoom.amenities.map((amenity, index) => (
//                         <span
//                           key={index}
//                           className="inline-flex items-center gap-1 mr-2 text-green-600 font-medium"
//                         >
//                           <ImCheckmark className="text-green-500 ml-1" />
//                           {amenity.name}
//                           {index !== selectedRoom.amenities.length - 1 && ","}
//                         </span>
//                       ))}
//                     </>
//                   )}
//                 </span>
//               </div>

//               <div className="space-y-4">
//                 <div className="grid grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       First name*
//                     </label>
//                     <input
//                       type="text"
//                       value={firstName}
//                       placeholder="Enter first name"
//                       onChange={handleFirstNameChange}
//                       className="w-full p-2 border text-transform: capitalize  border-gray-300 rounded-md text-sm"
//                     />
//                     <div className="h-2">
//                       {errors.firstName && (
//                         <p className="text-[10px] text-red-500 mt-1">
//                           {errors.firstName}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Last name*
//                     </label>
//                     <input
//                       type="text"
//                       value={lastName}
//                       placeholder="Enter last name"
//                       onChange={handleLastNameChange}
//                       className="w-full p-2 border text-transform: capitalize border-gray-300 rounded-md text-sm"
//                     />
//                     <div className="h-2">
//                       {errors.lastName && (
//                         <p className="text-[10px] text-red-500 mt-1">
//                           {errors.lastName}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Mobile number*
//                     </label>
//                     <div className="flex gap-2">
//                       <select
//                         value={countryCode}
//                         onChange={(e) => setCountryCode(e.target.value)}
//                         className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
//                       >
//                         <option value="+91">+91 (IND)</option>
//                         <option value="+1">+1 (US)</option>
//                       </select>
//                       <input
//                         type="number"
//                         value={phoneNumber}
//                         onChange={handlePhoneNumberChange}
//                         className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                         placeholder="Please enter a valid phone number"
//                       />
//                     </div>
//                     <div className="h-2">
//                       {errors.phoneNumber && (
//                         <p className="text-[10px] text-red-500 mt-1">
//                           {errors.phoneNumber}
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   <div className="">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Email*
//                     </label>
//                     <input
//                       type="text"
//                       value={email}
//                       placeholder="Enter email"
//                       onChange={handleEmailChange}
//                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                     />
//                     <div className="h-2">
//                       {errors.email && (
//                         <p className="text-[10px] text-red-500 mt-1">
//                           {errors.email}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Profile Type */}
//                   <div className="mb-1">
//                     <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
//                       Profile Type*
//                     </label>
//                     <select
//                       value={clientType}
//                       onChange={handleClientTypeChange}
//                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                       disabled={isCorporateGuest}
//                     >
//                       <option value="Leisure">Leisure</option>
//                       <option value="Corporate">Corporate</option>
//                     </select>
//                   </div>

//                   {/* Country Select (with flags) */}
//                   <div className="mb-1 relative">
//                     <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
//                       Country*
//                     </label>
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() => setIsOpen(!isOpen)}
//                         className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
//                       >
//                         <span className="flex items-center gap-2">
//                           <img
//                             src={selectedCountry.flag}
//                             alt={selectedCountry.name}
//                             className="w-5 h-4 object-cover rounded-sm"
//                           />
//                           {selectedCountry.name}
//                         </span>
//                         <span className="ml-2 font-semibold">v</span>
//                       </button>

//                       {isOpen && (
//                         <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                           {countries.map((country) => (
//                             <div
//                               key={country.code}
//                               onClick={() => {
//                                 setSelectedCountry(country);
//                                 setIsOpen(false);
//                               }}
//                               className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                             >
//                               <img
//                                 src={country.flag}
//                                 alt={country.name}
//                                 className="w-5 h-4 object-cover rounded-sm"
//                               />
//                               {country.name}
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   {/* Add Corporate Fields Section */}
//                   {clientType === "Corporate" && (
//                     <div className=" p-4 bg-white rounded-lg border border-gray-200">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                         Company Details
//                       </h3>
//                       <div className="grid grid-cols-1 gap-2">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Company Name*
//                           </label>
//                           <input
//                             type="text"
//                             value={companyName}
//                             onChange={(e) => setCompanyName(e.target.value)}
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
//                             placeholder="Enter company name"
//                             disabled
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Company ID*
//                           </label>
//                           <input
//                             type="text"
//                             value={companyId}
//                             onChange={(e) => setCompanyId(e.target.value)}
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
//                             placeholder="Enter company ID"
//                             disabled
//                           />
//                         </div>
//                       </div>
//                       <p className="text-xs font-semibold text-gray-900 bg-yellow-200 px-2 py-1 rounded-md mt-2">
//                         Note: Corporate details can't be edited here. Update
//                         them in your profile to reflect changes.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6">
//               <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
//                 {additionalGuests.map((guest, index) => (
//                   <div
//                     key={index}
//                     className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
//                   >
//                     <button
//                       onClick={() => removeAdditionalGuest(index)}
//                       className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//                     >
//                       <FiMinus className="w-4 h-4" />
//                     </button>

//                     <h4 className="text-md font-semibold text-gray-700 mb-3">
//                       Guest {index + 2}
//                     </h4>

//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           First name*
//                         </label>
//                         <input
//                           type="text"
//                           value={guest.firstName}
//                           onChange={(e) =>
//                             handleAdditionalGuestChange(
//                               index,
//                               "firstName",
//                               e.target.value
//                             )
//                           }
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                           placeholder="Enter first name"
//                         />
//                         <div className="h-2">
//                           {guestErrors[index]?.firstName && (
//                             <p className="text-[10px] text-red-500 mt-1">
//                               {guestErrors[index].firstName}
//                             </p>
//                           )}
//                         </div>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Last name*
//                         </label>
//                         <input
//                           type="text"
//                           value={guest.lastName}
//                           onChange={(e) =>
//                             handleAdditionalGuestChange(
//                               index,
//                               "lastName",
//                               e.target.value
//                             )
//                           }
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                           placeholder="Enter last name"
//                         />
//                         <div className="h-2">
//                           {guestErrors[index]?.lastName && (
//                             <p className="text-[10px] text-red-500 mt-1">
//                               {guestErrors[index].lastName}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                       <div className="mt-1">
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Mobile number (optional)
//                         </label>
//                         <div className="flex gap-2">
//                           <select
//                             value={guest.countryCode}
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 index,
//                                 "countryCode",
//                                 e.target.value
//                               )
//                             }
//                             className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
//                           >
//                             <option value="+91">+91 (IND)</option>
//                             <option value="+1">+1 (US)</option>
//                           </select>
//                           <input
//                             type="number"
//                             value={guest.phoneNumber}
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 index,
//                                 "phoneNumber",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Please enter a valid mobile number"
//                           />
//                         </div>
//                         <div className="h-2">
//                           {guestErrors[index]?.phoneNumber && (
//                             <p className="text-[10px] text-red-500 mt-1">
//                               {guestErrors[index].phoneNumber}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                       <div className="relative">
//                         <label className="block text-sm font-medium text-gray-700 mt-1 mb-1">
//                           Country
//                         </label>
//                         <div className="relative">
//                           <button
//                             type="button"
//                             onClick={() => toggleGuestDropdown(index)}
//                             className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
//                           >
//                             <span className="flex items-center gap-2">
//                               <img
//                                 src={guest.country?.flag || countries[0].flag}
//                                 alt={guest.country?.name || countries[0].name}
//                                 className="w-5 h-4 object-cover rounded-sm"
//                               />
//                               {guest.country?.name || countries[0].name}
//                             </span>
//                             <span className="ml-2 font-semibold">v</span>
//                           </button>

//                           {guestDropdownStates[index] && (
//                             <div className="absolute bottom-full mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                               {countries.map((country) => (
//                                 <div
//                                   key={country.code}
//                                   onClick={() => {
//                                     handleAdditionalGuestChange(
//                                       index,
//                                       "country",
//                                       country
//                                     );
//                                     toggleGuestDropdown(index);
//                                   }}
//                                   className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                                 >
//                                   <img
//                                     src={country.flag}
//                                     alt={country.name}
//                                     className="w-5 h-4 object-cover rounded-sm"
//                                   />
//                                   {country.name}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex justify-between items-center py-3">
//                 <div className="relative group w-fit">
//                   <button
//                     onClick={handleAddAdditionalGuest}
//                     disabled={additionalGuests.length >= formDetails.adults - 1}
//                     className={`flex items-center gap-2 pb-4 ${
//                       additionalGuests.length >= formDetails.adults - 1
//                         ? "text-gray-400 cursor-not-allowed"
//                         : "text-blue-600 hover:text-blue-800"
//                     }`}
//                   >
//                     <FiPlus className="w-4 h-4" />
//                     Additional guest
//                   </button>
//                   {additionalGuests.length >= formDetails.adults - 1 && (
//                     <div className="absolute whitespace-nowrap bottom-full mb-2 left-52 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
//                       To add more guests, please increase the number of adults
//                       in your reservation
//                     </div>
//                   )}
//                 </div>

//                 {additionalGuests.length > 0 && (
//                   <button
//                     onClick={saveAdditionalGuests}
//                     className="bg-black hover:bg-gray-700 text-white px-10 py-2 rounded-md text-sm font-medium ml-4"
//                   >
//                     Save
//                   </button>
//                 )}
//               </div>
//             </div>

//             <div
//               className="border-t pt-6 cursor-pointer"
//               onClick={() => setSpecialRequestOpen(true)}
//             >
//               <h3 className="text-md font-bold text-gray-800 flex items-center justify-between">
//                 Special Requests (optional)
//                 <FiChevronRight className="text-gray-500" />
//               </h3>
//               {specialRequest && (
//                 <p className="text-sm text-gray-600 mt-2 line-clamp-2">
//                   {specialRequest.length > 60
//                     ? `${specialRequest.substring(0, 60)}...`
//                     : specialRequest}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Selected Amenities Card */}
//           <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-2">
//               Selected Enhanced Items
//             </h2>

//             {enhancedStayItems?.items && enhancedStayItems.items.length > 0 ? (
//               <ul className="space-y-2">
//                 {enhancedStayItems.items.map((item, index) => (
//                   <li key={index} className="flex justify-between py-1">
//                     <span>
//                       {item.name} × {item.quantity}
//                     </span>
//                     <span>
//                       ₹
//                       {(
//                         item.item_total || item.price * item.quantity
//                       ).toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-sm">
//                 No enhanced stay items selected.
//               </p>
//             )}
//           </div>

//           {/* Important Information Card  */}
//           <div className="bg-white border rounded-lg shadow-sm p-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Important information
//             </h2>
//             <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
//               <li>
//                 Cancel your reservation at least 24 hours before your scheduled
//                 check-in time to avoid cancellation fees
//               </li>
//               <li>
//                 Cancellations made within 24 hours of the check-in time, as well
//                 as no-shows, will incur a charge equivalent to first night's
//                 stay.
//               </li>
//               <li>
//                 Guests are requested to present a valid government-issued photo
//                 ID at the time of check-in. Foreign nationals are requested to
//                 carry a valid passport and visa for verification.
//               </li>
//               <li>
//                 Guests may check in from 1:00 PM onwards and are requested to
//                 check out by 1:00 PM.
//               </li>
//               <li>
//                 Special requests (early check-in, late check-out, amenities) are
//                 subject to availability and may incur additional charges.
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Right Column (1/3 width) - Sticky Booking Summary */}
//         <div className="w-full md:w-1/3">
//           <div className="rounded-2xl border border-gray-200 shadow-sm bg-white sticky top-4">
//             {/* Image slider section */}
//             <div className="relative w-full h-60 overflow-hidden rounded-t-2xl">
//               {(selectedRoom?.roomImages?.length > 0
//                 ? selectedRoom.roomImages
//                 : fallbackImages
//               ).map((img, index) => (
//                 <img
//                   key={index}
//                   src={img}
//                   alt={`Room ${index + 1}`}
//                   className={`w-full h-full object-cover ${
//                     index === currentImageIndex ? "block" : "hidden"
//                   }`}
//                 />
//               ))}
//               {/* Slider controls */}
//               <button
//                 onClick={prevImage}
//                 className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
//               >
//                 &lt;
//               </button>
//               <button
//                 onClick={nextImage}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
//               >
//                 &gt;
//               </button>
//             </div>

//             {/* Room info section */}
//             <div className="p-6">
//               <div className="pt-2">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Check-in:
//                     </h3>
//                     <p className="text-gray-600 text-sm ">
//                       {formatDisplayDate(bookingData.checkInDate)} (11:00 AM)
//                     </p>
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Check-out:
//                     </h3>
//                     <p className="text-gray-600 text-sm">
//                       {formatDisplayDate(bookingData.checkOutDate)} (1:00 PM)
//                     </p>
//                   </div>
//                 </div>

//                 <div className="border-t pt-4 mb-4">
//                   <h3 className="text-lg font-bold text-gray-800 mb-2">
//                     Price Details
//                   </h3>

//                   <div className="flex justify-between text-sm text-gray-700 mb-1">
//                     <span>
//                       {roomsCount} Room{roomsCount > 1 ? "s" : ""} × {nights}{" "}
//                       Night{nights > 1 ? "s" : ""}
//                     </span>
//                     <span>
//                       ₹
//                       {basePrice.toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>

//                   {enhancedStayItems?.items &&
//                     enhancedStayItems.items.length > 0 && (
//                       <div className="">
//                         <ul className="text-sm text-gray-700">
//                           {enhancedStayItems.items.map((item, index) => (
//                             <li
//                               key={index}
//                               className="flex justify-between py-1"
//                             >
//                               <span>
//                                 {item.name} × {item.quantity}
//                               </span>
//                               <span>
//                                 ₹
//                                 {(
//                                   item.item_total || item.price * item.quantity
//                                 ).toLocaleString("en-IN", {
//                                   minimumFractionDigits: 2,
//                                 })}
//                               </span>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}

//                   <div className="flex justify-between text-sm text-gray-700 mt-3 border-t pt-2">
//                     <span className="font-semibold">Subtotal:</span>
//                     <span>
//                       ₹
//                       {(basePrice + enhancedStayTotal).toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>
//                   <div className="mt-3 mb-1">
//                     <div className="flex justify-between items-center">
//                       <div className="flex items-center gap-1">
//                         <span className="text-sm font-semibold text-gray-800">
//                           Total Taxes and Charges
//                         </span>
//                         <button
//                           onClick={() => setShowTaxDetails(!showTaxDetails)}
//                           className="text-gray-400 hover:text-gray-600 focus:outline-none"
//                         >
//                           {showTaxDetails ? <FiChevronUp /> : <FiChevronDown />}
//                         </button>
//                       </div>

//                       <span className="text-sm text-gray-700">
//                         ₹
//                         {taxAmount.toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </span>
//                     </div>

//                     {showTaxDetails && (
//                       <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
//                         <div className="mb-2">
//                           <div className="flex justify-between">
//                             <div className="flex items-center gap-1">
//                               <span>Room Charges (12%)</span>
//                               <div className="group relative">
//                                 <FiInfo className="text-gray-400 cursor-pointer" />
//                                 <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
//                                   <div className="flex justify-between mb-1">
//                                     <span>CGST (6%)</span>
//                                     <span>
//                                       ₹
//                                       {(basePrice * 0.06).toLocaleString(
//                                         "en-IN",
//                                         { minimumFractionDigits: 2 }
//                                       )}
//                                     </span>
//                                   </div>
//                                   <div className="flex justify-between">
//                                     <span>SGST (6%)</span>
//                                     <span>
//                                       ₹
//                                       {(basePrice * 0.06).toLocaleString(
//                                         "en-IN",
//                                         { minimumFractionDigits: 2 }
//                                       )}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                             <span>
//                               ₹
//                               {(basePrice * 0.12).toLocaleString("en-IN", {
//                                 minimumFractionDigits: 2,
//                               })}
//                             </span>
//                           </div>
//                         </div>

//                         {enhancedStayItems?.items &&
//                           enhancedStayItems.items.map((item, index) => {
//                             const itemTotal =
//                               item.item_total || item.price * item.quantity;
//                             const itemTax = itemTotal * 0.18;
//                             return (
//                               <div key={index} className="mb-2">
//                                 <div className="flex justify-between">
//                                   <div className="flex items-center gap-1">
//                                     <span>{item.name} (18%)</span>
//                                     <div className="group relative">
//                                       <FiInfo className="text-gray-400 cursor-pointer" />
//                                       <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
//                                         <div className="flex justify-between mb-1">
//                                           <span>CGST (9%)</span>
//                                           <span>
//                                             ₹
//                                             {(itemTax / 2).toLocaleString(
//                                               "en-IN",
//                                               { minimumFractionDigits: 2 }
//                                             )}
//                                           </span>
//                                         </div>
//                                         <div className="flex justify-between">
//                                           <span>SGST (9%)</span>
//                                           <span>
//                                             ₹
//                                             {(itemTax / 2).toLocaleString(
//                                               "en-IN",
//                                               { minimumFractionDigits: 2 }
//                                             )}
//                                           </span>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>
//                                   <span>
//                                     ₹
//                                     {itemTax.toLocaleString("en-IN", {
//                                       minimumFractionDigits: 2,
//                                     })}
//                                   </span>
//                                 </div>
//                               </div>
//                             );
//                           })}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="border-t pt-4 mt-auto">
//                   <div className="flex justify-between items-center">
//                     <h3 className="text-lg font-bold text-gray-800">Total</h3>
//                     <span className="text-xl font-bold text-gray-800">
//                       ₹
//                       {totalPrice.toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex items-start mt-4 mb-6 text-xs text-gray-500">
//                   <input
//                     type="checkbox"
//                     id="acknowledgement"
//                     className="size-6 mr-1 mb-2"
//                     checked={isAcknowledged}
//                     onChange={(e) => setIsAcknowledged(e.target.checked)}
//                   />
//                   <label htmlFor="acknowledgement" className="mt-1">
//                     By proceeding,I confirm that I have read and agree to
//                     the&nbsp;
//                     <button
//                       type="button"
//                       onClick={() => setShowLegalPopup(true)}
//                       className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
//                     >
//                       Terms and Conditions
//                     </button>
//                     &nbsp;and&nbsp;
//                     <button
//                       type="button"
//                       onClick={() => setShowLegalPopup(true)}
//                       className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
//                     >
//                       Privacy Policy
//                     </button>
//                   </label>
//                 </div>

//                 <LegalDocumentsPopup
//                   isOpen={showLegalPopup}
//                   onClose={() => setShowLegalPopup(false)}
//                 />
//                 {checkboxError && (
//                   <p className="text-red-500 text-xs mb-2">
//                     Please acknowledge the terms and conditions to proceed
//                   </p>
//                 )}

//                 <button
//                   onClick={handleBooking}
//                   className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-70"
//                   disabled={isLoading}
//                 >
//                   {isLoading ? "Processing..." : "Reserve Now"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Popup Modals */}
//       {/* Popup Modals */}
//       {reservationPopupOpen && (
//         <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
//           <div className="bg-white border border-gray-300 w-4/5 sm:w-2/5 p-8 rounded-lg shadow-xl relative">
//             <button
//               className="absolute top-3 right-4 text-red-600 text-xl"
//               onClick={() => setReservationPopupOpen(false)}
//             >
//               ✕
//             </button>

//             {reservationError ? (
//               <div>
//                 <h2 className="text-center text-2xl font-bold text-red-600">
//                   Reservation Failed
//                 </h2>

//                 {/* Always render error.message as a string */}
//                 <div className="mt-4">
//                   <h3 className="text-center text-lg font-semibold text-gray-600 mb-6">
//                     We're sorry, but something went wrong during the booking
//                     process.
//                   </h3>
//                   <p className="text-center text-base font-semibold text-gray-500 mb-6">
//                     <span className="text-red-600">
//                       {typeof reservationError === "object"
//                         ? reservationError.message
//                         : String(reservationError)}
//                     </span>
//                   </p>

//                   {/* If there are details, show them properly */}
//                   {reservationError &&
//                     typeof reservationError === "object" &&
//                     reservationError.details && (
//                       <div className="mt-4 bg-gray-50 p-4 rounded-md">
//                         <h4 className="font-semibold text-gray-700 mb-2">
//                           Error Details:
//                         </h4>
//                         <div className="text-sm text-gray-600">
//                           {reservationError.details.conflicts &&
//                             Array.isArray(
//                               reservationError.details.conflicts
//                             ) && (
//                               <div className="mb-3">
//                                 <p className="font-medium">Conflicts:</p>
//                                 <ul className="list-disc pl-5 mt-1">
//                                   {reservationError.details.conflicts.map(
//                                     (conflict, index) => (
//                                       <li key={index}>
//                                         {conflict.message ||
//                                           JSON.stringify(conflict)}
//                                       </li>
//                                     )
//                                   )}
//                                 </ul>
//                               </div>
//                             )}

//                           {reservationError.details.resolution && (
//                             <p className="mb-2">
//                               <span className="font-medium">Resolution:</span>{" "}
//                               {reservationError.details.resolution}
//                             </p>
//                           )}

//                           {reservationError.details.contact_support && (
//                             <p className="mb-2">
//                               <span className="font-medium">
//                                 Contact Support:
//                               </span>{" "}
//                               {reservationError.details.contact_support}
//                             </p>
//                           )}

//                           {reservationError.details.support_contact && (
//                             <div className="mt-3">
//                               <p className="font-medium">Support Contact:</p>
//                               <p className="mt-1">
//                                 Phone:{" "}
//                                 {reservationError.details.support_contact
//                                   .phone || "N/A"}
//                               </p>
//                               <p>
//                                 Email:{" "}
//                                 {reservationError.details.support_contact
//                                   .email || "N/A"}
//                               </p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                   <div className="text-center mt-4">
//                     <p className="text-sm font-semibold text-gray-500">
//                       Please try again or contact us for assistance.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <div>
//                 {/* Success content remains the same */}
//                 <div className="mb-4 mt-5">
//                   <p className="text-md font-semibold ">
//                     Hello,{" "}
//                     <span className="capitalize">
//                       {firstName} {lastName}
//                     </span>{" "}
//                     you've reached last step of your reservation
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-3 gap-2 mb-6">
//                   <div className="rounded-lg">
//                     <p className="text-md font-semibold text-gray-700">
//                       Reservation Number
//                     </p>
//                     <p className="text-md font-mono">
//                       {localStorage.getItem("orderId") || "ORD123456"}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Check-in
//                     </p>
//                     <p className="text-md">
//                       {formatDisplayDate(bookingData.checkInDate)}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Check-out
//                     </p>
//                     <p className="text-md">
//                       {formatDisplayDate(bookingData.checkOutDate)}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="bg-blue-50 p-2 rounded-md mb-6">
//                   <p className="text-center text-md font-semibold text-black">
//                     Please read a details carefully and make a payment of{" "}
//                     <span className="text-blue-500">
//                       ₹{totalPrice.toLocaleString("en-IN")}
//                     </span>{" "}
//                   </p>
//                 </div>

//                 <div className="flex justify-center gap-4 mt-6">
//                   <button
//                     onClick={() => handlePaymentOption("payLater")}
//                     className="w-full text-lg font-semibold bg-black text-white px-4 py-2 rounded-lg hover:text-gray-200"
//                   >
//                     {isCorporateGuest ? "Bill to Company" : "Pay at Front Desk"}
//                   </button>

//                   <button
//                     onClick={() => handlePaymentOption("payNow")}
//                     className="w-full text-lg font-semibold bg-gradient-to-r bg-black text-white px-4 py-2 rounded-lg hover:text-gray-300"
//                   >
//                     Pay Now
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       <SpecialRequest
//         isOpen={specialRequestOpen}
//         onClose={() => setSpecialRequestOpen(false)}
//         request={specialRequest}
//         setRequest={setSpecialRequest}
//       />
//       <ToastContainer />
//     </div>
//   );
// };

// export default PaymentPage;
