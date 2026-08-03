import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import countries from './countries';
import { useNavigate } from 'react-router-dom';
import { FiInfo } from 'react-icons/fi';
import { AiOutlineWarning } from 'react-icons/ai';
import { z } from 'zod';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import { FiChevronRight, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import SpecialRequest from '../pages/SpecialRequest';
import { ImCheckmark } from 'react-icons/im';
import { MdOutlineBedroomChild } from 'react-icons/md';
import LegalDocumentsPopup from './LegalDocumentsPopup';
import { addAdditionalGuest, updateAdditionalGuest, removeAdditionalGuest } from './redux/action';
import CancellationPolicy from './CancellationPolicy';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const getGuestData = async () => {
  const accessToken = Cookies.get('access_token');

  // If no access token, user is not logged in - return null to indicate guest user
  if (!accessToken) {
    console.log('No access token found - treating as guest user');
    return null;
  }

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

const BookingSummary = () => {
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
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isCorporateGuest, setIsCorporateGuest] = useState(false);

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
  });
  const [guestErrors, setGuestErrors] = useState([]);

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [unifiedBillingId, setUnifiedBillingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLegalPopup, setShowLegalPopup] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAddGuestCountry, setselectedAddGuestCountry] = useState(countries[0]);
  const [guestDropdownStates, setGuestDropdownStates] = useState({});
  const [gstNumber, setGstNumber] = useState('');
  const [gstErrors, setGstErrors] = useState('');
  const { specialRateType, corporateCode, seniorCitizenDiscount, promoCode, isSpecialRateApplied } =
    useSelector((state) => state.specialRates || {});

  const validateName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return 'Please enter a name';
    }

    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 60) {
      return 'Name cannot exceed 60 characters';
    }

    if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
      const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
      if (invalidChars) {
        const uniqueChars = [...new Set(invalidChars)];
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
      return 'Only letters are allowed (no special characters)  ';
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

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux State
  const { checkInDate, checkOutDate, daysCount } = useSelector((state) => state.selectedDates);
  const additionalGuests = useSelector((state) => state.formDetails.additionalGuests);

  const { selectedRoom } = useSelector((state) => state.roomtype);
  console.log(selectedRoom);
  const { rooms, adults, children, infants, childrenAges } = useSelector(
    (state) => state.formDetails
  );

  const togglePopup = () => setPopupOpen(!popupOpen);

  const selectedAmenities = useSelector((state) => state.amenities.selectedAmenities);

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

    if (clientType === 'Corporate' && newClientType === 'Leisure' && corporateCode) {
      toast.error(
        'You cannot switch to Leisure while a corporate rate code is applied. Please remove the corporate rate code first or stay as Corporate.'
      );
      return;
    }

    if (newClientType === 'Corporate') {
      if (!corporateCode) {
        toast.error(
          'Corporate booking requires a contract code. Please apply a corporate rate first.'
        );
        return;
      }

      if (!companyName || !companyId) {
        toast.error(
          'You need to have company details (Company Name and Company ID) in your profile to book as Corporate. Please update your profile or select Leisure.'
        );
        return;
      }
    }

    setClientType(newClientType);

    if (newClientType === 'Corporate') {
      setGstNumber('');
      setGstErrors('');
      setIsCorporateGuest(true);
    } else if (newClientType === 'Leisure') {
      setIsCorporateGuest(false);
    }
  };

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

  useEffect(() => {
    const checkCorporateMismatch = () => {
      if (corporateCode && clientType === 'Leisure') {
        toast.warning(
          'Corporate rate code applied but profile type is set to Leisure. Please either switch to Corporate profile type or remove the corporate rate code before reservation.',
          { autoClose: 5000 }
        );
      }
    };

    const timer = setTimeout(checkCorporateMismatch, 500);
    return () => clearTimeout(timer);
  }, [corporateCode, clientType]);

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    const error = validateName(value, true);
    setErrors((prev) => ({ ...prev, firstName: error }));
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    const error = validateName(value, false);
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

  const validateGST = (gst) => {
    if (!gst) return '';

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

    if (!gstRegex.test(gst)) {
      return 'Please enter a valid GST number';
    }

    return '';
  };

  const handleGstChange = (e) => {
    const value = e.target.value.toUpperCase();
    setGstNumber(value);
    const error = validateGST(value);
    setGstErrors(error);
  };

  const guestDetailsSchema = z.object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    phoneNumber: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return /^\d+$/.test(val) && val.length === 10;
        },
        {
          message: 'Phone Number must be exactly 10 digits and contain only digits.',
        }
      ),
    email: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(val);
        },
        {
          message: 'Please enter a valid email address.',
        }
      ),
    countryCode: z
      .string()
      .min(1, 'Country Code is required.')
      .refine((code) => countryCodeEnum.includes(code), {
        message: 'Invalid country code. Please select a valid country code.',
      }),
  });

  const createUnifiedBilling = async (bookingId) => {
    try {
      const items = selectedAmenities.map((amenity) => {
        if (amenity.type === 'food') {
          return {
            item_type: 'food',
            items: [
              {
                foodid: amenity.id,
                quantity: amenity.quantity,
              },
            ],
          };
        } else {
          return {
            item_type: amenity.type || 'amenity',
            itemid: parseInt(amenity.id),
            quantity: amenity.quantity,
            urgencylevel: 'Normal',
            scheduledtime: new Date().toISOString(),
            specialinstructions: '',
          };
        }
      });

      const payload = {
        bookingid: bookingId,
        items: items,
      };

      const response = await fetch(`${CQ_BASE_URL}/bq/api/create-unified-billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Unified billing failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating unified billing:', error);
      throw error;
    }
  };

  const handleBooking = async () => {
    console.log('=== handleBooking START ===');

    if (!isAcknowledged) {
      console.log('Booking blocked: Terms not acknowledged');
      setCheckboxError(true);
      toast.error('Please acknowledge the terms and conditions to proceed');
      return;
    }

    if (corporateCode && clientType === 'Leisure') {
      console.log('Booking blocked: Corporate code mismatch');
      setReservationError({
        detail: {
          message:
            "You have applied a corporate rate code but selected 'Leisure' as profile type. Please either select 'Corporate' as profile type or remove the corporate rate code to proceed as Leisure guest.",
          title: 'Profile Type Mismatch',
          type: 'corporate_code_mismatch',
          solution:
            'Switch to Corporate profile type or go back to room selection to remove the corporate rate code.',
        },
      });
      setReservationPopupOpen(true);
      return;
    }

    if (clientType === 'Corporate') {
      console.log('Corporate validation started...');

      if (!corporateCode) {
        console.log('Booking blocked: Corporate clientType but no corporateCode');
        setReservationError({
          detail: {
            message:
              "You have selected 'Corporate' as profile type but no corporate rate code has been applied. Please apply a corporate rate code first by going back to room selection, or switch to 'Leisure' profile type.",
            title: 'Corporate Rate Code Required',
            type: 'corporate_rate_required',
            solution:
              'Go back to room selection and enter a valid corporate contract code, or switch to Leisure profile type.',
          },
        });
        setReservationPopupOpen(true);
        setIsLoading(false);
        return;
      }

      if (!companyName || !companyId) {
        console.log('Booking blocked: Corporate clientType but missing company details');
        setReservationError({
          detail: {
            message:
              'To book as Corporate, you must have Company Name and Corporate ID in your profile. Please update your profile with company details or switch to Leisure profile type.',
            title: 'Company Details Required',
            type: 'company_details_required',
            solution:
              'Go to your profile and add your company information under Corporate Details section, or switch to Leisure profile type.',
          },
        });
        setReservationPopupOpen(true);
        setIsLoading(false);
        return;
      }
      console.log('Corporate validation passed');
    }

    if (adults > 1 && additionalGuests.length < adults - 1) {
      console.log(
        `Booking blocked: Additional guests needed. Adults: ${adults}, AdditionalGuests: ${additionalGuests.length}`
      );
      setReservationError({
        detail: {
          message: `Please add additional guest information. You selected ${adults} adult(s) but have only provided information for ${
            additionalGuests.length + 1
          } guest(s).`,
          title: 'Additional Guest Information Required',
          type: 'guest_info_required',
        },
      });
      setReservationPopupOpen(true);
      return;
    }

    if (additionalGuests.length > 0) {
      const incompleteGuests = additionalGuests.filter((guest, index) => {
        return !guest.firstName || !guest.lastName;
      });

      if (incompleteGuests.length > 0) {
        console.log(`Booking blocked: Incomplete guest info`);
        setReservationError({
          detail: {
            message: `Please complete all required fields for additional guests. First name and last name are mandatory for each additional guest.`,
            title: 'Incomplete Guest Information',
            type: 'incomplete_guest_info',
          },
        });
        setReservationPopupOpen(true);
        return;
      }
    }

    setIsLoading(true);
    setCheckboxError(false);

    const getRoomTaxApplicable = () => {
      if (selectedRoom?.tax_applicable !== undefined) {
        return selectedRoom.tax_applicable;
      }
      return 0;
    };

    const roomTaxApplicable = getRoomTaxApplicable();
    const basePricePerRoom = selectedRoom?.dynamicPrice || selectedRoom?.baseprice || 10000;
    const basePrice = basePricePerRoom * rooms;
    const roomTax = roomTaxApplicable * rooms;

    let amenitiesTotal = 0;
    let amenitiesTax = 0;

    selectedAmenities.forEach((amenity) => {
      amenitiesTotal += amenity.totalPrice;
      amenitiesTax += (amenity.totalPrice * amenity.value) / 100;
    });

    const taxAmount = roomTax + amenitiesTax;
    const totalPrice = basePrice + amenitiesTotal + taxAmount;

    localStorage.setItem(
      'priceDetails',
      JSON.stringify({
        subtotal: basePrice + amenitiesTotal,
        taxes: taxAmount,
        total: totalPrice,
        basePrice: basePrice,
        amenitiesTotal: amenitiesTotal,
      })
    );

    // ========== FIXED: Handle both logged-in and guest users ==========
    const loggedInGuestData = await getGuestData();
    console.log('Logged-in guest data fetched:', loggedInGuestData);

    // For guest users (not logged in), use the form data
    // For logged-in users, use the API data but allow form data to override if provided
    const guestData = {
      first_name: firstName || loggedInGuestData?.first_name || '',
      last_name: lastName || loggedInGuestData?.last_name || '',
      email: email || loggedInGuestData?.email || '',
      phone_number: phoneNumber || loggedInGuestData?.phone_number || '',
      country_code: countryCode || loggedInGuestData?.country_code || '+91',
      client_type: clientType || loggedInGuestData?.client_type || 'Leisure',
      company_id: companyId || loggedInGuestData?.company_id || '',
      company_name: companyName || loggedInGuestData?.company_name || '',
      is_corporate: clientType === 'Corporate' && !!corporateCode,
    };

    console.log('Final guest data for booking:', guestData);

    // Validate that we have at least the minimum required info for guest users
    if (!guestData.first_name || !guestData.last_name) {
      console.log('Booking blocked: Missing required guest information');
      setReservationError({
        detail: {
          message: 'Please provide your first name and last name to continue.',
          title: 'Guest Information Required',
          type: 'guest_info_required',
        },
      });
      setReservationPopupOpen(true);
      setIsLoading(false);
      return;
    }

    const formData = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: String(phoneNumber),
      email: email,
      clientType: clientType,
      countryCode: countryCode,
      ...(clientType === 'Corporate' && {
        companyName: companyName,
        companyId: companyId,
      }),
    };

    const hasInvalidAdditionalGuests = additionalGuests.some((guest, index) => {
      return (
        !guest.firstName ||
        !guest.lastName ||
        (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
        Object.values(guestErrors[index] || {}).some(Boolean)
      );
    });

    if (hasInvalidAdditionalGuests) {
      console.log('Booking blocked: Invalid additional guests found');
      toast.error('Please fill all required fields for additional guests correctly');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Validating form data with zod schema...');
      guestDetailsSchema.parse(formData);
      setGuestValidationErrors({});
      console.log('Form data validation passed');

      const formattedCheckInDate = checkInDate
        ? new Date(checkInDate).toISOString().split('T')[0]
        : 'N/A';
      const formattedCheckOutDate = checkOutDate
        ? new Date(checkOutDate).toISOString().split('T')[0]
        : 'N/A';

      const seniorDiscount = selectedRoom?.senior_discount;
      const isSeniorDiscountApplied = seniorDiscount?.applied === true;
      const existingOrderId = localStorage.getItem('orderId') || '';

      const bookingDetails = {
        guest: {
          firstname: guestData.first_name,
          lastname: guestData.last_name,
          phonenumber: guestData.phone_number ? parseInt(guestData.phone_number) : null,
          emailid: guestData.email,
          countrycode: guestData.country_code,
          clienttype: guestData.client_type,
          country: selectedCountry?.name || 'India',
          gst_number: gstNumber || null,
          ...(clientType === 'Corporate' && corporateCode
            ? {
                companyid: companyId,
                companyname: companyName,
                contractid: corporateCode,
              }
            : {}),
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
          checkindate: formattedCheckInDate,
          checkoutdate: formattedCheckOutDate,
          room_type: selectedRoom?.roomtypename || 'N/A',
          number_of_guests: (adults || 0) + (children || 0) + (infants || 0),
          quantity: rooms || 1,
          special_requests: specialRequest || '',
          gst_number: gstNumber || null,
          senior_discount: {
            applied: isSeniorDiscountApplied,
            total_amount: isSeniorDiscountApplied ? seniorDiscount?.total_amount || 0 : 0,
            per_day_amount: isSeniorDiscountApplied ? seniorDiscount?.per_day_amount || 0 : 0,
            percent: isSeniorDiscountApplied ? seniorDiscount?.percent || 0 : 0,
            policy_name: isSeniorDiscountApplied
              ? seniorDiscount?.policy_name || 'SENIOR_DISCOUNT'
              : '',
            applied_source: 'senior',
          },
          order_id: existingOrderId || '',
        },
      };

      console.log('Booking Details prepared:', JSON.stringify(bookingDetails, null, 2));
      localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));

      const reservationResponse = await fetch(
        `${CQ_BASE_URL}/bq/api/create-reservation-online-new/`,
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
        console.error('Reservation API error response:', errorData);
        throw errorData;
      }

      const reservationData = await reservationResponse.json();
      console.log('Reservation API success response:', reservationData);

      const bookingId = reservationData.booking_id;
      setReservationId(bookingId);

      localStorage.setItem('reservationId', bookingId);
      localStorage.setItem('orderId', reservationData.order_id);
      localStorage.setItem('billingId', reservationData.billing.billing_id);
      localStorage.setItem('reservationData', JSON.stringify(reservationData));

      if (
        reservationData.qrcodes &&
        Array.isArray(reservationData.qrcodes) &&
        reservationData.qrcodes.length > 0
      ) {
        localStorage.setItem('qrcode', reservationData.qrcodes[0]);
      }

      if (reservationData.guests && Array.isArray(reservationData.guests)) {
        localStorage.setItem('guestDetails', JSON.stringify(reservationData.guests));
      }

      let unifiedBillingId = null;
      if (selectedAmenities.length > 0) {
        console.log('Creating unified billing for amenities...');
        const unifiedBillingResponse = await createUnifiedBilling(bookingId);
        console.log('Unified Billing Response:', unifiedBillingResponse);

        unifiedBillingId = unifiedBillingResponse.billingid;
        setUnifiedBillingId(unifiedBillingId);
        localStorage.setItem('unifiedBillingId', unifiedBillingId);
        localStorage.setItem('unifiedBillingData', JSON.stringify(unifiedBillingResponse));
      }

      setReservationMessage(`Reservation successful! Thank you for choosing our hotel.`);
      setReservationError('');
      setReservationPopupOpen(true);
      console.log('=== handleBooking COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      let errorMessage = 'An error occurred during booking';
      console.error('=== handleBooking ERROR ===');
      console.error('Error object:', error);

      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.errors) {
        errorMessage = Object.values(error.errors).join(', ');
      }

      setReservationError(error);
      setReservationPopupOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentOption = async (paymentMethod) => {
    if (!razorpayLoaded && paymentMethod === 'payNow') {
      toast.error('Razorpay script is not loaded yet.');
      return;
    }

    if (paymentMethod === 'payNow') {
      try {
        setIsProcessing(true);
        const bookingId = localStorage.getItem('reservationId');
        const reservationBillingId = localStorage.getItem('billingId');
        const unifiedBillingId = localStorage.getItem('unifiedBillingId');

        if (!bookingId || !reservationBillingId) {
          toast.error('Booking details not found. Please try again.');
          setIsProcessing(false);
          return;
        }

        const billingIds = [reservationBillingId];
        if (unifiedBillingId) {
          billingIds.push(unifiedBillingId);
        }

        const apiUrl = `${CQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

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
            key: RAZORPAY_KEY,
            amount: totalAmount * 100,
            currency: 'INR',
            name: 'Pagoda Hotel',
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

                if (!verificationResponse.ok) {
                  throw new Error('Payment verification failed');
                }

                const verificationData = await verificationResponse.json();

                if (verificationData.status === 'success') {
                  toast.success('Payment successful and verified!');

                  await Promise.all([
                    fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
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
                          fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
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

                  window.location.href = '/payment-succesful';
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
      // Close the reservation popup first
      setReservationPopupOpen(false);

      if (isCorporateGuest) {
        try {
          setIsProcessing(true);
          toast.info('Booking will be billed to your company.');
          // Small delay to ensure popup closes before redirect
          setTimeout(() => {
            window.location.href = '/reservation-succesful';
          }, 100);
        } catch (error) {
          toast.error('Error processing corporate billing. Please try again.');
          setIsProcessing(false);
        }
      } else {
        try {
          setIsProcessing(true);
          toast.info('Payment deferred. Please pay at the front desk.');
          // Small delay to ensure popup closes before redirect
          setTimeout(() => {
            window.location.href = '/reservation-succesful';
          }, 100);
        } catch (error) {
          toast.error('Error processing check-in. Please try again.');
          setIsProcessing(false);
        }
      }
    }
  };

  const handleAddAdditionalGuest = () => {
    if (additionalGuests.length >= adults - 1) return;

    const newGuest = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      countryCode: '+91',
      country: selectedCountry,
    };

    dispatch(addAdditionalGuest(newGuest));

    setTimeout(() => {
      const guestContainer = document.querySelector('.guest-list-container');
      if (guestContainer) {
        guestContainer.scrollTop = guestContainer.scrollHeight;
      }
    }, 100);
  };

  const handleAdditionalGuestChange = (index, field, value) => {
    const updatedGuest = {
      ...additionalGuests[index],
      [field]: value,
    };

    dispatch(updateAdditionalGuest(index, updatedGuest));

    let errorMsg = '';
    if ((field === 'firstName' || field === 'lastName') && !/^[A-Za-z]+$/.test(value)) {
      errorMsg = `${field === 'firstName' ? 'First' : 'Last'} name should contain only letters.`;
    }

    if (field === 'phoneNumber') {
      if (!/^\d+$/.test(value)) {
        errorMsg = 'Phone number must contain digits only.';
      } else if (value.length !== 10) {
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

    const updatedGuests = additionalGuests.map((guest) => ({
      ...guest,
      country: guest.country || selectedCountry,
    }));

    updatedGuests.forEach((guest, index) => {
      dispatch(updateAdditionalGuest(index, guest));
    });

    toast.success('Additional guests saved successfully!');
  };

  useEffect(() => {
    const fetchGuestData = async () => {
      const guestData = await getGuestData();
      if (guestData) {
        setFirstName(guestData.first_name || '');
        setLastName(guestData.last_name || '');
        setPhoneNumber(guestData.phone_number || '');
        setEmail(guestData.email || '');
        setCountryCode(
          guestData.country_code && countryCodeEnum.includes(guestData.country_code)
            ? guestData.country_code
            : '+91'
        );
        setClientType(guestData.client_type || 'Leisure');

        if (guestData.is_corporate) {
          setCompanyName(guestData.company_name);
          setCompanyId(guestData.company_id || '');
          setIsCorporateGuest(true);
          setClientType('Corporate');
        }
      }
    };

    fetchGuestData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.country-dropdown-primary')) {
        setIsOpen(false);
      }

      Object.keys(guestDropdownStates).forEach((index) => {
        if (
          guestDropdownStates[index] &&
          !event.target.closest(`.country-dropdown-guest-${index}`)
        ) {
          setGuestDropdownStates((prev) => ({
            ...prev,
            [index]: false,
          }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, guestDropdownStates]);

  const fallbackImages = [
    'https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg',
  ];

  if (!selectedRoom) {
    return (
      <div className="min-h-[600px] bg-white p-4 sm:p-10 flex flex-col items-center justify-center space-y-6">
        <AiOutlineWarning className="w-16 h-16 sm:w-20 sm:h-20 text-red-500" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center">
          No Room Selected!
        </h1>
        <p className="text-red-500 text-center text-lg sm:text-xl font-bold px-4">
          It looks like you haven't selected a room yet.
          <br />
          Please choose one to proceed with your reservation.
        </p>
        <button
          onClick={() => navigate('/walk-in/room-reservation')}
          className="mt-4 bg-gradient-to-br from-black to-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md hover:text-gray-100 font-bold"
        >
          Select a Room
        </button>
      </div>
    );
  }

  const getRoomTaxApplicable = () => {
    if (selectedRoom?.tax_applicable !== undefined) {
      return selectedRoom.tax_applicable;
    }
    return 0;
  };

  const roomTaxApplicable = getRoomTaxApplicable();
  const basePricePerRoom = selectedRoom?.dynamicPrice || selectedRoom?.baseprice || 10000;
  const basePrice = basePricePerRoom * rooms;
  const roomTax = roomTaxApplicable * rooms;

  let amenitiesTotal = 0;
  let amenitiesTax = 0;

  selectedAmenities.forEach((amenity) => {
    amenitiesTotal += amenity.totalPrice;
    amenitiesTax += (amenity.totalPrice * amenity.value) / 100;
  });

  const taxAmount = roomTax + amenitiesTax;
  const totalPrice = basePrice + amenitiesTotal + taxAmount;

  const nextImage = () => {
    setCurrentImageIndex(
      (prev) => (prev + 1) % (selectedRoom?.image_urls?.length || fallbackImages.length)
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (selectedRoom?.image_urls?.length || fallbackImages.length)) %
        (selectedRoom?.image_urls?.length || fallbackImages.length)
    );
  };

  const formatFieldName = (fieldName) => {
    const nameMap = {
      applied_source: 'Applied Source',
      senior_discount: 'Senior Discount',
      applied: 'Applied Status',
      total_amount: 'Total Amount',
      per_day_amount: 'Per Day Amount',
      percent: 'Percentage',
      policy_name: 'Policy Name',
      body: 'Request Body',
      booking: 'Booking Details',
    };

    return (
      nameMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  return (
    <div className="w-full px-3 sm:px-5 md:px-10 py-4 mt-16 sm:mt-20 bg-white max-w-8xl mx-auto">
      {/* Back Button - Responsive */}
      <button
        onClick={() => navigate(-1)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 bg-purple-500 hover:bg-purple-600 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 group"
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
          Go Back
        </span>
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 mt-4 sm:mt-6 ml-2 sm:ml-4">
        Reserve and Pay
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mx-2 sm:mx-4">
        {/* Left Column - Responsive width */}
        <div className="w-full lg:w-2/3">
          {/* Fully Refundable Card - Responsive */}
          <div className="bg-white border rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                    Room 1: {adults} Adult{adults !== 1 ? 's' : ''}
                    {children > 0 && `, ${children} Child${children !== 1 ? 'ren' : ''}`},{' '}
                    {selectedRoom?.roomtypename || 'Deluxe'}
                    {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                      <span className="block sm:inline mt-1 sm:mt-0">
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
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 px-3 py-1 rounded-md w-full sm:w-auto">
                <div className="text-sm font-bold text-gray-900 text-center sm:text-left">
                  <span className="text-xs sm:text-sm font-semibold text-gray-600">Total :</span> ₹
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
                  className="h-5 w-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0"
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
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Fully refundable until 24 hours before check-in date
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    You can change or cancel this stay if plans change. Please refer to our{' '}
                    <span
                      className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                      onClick={() => setShowCancellationPolicy(true)}
                    >
                      cancellation policy
                    </span>
                  </p>
                  <CancellationPolicy
                    isOpen={showCancellationPolicy}
                    onClose={() => setShowCancellationPolicy(false)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Guest Details Card - Responsive */}
          <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Guest Details</h2>

            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Room 1:</span>
                <span className="text-xs sm:text-sm text-gray-700">
                  {adults} Adult{adults > 1 ? 's' : ''}
                  {childrenAges.length > 0 ? (
                    <>
                      , {childrenAges.length} Child
                      {childrenAges.length > 1 ? 'ren' : ''} (
                      {childrenAges.map((age, index) => (
                        <span key={index}>
                          {age} yr{age > 1 ? 's' : ''}
                          {index !== childrenAges.length - 1 && ', '}
                        </span>
                      ))}
                      )
                    </>
                  ) : (
                    ''
                  )}
                  {selectedRoom?.roomtypename && `, ${selectedRoom.roomtypename}`}
                </span>
              </div>

              <div className="space-y-4">
                {/* Name fields - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First name*
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      placeholder="Enter first name"
                      onChange={handleFirstNameChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="h-2">
                      {errors.lastName && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone and Email - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-1/4 sm:w-1/5 p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneNumberChange}
                        className="w-3/4 sm:w-4/5 p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="h-2">
                      {errors.phoneNumber && (
                        <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
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

                {/* GST Number - Only for Leisure */}
                {clientType === 'Leisure' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GST Number{' '}
                        <span className="text-gray-400 text-xs font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={handleGstChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase"
                        placeholder="Enter GST number"
                      />
                      <div className="h-2">
                        {gstErrors && <p className="text-[10px] text-red-500 mt-1">{gstErrors}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Type and Country - Responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Type*
                    </label>
                    <div className="relative">
                      <select
                        value={clientType}
                        onChange={handleClientTypeChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="Leisure">Leisure</option>
                        <option
                          value="Corporate"
                          disabled={!corporateCode || !companyName || !companyId}
                        >
                          Corporate
                          {!corporateCode && ' (Apply corporate rate first)'}
                        </option>
                      </select>

                      {corporateCode && clientType === 'Leisure' && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded-md shadow-lg z-10">
                          <p className="font-semibold mb-1">⚠ Corporate Rate Applied</p>
                          <p>Switch to Corporate profile type to use this rate</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                    <div className="relative country-dropdown-primary">
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
                          <span className="truncate">{selectedCountry.name}</span>
                        </span>
                        <span className="ml-2 font-semibold">{isOpen ? '∧' : '∨'}</span>
                      </button>

                      {isOpen && (
                        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
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
                              <span className="truncate">{country.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Corporate Fields Section */}
                {clientType === 'Corporate' && corporateCode && (
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                      Company Details
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name*
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
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
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
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

            {/* Additional Guests Section */}
            <div className="mt-6">
              <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
                {additionalGuests.map((guest, index) => (
                  <div
                    key={index}
                    className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
                  >
                    <button
                      onClick={() => dispatch(removeAdditionalGuest(index))}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>

                    <h4 className="text-md font-semibold text-gray-700 mb-3">Guest {index + 2}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile number (optional)
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={guest.countryCode}
                            onChange={(e) =>
                              handleAdditionalGuestChange(index, 'countryCode', e.target.value)
                            }
                            className="w-1/4 p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                          </select>
                          <input
                            type="tel"
                            value={guest.phoneNumber}
                            onChange={(e) =>
                              handleAdditionalGuestChange(index, 'phoneNumber', e.target.value)
                            }
                            className="w-3/4 p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Phone number"
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

                      <div className={`relative country-dropdown-guest-${index}`}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              <span className="truncate">
                                {guest.country?.name || countries[0].name}
                              </span>
                            </span>
                            <span className="ml-2 font-semibold">
                              {guestDropdownStates[index] ? '∧' : '∨'}
                            </span>
                          </button>

                          {guestDropdownStates[index] && (
                            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
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
                                  <span className="truncate">{country.name}</span>
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

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 py-3">
                <div className="relative group w-full sm:w-fit">
                  <button
                    onClick={handleAddAdditionalGuest}
                    disabled={additionalGuests.length >= adults - 1}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto ${
                      additionalGuests.length >= adults - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    <FiPlus className="w-4 h-4" />
                    Additional guest
                  </button>
                  {additionalGuests.length >= adults - 1 && (
                    <div className="absolute whitespace-normal sm:whitespace-nowrap bottom-full mb-2 left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-full sm:w-auto">
                      To add more guests, please increase the number of adults in your reservation
                    </div>
                  )}
                </div>

                {additionalGuests.length > 0 && (
                  <button
                    onClick={saveAdditionalGuests}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 sm:px-10 py-2 rounded-md text-sm font-medium"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Additional Rooms */}
            {rooms > 1 && (
              <div className="border-t pt-6 mt-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
                  Additional Rooms
                </h3>

                {Array.from({ length: rooms - 1 }).map((_, roomIndex) => (
                  <div key={roomIndex} className="mb-6 border-b pb-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">
                        Room {roomIndex + 2}:
                      </span>
                      <span className="text-sm">{selectedRoom?.roomtypename}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First name*
                          </label>
                          <input
                            type="text"
                            value={additionalGuests[roomIndex]?.firstName || ''}
                            onChange={(e) =>
                              handleAdditionalGuestChange(roomIndex, 'firstName', e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last name*
                          </label>
                          <input
                            type="text"
                            value={additionalGuests[roomIndex]?.lastName || ''}
                            onChange={(e) =>
                              handleAdditionalGuestChange(roomIndex, 'lastName', e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Last name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile number
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={additionalGuests[roomIndex]?.countryCode || '+91'}
                            onChange={(e) =>
                              handleAdditionalGuestChange(roomIndex, 'countryCode', e.target.value)
                            }
                            className="w-1/4 p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                          </select>
                          <input
                            type="tel"
                            value={additionalGuests[roomIndex]?.phoneNumber || ''}
                            onChange={(e) =>
                              handleAdditionalGuestChange(roomIndex, 'phoneNumber', e.target.value)
                            }
                            className="w-3/4 p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Requests */}
            <div
              className="border-t pt-6 mt-4 cursor-pointer"
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
          <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Selected Amenities</h2>
            {selectedAmenities.length > 0 ? (
              <ul className="space-y-1">
                {selectedAmenities.map((amenity) => (
                  <li key={amenity.id} className="flex justify-between py-1 text-sm">
                    <span>
                      {amenity.name} × {amenity.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No amenities selected.</p>
            )}
          </div>

          {/* Important Information Card */}
          <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              Important information
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-gray-700">
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
                check-in.
              </li>
              <li>
                Guests may check in from 11:00 AM onwards and are requested to check out by 12:00
                PM.
              </li>
              <li>
                Special requests are subject to availability and may incur additional charges.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Sticky Booking Summary - Responsive */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white border rounded-lg shadow-sm p-3 mb-4">
            <div className="p-0.5 text-right">
              <p className="text-xs sm:text-sm text-black truncate">
                <span className="font-semibold">Signed in as</span> {email || 'Guest User'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 shadow-sm bg-white sticky top-4">
            {/* Image slider section - Responsive height */}
            <div className="relative w-full h-48 sm:h-60 overflow-hidden rounded-t-2xl">
              {(selectedRoom?.image_urls?.length > 0
                ? selectedRoom.image_urls
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
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full text-sm"
              >
                &lt;
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-1.5 sm:p-2 rounded-full text-sm"
              >
                &gt;
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="pt-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800">Check-in:</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {checkInDate
                        ? new Date(checkInDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}{' '}
                      (11:00 AM)
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800">Check-out:</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {checkOutDate
                        ? new Date(checkOutDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}{' '}
                      (12:00 PM)
                    </p>
                  </div>
                </div>

                {/* Price Details */}
                <div className="border-t pt-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                    Price Details
                  </h3>

                  <div className="flex justify-between text-xs sm:text-sm text-gray-700 mb-1">
                    <span>
                      {rooms} Room{rooms > 1 ? 's' : ''} × {Math.max(1, daysCount)} Night
                      {Math.max(1, daysCount) > 1 ? 's' : ''}
                    </span>
                    <span>
                      ₹
                      {basePrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {selectedAmenities.length > 0 && (
                    <div className="mt-2">
                      <ul className="text-xs sm:text-sm text-gray-700">
                        {selectedAmenities.map((amenity) => (
                          <li key={amenity.id} className="flex justify-between py-1">
                            <span>
                              {amenity.name} × {amenity.quantity}
                            </span>
                            <span>
                              ₹
                              {amenity.totalPrice.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between text-xs sm:text-sm text-gray-700 mt-3 border-t pt-2">
                    <span className="font-semibold">Subtotal:</span>
                    <span>
                      ₹
                      {(basePrice + amenitiesTotal).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="mt-3 mb-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-gray-800">
                          Total Taxes and Charges
                        </span>
                        <button
                          onClick={() => setShowTaxDetails(!showTaxDetails)}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showTaxDetails ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-700">
                        ₹
                        {taxAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {showTaxDetails && (
                      <div className="mt-2 bg-gray-50 p-3 rounded-md text-xs sm:text-sm">
                        <div className="mb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-1">
                              <span>Room Taxes (5%)</span>
                              <div className="group relative">
                                <FiInfo className="text-gray-400 cursor-pointer" />
                                <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
                                  <div className="flex justify-between mb-1">
                                    <span>CGST</span>
                                    <span>
                                      ₹
                                      {(roomTaxApplicable / 2).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SGST</span>
                                    <span>
                                      ₹
                                      {(roomTaxApplicable / 2).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span>
                              ₹
                              {roomTaxApplicable.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {selectedAmenities.map((amenity) => {
                          const amenityTax = (amenity.totalPrice * amenity.value) / 100;
                          return (
                            <div key={amenity.id} className="mb-2">
                              <div className="flex justify-between">
                                <div className="flex items-center gap-1">
                                  <span>
                                    {amenity.name} ({amenity.value}%)
                                  </span>
                                  <div className="group relative">
                                    <FiInfo className="text-gray-400 cursor-pointer" />
                                    <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
                                      <div className="flex justify-between mb-1">
                                        <span>CGST ({amenity.value / 2}%)</span>
                                        <span>
                                          ₹
                                          {(amenityTax / 2).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>SGST ({amenity.value / 2}%)</span>
                                        <span>
                                          ₹
                                          {(amenityTax / 2).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <span>
                                  ₹
                                  {amenityTax.toLocaleString('en-IN', {
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">Total</h3>
                    <span className="text-lg sm:text-xl font-bold text-gray-800">
                      ₹
                      {totalPrice.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start mt-4 mb-4 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    id="acknowledgement"
                    className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                    checked={isAcknowledged}
                    onChange={(e) => setIsAcknowledged(e.target.checked)}
                  />
                  <label htmlFor="acknowledgement" className="text-xs sm:text-sm">
                    By proceeding, I confirm that I have read and agree to the&nbsp;
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
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-70 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Reserve Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Popup Modal - Responsive */}
      {reservationPopupOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white border border-gray-300 w-full max-w-lg p-4 sm:p-8 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-4 text-red-600 text-2xl sm:text-3xl"
              onClick={() => setReservationPopupOpen(false)}
            >
              ✕
            </button>

            {reservationError ? (
              <div>
                {/* Corporate Rate Required Error */}
                {reservationError.detail?.type === 'corporate_rate_required' && (
                  <div className="text-center">
                    <div className="mb-4 sm:mb-6">
                      <AiOutlineWarning className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">
                        {reservationError.detail.title || 'Corporate Rate Code Required'}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-700 mb-4">
                        {reservationError.detail.message}
                      </p>
                      {reservationError.detail.solution && (
                        <div className="bg-yellow-50 p-3 rounded-md mb-4">
                          <p className="text-sm font-semibold text-yellow-800">Solution:</p>
                          <p className="text-xs text-yellow-700">
                            {reservationError.detail.solution}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          navigate('/walk-in/room-reservation');
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-md transition-colors text-sm sm:text-base"
                      >
                        Go Back to Apply Corporate Rate
                      </button>
                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          setClientType('Leisure');
                          toast.info('Switched to Leisure profile type');
                        }}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-md transition-colors text-sm sm:text-base"
                      >
                        Switch to Leisure Booking
                      </button>
                    </div>
                  </div>
                )}

                {/* Company Details Required Error */}
                {reservationError.detail?.type === 'company_details_required' && (
                  <div className="text-center">
                    <div className="mb-4 sm:mb-6">
                      <AiOutlineWarning className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">
                        {reservationError.detail.title || 'Company Details Required'}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-700 mb-4">
                        {reservationError.detail.message}
                      </p>
                      {reservationError.detail.solution && (
                        <div className="bg-yellow-50 p-3 rounded-md mb-4">
                          <p className="text-sm font-semibold text-yellow-800">Solution:</p>
                          <p className="text-xs text-yellow-700">
                            {reservationError.detail.solution}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-md transition-colors text-sm sm:text-base"
                      >
                        Update Profile with Company Details
                      </button>
                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          setClientType('Leisure');
                          toast.info('Switched to Leisure profile type');
                        }}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-md transition-colors text-sm sm:text-base"
                      >
                        Switch to Leisure Booking
                      </button>
                    </div>
                  </div>
                )}

                {/* Guest Info Required Error */}
                {(reservationError.detail?.type === 'guest_info_required' ||
                  reservationError.detail?.type === 'incomplete_guest_info') && (
                  <div className="text-center">
                    <div className="mb-4 sm:mb-6">
                      <AiOutlineWarning className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">
                        {reservationError.detail.title || 'Additional Guest Information Required'}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-700 mb-4">
                        {reservationError.detail.message}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setReservationPopupOpen(false);
                        setTimeout(() => {
                          const guestSection = document.querySelector('.guest-list-container');
                          if (guestSection) {
                            guestSection.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                          }
                        }, 100);
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 rounded-md transition-colors text-sm sm:text-base"
                    >
                      Add Guest Information Now
                    </button>
                  </div>
                )}

                {/* Default Error */}
                {!reservationError.detail?.type && (
                  <>
                    <h2 className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-4 sm:mb-6">
                      Reservation Failed
                    </h2>
                    <div className="text-center">
                      <button
                        onClick={() => setReservationPopupOpen(false)}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-6 rounded-md text-sm sm:text-base"
                      >
                        Go Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4 mt-5">
                  <p className="text-sm sm:text-md font-semibold">
                    Hello,{' '}
                    <span className="capitalize">
                      {firstName} {lastName}
                    </span>
                    , you've reached the last step of your reservation
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-md mb-6">
                  <p className="text-center text-sm sm:text-md font-semibold text-black">
                    Please read the details carefully and make a payment of{' '}
                    <span className="text-blue-500 font-bold">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                  <button
                    onClick={() => {
                      setReservationPopupOpen(false);
                      handlePaymentOption('payLater');
                    }}
                    className="w-full text-sm sm:text-lg font-semibold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                  >
                    {isCorporateGuest ? 'Bill to Company' : 'Pay at Front Desk'}
                  </button>

                  <button
                    onClick={() => {
                      setReservationPopupOpen(false);
                      handlePaymentOption('payNow');
                    }}
                    className="w-full text-sm sm:text-lg font-semibold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer />
      <SpecialRequest
        isOpen={specialRequestOpen}
        onClose={() => setSpecialRequestOpen(false)}
        request={specialRequest}
        setRequest={setSpecialRequest}
      />
    </div>
  );
};

export default BookingSummary;

// import React, { useState, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import countries from "./countries";
// import { useNavigate } from "react-router-dom";
// import { FiInfo } from "react-icons/fi";
// import { AiOutlineWarning } from "react-icons/ai";
// import { z } from "zod";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Cookies from "js-cookie";
// import {
//   FiChevronRight,
//   FiPlus,
//   FiMinus,
//   FiChevronDown,
//   FiChevronUp,
// } from "react-icons/fi";
// import SpecialRequest from "../pages/SpecialRequest";
// import { ImCheckmark } from "react-icons/im";
// import { MdOutlineBedroomChild } from "react-icons/md";
// import LegalDocumentsPopup from "./LegalDocumentsPopup";
// import {
//   addAdditionalGuest,
//   updateAdditionalGuest,
//   removeAdditionalGuest,
// } from "./redux/action";
// import CancellationPolicy from "./CancellationPolicy";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
// const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

// // const getGuestData = async () => {
// //   const accessToken = Cookies.get("access_token");
// //   if (!accessToken) return null;

// //   try {
// //     const guestId = Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
// //     if (!guestId) return null;

// //     const profileResponse = await fetch(
// //       `${CQ_BASE_URL}/bq/api/profile?guest_id=${guestId}`,
// //       {
// //         method: "GET",
// //         headers: {
// //           Accept: "application/json",
// //           Authorization: `Bearer ${accessToken}`,
// //         },
// //       },
// //     );

// //     if (!profileResponse.ok) {
// //       throw new Error(`Profile API Error: ${profileResponse.statusText}`);
// //     }

// //     const profileData = await profileResponse.json();

// //     // Check if this is a corporate guest
// //     const isCorporateGuest = profileData.companyid && profileData.companyname;

// //     const isDecrypted = profileData.emailid && profileData.emailid.length < 50;

// //     if (isDecrypted) {
// //       return {
// //         first_name: profileData.firstname || "",
// //         last_name: profileData.lastname || "",
// //         email: profileData.emailid || "",
// //         phone_number: profileData.phonenumber || "",
// //         country_code: "+91",
// //         client_type: profileData.clienttype || "Leisure",
// //         company_id: profileData.companyid || "",
// //         company_name: profileData.companyname || "",
// //         is_corporate: isCorporateGuest,
// //       };
// //     }

// //     const decryptedFields = await decryptUserData({
// //       email: profileData.emailid,
// //       phone_number: profileData.phonenumber,
// //       country_code: profileData.countrycode,
// //     });

// //     return {
// //       first_name: profileData.firstname || "",
// //       last_name: profileData.lastname || "",
// //       email: decryptedFields.email || profileData.emailid || "",
// //       phone_number:
// //         decryptedFields.phone_number || profileData.phonenumber || "",
// //       country_code: "+91",
// //       client_type: profileData.clienttype || "Leisure",
// //       company_id: profileData.companyid || "",
// //       company_name: profileData.companyname || "",
// //       is_corporate: isCorporateGuest,
// //     };
// //   } catch (error) {
// //     console.error("Error fetching guest data:", error);
// //     return null;
// //   }
// // };

// const getGuestData = async () => {
//   const accessToken = Cookies.get("access_token");

//   // If no access token, user is not logged in - return null to indicate guest user
//   if (!accessToken) {
//     console.log("No access token found - treating as guest user");
//     return null; // This is fine for guest users
//   }

//   try {
//     const guestId = Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
//     if (!guestId) return null;

//     const profileResponse = await fetch(
//       `${CQ_BASE_URL}/bq/api/profile?guest_id=${guestId}`,
//       {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     if (!profileResponse.ok) {
//       throw new Error(`Profile API Error: ${profileResponse.statusText}`);
//     }

//     const profileData = await profileResponse.json();

//     // Check if this is a corporate guest
//     const isCorporateGuest = profileData.companyid && profileData.companyname;

//     const isDecrypted = profileData.emailid && profileData.emailid.length < 50;

//     if (isDecrypted) {
//       return {
//         first_name: profileData.firstname || "",
//         last_name: profileData.lastname || "",
//         email: profileData.emailid || "",
//         phone_number: profileData.phonenumber || "",
//         country_code: "+91",
//         client_type: profileData.clienttype || "Leisure",
//         company_id: profileData.companyid || "",
//         company_name: profileData.companyname || "",
//         is_corporate: isCorporateGuest,
//       };
//     }

//     const decryptedFields = await decryptUserData({
//       email: profileData.emailid,
//       phone_number: profileData.phonenumber,
//       country_code: profileData.countrycode,
//     });

//     return {
//       first_name: profileData.firstname || "",
//       last_name: profileData.lastname || "",
//       email: decryptedFields.email || profileData.emailid || "",
//       phone_number: decryptedFields.phone_number || profileData.phonenumber || "",
//       country_code: "+91",
//       client_type: profileData.clienttype || "Leisure",
//       company_id: profileData.companyid || "",
//       company_name: profileData.companyname || "",
//       is_corporate: isCorporateGuest,
//     };
//   } catch (error) {
//     console.error("Error fetching guest data:", error);
//     return null;
//   }
// };

// const getGuestIdFromToken = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     return payload.sub;
//   } catch (e) {
//     console.error("Error parsing token:", e);
//     return null;
//   }
// };

// const decryptUserData = async (encryptedData) => {
//   try {
//     if (encryptedData.email && encryptedData.email.length < 50) {
//       return encryptedData;
//     }

//     const accessToken = Cookies.get("access_token");
//     if (!accessToken) {
//       throw new Error("No access token found");
//     }

//     const response = await fetch(`${CQ_BASE_URL}/bq/api/decrypt-fields`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({
//         encrypted_fields: {
//           email: encryptedData.email,
//           phone_number: encryptedData.phone_number,
//           country_code: encryptedData.country_code,
//         },
//       }),
//     });

//     if (response.status === 401) {
//       return encryptedData;
//     }

//     if (!response.ok) {
//       throw new Error(`Decryption failed: ${response.statusText}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Decryption error:", error);
//     return encryptedData;
//   }
// };

// const BookingSummary = () => {
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
//     countries.find((country) => country.name === "India") || countries[0],
//   );
//   const [isOpen, setIsOpen] = useState(false);
//   const [companyName, setCompanyName] = useState("");
//   const [companyId, setCompanyId] = useState("");
//   const [isCorporateGuest, setIsCorporateGuest] = useState(false);

//   const [errors, setErrors] = useState({
//     firstName: "",
//     lastName: "",
//     phoneNumber: "",
//     email: "",
//   });
//   const [guestErrors, setGuestErrors] = useState([]);

//   const [razorpayLoaded, setRazorpayLoaded] = useState(false);
//   const [unifiedBillingId, setUnifiedBillingId] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showLegalPopup, setShowLegalPopup] = useState(false);
//   const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [selectedAddGuestCountry, setselectedAddGuestCountry] = useState(
//     countries[0],
//   );
//   const [guestDropdownStates, setGuestDropdownStates] = useState({});
//   const [gstNumber, setGstNumber] = useState("");
//   const [gstErrors, setGstErrors] = useState("");
//   const {
//     specialRateType,
//     corporateCode,
//     seniorCitizenDiscount,
//     promoCode,
//     isSpecialRateApplied,
//   } = useSelector((state) => state.specialRates || {});

//   const validateName = (value) => {
//     const trimmed = value.trim();

//     // Empty check
//     if (!trimmed) {
//       return "Please enter a name";
//     }

//     // Length check (2-60 chars total)
//     if (trimmed.length < 2) {
//       return "Name must be at least 2 characters";
//     }
//     if (trimmed.length > 60) {
//       return "Name cannot exceed 60 characters";
//     }

//     // Character validation
//     if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
//       // Detect specific invalid characters
//       const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
//       if (invalidChars) {
//         const uniqueChars = [...new Set(invalidChars)];
//         return `Names cannot have digits`;
//       }
//       return "Only letters, spaces, hyphens (-) and apostrophes (') are allowed";
//     }

//     // Special character rules
//     if (/['-]{2,}/.test(trimmed)) {
//       return "Cannot have consecutive special characters (-- or '')";
//     }
//     if (/^['-]/.test(trimmed)) {
//       return "Only letters are allowed (no special characters)";
//     }
//     if (/['-]$/.test(trimmed)) {
//       return "Only letters are allowed (no special characters)  ";
//     }

//     // Word validation
//     const words = trimmed.split(/\s+/);

//     // Word length check
//     for (const word of words) {
//       if (word.length > 20) {
//         return `"${word}" is too long (max 20 letters)`;
//       }
//       if (word.length < 2 && /[A-Za-z]/.test(word)) {
//         return `"${word}" is too short (min 2 letters)`;
//       }
//     }

//     // Multiple space check
//     if (trimmed.includes("  ")) {
//       return "Cannot have multiple spaces between words";
//     }

//     return ""; // Valid name
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
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Redux State
//   const { checkInDate, checkOutDate, daysCount } = useSelector(
//     (state) => state.selectedDates,
//   );
//   const additionalGuests = useSelector(
//     (state) => state.formDetails.additionalGuests,
//   );

//   const { selectedRoom } = useSelector((state) => state.roomtype);
//   console.log(selectedRoom);
//   const { rooms, adults, children, infants, childrenAges } = useSelector(
//     (state) => state.formDetails,
//   );

//   const togglePopup = () => setPopupOpen(!popupOpen);

//   const selectedAmenities = useSelector(
//     (state) => state.amenities.selectedAmenities,
//   );

//   // Calculate amenities total
//   // const amenitiesTotal = selectedAmenities.reduce(
//   //   (sum, amenity) => sum + amenity.totalPrice,
//   //   0
//   // );

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

//     // Check if user is trying to switch from Corporate to Leisure but has corporate code applied
//     if (
//       clientType === "Corporate" &&
//       newClientType === "Leisure" &&
//       corporateCode
//     ) {
//       toast.error(
//         "You cannot switch to Leisure while a corporate rate code is applied. Please remove the corporate rate code first or stay as Corporate.",
//       );
//       return;
//     }

//     // Check if user has company details in profile for corporate booking
//     if (newClientType === "Corporate") {
//       if (!corporateCode) {
//         toast.error(
//           "Corporate booking requires a contract code. Please apply a corporate rate first.",
//         );
//         return;
//       }

//       // Check if user has company details in their profile
//       if (!companyName || !companyId) {
//         toast.error(
//           "You need to have company details (Company Name and Company ID) in your profile to book as Corporate. Please update your profile or select Leisure.",
//         );
//         return;
//       }
//     }

//     setClientType(newClientType);

//     // If switching to corporate, clear GST number
//     if (newClientType === "Corporate") {
//       setGstNumber("");
//       setGstErrors("");
//       setIsCorporateGuest(true);
//     } else if (newClientType === "Leisure") {
//       setIsCorporateGuest(false);
//     }
//   };
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

//   useEffect(() => {
//     const checkCorporateMismatch = () => {
//       if (corporateCode && clientType === "Leisure") {
//         // Show a warning toast but don't block - let them fix it at booking time
//         toast.warning(
//           "Corporate rate code applied but profile type is set to Leisure. Please either switch to Corporate profile type or remove the corporate rate code before reservation.",
//           { autoClose: 5000 },
//         );
//       }
//     };

//     // Check after a short delay to ensure state is set
//     const timer = setTimeout(checkCorporateMismatch, 500);
//     return () => clearTimeout(timer);
//   }, [corporateCode, clientType]);

//   const handleFirstNameChange = (e) => {
//     const value = e.target.value;
//     setFirstName(value);
//     const error = validateName(value, true);
//     setErrors((prev) => ({ ...prev, firstName: error }));
//   };

//   const handleLastNameChange = (e) => {
//     const value = e.target.value;
//     setLastName(value);
//     const error = validateName(value, false);
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

//   const validateGST = (gst) => {
//     if (!gst) return ""; // Optional field, so empty is valid

//     // Basic GST format validation
//     const gstRegex =
//       /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

//     if (!gstRegex.test(gst)) {
//       return "Please enter a valid GST number";
//     }

//     return "";
//   };

//   const handleGstChange = (e) => {
//     const value = e.target.value.toUpperCase();
//     setGstNumber(value);
//     const error = validateGST(value);
//     setGstErrors(error);
//   };

//   // Replace the existing guestDetailsSchema with this updated version
//   const guestDetailsSchema = z.object({
//     firstName: z.string().min(1, "First Name is required."),
//     lastName: z.string().min(1, "Last Name is required."),
//     phoneNumber: z
//       .string()
//       .optional() // Make it optional
//       .nullable() // Allow null values
//       .refine(
//         (val) => {
//           // If value exists, validate it, otherwise it's valid (optional)
//           if (!val) return true;
//           return /^\d+$/.test(val) && val.length === 10;
//         },
//         {
//           message:
//             "Phone Number must be exactly 10 digits and contain only digits.",
//         },
//       ),
//     email: z
//       .string()
//       .optional() // Make it optional
//       .nullable() // Allow null values
//       .refine(
//         (val) => {
//           // If value exists, validate it, otherwise it's valid (optional)
//           if (!val) return true;
//           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//           return emailRegex.test(val);
//         },
//         {
//           message: "Please enter a valid email address.",
//         },
//       ),
//     countryCode: z
//       .string()
//       .min(1, "Country Code is required.")
//       .refine((code) => countryCodeEnum.includes(code), {
//         message: "Invalid country code. Please select a valid country code.",
//       }),
//   });

//   const createUnifiedBilling = async (bookingId) => {
//     try {
//       // Prepare items with proper typing
//       const items = selectedAmenities.map((amenity) => {
//         // Convert to proper backend structure based on type
//         if (amenity.type === "food") {
//           return {
//             item_type: "food",
//             items: [
//               {
//                 foodid: amenity.id, // Keep as string if using UUIDs
//                 quantity: amenity.quantity,
//               },
//             ],
//           };
//         } else {
//           return {
//             item_type: amenity.type || "amenity",
//             itemid: parseInt(amenity.id), // Convert to number if backend requires
//             quantity: amenity.quantity,
//             urgencylevel: "Normal",
//             scheduledtime: new Date().toISOString(),
//             specialinstructions: "",
//           };
//         }
//       });

//       const payload = {
//         bookingid: bookingId,
//         items: items,
//       };

//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/create-unified-billing`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(payload),
//         },
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.detail || `Unified billing failed: ${response.statusText}`,
//         );
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Error creating unified billing:", error);
//       throw error;
//     }
//   };

//   const handleBooking = async () => {
//     console.log("=== handleBooking START ===");
//     console.log("Current state:", {
//       isAcknowledged,
//       corporateCode,
//       clientType,
//       adults,
//       additionalGuestsLength: additionalGuests.length,
//       selectedRoomExists: !!selectedRoom,
//       rooms,
//       selectedAmenitiesCount: selectedAmenities.length,
//       companyName,
//       companyId
//     });

//     if (!isAcknowledged) {
//       console.log("Booking blocked: Terms not acknowledged");
//       setCheckboxError(true);
//       toast.error("Please acknowledge the terms and conditions to proceed");
//       return;
//     }

//     // ========== NEW: Check if corporate code is applied but profile type is Leisure ==========
//     if (corporateCode && clientType === "Leisure") {
//       console.log("Booking blocked: Corporate code mismatch - corporateCode exists but clientType is Leisure");
//       setReservationError({
//         detail: {
//           message:
//             "You have applied a corporate rate code but selected 'Leisure' as profile type. Please either select 'Corporate' as profile type or remove the corporate rate code to proceed as Leisure guest.",
//           title: "Profile Type Mismatch",
//           type: "corporate_code_mismatch",
//           solution:
//             "Switch to Corporate profile type or go back to room selection to remove the corporate rate code.",
//         },
//       });
//       setReservationPopupOpen(true);
//       return;
//     }

//     // ========== Enhanced Corporate Validation ==========
//     if (clientType === "Corporate") {
//       console.log("Corporate validation started...");

//       // Check 1: Corporate code applied
//       if (!corporateCode) {
//         console.log("Booking blocked: Corporate clientType but no corporateCode");
//         setReservationError({
//           detail: {
//             message:
//               "Corporate booking requires a valid corporate rate code. Please apply a corporate rate first or switch to Leisure profile type.",
//             title: "Corporate Rate Required",
//             type: "corporate_rate_required",
//           },
//         });
//         setReservationPopupOpen(true);
//         return;
//       }

//       // Check 2: Company details in profile
//       if (!companyName || !companyId) {
//         console.log("Booking blocked: Corporate clientType but missing company details:", { companyName, companyId });
//         setReservationError({
//           detail: {
//             message:
//               "To book as Corporate, you must have Company Name and Corporate ID in your profile. Please update your profile with company details or switch to Leisure profile type.",
//             title: "Company Details Required",
//             type: "company_details_required",
//             solution:
//               "Go to your profile and add your company information under Corporate Details section.",
//           },
//         });
//         setReservationPopupOpen(true);
//         return;
//       }
//       console.log("Corporate validation passed");
//     }

//     // ========== Additional Guest Validation ==========
//     if (adults > 1 && additionalGuests.length < adults - 1) {
//       console.log(`Booking blocked: Additional guests needed. Adults: ${adults}, AdditionalGuests: ${additionalGuests.length}`);
//       setReservationError({
//         detail: {
//           message: `Please add additional guest information. You selected ${adults} adult(s) but have only provided information for ${
//             additionalGuests.length + 1
//           } guest(s).`,
//           title: "Additional Guest Information Required",
//           type: "guest_info_required",
//         },
//       });
//       setReservationPopupOpen(true);
//       return;
//     }

//     // Also validate that all required additional guest fields are filled
//     if (additionalGuests.length > 0) {
//       const incompleteGuests = additionalGuests.filter((guest, index) => {
//         return !guest.firstName || !guest.lastName;
//       });

//       if (incompleteGuests.length > 0) {
//         console.log(`Booking blocked: Incomplete guest info. Incomplete guests: ${incompleteGuests.length}`);
//         setReservationError({
//           detail: {
//             message: `Please complete all required fields for additional guests. First name and last name are mandatory for each additional guest.`,
//             title: "Incomplete Guest Information",
//             type: "incomplete_guest_info",
//           },
//         });
//         setReservationPopupOpen(true);
//         return;
//       }
//     }

//     setIsLoading(true);
//     setCheckboxError(false);
//     console.log("All validations passed. Starting reservation process...");

//     // Get tax applicable from selectedRoom - DIRECT FROM API
//     const getRoomTaxApplicable = () => {
//       // Check if tax_applicable exists in selectedRoom (from Redux)
//       if (selectedRoom?.tax_applicable !== undefined) {
//         console.log("Room tax applicable from selectedRoom:", selectedRoom.tax_applicable);
//         return selectedRoom.tax_applicable;
//       }

//       // Return 0 as fallback (not 1800 or 12%)
//       console.log("No tax_applicable found, using 0");
//       return 0;
//     };

//     // Get tax applicable from API
//     const roomTaxApplicable = getRoomTaxApplicable();

//     const basePricePerRoom = selectedRoom?.dynamicPrice || selectedRoom?.baseprice || 10000;
//     const basePrice = basePricePerRoom * rooms;
//     console.log("Price calculation:", { basePricePerRoom, basePrice, rooms, roomTaxApplicable });

//     // Room tax (12%)
//     const roomTax = roomTaxApplicable * rooms;

//     // Amenities subtotal and tax
//     let amenitiesTotal = 0;
//     let amenitiesTax = 0;

//     selectedAmenities.forEach((amenity) => {
//       amenitiesTotal += amenity.totalPrice;
//       amenitiesTax += (amenity.totalPrice * amenity.value) / 100;
//     });
//     console.log("Amenities calculation:", { amenitiesTotal, amenitiesTax });

//     const taxAmount = roomTax + amenitiesTax;
//     const totalPrice = basePrice + amenitiesTotal + taxAmount;
//     console.log("Final price calculation:", { taxAmount, totalPrice });

//     // Store price details in localStorage
//     localStorage.setItem(
//       "priceDetails",
//       JSON.stringify({
//         subtotal: basePrice + amenitiesTotal,
//         taxes: taxAmount,
//         total: totalPrice,
//         basePrice: basePrice,
//         amenitiesTotal: amenitiesTotal,
//       })
//     );
//     console.log("Price details saved to localStorage");

//     // ========== FIXED: Handle both logged-in and guest users ==========
//     const loggedInGuestData = await getGuestData();
//     console.log("Logged-in guest data fetched:", loggedInGuestData);

//     // For guest users (not logged in), use the form data
//     // For logged-in users, use the API data but allow form data to override if provided
//     const guestData = {
//       first_name: firstName || loggedInGuestData?.first_name || "",
//       last_name: lastName || loggedInGuestData?.last_name || "",
//       email: email || loggedInGuestData?.email || "",
//       phone_number: phoneNumber || loggedInGuestData?.phone_number || "",
//       country_code: countryCode || loggedInGuestData?.country_code || "+91",
//       client_type: clientType || loggedInGuestData?.client_type || "Leisure",
//       company_id: companyId || loggedInGuestData?.company_id || "",
//       company_name: companyName || loggedInGuestData?.company_name || "",
//       is_corporate: clientType === "Corporate" && !!corporateCode,
//     };

//     console.log("Final guest data for booking:", guestData);

//     // Validate that we have at least the minimum required info for guest users
//     if (!guestData.first_name || !guestData.last_name) {
//       console.log("Booking blocked: Missing required guest information");
//       setReservationError({
//         detail: {
//           message: "Please provide your first name and last name to continue.",
//           title: "Guest Information Required",
//           type: "guest_info_required",
//         },
//       });
//       setReservationPopupOpen(true);
//       setIsLoading(false);
//       return;
//     }

//     const formData = {
//       firstName: firstName,
//       lastName: lastName,
//       phoneNumber: String(phoneNumber),
//       email: email,
//       clientType: clientType,
//       countryCode: countryCode,
//       ...(clientType === "Corporate" && {
//         companyName: companyName,
//         companyId: companyId,
//       }),
//     };
//     console.log("Form data prepared:", formData);

//     // Add validation for additional guests
//     const hasInvalidAdditionalGuests = additionalGuests.some((guest, index) => {
//       return (
//         !guest.firstName ||
//         !guest.lastName ||
//         (guest.phoneNumber && guest.phoneNumber.length !== 10) ||
//         Object.values(guestErrors[index] || {}).some(Boolean)
//       );
//     });

//     if (hasInvalidAdditionalGuests) {
//       console.log("Booking blocked: Invalid additional guests found");
//       toast.error(
//         "Please fill all required fields for additional guests correctly"
//       );
//       setIsLoading(false);
//       return;
//     }

//     try {
//       console.log("Validating form data with zod schema...");
//       guestDetailsSchema.parse(formData);
//       setGuestValidationErrors({});
//       console.log("Form data validation passed");

//       const formattedCheckInDate = checkInDate
//         ? new Date(checkInDate).toISOString().split("T")[0]
//         : "N/A";
//       const formattedCheckOutDate = checkOutDate
//         ? new Date(checkOutDate).toISOString().split("T")[0]
//         : "N/A";
//       console.log("Formatted dates:", { formattedCheckInDate, formattedCheckOutDate });

//       // Check if senior discount is applied
//       const seniorDiscount = selectedRoom?.senior_discount;
//       const isSeniorDiscountApplied = seniorDiscount?.applied === true;
//       console.log("Senior discount status:", { isSeniorDiscountApplied, seniorDiscount });

//       // Get order_id from localStorage if it exists (for duplicate prevention)
//       const existingOrderId = localStorage.getItem("orderId") || "";
//       console.log("Existing orderId:", existingOrderId);

//       // UPDATED: New API request body structure
//       const bookingDetails = {
//         guest: {
//           firstname: guestData.first_name,
//           lastname: guestData.last_name,
//           phonenumber: guestData.phone_number ? parseInt(guestData.phone_number) : null,
//           emailid: guestData.email,
//           countrycode: guestData.country_code,
//           clienttype: guestData.client_type,
//           country: selectedCountry?.name || "India",
//           gst_number: gstNumber || null,
//           // Send company details for corporate guests
//           ...(clientType === "Corporate" && corporateCode
//             ? {
//                 companyid: companyId,
//                 companyname: companyName,
//                 contractid: corporateCode,
//               }
//             : {}),
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
//           checkindate: formattedCheckInDate,
//           checkoutdate: formattedCheckOutDate,
//           room_type: selectedRoom?.roomtypename || "N/A",
//           number_of_guests: (adults || 0) + (children || 0) + (infants || 0),
//           quantity: rooms || 1,
//           special_requests: specialRequest || "",
//           gst_number: gstNumber || null,
//           senior_discount: {
//             applied: isSeniorDiscountApplied,
//             total_amount: isSeniorDiscountApplied
//               ? seniorDiscount?.total_amount || 0
//               : 0,
//             per_day_amount: isSeniorDiscountApplied
//               ? seniorDiscount?.per_day_amount || 0
//               : 0,
//             percent: isSeniorDiscountApplied ? seniorDiscount?.percent || 0 : 0,
//             policy_name: isSeniorDiscountApplied
//               ? seniorDiscount?.policy_name || "SENIOR_DISCOUNT"
//               : "",
//             applied_source: "senior",
//           },
//           order_id: existingOrderId || "",
//         },
//       };

//       console.log("Booking Details prepared:", JSON.stringify(bookingDetails, null, 2));
//       localStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
//       console.log("Booking details saved to localStorage");

//       // Step 1: Create the reservation
//       console.log("Calling create-reservation-walkin-new API...");
//       const reservationResponse = await fetch(
//         `${CQ_BASE_URL}/bq/api/create-reservation-walkin-new/`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(bookingDetails),
//         }
//       );

//       console.log("Reservation API response status:", reservationResponse.status);

//       if (!reservationResponse.ok) {
//         const errorData = await reservationResponse.json();
//         console.error("Reservation API error response:", errorData);
//         throw errorData;
//       }

//       const reservationData = await reservationResponse.json();
//       console.log("Reservation API success response:", reservationData);

//       const bookingId = reservationData.booking_id;
//       setReservationId(bookingId);
//       console.log("Booking ID:", bookingId);

//       // Store all reservation data in localStorage
//       localStorage.setItem("reservationId", bookingId);
//       localStorage.setItem("orderId", reservationData.order_id);
//       localStorage.setItem("billingId", reservationData.billing.billing_id);
//       localStorage.setItem("reservationData", JSON.stringify(reservationData));
//       console.log("Reservation data saved to localStorage");

//       if (
//         reservationData.qrcodes &&
//         Array.isArray(reservationData.qrcodes) &&
//         reservationData.qrcodes.length > 0
//       ) {
//         localStorage.setItem("qrcode", reservationData.qrcodes[0]);
//         console.log("QR code saved");
//       }

//       if (reservationData.guests && Array.isArray(reservationData.guests)) {
//         localStorage.setItem(
//           "guestDetails",
//           JSON.stringify(reservationData.guests)
//         );
//         console.log("Guest details saved");
//       }

//       // Step 2: Create unified billing if there are selected amenities
//       let unifiedBillingId = null;
//       if (selectedAmenities.length > 0) {
//         console.log("Creating unified billing for amenities...");
//         const unifiedBillingResponse = await createUnifiedBilling(bookingId);
//         console.log("Unified Billing Response:", unifiedBillingResponse);

//         unifiedBillingId = unifiedBillingResponse.billingid;
//         setUnifiedBillingId(unifiedBillingId);
//         localStorage.setItem("unifiedBillingId", unifiedBillingId);
//         localStorage.setItem(
//           "unifiedBillingData",
//           JSON.stringify(unifiedBillingResponse)
//         );
//         console.log("Unified billing created with ID:", unifiedBillingId);
//       } else {
//         console.log("No amenities selected, skipping unified billing");
//       }

//       // Calculate total amount from both billing sources
//       const reservationBillingAmount = parseFloat(
//         reservationData.billing.final_amount
//       );
//       const unifiedBillingAmount =
//         selectedAmenities.reduce(
//           (sum, amenity) => sum + amenity.totalPrice,
//           0
//         ) * 1.12;

//       const totalAmount = reservationBillingAmount + unifiedBillingAmount;
//       console.log("Final amounts:", { reservationBillingAmount, unifiedBillingAmount, totalAmount });

//       setReservationMessage(
//         `Reservation successful! Thank you for choosing our hotel.`
//       );
//       setReservationError("");
//       setReservationPopupOpen(true);
//       console.log("=== handleBooking COMPLETED SUCCESSFULLY ===");
//     } catch (error) {
//       let errorMessage = "An error occurred during booking";
//       console.error("=== handleBooking ERROR ===");
//       console.error("Error object:", error);

//       if (error.detail) {
//         errorMessage = error.detail;
//         console.error("Error detail:", error.detail);
//       } else if (error.message) {
//         errorMessage = error.message;
//         console.error("Error message:", error.message);
//       } else if (typeof error === "string") {
//         errorMessage = error;
//         console.error("Error string:", error);
//       } else if (error.errors) {
//         errorMessage = Object.values(error.errors).join(", ");
//         console.error("Error validation errors:", error.errors);
//       }

//       setReservationError(error);
//       setReservationPopupOpen(true);
//       console.log("Reservation error set, popup opened");
//     } finally {
//       setIsLoading(false);
//       console.log("Loading state set to false");
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

//         const apiUrl = `${CQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

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
//               `Payment order creation failed: ${response.statusText}`,
//           );
//         }

//         const orderData = await response.json();

//         if (orderData && orderData.razorpay_order_id) {
//           // Get the total amount from both billing sources
//           const reservationData = JSON.parse(
//             localStorage.getItem("reservationData"),
//           );
//           const reservationBillingAmount = parseFloat(
//             reservationData.billing.final_amount,
//           );

//           const unifiedBillingData = unifiedBillingId
//             ? JSON.parse(localStorage.getItem("unifiedBillingData"))
//             : null;

//           const unifiedBillingAmount = unifiedBillingData
//             ? parseFloat(unifiedBillingData.final_amount)
//             : 0;

//           const totalAmount = reservationBillingAmount + unifiedBillingAmount;

//           console.log("RAZORPAY_KEY:", RAZORPAY_KEY);

//           const options = {
//             key: RAZORPAY_KEY,
//             amount: totalAmount * 100, // Convert to paise
//             currency: "INR",
//             name: "Pagoda Hotel",
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
//                   `${CQ_BASE_URL}/bq/api/razorpay/verify_payment_multiple`,
//                   {
//                     method: "POST",
//                     headers: {
//                       "Content-Type": "application/json",
//                       Accept: "application/json",
//                     },
//                     body: JSON.stringify(paymentDetails),
//                   },
//                 );

//                 if (!verificationResponse.ok) {
//                   throw new Error("Payment verification failed");
//                 }

//                 const verificationData = await verificationResponse.json();

//                 if (verificationData.status === "success") {
//                   toast.success("Payment successful and verified!");

//                   // Update both billing records
//                   await Promise.all([
//                     fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
//                       method: "POST",
//                       headers: {
//                         "Content-Type": "application/json",
//                       },
//                       body: JSON.stringify({
//                         billing_id: reservationBillingId,
//                         status: "paid",
//                         payment_method: "razorpay",
//                         payment_reference: response.razorpay_payment_id,
//                       }),
//                     }),
//                     ...(unifiedBillingId
//                       ? [
//                           fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
//                             method: "POST",
//                             headers: {
//                               "Content-Type": "application/json",
//                             },
//                             body: JSON.stringify({
//                               billing_id: unifiedBillingId,
//                               status: "paid",
//                               payment_method: "razorpay",
//                               payment_reference: response.razorpay_payment_id,
//                             }),
//                           }),
//                         ]
//                       : []),
//                   ]);

//                   window.location.href = "/payment-succesful";
//                 } else {
//                   toast.error(
//                     "Payment verification failed. Please contact support.",
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
//           error.message || "Error processing payment. Please try again.",
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

//   // Replace the existing addAdditionalGuest function with:
//   const handleAddAdditionalGuest = () => {
//     if (additionalGuests.length >= adults - 1) return;

//     const newGuest = {
//       firstName: "",
//       lastName: "",
//       phoneNumber: "",
//       email: "",
//       countryCode: "+91",
//       country: selectedCountry,
//     };

//     dispatch(addAdditionalGuest(newGuest));

//     setTimeout(() => {
//       const guestContainer = document.querySelector(".guest-list-container");
//       if (guestContainer) {
//         guestContainer.scrollTop = guestContainer.scrollHeight;
//       }
//     }, 100);
//   };

//   // Replace the existing handleAdditionalGuestChange function with:
//   const handleAdditionalGuestChange = (index, field, value) => {
//     const updatedGuest = {
//       ...additionalGuests[index],
//       [field]: value,
//     };

//     dispatch(updateAdditionalGuest(index, updatedGuest));

//     // Validation logic remains the same
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
//       } else if (value.length !== 10) {
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
//   // Add this new function for saving guests
//   const saveAdditionalGuests = () => {
//     // Validate all additional guests before saving
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
//         "Please fill all required fields for additional guests correctly",
//       );
//       return;
//     }

//     // Ensure all additional guests have country data
//     const updatedGuests = additionalGuests.map((guest) => ({
//       ...guest,
//       country: guest.country || selectedCountry, // Fallback to primary guest's country
//     }));

//     // Update Redux state with country data
//     updatedGuests.forEach((guest, index) => {
//       dispatch(updateAdditionalGuest(index, guest));
//     });

//     toast.success("Additional guests saved successfully!");
//   };

//   // Update useEffect to prefill company data
//   useEffect(() => {
//     const fetchGuestData = async () => {
//       const guestData = await getGuestData();
//       if (guestData) {
//         setFirstName(guestData.first_name || "");
//         setLastName(guestData.last_name || "");
//         setPhoneNumber(guestData.phone_number || "");
//         setEmail(guestData.email || "");
//         setCountryCode(
//           guestData.country_code &&
//             countryCodeEnum.includes(guestData.country_code)
//             ? guestData.country_code
//             : "+91",
//         );
//         setClientType(guestData.client_type || "Leisure");

//         // Prefill company data if available and set corporate status
//         if (guestData.is_corporate) {
//           setCompanyName(guestData.company_name);
//           setCompanyId(guestData.company_id || "");
//           setIsCorporateGuest(true);
//           setClientType("Corporate");
//         }
//       }
//     };

//     fetchGuestData();
//   }, []);

//   // Add this useEffect for closing dropdowns when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       // Close primary country dropdown
//       if (isOpen && !event.target.closest(".country-dropdown-primary")) {
//         setIsOpen(false);
//       }

//       // Close additional guest country dropdowns
//       Object.keys(guestDropdownStates).forEach((index) => {
//         if (
//           guestDropdownStates[index] &&
//           !event.target.closest(`.country-dropdown-guest-${index}`)
//         ) {
//           setGuestDropdownStates((prev) => ({
//             ...prev,
//             [index]: false,
//           }));
//         }
//       });
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isOpen, guestDropdownStates]);

//   const fallbackImages = [
//     "https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg",
//   ];

//   if (!selectedRoom) {
//     return (
//       <div className="h-[600px] bg-white p-10 flex flex-col items-center justify-center space-y-6">
//         <AiOutlineWarning className="w-20 h-20 text-red-500" />
//         <h1 className="text-3xl font-extrabold text-gray-800">
//           No Room Selected!
//         </h1>
//         <p className="text-red-500 text-center text-xl font-bold">
//           It looks like you haven't selected a room yet.
//           <br />
//           Please choose one to proceed with your reservation.
//         </p>
//         <button
//           onClick={() => navigate("/walk-in/room-reservation")}
//           className="mt-4 bg-gradient-to-br from-black to-black text-white px-6 py-3 rounded-xl shadow-md hover:text-gray-100 font-bold"
//         >
//           Select a Room
//         </button>
//       </div>
//     );
//   }

//   const getRoomTaxApplicable = () => {
//     // Check if tax_applicable exists in selectedRoom (from Redux)
//     if (selectedRoom?.tax_applicable !== undefined) {
//       return selectedRoom.tax_applicable;
//     }

//     // Return 0 as fallback (not 1800 or 12%)
//     return 0;
//   };

//   // Get tax applicable from API
//   const roomTaxApplicable = getRoomTaxApplicable();

//   const basePricePerRoom =
//     selectedRoom?.dynamicPrice || selectedRoom?.baseprice || 10000;
//   const basePrice = basePricePerRoom * rooms;

//   // Room tax (12%)
//   const roomTax = roomTaxApplicable * rooms;

//   // Amenities subtotal and tax
//   let amenitiesTotal = 0;
//   let amenitiesTax = 0;

//   selectedAmenities.forEach((amenity) => {
//     amenitiesTotal += amenity.totalPrice;
//     amenitiesTax += (amenity.totalPrice * amenity.value) / 100;
//   });

//   const taxAmount = roomTax + amenitiesTax;

//   const totalPrice = basePrice + amenitiesTotal + taxAmount;

//   const nextImage = () => {
//     setCurrentImageIndex(
//       (prev) =>
//         (prev + 1) %
//         (selectedRoom?.image_urls?.length || fallbackImages.length),
//     );
//   };

//   const prevImage = () => {
//     setCurrentImageIndex(
//       (prev) =>
//         (prev -
//           1 +
//           (selectedRoom?.image_urls?.length || fallbackImages.length)) %
//         (selectedRoom?.image_urls?.length || fallbackImages.length),
//     );
//   };

//   // Add this function outside your component
//   const formatDateToDDMMYYYY = (dateString) => {
//     if (!dateString) return "N/A";

//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "Invalid Date";

//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
//     const year = date.getFullYear();

//     return `${day}-${month}-${year}`;
//   };

//   // Helper function to format field names for display
//   const formatFieldName = (fieldName) => {
//     const nameMap = {
//       applied_source: "Applied Source",
//       senior_discount: "Senior Discount",
//       applied: "Applied Status",
//       total_amount: "Total Amount",
//       per_day_amount: "Per Day Amount",
//       percent: "Percentage",
//       policy_name: "Policy Name",
//       body: "Request Body",
//       booking: "Booking Details",
//     };

//     return (
//       nameMap[fieldName] ||
//       fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
//     );
//   };
//   const showAdditionalGuestError = () => {
//     // Create a more detailed error object
//     const errorDetails = {
//       title: "Additional Guest Information Required",
//       message: `You have selected ${adults} adult(s) for your reservation.`,
//       details: [
//         `Primary guest information: ${firstName ? "✓ Provided" : "✗ Missing"}`,
//         `Additional guest(s) required: ${adults - 1}`,
//         `Additional guest(s) provided: ${additionalGuests.length}`,
//       ],
//       missingGuests: adults - 1 - additionalGuests.length,
//       actionRequired: `Please add information for ${adults - 1 - additionalGuests.length} more guest(s) by clicking the "Add guest" button below.`,
//     };

//     setReservationError({
//       detail: errorDetails,
//     });
//     setReservationPopupOpen(true);
//   };

//   return (
//     <div className="w-full px-10 py-4 mt-20 bg-white max-w-8xl mx-auto">
//       <button
//         onClick={() => navigate(-1)} // Goes back to previous page
//         className="fixed bottom-6 left-6 z-50 bg-purple-500 hover:bg-purple-800 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 group"
//         aria-label="Go back"
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-6 w-6"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M10 19l-7-7m0 0l7-7m-7 7h18"
//           />
//         </svg>
//         {/* Tooltip on hover */}
//         <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//           Go Back
//         </span>
//       </button>

//       {/* Rest of your existing JSX */}
//       {/* <div className="p-4 border-b border-gray-200 bg-gray-50">
//         <ProgressSteps currentStep={3} />
//       </div> */}

//       <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-6 ml-4">
//         Reserve and Pay
//       </h1>
//       {/* <div className="ml-4 mb-4 text-gray-600 text-md">
//         <p>
//           {adults} Adult{adults !== 1 ? "s" : ""}
//           {children > 0 && (
//             <>
//               , {children} Child{children !== 1 ? "ren" : ""}
//             </>
//           )}
//           {` · ${Math.max(1, daysCount)} Night${daysCount !== 1 ? "s" : ""}`}
//           {` · ${rooms} Room${rooms !== 1 ? "s" : ""}`}
//           {selectedRoom?.roomtypename && ` · ${selectedRoom.roomtypename}`}
//         </p>
//       </div> */}

//       <div className="flex flex-col md:flex-row gap-6 mx-4">
//         {/* Left Column (2/3 width) */}
//         <div className="w-full md:w-2/3">
//           {/* Fully Refundable Card */}
//           <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
//             <div className="flex justify-between items-start mb-4">
//               {/* Icon and Room Info */}
//               <div className="flex items-start gap-2">
//                 <div className="bg-blue-100 p-2 rounded-full">
//                   <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-900 mt-1 md:text[12px] lg:text-[14px]">
//                     Room 1: {adults} Adult{adults !== 1 ? "s" : ""}
//                     {children > 0 &&
//                       `, ${children} Child${children !== 1 ? "ren" : ""}`}
//                     , {selectedRoom?.roomtypename || "Deluxe"}
//                     <>
//                       , with{" "}
//                       {selectedRoom.amenities.map((amenity, index) => (
//                         <span
//                           key={index}
//                           className="inline-flex items-center gap-1 mr-1 text-green-600"
//                         >
//                           <ImCheckmark className="text-green-500 ml-1" />
//                           {amenity.name}
//                           {index !== selectedRoom.amenities.length - 1 && ","}
//                         </span>
//                       ))}
//                     </>
//                   </p>
//                 </div>
//               </div>

//               {/* Floating Total Price */}
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

//             {/* Signed-in Info */}
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
//             {/* Primary Guest Section */}
//             <div className="mb-6">
//               <div className="flex items-center gap-2 mb-3">
//                 <span className="text-sm font-semibold text-gray-700">
//                   Room 1:
//                 </span>
//                 <span className="text-sm text-gray-700">
//                   {adults} Adult{adults > 1 ? "s" : ""}
//                   {childrenAges.length > 0 ? (
//                     <>
//                       , {childrenAges.length} Child
//                       {childrenAges.length > 1 ? "ren" : ""} (
//                       {childrenAges.map((age, index) => (
//                         <span key={index}>
//                           {age} yr{age > 1 ? "s" : ""}
//                           {index !== childrenAges.length - 1 && ", "}
//                         </span>
//                       ))}
//                       )
//                     </>
//                   ) : (
//                     ""
//                   )}
//                   {selectedRoom?.roomtypename &&
//                     `, ${selectedRoom.roomtypename}`}
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
//                       Mobile number
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
//                       Email
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

//                 {/* GST Number Field - Added below email */}

//                 {/* GST Number Field - Only show for Leisure guests */}
//                 {clientType === "Leisure" && (
//                   <div className="grid grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         GST Number{" "}
//                         <span className="text-gray-400 text-xs font-normal">
//                           (optional)
//                         </span>
//                       </label>
//                       <input
//                         type="text"
//                         value={gstNumber}
//                         onChange={handleGstChange}
//                         className="w-full p-2 border border-gray-300 rounded-md text-sm uppercase"
//                         placeholder="Enter GST number"
//                       />
//                       <div className="h-2">
//                         {gstErrors && (
//                           <p className="text-[10px] text-red-500 mt-1">
//                             {gstErrors}
//                           </p>
//                         )}
//                       </div>
//                     </div>
//                     <div>
//                       {/* Empty div for spacing - keeps the grid layout */}
//                     </div>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-2 gap-6">
//                   {/* Profile Type */}
//                   <div className="mb-1">
//                     <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
//                       Profile Type*
//                     </label>
//                     <div className="relative">
//                       <select
//                         value={clientType}
//                         onChange={handleClientTypeChange}
//                         className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                       >
//                         <option value="Leisure">Leisure</option>
//                         <option
//                           value="Corporate"
//                           disabled={
//                             !corporateCode || !companyName || !companyId
//                           }
//                           className={
//                             !corporateCode || !companyName || !companyId
//                               ? "text-gray-400"
//                               : ""
//                           }
//                         >
//                           Corporate
//                           {!corporateCode && " (Apply corporate rate first)"}
//                           {corporateCode &&
//                             (!companyName || !companyId) &&
//                             " (Update profile with company details)"}
//                         </option>
//                       </select>

//                       {/* Show warning if corporate code applied but Leisure selected */}
//                       {corporateCode && clientType === "Leisure" && (
//                         <div className="absolute top-full left-0 mt-1 w-full bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2 rounded-md shadow-lg z-10">
//                           <p className="font-semibold mb-1">
//                             ⚠ Corporate Rate Applied
//                           </p>
//                           <p>
//                             You have applied hotel rate code{" "}
//                             <span className="font-mono">{corporateCode}</span>
//                           </p>
//                           <p>
//                             Switch to Corporate profile type to use this rate
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Country Select (with flags) */}
//                   <div className="mb-1 relative">
//                     <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
//                       Country*
//                     </label>
//                     <div className="relative country-dropdown-primary">
//                       {/* Selected country button */}
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
//                         <span className="ml-2 font-semibold">
//                           {isOpen ? "∧" : "∨"}
//                         </span>
//                       </button>

//                       {/* Dropdown list */}
//                       {isOpen && (
//                         <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
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
//                 </div>

//                 {/* Add Corporate Fields Section */}
//                 {clientType === "Corporate" && corporateCode && (
//                   <div className=" p-4 bg-white rounded-lg border border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                       Company Details
//                     </h3>
//                     <div className="grid grid-cols-1 gap-2">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Company Name*
//                         </label>
//                         <input
//                           type="text"
//                           value={companyName}
//                           onChange={(e) => setCompanyName(e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
//                           placeholder="Enter  Corporate name"
//                           disabled
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Company ID*
//                         </label>
//                         <input
//                           type="text"
//                           value={companyId}
//                           onChange={(e) => setCompanyId(e.target.value)}
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
//                           placeholder="Enter  Corporate ID"
//                           disabled
//                         />
//                       </div>
//                     </div>
//                     <p className="text-xs font-semibold text-gray-900 bg-yellow-200 px-2 py-1 rounded-md mt-2">
//                       Note: Corporate details can’t be edited here. Update them
//                       in your profile to reflect changes.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="mt-6">
//               {/* Container for additional guests that will scroll */}
//               <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
//                 {additionalGuests.map((guest, index) => (
//                   <div
//                     key={index}
//                     className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
//                   >
//                     <button
//                       onClick={() => dispatch(removeAdditionalGuest(index))}
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
//                               e.target.value,
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
//                               e.target.value,
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
//                                 e.target.value,
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
//                                 e.target.value,
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
//                       <div
//                         className={`relative country-dropdown-guest-${index}`}
//                       >
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
//                             <span className="ml-2 font-semibold">
//                               {guestDropdownStates[index] ? "∧" : "∨"}
//                             </span>
//                           </button>

//                           {guestDropdownStates[index] && (
//                             <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
//                               {countries.map((country) => (
//                                 <div
//                                   key={country.code}
//                                   onClick={() => {
//                                     handleAdditionalGuestChange(
//                                       index,
//                                       "country",
//                                       country,
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

//               {/* Fixed "Add guest" button at the bottom */}
//               <div className="flex justify-between items-center py-3">
//                 <div className="relative group w-fit">
//                   <button
//                     onClick={handleAddAdditionalGuest}
//                     disabled={additionalGuests.length >= adults - 1}
//                     className={`flex items-center gap-2 pb-4 ${
//                       additionalGuests.length >= adults - 1
//                         ? "text-gray-400 cursor-not-allowed"
//                         : "text-blue-600 hover:text-blue-800"
//                     }`}
//                   >
//                     <FiPlus className="w-4 h-4" />
//                     Additional guest
//                   </button>
//                   {/* Tooltip code remains the same */}
//                   {additionalGuests.length >= adults - 1 && (
//                     <div className="absolute whitespace-nowrap bottom-full mb-2 left-52 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
//                       To add more guests, please increase the number of adults
//                       in your reservation
//                     </div>
//                   )}
//                 </div>

//                 {additionalGuests.length > 0 && (
//                   <button
//                     onClick={saveAdditionalGuests}
//                     className="bg-purple-500 hover:bg-purple-800 text-white px-10 py-2 rounded-md text-sm font-medium ml-4"
//                   >
//                     Save
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Additional Rooms and Guests */}
//             {rooms > 1 && (
//               <div className="border-t pt-6">
//                 <h3 className="text-lg font-bold text-gray-800 mb-4">
//                   Additional Rooms
//                 </h3>

//                 {Array.from({ length: rooms - 1 }).map((_, roomIndex) => (
//                   <div key={roomIndex} className="mb-6 border-b pb-6">
//                     <div className="flex items-center gap-2 mb-3">
//                       <span className="text-sm font-semibold text-gray-700">
//                         Room {roomIndex + 2}:
//                       </span>
//                       <span className="text-sm">
//                         {selectedRoom?.roomtypename},
//                         {selectedRoom?.amenities?.map((amenity, index) => (
//                           <span
//                             key={index}
//                             className="inline-flex items-center gap-1 mr-2"
//                           >
//                             <ImCheckmark className="text-green-500 ml-2" />
//                             {amenity.name}
//                             {index !== selectedRoom.amenities.length - 1 && ","}
//                           </span>
//                         ))}
//                       </span>
//                     </div>

//                     <div className="space-y-4">
//                       <div className="grid grid-cols-2 gap-6">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             First name*
//                           </label>
//                           <input
//                             type="text"
//                             value={additionalGuests[roomIndex]?.firstName || ""}
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "firstName",
//                                 e.target.value,
//                               )
//                             }
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="First name"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Last name*
//                           </label>
//                           <input
//                             type="text"
//                             value={additionalGuests[roomIndex]?.lastName || ""}
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "lastName",
//                                 e.target.value,
//                               )
//                             }
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Last name"
//                           />
//                         </div>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Mobile number
//                         </label>
//                         <div className="flex gap-2">
//                           <select
//                             value={
//                               additionalGuests[roomIndex]?.countryCode || "+91"
//                             }
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "countryCode",
//                                 e.target.value,
//                               )
//                             }
//                             className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
//                           >
//                             <option value="+91">+91</option>
//                             <option value="+1">+1</option>
//                             <option value="+44">+44</option>
//                             <option value="+81">+81</option>
//                           </select>
//                           <input
//                             type="text"
//                             value={
//                               additionalGuests[roomIndex]?.phoneNumber || ""
//                             }
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "phoneNumber",
//                                 e.target.value,
//                               )
//                             }
//                             className="w-[355px] p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Please enter a valid Mobile number"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

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
//               Selected Amenities
//             </h2>

//             {selectedAmenities.length > 0 ? (
//               selectedAmenities.map((amenity) => (
//                 <li key={amenity.id} className="flex justify-between py-1">
//                   <span>
//                     {amenity.name} × {amenity.quantity}{" "}
//                     {/* {amenity.type && (
//                       <span className="text-xs text-gray-500 block">
//                         {amenity.type}
//                       </span>
//                     )} */}
//                   </span>
//                   {/* <span>₹{amenity.totalPrice.toLocaleString("en-IN")}</span> */}
//                 </li>
//               ))
//             ) : (
//               <p className="text-gray-500 text-sm">No amenities selected.</p>
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
//                 as no-shows, will incur a charge equivalent to first night’s
//                 stay.
//               </li>
//               <li>
//                 Guests are requested to present a valid government-issued photo
//                 ID at the time of check-in. Foreign nationals are requested to
//                 carry a valid passport and visa for verification.
//               </li>
//               <li>
//                 Guests may check in from 11:00 AM onwards and are requested to
//                 check out by 12:00 PM.
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
//           <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
//             {/* Signed-in Info */}
//             <div className=" p-0.5 text-right">
//               <p className="text-sm text-black">
//                 <span className="font-semibold ">Signed in as</span> {email}
//               </p>
//             </div>
//           </div>
//           <div className="rounded-2xl border border-gray-200 shadow-sm bg-white sticky top-4">
//             {/* Image slider section */}
//             <div className="relative w-full h-60 overflow-hidden rounded-t-2xl">
//               {(selectedRoom?.image_urls?.length > 0
//                 ? selectedRoom.image_urls
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
//                 className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-2 rounded-full"
//               >
//                 &lt;
//               </button>
//               <button
//                 onClick={nextImage}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-2 rounded-full"
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
//                       {checkInDate
//                         ? new Date(checkInDate).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             year: "numeric",
//                           })
//                         : "N/A"}{" "}
//                       (11:00 AM)
//                     </p>
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Check-out:
//                     </h3>
//                     <p className="text-gray-600 text-sm">
//                       {checkOutDate
//                         ? new Date(checkOutDate).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             year: "numeric",
//                           })
//                         : "N/A"}{" "}
//                       (12:00 PM)
//                     </p>
//                   </div>
//                 </div>

//                 {/* In the Price Details section of the right column */}
//                 <div className="border-t pt-4 mb-4">
//                   <h3 className="text-lg font-bold text-gray-800 mb-2">
//                     Price Details
//                   </h3>

//                   {/* Room Charges */}
//                   <div className="flex justify-between text-sm text-gray-700 mb-1">
//                     <span>
//                       {rooms} Room{rooms > 1 ? "s" : ""} ×{" "}
//                       {Math.max(1, daysCount)} Night
//                       {Math.max(1, daysCount) > 1 ? "s" : ""}
//                     </span>
//                     <span>
//                       ₹
//                       {basePrice.toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>

//                   {/* Show amenities with their prices */}
//                   {selectedAmenities.length > 0 && (
//                     <div className="">
//                       <ul className="text-sm text-gray-700">
//                         {selectedAmenities.map((amenity) => (
//                           <li
//                             key={amenity.id}
//                             className="flex justify-between py-1"
//                           >
//                             <span>
//                               {amenity.name} × {amenity.quantity}
//                             </span>
//                             <span>
//                               ₹
//                               {amenity.totalPrice.toLocaleString("en-IN", {
//                                 minimumFractionDigits: 2,
//                               })}
//                             </span>
//                           </li>
//                         ))}
//                       </ul>
//                     </div>
//                   )}

//                   {/* All Items Subtotal */}
//                   <div className="flex justify-between text-sm text-gray-700 mt-3 border-t pt-2">
//                     <span className="font-semibold">Subtotal:</span>
//                     <span>
//                       ₹
//                       {(basePrice + amenitiesTotal).toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>

//                   <div className="mt-3 mb-1">
//                     <div className="flex justify-between items-center">
//                       {/* Label with dropdown toggle */}
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

//                       {/* Total tax amount */}
//                       <span className="text-sm text-gray-700">
//                         ₹
//                         {taxAmount.toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </span>
//                     </div>

//                     {/* Tax breakdown dropdown */}
//                     {showTaxDetails && (
//                       <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
//                         {/* Room Tax */}
//                         <div className="mb-2">
//                           <div className="flex justify-between">
//                             <div className="flex items-center gap-1">
//                               <span>Room Taxes (5%)</span>
//                               <div className="group relative">
//                                 <FiInfo className="text-gray-400 cursor-pointer" />
//                                 <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
//                                   <div className="flex justify-between mb-1">
//                                     <span>CGST </span>
//                                     <span>
//                                       ₹
//                                       {(roomTaxApplicable / 2).toLocaleString(
//                                         "en-IN",
//                                         { minimumFractionDigits: 2 },
//                                       )}
//                                     </span>
//                                   </div>
//                                   <div className="flex justify-between">
//                                     <span>SGST </span>
//                                     <span>
//                                       ₹
//                                       {(roomTaxApplicable / 2).toLocaleString(
//                                         "en-IN",
//                                         { minimumFractionDigits: 2 },
//                                       )}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                             <span>
//                               ₹
//                               {roomTaxApplicable.toLocaleString("en-IN", {
//                                 minimumFractionDigits: 2,
//                               })}
//                             </span>
//                           </div>
//                         </div>

//                         {/* Amenities Taxes */}
//                         {selectedAmenities.map((amenity) => {
//                           const amenityTax =
//                             (amenity.totalPrice * amenity.value) / 100;
//                           return (
//                             <div key={amenity.id} className="mb-2">
//                               <div className="flex justify-between">
//                                 <div className="flex items-center gap-1">
//                                   <span>
//                                     {amenity.name} ({amenity.value}%)
//                                   </span>
//                                   <div className="group relative">
//                                     <FiInfo className="text-gray-400 cursor-pointer" />
//                                     <div className="hidden group-hover:block absolute z-10 w-48 p-2 mt-1 bg-white border border-gray-200 rounded shadow-lg">
//                                       <div className="flex justify-between mb-1">
//                                         <span>CGST ({amenity.value / 2}%)</span>
//                                         <span>
//                                           ₹
//                                           {(amenityTax / 2).toLocaleString(
//                                             "en-IN",
//                                             { minimumFractionDigits: 2 },
//                                           )}
//                                         </span>
//                                       </div>
//                                       <div className="flex justify-between">
//                                         <span>SGST ({amenity.value / 2}%)</span>
//                                         <span>
//                                           ₹
//                                           {(amenityTax / 2).toLocaleString(
//                                             "en-IN",
//                                             { minimumFractionDigits: 2 },
//                                           )}
//                                         </span>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <span>
//                                   ₹
//                                   {amenityTax.toLocaleString("en-IN", {
//                                     minimumFractionDigits: 2,
//                                   })}
//                                 </span>
//                               </div>
//                             </div>
//                           );
//                         })}
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
//                   {isSpecialRateApplied &&
//                     selectedRoom?.applied_sources_per_day && (
//                       <div className="flex justify-end text-sm text-gray-700 mb-1">
//                         <span className="flex items-center gap-1">
//                           <span className="text-green-600">✓</span>
//                           Special Rate Applied
//                         </span>
//                       </div>
//                     )}
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

//                 {/* Render the popup component */}
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
//                   className="w-full bg-purple-500 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-70"
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
//                 {/* ========== Additional Guest Information Error ========== */}
//                 {reservationError.detail?.type === "guest_info_required" ||
//                 reservationError.detail?.type === "incomplete_guest_info" ? (
//                   <div className="text-center">
//                     <div className="mb-6">
//                       <AiOutlineWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                       <h2 className="text-2xl font-bold text-red-600 mb-2">
//                         {reservationError.detail.title ||
//                           "Additional Guest Information Required"}
//                       </h2>
//                       <p className="text-sm text-gray-700 mb-4">
//                         {reservationError.detail.message}
//                       </p>

//                       {/* Show guest count details */}
//                       {reservationError.detail.details && (
//                         <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
//                           <ul className="space-y-2">
//                             {reservationError.detail.details.map(
//                               (detail, index) => (
//                                 <li key={index} className="flex items-center">
//                                   {detail.includes("✓") ? (
//                                     <span className="text-green-500 mr-2">
//                                       ✓
//                                     </span>
//                                   ) : detail.includes("✗") ? (
//                                     <span className="text-red-500 mr-2">✗</span>
//                                   ) : null}
//                                   {detail}
//                                 </li>
//                               ),
//                             )}
//                           </ul>
//                         </div>
//                       )}

//                       {/* Show missing guest count */}
//                       {reservationError.detail.missingGuests > 0 && (
//                         <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
//                           <p className="font-semibold text-yellow-800">
//                             Action Required:
//                           </p>
//                           <p className="text-yellow-700">
//                             {reservationError.detail.actionRequired}
//                           </p>
//                         </div>
//                       )}

//                       {/* Show how to fix */}
//                       <div className="mt-4 p-4 bg-blue-50 rounded-lg">
//                         <p className="font-semibold text-blue-800 mb-2">
//                           How to fix this:
//                         </p>
//                         <ol className="text-left text-sm text-blue-700 space-y-1 pl-5">
//                           <li>
//                             1. Scroll down to the "Additional Guests" section
//                             and click on that.
//                           </li>
//                           <li>
//                             2. Fill in all required fields (First Name, Last
//                             Name)
//                           </li>
//                           <li>3. Click "Save" after adding each guest</li>
//                           <li>4. Try reserving again</li>
//                         </ol>
//                       </div>
//                     </div>

//                     <div className="space-y-1">
//                       <button
//                         onClick={() => {
//                           setReservationPopupOpen(false);
//                           // Scroll to additional guests section
//                           setTimeout(() => {
//                             const guestSection = document.querySelector(
//                               ".guest-list-container",
//                             );
//                             if (guestSection) {
//                               guestSection.scrollIntoView({
//                                 behavior: "smooth",
//                                 block: "start",
//                               });
//                               // Highlight the section
//                               guestSection.parentElement.style.boxShadow =
//                                 "0 0 0 2px #3b82f6";
//                               setTimeout(() => {
//                                 if (guestSection.parentElement) {
//                                   guestSection.parentElement.style.boxShadow =
//                                     "";
//                                 }
//                               }, 2000);
//                             }
//                           }, 100);
//                         }}
//                         className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md transition-colors"
//                       >
//                         Add Guest Information Now
//                       </button>
//                     </div>

//                     <div className="mt-2 pt-2 border-t border-gray-200">
//                       <p className="text-sm text-gray-500">
//                         <span className="font-semibold">Note:</span> For group
//                         bookings, we require complete information for all guests
//                         staying in the room as per hotel policy and government
//                         regulations.
//                       </p>
//                     </div>
//                   </div>
//                 ) : reservationError.detail?.type ===
//                     "corporate_rate_required" ||
//                   reservationError.detail?.type ===
//                     "company_details_required" ? (
//                   <div className="text-center">
//                     <div className="mb-6">
//                       <AiOutlineWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                       <h2 className="text-2xl font-bold text-red-600 mb-2">
//                         {reservationError.detail.title ||
//                           "Corporate Booking Issue"}
//                       </h2>

//                       <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
//                         <p className="text-red-700 font-semibold mb-2">
//                           {reservationError.detail.message}
//                         </p>

//                         {reservationError.detail.type ===
//                           "company_details_required" && (
//                           <div className="mt-3">
//                             <p className="text-sm text-gray-700 mb-2">
//                               <span className="font-semibold">
//                                 Missing in your profile:
//                               </span>
//                             </p>
//                             <ul className="text-sm text-gray-600 space-y-1 pl-5">
//                               {!companyName && (
//                                 <li className="flex items-center">
//                                   <span className="text-red-500 mr-2">✗</span>
//                                   Hotel Name
//                                 </li>
//                               )}
//                               {!companyId && (
//                                 <li className="flex items-center">
//                                   <span className="text-red-500 mr-2">✗</span>
//                                   Corporate ID
//                                 </li>
//                               )}
//                             </ul>
//                           </div>
//                         )}

//                         {reservationError.detail.type ===
//                           "corporate_rate_required" && (
//                           <div className="mt-3">
//                             <p className="text-sm text-gray-700">
//                               <span className="font-semibold">
//                                 To apply corporate rate:
//                               </span>
//                             </p>
//                             <p className="text-sm text-gray-600">
//                               Go back to room selection and enter a valid
//                               corporate contract code.
//                             </p>
//                           </div>
//                         )}
//                       </div>

//                       {reservationError.detail.solution && (
//                         <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
//                           <p className="font-semibold text-yellow-800">
//                             Solution:
//                           </p>
//                           <p className="text-yellow-700">
//                             {reservationError.detail.solution}
//                           </p>
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-3">
//                       {reservationError.detail.type ===
//                       "company_details_required" ? (
//                         <>
//                           <button
//                             onClick={() => {
//                               setReservationPopupOpen(false);
//                               setClientType("Leisure");
//                               toast.info(
//                                 "Switched to Leisure profile type. You can now proceed.",
//                               );
//                             }}
//                             className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md"
//                           >
//                             Switch to Leisure Booking
//                           </button>

//                           <button
//                             onClick={() => {
//                               setReservationPopupOpen(false);
//                               // Navigate to profile page
//                               navigate("/profile");
//                             }}
//                             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md"
//                           >
//                             Update Profile with Company Details
//                           </button>
//                         </>
//                       ) : (
//                         <button
//                           onClick={() => {
//                             setReservationPopupOpen(false);
//                             // Navigate back to room reservation
//                             navigate("/walk-in/room-reservation");
//                           }}
//                           className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md"
//                         >
//                           Go Back to Apply Corporate Rate
//                         </button>
//                       )}

//                       <button
//                         onClick={() => setReservationPopupOpen(false)}
//                         className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-md"
//                       >
//                         Cancel
//                       </button>
//                     </div>

//                     <div className="mt-6 pt-4 border-t border-gray-200">
//                       <p className="text-sm text-gray-500">
//                         <span className="font-semibold">
//                           Corporate Booking Requirements:
//                         </span>
//                         <ul className="list-disc pl-5 mt-2 text-left space-y-1">
//                           <li>Valid corporate contract code</li>
//                           <li>Company Name in your profile</li>
//                           <li> Corporate ID in your profile</li>
//                           <li>Approved corporate contract with the hotel</li>
//                         </ul>
//                       </p>
//                     </div>
//                   </div>
//                 ) : reservationError.detail?.type ===
//                   "corporate_code_mismatch" ? (
//                   <div className="text-center">
//                     <div className="mb-6">
//                       <AiOutlineWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                       <h2 className="text-2xl font-bold text-red-600 mb-2">
//                         {reservationError.detail.title ||
//                           "Profile Type Mismatch"}
//                       </h2>

//                       <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
//                         <p className="text-red-700 font-semibold mb-2">
//                           {reservationError.detail.message}
//                         </p>
//                       </div>

//                       {reservationError.detail.solution && (
//                         <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
//                           <p className="font-semibold text-yellow-800">
//                             Solution:
//                           </p>
//                           <p className="text-yellow-700">
//                             {reservationError.detail.solution}
//                           </p>
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-3">
//                       <button
//                         onClick={() => {
//                           setReservationPopupOpen(false);
//                           // Navigate back to remove corporate code
//                           navigate("/walk-in/room-reservation");
//                         }}
//                         className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md"
//                       >
//                         Go Back to Remove Corporate Rate
//                       </button>
//                     </div>

//                     <div className="mt-2 pt-2 border-t border-gray-200">
//                       <p className="text-[12px] text-gray-500">
//                         <span className="font-semibold">Note:</span>Corporate
//                         rate codes require a Corporate profile with hotel
//                         details. Otherwise, please remove the code to continue
//                         as a Leisure guest.
//                       </p>
//                     </div>
//                   </div>
//                 ) : (
//                   <>
//                     <h2 className="text-center text-2xl font-bold text-red-600 mb-6">
//                       Reservation Failed
//                     </h2>

//                     {/* Handle room availability error */}
//                     {reservationError.detail?.message?.includes("Not enough") &&
//                     reservationError.detail?.available !== undefined ? (
//                       <div className="mt-2 text-center">
//                         <div className="mb-6">
//                           <AiOutlineWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                           <h3 className="text-xl font-semibold text-red-600 mb-2">
//                             Room Unavailable
//                           </h3>
//                           <p className="text-gray-700 text-lg mb-4">
//                             {reservationError.detail.message}
//                           </p>

//                           <p className="text-gray-600 mb-6">
//                             The room type you selected is not available for your
//                             selected dates.
//                             {reservationError.detail.available < 0 &&
//                               " There are currently more reservations than available rooms."}
//                           </p>
//                         </div>

//                         <div className="space-y-3">
//                           <button
//                             onClick={() => {
//                               setReservationPopupOpen(false);
//                               navigate("/walk-in/room-reservation");
//                             }}
//                             className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md transition-colors"
//                           >
//                             Choose Different Room/Dates
//                           </button>
//                         </div>

//                         <div className="mt-6 text-sm text-gray-500">
//                           <p className="font-semibold">Need help?</p>
//                           <p className="mt-1">
//                             Contact our reservations team for assistance
//                           </p>
//                           <div className="flex justify-center gap-4 text-sm mt-2">
//                             <p>
//                               Phone:{" "}
//                               {reservationError.detail.support_contact?.phone ||
//                                 "+91-8698732336"}
//                             </p>
//                             <p>
//                               Email:{" "}
//                               {reservationError.detail.support_contact?.email ||
//                                 "tushar.bhosle@hotelpagoda.com"}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     ) : reservationError.includes &&
//                       reservationError.includes(
//                         "Corporate booking requires",
//                       ) ? (
//                       <div className="text-center">
//                         <div className="mb-6">
//                           <AiOutlineWarning className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//                           <p className="text-lg font-semibold text-gray-700 mb-2">
//                             Corporate Rate Code Required
//                           </p>
//                           <p className="text-gray-600 mb-4">
//                             You selected "Corporate" but haven't applied a
//                             corporate rate code.
//                           </p>
//                         </div>

//                         <div className="space-y-3">
//                           <button
//                             onClick={() => {
//                               setReservationPopupOpen(false);
//                               setClientType("Leisure");
//                               toast.info(
//                                 "Switched to Leisure. You can now proceed.",
//                               );
//                             }}
//                             className="w-full bg-purple-500 hover:bg-purple-800 text-white font-medium py-3 rounded-md"
//                           >
//                             Switch to Leisure Guest
//                           </button>

//                           <button
//                             onClick={() => setReservationPopupOpen(false)}
//                             className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-md"
//                           >
//                             Cancel
//                           </button>
//                         </div>
//                       </div>
//                     ) : Array.isArray(reservationError?.detail) ? (
//                       <div className="mt-4">
//                         <h3 className="text-lg font-semibold text-red-600 mb-4">
//                           Validation Errors
//                         </h3>

//                         {reservationError.detail.map((error, index) => {
//                           const fieldPath = error.loc || [];
//                           const fieldName =
//                             fieldPath[fieldPath.length - 1] || "Field";
//                           const errorMsg = error.msg || "Invalid input";
//                           const inputValue = error.input || "";

//                           return (
//                             <div
//                               key={index}
//                               className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
//                             >
//                               <div className="flex items-start">
//                                 <AiOutlineWarning className="text-red-500 mt-1 mr-2 flex-shrink-0" />
//                                 <div>
//                                   <p className="font-semibold text-red-700">
//                                     {formatFieldName(fieldName)} Error
//                                   </p>
//                                   <p className="text-sm text-gray-700 mt-1">
//                                     {errorMsg}
//                                   </p>

//                                   {error.ctx?.expected && (
//                                     <p className="text-sm text-gray-600 mt-1">
//                                       <span className="font-medium">
//                                         Expected:
//                                       </span>{" "}
//                                       {error.ctx.expected}
//                                       {inputValue && (
//                                         <>
//                                           <br />
//                                           <span className="font-medium">
//                                             Received:
//                                           </span>{" "}
//                                           "{inputValue}"
//                                         </>
//                                       )}
//                                     </p>
//                                   )}

//                                   <p className="text-xs text-gray-500 mt-2">
//                                     Location: {fieldPath.join(" → ")}
//                                   </p>
//                                 </div>
//                               </div>

//                               {fieldPath.includes("senior_discount") && (
//                                 <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
//                                   <p className="text-xs text-yellow-800">
//                                     <span className="font-semibold">Note:</span>{" "}
//                                     Senior discount requires all fields
//                                     including "applied_source" which must be
//                                     "senior".
//                                   </p>
//                                 </div>
//                               )}
//                             </div>
//                           );
//                         })}

//                         <div className="mt-6 text-center">
//                           <p className="text-sm text-gray-600 mb-4">
//                             Please correct the errors above and try again.
//                           </p>
//                           <button
//                             onClick={() => setReservationPopupOpen(false)}
//                             className="bg-purple-500 hover:bg-purple-800 text-white font-medium py-2 px-6 rounded-md"
//                           >
//                             Go Back and Fix
//                           </button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="mt-4">
//                         <h3 className="text-center text-lg font-semibold text-gray-600 mb-6">
//                           We're sorry, but something went wrong during the
//                           reservation process.
//                         </h3>
//                         <p className="text-center text-base font-semibold text-gray-500 mb-6">
//                           <span className="text-red-600">
//                             {typeof reservationError === "string"
//                               ? reservationError
//                               : JSON.stringify(reservationError)}
//                           </span>
//                         </p>
//                         <div className="text-center">
//                           <button
//                             onClick={() => setReservationPopupOpen(false)}
//                             className="bg-purple-500 hover:bg-purple-800 text-white font-medium py-2 px-6 rounded-md"
//                           >
//                             Go Back
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </div>
//             ) : (
//               <div>
//                 <div className="mb-4 mt-5">
//                   <p className="text-md font-semibold ">
//                     Hello,{" "}
//                     <span className="capitalize">
//                       {firstName} {lastName}
//                     </span>{" "}
//                     you've reached last step of your reservation
//                   </p>
//                   <p className=" text-gray-800 font-semibold text-md"></p>
//                 </div>

//                 <div className="grid grid-cols-3 gap-2 mb-6">
//                   <div className="rounded-lg">
//                     <p className="text-md font-semibold text-gray-700">
//                       Reservation Number
//                     </p>
//                     <p className="text-md font-mono">
//                       {localStorage.getItem("orderId")}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Check-in
//                     </p>
//                     <p className="text-md">
//                       {checkInDate
//                         ? new Date(checkInDate).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             year: "numeric",
//                           })
//                         : "N/A"}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Check-out
//                     </p>
//                     <p className="text-md">
//                       {checkOutDate
//                         ? new Date(checkOutDate).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             year: "numeric",
//                           })
//                         : "N/A"}
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
//                     className="w-full text-lg font-semibold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
//                   >
//                     {isCorporateGuest ? "Bill to Company" : "Pay at Front Desk"}
//                   </button>

//                   <button
//                     onClick={() => handlePaymentOption("payNow")}
//                     className="w-full text-lg font-semibold bg-gradient-to-r bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-800"
//                   >
//                     Pay Now
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//       {popupOpen && (
//         <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
//           <div className="bg-white border border-gray-300 w-4/5 md:w-3/5 lg:w-2/5 p-6 rounded-2xl shadow-xl relative">
//             <button
//               className="absolute top-3 right-4 text-red-600 text-4xl"
//               onClick={togglePopup}
//             >
//               ×
//             </button>
//             <h2 className="text-center text-2xl font-bold mb-2">
//               360° Room View
//             </h2>
//             <p className="text-center text-sm text-gray-600 mb-4">
//               Explore every corner of the room with our interactive 360° view.
//             </p>
//             <PanolensViewer imageUrl={hotel3} />
//           </div>
//         </div>
//       )}

//       <ToastContainer />
//       <SpecialRequest
//         isOpen={specialRequestOpen}
//         onClose={() => setSpecialRequestOpen(false)}
//         request={specialRequest}
//         setRequest={setSpecialRequest}
//       />
//     </div>
//   );
// };

// export default BookingSummary;
