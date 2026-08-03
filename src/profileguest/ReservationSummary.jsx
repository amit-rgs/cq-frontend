import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import countries from '../Walk-In/countries';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import { FiChevronRight, FiPlus, FiMinus, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import SpecialRequest from '../pages/SpecialRequest';
import { ImCheckmark } from 'react-icons/im';
import { MdOutlineBedroomChild } from 'react-icons/md';
import LegalDocumentsPopup from '../Walk-In/LegalDocumentsPopup';
import {
  addAdditionalGuest,
  updateAdditionalGuest,
  removeAdditionalGuest,
  initAdditionalGuests,
} from '../Walk-In/redux/action';
import CancellationPolicy from '../Walk-In/CancellationPolicy';
import ReservationSteps from './ReservationSteps';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const getGuestIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
};
const getGuestData = async () => {
  const accessToken = Cookies.get('access_token');
  console.log(accessToken);
  if (!accessToken) return null;

  try {
    const guestId = getGuestIdFromToken(accessToken) || Cookies.get('guest_id');
    console.log(guestId);
    if (!guestId) return null;

    // Use the guests API endpoint that shows company info
    const guestResponse = await fetch(`${CQ_BASE_URL}/bq/api/guests/${guestId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guestResponse.ok) {
      throw new Error(`Guest API Error: ${guestResponse.statusText}`);
    }

    const guestData = await guestResponse.json();

    // The response structure is {success: true, guest: {...}}
    if (!guestData.success || !guestData.guest) {
      return null;
    }

    const guest = guestData.guest;

    // Check if this is a corporate guest
    const isCorporateGuest = guest.companyid && guest.companyname;

    // Check if email needs decryption
    const isDecrypted = guest.emailid && guest.emailid.length < 50;

    if (isDecrypted) {
      return {
        first_name: guest.firstname || '',
        last_name: guest.lastname || '',
        email: guest.emailid || '',
        phone_number: guest.phonenumber ? guest.phonenumber.toString() : '',
        country_code: guest.countrycode || '+91',
        client_type: guest.clienttype || 'Leisure',
        company_id: guest.companyid || '',
        company_name: guest.companyname || '',
        is_corporate: isCorporateGuest,
        country: guest.country || 'India',
      };
    }

    // Try to decrypt if needed
    const decryptedFields = await decryptUserData({
      email: guest.emailid,
      phone_number: guest.phonenumber,
      country_code: guest.countrycode,
    });

    return {
      first_name: guest.firstname || '',
      last_name: guest.lastname || '',
      email: decryptedFields.email || guest.emailid || '',
      phone_number:
        decryptedFields.phone_number || (guest.phonenumber ? guest.phonenumber.toString() : ''),
      country_code: guest.countrycode || '+91',
      client_type: guest.clienttype || 'Leisure',
      company_id: guest.companyid || '',
      company_name: guest.companyname || '',
      is_corporate: isCorporateGuest,
      country: guest.country || 'India',
    };
  } catch (error) {
    console.error('Error fetching guest data:', error);
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

const ReservationSummary = () => {
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
  const [showAdjustmentErrorPopup, setShowAdjustmentErrorPopup] = useState(false);
  const [adjustmentErrorDetails, setAdjustmentErrorDetails] = useState(null);
  const [checkboxError, setCheckboxError] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);
  const [editingGuestIndex, setEditingGuestIndex] = useState(null);
  const [currentEditingGuest, setCurrentEditingGuest] = useState(null);
  const [previousPricePopupOpen, setPreviousPricePopupOpen] = useState(false);
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDowngradeRefund, setIsDowngradeRefund] = useState(false);
  const [refundDetails, setRefundDetails] = useState(null);
  const [amenitiesRefundDetails, setAmenitiesRefundDetails] = useState(null);
  const [showAmenitiesPopup, setShowAmenitiesPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.name === 'India') || countries[0]
  );
  const [isOpen, setIsOpen] = useState(false);

  const [guestDropdownStates, setGuestDropdownStates] = useState({});
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isCorporateGuest, setIsCorporateGuest] = useState(false);

  // New states for preview API
  const [previewData, setPreviewData] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [unifiedBillingId, setUnifiedBillingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLegalPopup, setShowLegalPopup] = useState(false);
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [unpaidBillingDetails, setUnpaidBillingDetails] = useState({
    totalPaid: 0,
    totalDue: 0,
    unpaidBillingIds: [],
  });

  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [adjustmentWarning, setAdjustmentWarning] = useState(null);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
  });
  const [guestErrors, setGuestErrors] = useState([]);
  const [hasInitializedGuests, setHasInitializedGuests] = useState(false);

  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const validateName = (value) => {
    const trimmed = value.trim();

    // Empty check
    if (!trimmed) {
      return 'Please enter a name';
    }

    // Length check (2-60 chars total)
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (trimmed.length > 60) {
      return 'Name cannot exceed 60 characters';
    }

    // Character validation
    if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
      // Detect specific invalid characters
      const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
      if (invalidChars) {
        const uniqueChars = [...new Set(invalidChars)];
        return `Names cannot have digits`;
      }
      return "Only letters, spaces, hyphens (-) and apostrophes (') are allowed";
    }

    // Special character rules
    if (/['-]{2,}/.test(trimmed)) {
      return "Cannot have consecutive special characters (-- or '')";
    }
    if (/^['-]/.test(trimmed)) {
      return 'Only letters are allowed (no special characters)';
    }
    if (/['-]$/.test(trimmed)) {
      return 'Only letters are allowed (no special characters)  ';
    }

    // Word validation
    const words = trimmed.split(/\s+/);

    // Word length check
    for (const word of words) {
      if (word.length > 20) {
        return `"${word}" is too long (max 20 letters)`;
      }
      if (word.length < 2 && /[A-Za-z]/.test(word)) {
        return `"${word}" is too short (min 2 letters)`;
      }
    }

    // Multiple space check
    if (trimmed.includes('  ')) {
      return 'Cannot have multiple spaces between words';
    }

    return ''; // Valid name
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
  const booking = useSelector((state) => state.booking.selectedBooking);

  // Redux State
  const { checkInDate, checkOutDate, daysCount } = useSelector(
    (state) => state.selectedModifyDates
  );

  const additionalGuests = useSelector((state) => state.formDetails.additionalGuests || []);
  const { selectedRoom } = useSelector((state) => state.roomtype);
  const { rooms, adults, children, infants, childrenAges } = useSelector(
    (state) => state.formDetails
  );
  const maxAdditionalGuests = Math.max(0, adults - 1); // Subtract 1 for primary guest

  const togglePopup = () => setPopupOpen(!popupOpen);
  // In ReservationSummary.js, update the selectedAmenities selector:

  const selectedAmenities = useSelector((state) => {
    // First, try to get from Redux store (this is where EnhanceStayModify saves selections)
    const reduxAmenities = state.amenities?.selectedAmenities || [];

    console.log('Raw Redux amenities:', reduxAmenities);

    if (reduxAmenities.length > 0) {
      // Use the exact prices from Redux - DO NOT recalculate
      return reduxAmenities.map((amenity) => ({
        ...amenity,
        // Ensure totalPrice is correctly calculated using the stored price
        totalPrice: (amenity.price || 0) * (amenity.quantity || 1),
      }));
    }

    // Fallback to booking amenities if Redux is empty
    const bookingEnhancements = state.booking.selectedBooking?.enhancements_detailed || {};
    const bookingFoodItems = bookingEnhancements.food?.items || [];
    const bookingAmenityItems = bookingEnhancements.amenities?.items || [];
    const bookingRoomServiceItems = bookingEnhancements.room_services?.items || [];

    const fallbackAmenities = [
      ...bookingFoodItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price || item.price || 0,
        quantity: item.quantity || 1,
        totalPrice: (item.base_price || item.price || 0) * (item.quantity || 1),
        type: 'food',
        value: item.value || 0,
        value_type: item.value_type || 'P',
        refundable: item.refundable || false,
      })),
      ...bookingAmenityItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price || 0,
        quantity: item.quantity || 1,
        totalPrice: (item.base_price || 0) * (item.quantity || 1),
        type: 'amenity',
        value: item.value || 0,
        value_type: item.value_type || 'P',
        refundable: item.refundable || false,
      })),
      ...bookingRoomServiceItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price || 0,
        quantity: item.quantity || 1,
        totalPrice: (item.base_price || 0) * (item.quantity || 1),
        type: 'room_service',
        value: item.value || 0,
        value_type: item.value_type || 'P',
        refundable: item.refundable || false,
      })),
    ];

    return fallbackAmenities;
  });

  const countryCodes = [
    { code: '+91' },
    { code: '+1' },
    { code: '+44' },
    { code: '+61' },
    { code: '+81' },
  ];
  const countryCodeEnum = countryCodes.map((item) => item.code);

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

  const handleFirstNameChange = (e) => {
    setHasUserEdited(true);
    const value = e.target.value;
    setFirstName(value);
    const error = validateName(value, true);
    setErrors((prev) => ({ ...prev, firstName: error }));
  };

  const handleLastNameChange = (e) => {
    setHasUserEdited(true);
    const value = e.target.value;
    setLastName(value);
    const error = validateName(value, false);
    setErrors((prev) => ({ ...prev, lastName: error }));
  };

  const handlePhoneNumberChange = (e) => {
    setHasUserEdited(true);
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

  const validateAdditionalGuest = (guest) => {
    const errors = {};

    if (!guest.firstName?.trim()) {
      errors.firstName = 'First name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(guest.firstName)) {
      errors.firstName = 'Only letters and basic punctuation allowed';
    }

    if (!guest.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(guest.lastName)) {
      errors.lastName = 'Only letters and basic punctuation allowed';
    }

    if (guest.phoneNumber && !/^\d{10}$/.test(guest.phoneNumber)) {
      errors.phoneNumber = 'Phone must be 10 digits if provided';
    }

    return errors;
  };

  const saveAdditionalGuest = (index) => {
    const guestToSave = additionalGuests[index];

    const errors = validateAdditionalGuest(guestToSave);

    if (Object.keys(errors).length > 0) {
      const updatedErrors = [...guestErrors];
      updatedErrors[index] = errors;
      setGuestErrors(updatedErrors);
      toast.error('Please fix the errors before saving');
      return;
    }

    dispatch(updateAdditionalGuest(index, guestToSave));
    setEditingGuestIndex(null);
    toast.success('Guest saved successfully!');
  };

  const guestDetailsSchema = z.object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    phoneNumber: z
      .string()
      .min(1, 'Phone Number is required.')
      .regex(/^\d+$/, 'Phone Number must contain only digits.')
      .length(10, 'Phone Number must be exactly 10 digits.'),
    email: z.string().email('Email address is required.'),
    countryCode: z
      .string()
      .min(1, 'Country Code is required.')
      .refine((code) => countryCodeEnum.includes(code), {
        message: 'Invalid country code. Please select a valid country code.',
      }),
  });

  // Memoize the allEnhancements
  // Memoize the allEnhancements - make sure it's using the correct prices
  const allEnhancements = useMemo(() => {
    console.log('Selected amenities in allEnhancements:', selectedAmenities);
    return selectedAmenities;
  }, [JSON.stringify(selectedAmenities)]);
  const ItemType = {
    AMENITY: 'Amenity',
    ROOM_SERVICE: 'RoomService',
    FOOD: 'Food',
  };

  // const hasInitializedGuests = useRef(false);
  useEffect(() => {
    if (
      booking?.additional_guests?.length > 0 &&
      !hasInitializedGuests &&
      additionalGuests.length === 0
    ) {
      console.log('Initializing guests from booking data...');

      const formattedGuests = booking.additional_guests.map((guest) => ({
        firstName: guest.firstname || '',
        lastName: guest.lastname || '',
        phoneNumber: guest.phonenumber || '',
        email: guest.emailid || '',
        countryCode: guest.countrycode || '+91',
        country: guest.country
          ? countries.find((c) => c.name === guest.country) || countries[0]
          : countries[0],
      }));

      console.log('Formatted guests:', formattedGuests);

      // Use your existing action to initialize guests
      dispatch(initAdditionalGuests(formattedGuests));
      setHasInitializedGuests(true);

      // Initialize dropdown states
      const dropdownStates = {};
      formattedGuests.forEach((_, index) => {
        dropdownStates[index] = false;
      });
      setGuestDropdownStates(dropdownStates);
    }
  }, [booking, dispatch, hasInitializedGuests, additionalGuests.length]);

  useEffect(() => {
    if (additionalGuests.length > maxAdditionalGuests) {
      const excess = additionalGuests.length - maxAdditionalGuests;
      for (let i = 0; i < excess; i++) {
        dispatch(removeAdditionalGuest(additionalGuests.length - 1 - i));
      }
      toast.warning(`Reduced additional guests to match room capacity`);
    }
  }, [maxAdditionalGuests, additionalGuests.length, dispatch]);

  const handleAddAdditionalGuest = () => {
    if (additionalGuests.length >= maxAdditionalGuests) {
      toast.warning(`Maximum ${maxAdditionalGuests} additional guests allowed`);
      return;
    }

    const newGuest = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      countryCode: '+91',
    };
    dispatch(addAdditionalGuest(newGuest));
    setEditingGuestIndex(additionalGuests.length); // Start editing the new guest
  };

  const handleRemoveGuest = (index) => {
    dispatch(removeAdditionalGuest(index));
  };

  useEffect(() => {
    const totalGuests = 1 + additionalGuests.length; // Primary + additional
    const maxOccupancy = selectedRoom?.max_occupancy || 0;

    if (totalGuests > maxOccupancy) {
      const excess = totalGuests - maxOccupancy;
      for (let i = 0; i < excess; i++) {
        dispatch(removeAdditionalGuest(additionalGuests.length - 1 - i));
      }
      toast.warning(`Reduced additional guests to match room capacity`);
    }
  }, [selectedRoom?.max_occupancy, additionalGuests.length, dispatch]);

  const compareAmenities = (currentAmenities = []) => {
    const bookingEnhancements = booking?.enhancements || {};
    const existingFood = bookingEnhancements.food?.items || [];
    const existingAmenities = bookingEnhancements.amenities?.items || [];
    const existingRoomService = bookingEnhancements.room_services?.items || [];

    const allExisting = [
      ...existingFood.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price,
        quantity: item.selected_quantity || 1,
        totalPrice: item.base_price * (item.selected_quantity || 1),
        type: 'food',
        refundable: item.refundable === true,
        originalQuantity: item.selected_quantity || 1,
      })),
      ...existingAmenities.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price,
        quantity: item.selected_quantity || 1,
        totalPrice: item.base_price * (item.selected_quantity || 1),
        type: 'amenity',
        refundable: item.refundable === true,
        originalQuantity: item.selected_quantity || 1,
      })),
      ...existingRoomService.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.base_price,
        quantity: item.selected_quantity || 1,
        totalPrice: item.base_price * (item.selected_quantity || 1),
        type: 'room_service',
        refundable: item.refundable === true,
        originalQuantity: item.selected_quantity || 1,
      })),
    ];

    const safeCurrentAmenities = Array.isArray(currentAmenities) ? currentAmenities : [];

    const modifiedAmenities = safeCurrentAmenities
      .filter((selected) => {
        const existing = allExisting.find((e) => e.id === selected.id);
        return existing && existing.quantity !== selected.quantity;
      })
      .map((selected) => {
        const existing = allExisting.find((e) => e.id === selected.id);
        return {
          ...selected,
          originalQuantity: existing.quantity,
          originalTotalPrice: existing.totalPrice,
        };
      });

    const newAmenities = safeCurrentAmenities.filter(
      (selected) => !allExisting.some((existing) => existing.id === selected.id)
    );

    const removedAmenities = allExisting.filter(
      (existing) => !safeCurrentAmenities.some((selected) => selected.id === existing.id)
    );

    const unchangedAmenities = safeCurrentAmenities.filter((selected) => {
      const existing = allExisting.find((e) => e.id === selected.id);
      return existing && existing.quantity === selected.quantity;
    });

    const refundableChanges = modifiedAmenities
      .filter(
        (amenity) => amenity.refundable === true && amenity.quantity < amenity.originalQuantity
      )
      .map((amenity) => ({
        ...amenity,
        refundAmount: amenity.price * (amenity.originalQuantity - amenity.quantity),
      }));

    const refundableRemovals = removedAmenities
      .filter((amenity) => amenity.refundable === true)
      .map((amenity) => ({
        ...amenity,
        refundAmount: amenity.totalPrice,
      }));

    return {
      newAmenities,
      removedAmenities,
      modifiedAmenities,
      unchangedAmenities,
      allExisting,
      refundableChanges: [...refundableChanges, ...refundableRemovals],
    };
  };
  const RefundMessageComponent = () => {
    // MOVE ALL HOOKS TO THE TOP, before any conditional returns

    // Get all amenities from Redux to check refundability - MUST BE AT TOP
    const allAmenitiesFromRedux = useSelector((state) => {
      const formAmenities = state.amenities?.selectedAmenities || [];

      // Also check booking amenities
      const booking = state.booking?.selectedBooking;
      const bookingEnhancements = booking?.enhancements || {};

      const bookingFoodItems = bookingEnhancements.food?.items || [];
      const bookingAmenityItems = bookingEnhancements.amenities?.items || [];
      const bookingRoomServiceItems = bookingEnhancements.room_service?.items || [];

      // Combine all amenities
      return [
        ...formAmenities,
        ...bookingFoodItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.base_price,
          quantity: item.selected_quantity || 1,
          totalPrice: item.base_price * (item.selected_quantity || 1),
          type: 'food',
          refundable: item.refundable === true,
        })),
        ...bookingAmenityItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.base_price,
          quantity: item.selected_quantity || 1,
          totalPrice: item.base_price * (item.selected_quantity || 1),
          type: 'amenity',
          refundable: item.refundable === true,
        })),
        ...bookingRoomServiceItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.base_price,
          quantity: item.selected_quantity || 1,
          totalPrice: item.base_price * (item.selected_quantity || 1),
          type: 'room_service',
          refundable: item.refundable === true,
        })),
      ];
    });

    // Now check for previewData
    if (!previewData) return null;

    const cancelledItems = previewData?.service_preview?.cancelled_items || [];
    const refundAmount = previewData?.service_preview?.refund_amount || 0;
    const financialPreviewType = previewData?.financial_preview_type || '';
    const existingItems = previewData?.service_preview?.existing_items || [];
    const servicePreview = previewData?.service_preview || {};

    // Debug log
    console.log('RefundMessageComponent - cancelledItems:', cancelledItems);
    console.log('RefundMessageComponent - allAmenitiesFromRedux:', allAmenitiesFromRedux);
    console.log('RefundMessageComponent - refundAmount:', refundAmount);

    if (cancelledItems.length === 0 && refundAmount === 0) {
      return null;
    }

    // Check if it's a "recalculation_via_discount" type
    const isRecalculationViaDiscount = financialPreviewType === 'recalculation_via_discount';

    // Get amount due after preview for adjustment message
    const amountDueAfterPreview = previewData?.combined?.amount_due_after_preview || 0;
    const isFullyPaid = previewData?.is_paid || false;

    if (cancelledItems.length === 0) {
      return null;
    }

    // Separate refundable and non-refundable items
    const refundableItems = [];
    const nonRefundableItems = [];

    cancelledItems.forEach((item) => {
      // Get item ID based on type
      const itemId = item.type === 'food' ? item.food_id : item.item_id;

      // Find this item in Redux to check refundable status
      const reduxAmenity = allAmenitiesFromRedux.find(
        (a) =>
          a.id === itemId ||
          a.id?.toString() === itemId?.toString() ||
          (item.type === 'food' && a.type === 'food' && a.id === item.food_id) ||
          (item.type === 'amenity' && a.type === 'amenity' && a.id === item.item_id) ||
          (item.type === 'room_service' && a.type === 'room_service' && a.id === item.item_id)
      );

      console.log(`Checking refundability for item:`, item);
      console.log(`Redux amenity found:`, reduxAmenity);
      console.log(`Redux refundable status:`, reduxAmenity?.refundable);

      // Determine if item is refundable
      // Priority: 1. Redux data, 2. API refundable_amount
      const isRefundable = reduxAmenity
        ? reduxAmenity.refundable === true
        : item.refundable_amount && item.refundable_amount > 0;

      console.log(`Final isRefundable:`, isRefundable);

      if (isRefundable && item.refundable_amount && item.refundable_amount > 0) {
        refundableItems.push({
          ...item,
          name: item.name || reduxAmenity?.name || `Item ${itemId}`,
          isRefundable: true,
          source: reduxAmenity ? 'redux' : 'api',
        });
      } else {
        nonRefundableItems.push({
          ...item,
          name: item.name || reduxAmenity?.name || `Item ${itemId}`,
          isRefundable: false,
          source: reduxAmenity ? 'redux' : 'api',
          reason: reduxAmenity
            ? 'Marked as non-refundable in reservation'
            : 'No refund amount specified',
        });
      }
    });

    // Calculate refundable amount
    const refundableAmount = refundableItems.reduce(
      (sum, item) => sum + (item.refundable_amount || item.total_amount || 0),
      0
    );

    const nonRefundableAmount = nonRefundableItems.reduce(
      (sum, item) => sum + (item.total_amount || 0),
      0
    );

    console.log('Refundable items:', refundableItems);
    console.log('Non-refundable items:', nonRefundableItems);
    console.log('Refundable amount:', refundableAmount);
    console.log('Non-refundable amount:', nonRefundableAmount);

    // If amount is fully paid and not a recalculation via discount, show refund message
    if (isFullyPaid && !isRecalculationViaDiscount && refundableAmount > 0) {
      return (
        <div className="bg-green-50 p-3 rounded-md mt-4 border border-green-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-gray-700 text-sm font-medium">Refundable Items Cancelled</p>
              {refundableItems.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 mt-1">
                  <div className="flex justify-between">
                    <span>
                      {item.type === 'food'
                        ? 'Food'
                        : item.type === 'room_service'
                          ? 'Room Service'
                          : 'Amenity'}
                      : {item.name}
                      {item.quantity_cancelled > 1 && ` (×${item.quantity_cancelled})`}
                    </span>
                    <span className="font-medium">
                      ₹
                      {item.refundable_amount?.toLocaleString('en-IN') ||
                        item.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[10px] text-green-600 mt-0.5">
                    Refundable as per booking policy
                  </div>
                </div>
              ))}

              {nonRefundableItems.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-medium">Non-Refundable Items:</p>
                  {nonRefundableItems.map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 mt-1">
                      <div className="flex justify-between">
                        <span>
                          {item.type === 'food'
                            ? 'Food'
                            : item.type === 'room_service'
                              ? 'Room Service'
                              : 'Amenity'}
                          : {item.name}
                          {item.quantity_cancelled > 1 && ` (×${item.quantity_cancelled})`}
                          <span className="text-red-500 ml-1">(Non-refundable)</span>
                        </span>
                        <span className="line-through">
                          ₹{item.total_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[10px] text-red-500 mt-0.5">{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-600 italic mt-1">
                (Refund of ₹{refundableAmount.toLocaleString('en-IN')} will be processed within 5–7
                business days)
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If it's a recalculation via discount, show adjustment message
    if (isRecalculationViaDiscount && refundableAmount > 0) {
      return (
        <div className="bg-blue-50 p-3 rounded-md mt-4 border border-blue-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
              <path d="M10 12h4a1 1 0 001-1V6a1 1 0 00-1-1h-4v7z" />
            </svg>
            <div>
              <p className="text-gray-700 text-sm font-medium">Refund Adjustment Applied</p>
              <p className="text-xs text-gray-600 mt-1">
                The refund amount of ₹{refundableAmount.toLocaleString('en-IN')} has been adjusted
                against your total amount due.
              </p>
              {refundableItems.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
                  <div className="flex justify-between">
                    <span>• {item.name}:</span>
                    <span className="font-medium">
                      ₹
                      {item.refundable_amount?.toLocaleString('en-IN') ||
                        item.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[10px] text-green-600 ml-1">Refundable</div>
                </div>
              ))}

              {nonRefundableItems.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-medium">
                    Non-Refundable Items (not adjusted):
                  </p>
                  {nonRefundableItems.map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
                      <div className="flex justify-between">
                        <span>• {item.name}:</span>
                        <span className="line-through">
                          ₹{item.total_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[10px] text-red-500 ml-1">Non-refundable</div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-600 italic mt-1">
                (No refund will be processed as the amount has been adjusted in your total)
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default case (not fully paid, not recalculation via discount, but has non-refundable items)
    if (nonRefundableItems.length > 0) {
      return (
        <div className="bg-red-50 p-3 rounded-md mt-4 border border-red-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-gray-700 text-sm font-medium">Non-Refundable Items Cancelled</p>
              <p className="text-xs text-gray-600 mt-1">
                The following items are non-refundable and will not be refunded:
              </p>
              {nonRefundableItems.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
                  <div className="flex justify-between">
                    <span>
                      •{' '}
                      {item.type === 'food'
                        ? 'Food'
                        : item.type === 'room_service'
                          ? 'Room Service'
                          : 'Amenity'}
                      :{item.name}
                      {item.quantity_cancelled > 1 && ` (×${item.quantity_cancelled})`}
                    </span>
                    <span className="line-through">
                      ₹{item.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[10px] text-red-500 ml-1">{item.reason}</div>
                </div>
              ))}

              {refundableItems.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">Refundable Items:</p>
                  {refundableItems.map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
                      <div className="flex justify-between">
                        <span>• {item.name}:</span>
                        <span className="font-medium">
                          ₹{item.refundable_amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 italic mt-1">
                Non-refundable items are charged as per our cancellation policy
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If we have refundable items but the booking is not paid
    if (refundableItems.length > 0 && !isFullyPaid && amountDueAfterPreview > 0) {
      return (
        <div className="bg-yellow-50 p-3 rounded-md mt-4 border border-yellow-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-gray-700 text-sm font-medium">Refundable Items Cancelled</p>
              <p className="text-xs text-gray-600 mt-1">
                The refund amount will be adjusted against your outstanding balance.
              </p>
              {refundableItems.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 mt-1">
                  <div className="flex justify-between">
                    <span>
                      {item.type === 'food'
                        ? 'Food'
                        : item.type === 'room_service'
                          ? 'Room Service'
                          : 'Amenity'}
                      :{item.name}
                    </span>
                    <span className="font-medium">
                      ₹{item.refundable_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-600 italic mt-1">
                Total refundable amount: ₹{refundableAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };
  const calculatePreviousAmenitiesTotal = () => {
    if (!booking) return 0;

    let totalAmount = 0;

    // Check enhancements structure
    if (booking.enhancements) {
      const { food, amenities, room_services } = booking.enhancements;

      // Calculate from food
      if (food?.items?.length > 0) {
        food.items.forEach((item) => {
          totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
        });
      }

      // Calculate from amenities
      if (amenities?.items?.length > 0) {
        amenities.items.forEach((item) => {
          totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
        });
      }

      // Calculate from room services
      if (room_services?.items?.length > 0) {
        room_services.items.forEach((item) => {
          totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
        });
      }
    }

    // Also check enhancements_detailed structure
    if (booking.enhancements_detailed) {
      const { food, amenities, room_services } = booking.enhancements_detailed;

      if (food?.items?.length > 0) {
        food.items.forEach((item) => {
          totalAmount += item.total_amount || 0;
        });
      }

      if (amenities?.items?.length > 0) {
        amenities.items.forEach((item) => {
          totalAmount += item.total_amount || 0;
        });
      }

      if (room_services?.items?.length > 0) {
        room_services.items.forEach((item) => {
          totalAmount += item.total_amount || 0;
        });
      }
    }

    return totalAmount;
  };

  const calculatePreviousAmenitiesTaxForUi = () => {
    if (!booking) return 0;

    let totalTax = 0;

    // Check enhancements structure
    if (booking.enhancements) {
      const { food, amenities, room_services } = booking.enhancements;

      if (food?.total?.tax_amount) {
        totalTax += food.total.tax_amount;
      }

      if (amenities?.total?.tax_amount) {
        totalTax += amenities.total.tax_amount;
      }

      if (room_services?.total?.tax_amount) {
        totalTax += room_services.total.tax_amount;
      }
    }

    // Check enhancements_detailed structure
    if (booking.enhancements_detailed) {
      const { food, amenities, room_services } = booking.enhancements_detailed;

      if (food?.items?.length > 0) {
        food.items.forEach((item) => {
          totalTax += item.tax_amount || 0;
        });
      }

      if (amenities?.items?.length > 0) {
        amenities.items.forEach((item) => {
          totalTax += item.tax_amount || 0;
        });
      }

      if (room_services?.items?.length > 0) {
        room_services.items.forEach((item) => {
          totalTax += item.tax_amount || 0;
        });
      }
    }

    return totalTax;
  };
  // Format phone number helper
  const formatPhoneNumber = (phoneNumber, countryCode) => {
    if (!phoneNumber || !countryCode) return phoneNumber;
    return `${countryCode}${phoneNumber}`;
  };

  // Get selected amenities from Redux
  const selected = useSelector((state) => state.amenities?.selectedAmenities || []);

  // Format date for API
  const formatLocalDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ==================== PREVIEW API FUNCTIONS ====================

  // Preview API function
  const fetchModificationPreview = async () => {
    if (!booking?.bookingid) return null;

    try {
      const accessToken = Cookies.get('access_token');
      const bookingId = booking.bookingid;
      const newRoomTypeName = selectedRoom?.roomtypename;
      const newCheckinDate = checkInDate || booking?.checkindate;
      const newCheckoutDate = checkOutDate || booking?.checkoutdate;

      const requestBody = {
        new_checkin_date: formatLocalDate(newCheckinDate),
        new_checkout_date: formatLocalDate(newCheckoutDate),
        new_room_type_name: newRoomTypeName || null,
        amenities: [],
        room_services: [],
        food_orders: [],
      };

      // Simply pass ALL amenities from Redux (including those with quantity: 0)
      selectedAmenities.forEach((amenity) => {
        const baseItem = {
          itemid: amenity.id,
          quantity: amenity.quantity, // This will be 0 for cancelled items
          urgencylevel: 'Normal',
          scheduledtime: new Date().toISOString(),
          specialinstructions: '',
        };

        if (amenity.type === 'food') {
          if (!requestBody.food_orders.some((fo) => fo.item_type === 'food')) {
            requestBody.food_orders.push({
              item_type: 'food',
              items: [],
            });
          }
          requestBody.food_orders[0].items.push({
            foodid: amenity.id,
            quantity: amenity.quantity,
          });
        } else if (amenity.type === 'room_service') {
          requestBody.room_services.push({
            ...baseItem,
            item_type: 'room_service',
          });
        } else {
          requestBody.amenities.push({
            ...baseItem,
            item_type: 'amenity',
          });
        }
      });

      // Remove empty arrays
      if (requestBody.amenities.length === 0) delete requestBody.amenities;
      if (requestBody.room_services.length === 0) delete requestBody.room_services;
      if (requestBody.food_orders.length === 0) delete requestBody.food_orders;

      console.log(
        'Preview API Request Body (with zero quantities):',
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(`${CQ_BASE_URL}/bq/api/modify/${bookingId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch preview');
      }

      return await response.json();
    } catch (error) {
      console.error('Preview API error:', error);
      throw error;
    }
  };

  // Load preview data
  const loadPreviewData = async () => {
    if (!booking?.bookingid) return;

    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const previewResponse = await fetchModificationPreview();

      if (previewResponse && previewResponse.status === 'success') {
        setPreviewData(previewResponse.data);

        // Capture adjustment warning from the response
        if (
          previewResponse.data?.adjustment_warning &&
          previewResponse.data.adjustment_warning.has_adjustments
        ) {
          setAdjustmentWarning(previewResponse.data.adjustment_warning);
        } else {
          setAdjustmentWarning(null);
        }
      } else {
        throw new Error('Invalid preview response');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError(error.message);
      toast.error('Failed to load price preview. Please try again.');
    } finally {
      setIsLoadingPreview(false);
    }
  };
  // Load preview when dependencies change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPreviewData();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    booking?.bookingid,
    selectedRoom?.roomtypename,
    checkInDate,
    checkOutDate,
    JSON.stringify(selectedAmenities),
  ]);

  // Helper to get values from preview data
  const getPreviewValue = (path, defaultValue = 0) => {
    if (!previewData) return defaultValue;

    const paths = path.split('.');
    let value = previewData;

    for (const p of paths) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return defaultValue;
      }
    }

    return value || defaultValue;
  };

  // Calculate values from preview data
  // Add this useMemo for previewPrices at line 1071 (or wherever your previewPrices object is defined)
  const previewPrices = useMemo(() => {
    if (!previewData) {
      return {
        // Room charges
        roomBasePrice: 0,
        roomTaxAmount: 0,
        roomServiceFee: 0,
        roomFinalAmount: 0,

        // Combined totals
        totalDeltaBase: 0,
        fixedCurrentTax: 0,
        totalDeltaTax: 0,
        totalServiceFee: 0,
        totalRefund: 0,
        netFinancialImpact: 0,

        // Payment info
        amountPaid: 0,
        currentTotal: 0,
        amountDueAfterPreview: 0,
        currentDueBeforePreview: 0,
        projectedTotalAfterPreview: 0,

        // Room preview info
        modificationType: '',
        oldTotal: 0,
        newTotal: 0,
        priceDifference: 0,
        finalPriceDifference: 0,

        // Service preview
        serviceDeltaBase: 0,
        serviceDeltaTax: 0,
        serviceRefundAmount: 0,
        serviceNetImpact: 0,
        serviceFeeHistorical: 0,
        serviceFeeTotalAllModifications: 0,

        // Redzone and policy
        redzone: {},
        policy: {},

        // Breakdowns
        oldBreakdown: [],
        newBreakdown: [],

        // Cancelled and new items
        cancelledItems: [],
        newItems: [],

        // Additional info
        isPaid: false,
      };
    }

    const getPreviewValue = (path, defaultValue = 0) => {
      const paths = path.split('.');
      let value = previewData;

      for (const p of paths) {
        if (value && typeof value === 'object' && p in value) {
          value = value[p];
        } else {
          return defaultValue;
        }
      }

      return value || defaultValue;
    };

    return {
      // Room charges
      roomBasePrice: getPreviewValue('room_preview.room_details.new_room_base_total', 0),
      roomTaxAmount: getPreviewValue('room_preview.room_details.new_room_tax_total', 0),
      roomServiceFee: getPreviewValue('room_preview.price_details.service_fee', 0),
      roomFinalAmount: getPreviewValue('room_preview.room_details.new_room_final_total', 0),

      // Combined totals
      totalDeltaBase: getPreviewValue('combined.total_delta_base', 0),
      fixedCurrentTax: getPreviewValue('combined.fixed_current_tax', 0),
      totalDeltaTax: getPreviewValue('combined.total_delta_tax', 0),
      totalServiceFee: getPreviewValue('combined.total_service_fee', 0),
      totalRefund: getPreviewValue('combined.total_refund', 0),
      netFinancialImpact: getPreviewValue('combined.net_financial_impact', 0),

      // Payment info
      amountPaid: getPreviewValue('combined.amount_paid', 0),
      currentTotal: getPreviewValue('combined.fixed_current_total', 0),
      amountDueAfterPreview: getPreviewValue('combined.amount_due_after_preview', 0),
      currentDueBeforePreview: getPreviewValue('combined.current_due_before_preview', 0),
      projectedTotalAfterPreview: getPreviewValue('combined.projected_total_after_preview', 0),

      // Room preview info
      modificationType: getPreviewValue('room_preview.modification_type', ''),
      oldTotal: getPreviewValue('room_preview.old_total', 0),
      newTotal: getPreviewValue('room_preview.new_total', 0),
      priceDifference: getPreviewValue('room_preview.price_difference', 0),
      finalPriceDifference: getPreviewValue('room_preview.final_price_difference', 0),

      // Service preview
      serviceDeltaBase: getPreviewValue('service_preview.delta_base', 0),
      serviceDeltaTax: getPreviewValue('service_preview.delta_tax', 0),
      serviceRefundAmount: getPreviewValue('service_preview.refund_amount', 0),
      serviceNetImpact: getPreviewValue('service_preview.net_impact', 0),
      serviceFeeHistorical: getPreviewValue('room_preview.service_fee_historical', 0),
      serviceFeeTotalAllModifications: getPreviewValue(
        'room_preview.service_fee_total_all_modifications',
        0
      ),

      // Redzone and policy
      redzone: getPreviewValue('redzone', {}),
      policy: getPreviewValue('policy', {}),

      // Breakdowns
      oldBreakdown: getPreviewValue('room_preview.breakdown_old', []),
      newBreakdown: getPreviewValue('room_preview.breakdown_new', []),

      // Cancelled and new items
      cancelledItems: getPreviewValue('service_preview.cancelled_items', []),
      newItems: getPreviewValue('service_preview.new_items', []),

      // Additional info
      isPaid: getPreviewValue('is_paid', false),
    };
  }, [previewData]); // Only recalculate when previewData changes

  // Calculate derived values
  const isAfterCutoff = previewPrices.redzone?.level === 'modification_closed';
  const isWithin24Hours = previewPrices.redzone?.level === 'restricted_window';
  const hasRefund = previewPrices.totalRefund > 0;
  const hasAmountDue = previewPrices.amountDueAfterPreview > 0;
  const totalTaxAmount = previewPrices.totalDeltaTax;
  const totalServiceFee = previewPrices.totalServiceFee;
  const totalFinalAmount = booking?.total_final_amount;

  // Get previous booking info
  const previousAmenitiesTotal = calculatePreviousAmenitiesTotal();
  const previousAmenitiesTaxForUi = calculatePreviousAmenitiesTaxForUi();
  const originalRoomPrice = booking?.final_amount || 0;
  const originalTaxAmount = booking?.tax_amount || 0;
  const originalServiceFee = booking?.service_fee || 0;

  // Update the refundCalculations useMemo to include financial_preview_type check:
  const refundCalculations = useMemo(() => {
    if (!previewData)
      return {
        roomRefund: 0,
        amenitiesRefund: 0,
        totalRefund: 0,
        shouldShowRefund: false,
        refundableChanges: [],
        financialPreviewType: '',
      };

    // Check if it's a downgrade and has refund
    const isDowngrade = previewData?.room_preview?.modification_type === 'downgrade';
    const hasRoomRefund = isDowngrade && previewData?.room_preview?.final_price_difference > 0;

    // Room refund (positive values mean refund in your API)
    const roomRefund = hasRoomRefund ? previewData.room_preview.final_price_difference : 0;

    // Amenities refund from preview (already positive)
    const amenitiesRefund = previewData?.service_preview?.refund_amount || 0;

    const totalRefund = roomRefund + amenitiesRefund;
    const shouldShowRefund = totalRefund > 0;
    const financialPreviewType = previewData?.financial_preview_type || '';

    return {
      roomRefund,
      amenitiesRefund,
      totalRefund,
      shouldShowRefund,
      refundableChanges: previewData?.service_preview?.cancelled_items || [],
      isDowngrade,
      modificationType: previewData?.room_preview?.modification_type || '',
      financialPreviewType,
    };
  }, [previewData]);

  useEffect(() => {
    const {
      roomRefund,
      amenitiesRefund,
      amenitiesTaxRefund,
      totalRefund,
      shouldShowRefund,
      refundableChanges,
    } = refundCalculations;

    if (shouldShowRefund) {
      setIsDowngradeRefund(true);
      setRefundDetails({
        base_refund: roomRefund,
        amenities_refund: amenitiesRefund,
        amenities_tax_refund: amenitiesTaxRefund,
        service_fee: totalServiceFee,
        cancellation_charges: 0,
        final_refund: totalRefund - totalServiceFee,
        currency: 'INR',
      });

      if (amenitiesRefund > 0) {
        setAmenitiesRefundDetails({
          base_refund: amenitiesRefund,
          tax_refund: amenitiesTaxRefund,
          total_refund: amenitiesRefund + amenitiesTaxRefund,
          currency: 'INR',
        });
      } else {
        setAmenitiesRefundDetails(null);
      }
    } else {
      setIsDowngradeRefund(false);
      setRefundDetails(null);
      setAmenitiesRefundDetails(null);
    }
  }, [refundCalculations, totalServiceFee]);

  // 1. Update Booking Full API
  const updateBookingFull = async (bookingId, guestData) => {
    try {
      const response = await fetch(`${CQ_BASE_URL}/bq/api/guest/${bookingId}/details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          guest_details: {
            firstname: guestData.firstName,
            lastname: guestData.lastName,
            emailid: guestData.email,
            countrycode: guestData.countryCode,
            phonenumber: guestData.phoneNumber,
            clienttype: guestData.clientType,
            date_of_birth: guestData.date_of_birth || null,
            preferred_payment_method: guestData.preferred_payment_method || '',
            is_senior: guestData.is_senior || false,
            country: selectedCountry.name,
          },
          booking_guests: guestData.additionalGuests.map((guest) => ({
            firstname: guest.firstName,
            lastname: guest.lastName,
            emailid: guest.email || 'user@example.com',
            countrycode: guest.countryCode || '+91',
            phonenumber: guest.phoneNumber || '',
            clienttype: guest.clientType || 'Leisure',
            country: guest.country?.name || selectedCountry.name,
          })),
          booking_details: {
            number_of_guests: guestData.totalGuests,
            special_requests: guestData.specialRequest || '',
            remark: guestData.remark || '',
            booking_type: guestData.booking_type || 'Walk In',
            country: selectedCountry.name,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            'We were unable to process your modification request at the moment. Your reservation is still secure. Please try again later.'
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Full update error:', error);
      throw error;
    }
  };

  // 2. Modify Booking API (UPDATED VERSION with proper error handling)
  const modifyBookingDetails = async (
    bookingId,
    newRoomTypeName,
    newCheckinDate,
    newCheckoutDate
  ) => {
    try {
      const params = new URLSearchParams();

      if (newRoomTypeName) params.append('new_room_type_name', newRoomTypeName);

      if (newCheckinDate) {
        params.append('new_checkin_date', formatLocalDate(newCheckinDate));
      }

      if (newCheckoutDate) {
        params.append('new_checkout_date', formatLocalDate(newCheckoutDate));
      }

      const url = `${CQ_BASE_URL}/bq/api/modify/${bookingId}/modify?${params.toString()}`;

      console.log('Calling modify API:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: '',
      });

      // Handle 409 Conflict specifically
      if (response.status === 409) {
        const errorData = await response.json();
        console.error('409 Conflict - Active adjustments detected:', errorData);

        // Throw error with the adjustment details
        const error = new Error('Active adjustments block modification');
        error.status = 409;
        error.details = errorData.detail;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail ||
          errorData.message ||
          'We were unable to process your modification request at the moment. Your reservation is still secure, Please try again later.';

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Modify booking error:', error);
      throw error;
    }
  };
  // 3. Update Smart Reservation API
  const updateSmartReservation = async (bookingId, selectedAmenities) => {
    try {
      const amenities = [];
      const roomServices = [];
      const foodOrders = [];

      selectedAmenities.forEach((amenity) => {
        const baseItem = {
          itemid: amenity.id,
          quantity: amenity.quantity,
          urgencylevel: 'Normal',
          scheduledtime: new Date().toISOString(),
          specialinstructions: '',
        };

        if (amenity.type === 'food') {
          foodOrders.push({
            item_type: 'food',
            items: [
              {
                foodid: amenity.id,
                quantity: amenity.quantity,
              },
            ],
          });
        } else if (amenity.type === 'room_service') {
          roomServices.push({
            ...baseItem,
            item_type: 'room_service',
          });
        } else {
          amenities.push({
            ...baseItem,
            item_type: 'amenity',
          });
        }
      });

      const requestBody = {
        bookingid: bookingId,
        billing_type: 'Enhance stay modification',
      };

      if (amenities.length > 0) {
        requestBody.amenities = amenities;
      }
      if (roomServices.length > 0) {
        requestBody.room_services = roomServices;
      }
      if (foodOrders.length > 0) {
        requestBody.food_orders = foodOrders;
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/update-smart-reservation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            'We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.'
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Smart reservation error:', error);
      throw error;
    }
  };

  // 4. Get Payment Billing IDs API (UPDATED to use billing-summary)
  const getUnpaidBillingIds = async (orderId) => {
    try {
      const response = await fetch(
        `${CQ_BASE_URL}/bq/api/guest/billing-summary/?order_id=${orderId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            'We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.'
        );
      }
      const data = await response.json();

      setUnpaidBillingDetails({
        totalPaid: data.payment_summary.total_paid,
        totalDue: data.payment_summary.total_due,
        unpaidBillingIds: data.payment_summary.unpaid_billing_ids,
      });

      return data;
    } catch (error) {
      console.error('Get unpaid billing error:', error);
      throw error;
    }
  };
  // Add this function before the return statement
  const storeBookingData = () => {
    try {
      const bookingData = {
        bookingId: booking?.bookingid || localStorage.getItem('reservationId'),
        orderId: booking?.orderid || localStorage.getItem('orderId'),
        guestDetails: {
          firstName,
          lastName,
          email,
          phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
        },
        bookingDetails: {
          roomType: selectedRoom?.roomtypename || booking?.room_type,
          checkInDate: checkInDate || booking?.checkindate,
          checkOutDate: checkOutDate || booking?.checkoutdate,
          numberOfGuests: 1 + additionalGuests.length,
          specialRequest,
          daysCount,
        },
        amenities: {
          selectedAmenities: selectedAmenities.map((amenity) => ({
            id: amenity.id,
            name: amenity.name,
            price: amenity.price,
            quantity: amenity.quantity,
            totalPrice: amenity.totalPrice,
            type: amenity.type,
            value: amenity.value,
            value_type: amenity.value_type,
            refundable: amenity.refundable,
          })),
          currentState: {
            quantity: selectedAmenities.reduce((sum, amenity) => sum + amenity.quantity, 0),
            totalAmount: selectedAmenities.reduce((sum, amenity) => sum + amenity.totalPrice, 0),
            refundableAmount: selectedAmenities
              .filter((amenity) => amenity.refundable === true)
              .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
            nonRefundableAmount: selectedAmenities
              .filter((amenity) => amenity.refundable !== true)
              .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
          },
        },
        financialData: {
          previewData,
          refundCalculations,
          previewPrices,
          financialPreviewType: previewData?.room_preview?.financial_preview_type || '',
          isAdjustment:
            previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount',
          adjustmentAmount:
            previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount'
              ? refundCalculations.totalRefund
              : 0,
          refundAmount:
            previewData?.room_preview?.financial_preview_type !== 'recalculation_via_discount'
              ? refundCalculations.totalRefund
              : 0,
        },
        apiResponses: {
          previewResponse: previewData,
          timestamp: new Date().toISOString(),
        },
        currentState: {
          firstName,
          lastName,
          email,
          phoneNumber,
          countryCode,
          clientType,
          isCorporateGuest,
          additionalGuests,
          specialRequest,
          selectedCountry: selectedCountry.name,
        },
      };

      // Store in localStorage
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      console.log('Booking data stored successfully:', bookingData);
    } catch (error) {
      console.error('Error storing booking data:', error);
    }
  };

  // Add this helper function near the top, after the other utility functions
  const storePaymentVerification = (
    paymentId,
    orderId,
    signature,
    status,
    amount,
    billingIds,
    bookingId
  ) => {
    try {
      const paymentRecord = {
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        status: status,
        amount: amount,
        billing_ids: billingIds,
        booking_id: bookingId,
        timestamp: new Date().toISOString(),
        verified: status === 'success',
      };

      localStorage.setItem('payment_verification', JSON.stringify(paymentRecord));
      console.log('Payment verification stored in localStorage');
      return true;
    } catch (error) {
      console.error('Error storing payment verification:', error);
      return false;
    }
  };
  // Updated handleBooking function
  const handleBooking = async () => {
    if (!isAcknowledged) {
      setCheckboxError(true);
      toast.error('Please acknowledge the terms and conditions to proceed');
      return;
    }

    if (!email || email.trim() === '') {
      toast.error('Email address is required to proceed with the modification');
      return;
    }

    // NEW VALIDATION: Check if guest count is 2 and additional guests are removed
    const totalGuests = 1 + additionalGuests.length; // Primary + additional

    // If total guests is 2 but there are no additional guests
    if (totalGuests === 2 && additionalGuests.length === 0) {
      setReservationError({
        detail: {
          title: 'Additional Guest Information Required',
          message:
            'For 2 guests staying in the room, we require complete information for both guests as per hotel policy and government regulations.',
          details: [
            '✓ Primary guest information is complete',
            '✗ Additional guest information is missing',
            '✓ Room capacity allows for 2 guests',
          ],
          missingGuests: 1,
          actionRequired:
            'Please add information for 1 additional guest to proceed with the reservation.',
        },
      });
      setReservationPopupOpen(true);
      setIsLoading(false);

      // Store data even on validation error
      storeBookingData();
      return;
    }

    // Validate that all additional guests have required fields
    const incompleteAdditionalGuests = additionalGuests.filter(
      (guest) => !guest.firstName?.trim() || !guest.lastName?.trim()
    );

    if (incompleteAdditionalGuests.length > 0) {
      setReservationError({
        detail: {
          title: 'Additional Guest Information Required',
          message: 'Please complete all required fields for additional guests before proceeding.',
          details: [
            '✓ Primary guest information is complete',
            '✗ Additional guest information is incomplete',
            '✓ Room capacity allows for additional guests',
          ],
          missingGuests: incompleteAdditionalGuests.length,
          actionRequired: `Please complete information for ${incompleteAdditionalGuests.length} additional guest(s).`,
        },
      });
      setReservationPopupOpen(true);
      setIsLoading(false);

      // Store data even on validation error
      storeBookingData();
      return;
    }

    setIsLoading(true);
    setCheckboxError(false);

    // Declare variables outside try block so they're accessible in catch
    let fullUpdateResponse = null;
    let modificationResponse = null;
    let smartReservationResponse = null;

    try {
      const bookingId = booking?.bookingid || localStorage.getItem('reservationId');
      const orderId = booking?.orderid || localStorage.getItem('orderId');

      if (!bookingId || !orderId) {
        throw new Error('Booking information not found');
      }

      // Prepare guest data
      const guestData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        countryCode,
        clientType,
        additionalGuests: additionalGuests.map((g) => ({
          firstName: g.firstName || '',
          lastName: g.lastName || '',
          phoneNumber: g.phoneNumber || '',
          email: g.email || 'user@example.com',
          countryCode: g.countryCode || '+91',
          country: g.country?.name || selectedCountry.name,
        })), // This should come from Redux state
        totalGuests: 1 + additionalGuests.length,
        specialRequest,
        country: selectedCountry.name,
        // Add optional fields that might come from the original booking
        date_of_birth: booking?.primary_guest?.date_of_birth || null,
        preferred_payment_method: booking?.primary_guest?.preferred_payment_method || '',
        is_senior: booking?.primary_guest?.is_senior || false,
        remark: '', // Add this if needed
        booking_type: booking?.booking_type || 'Walk In',
      };

      // Check if we need to modify the booking
      const needsModification =
        (selectedRoom && booking?.room_type !== selectedRoom.roomtypename) ||
        (checkInDate && booking?.checkindate !== checkInDate) ||
        (checkOutDate && booking?.checkoutdate !== checkOutDate);

      // Store initial data BEFORE API calls
      storeBookingData();

      // Execute all 3 APIs in sequence

      // 1. First API - Full Update
      fullUpdateResponse = await updateBookingFull(bookingId, guestData);
      console.log('Full update response:', fullUpdateResponse);
      // 2. Second API - Modify Booking (if needed)
      if (needsModification) {
        try {
          modificationResponse = await modifyBookingDetails(
            bookingId,
            selectedRoom?.roomtypename,
            checkInDate,
            checkOutDate
          );
          console.log('Modification response:', modificationResponse);

          // Check if modification API returned an error
          if (modificationResponse && modificationResponse.success === false) {
            throw new Error(modificationResponse.message || 'Modification failed');
          }
        } catch (error) {
          // Check if it's a 409 conflict error with adjustment details
          if (error.status === 409 && error.details) {
            console.log('Adjustment error caught:', error.details);

            // Set the adjustment error details to show in the existing popup
            setAdjustmentErrorDetails(error.details);
            setShowAdjustmentErrorPopup(true);

            // Open the existing reservation popup with error
            setReservationError(error.details);
            setReservationPopupOpen(true);

            // Stop the booking process
            return;
          } else {
            // Re-throw other errors
            throw error;
          }
        }
      }

      // 3. Third API - Smart Reservation (if amenities changed)
      if (selectedAmenities.length > 0) {
        smartReservationResponse = await updateSmartReservation(bookingId, selectedAmenities);
        console.log('Smart reservation response:', smartReservationResponse);
      }

      // If all APIs succeeded, get unpaid billing IDs
      const billingDetails = await getUnpaidBillingIds(orderId);
      console.log('Unpaid billing details:', billingDetails);

      if (!billingDetails.success || !billingDetails.payment_summary?.unpaid_billing_ids) {
        throw new Error('Failed to get unpaid billing information');
      }

      const unpaidBillingIds = billingDetails.payment_summary.unpaid_billing_ids;

      // Store unpaid billing IDs for payment options
      localStorage.setItem('unpaidBillingIds', JSON.stringify(unpaidBillingIds));

      // Create comprehensive booking data for storage
      const bookingData = {
        bookingId,
        orderId,
        guestDetails: {
          firstName,
          lastName,
          email,
          phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
        },
        bookingDetails: {
          roomType: selectedRoom?.roomtypename || booking?.room_type,
          checkInDate: checkInDate || booking?.checkindate,
          checkOutDate: checkOutDate || booking?.checkoutdate,
          numberOfGuests: 1 + additionalGuests.length,
          specialRequest,
        },
        amenities: {
          selectedAmenities: selectedAmenities.map((amenity) => ({
            id: amenity.id,
            name: amenity.name,
            price: amenity.price,
            quantity: amenity.quantity,
            totalPrice: amenity.totalPrice,
            type: amenity.type,
            value: amenity.value,
            value_type: amenity.value_type,
            refundable: amenity.refundable,
          })),
          currentState: {
            quantity: selectedAmenities.reduce((sum, amenity) => sum + amenity.quantity, 0),
            totalAmount: selectedAmenities.reduce((sum, amenity) => sum + amenity.totalPrice, 0),
            refundableAmount: selectedAmenities
              .filter((amenity) => amenity.refundable === true)
              .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
            nonRefundableAmount: selectedAmenities
              .filter((amenity) => amenity.refundable !== true)
              .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
          },
        },
        financialData: {
          previewData,
          refundCalculations,
          previewPrices,
          financialPreviewType: previewData?.room_preview?.financial_preview_type || '',
          isAdjustment:
            previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount',
          adjustmentAmount:
            previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount'
              ? refundCalculations.totalRefund
              : 0,
          refundAmount:
            previewData?.room_preview?.financial_preview_type !== 'recalculation_via_discount'
              ? refundCalculations.totalRefund
              : 0,
          amountDueAfterPreview: previewPrices.amountDueAfterPreview || 0,
          totalServiceFee: previewPrices.totalServiceFee || 0,
        },
        paymentDetails: {
          unpaidBillingIds: billingDetails.payment_summary.unpaid_billing_ids,
          totalDue: billingDetails.payment_summary.total_due,
          totalTax: billingDetails.payment_summary.total_tax,
          fullyPaid: billingDetails.payment_summary.fully_paid,
        },
        apiResponses: {
          fullUpdate: fullUpdateResponse,
          modification: modificationResponse,
          smartReservation: smartReservationResponse,
          billingDetails: billingDetails,
          previewData: previewData,
        },
        currentState: {
          // Store current component state
          firstName,
          lastName,
          email,
          phoneNumber,
          countryCode,
          clientType,
          isCorporateGuest,
          additionalGuests: additionalGuests.map((g) => ({
            firstName: g.firstName,
            lastName: g.lastName,
            phoneNumber: g.phoneNumber,
            email: g.email,
            countryCode: g.countryCode,
            country: g.country?.name,
          })),
          specialRequest,
          selectedCountry: selectedCountry.name,
          isAcknowledged,
          checkboxError,
        },
        timestamp: new Date().toISOString(),
      };

      // Store all data in localStorage under a single key
      localStorage.setItem('bookingData', JSON.stringify(bookingData));
      console.log('Booking data stored successfully after API calls');

      // Show success message
      setReservationMessage(
        `Booking ${needsModification ? 'modified' : 'updated'} successfully! Reservation ID: ${bookingId}`
      );
      setReservationError('');
      setReservationPopupOpen(true);

      // Store data again after success
      storeBookingData();
    } catch (error) {
      console.error('Booking Update Error:', error);

      // Store data even on API error
      storeBookingData();

      let errorMessage =
        'We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.';

      if (
        error.message &&
        error.message !==
          'We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.'
      ) {
        errorMessage = `${errorMessage}\n\n  ${error.message}`;
      }

      // Check if it's a recalculation_via_discount adjustment
      const isAdjustment =
        previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount';
      const adjustmentAmount = refundCalculations.totalRefund;

      // If it's an adjustment, show adjustment message in error
      if (isAdjustment && adjustmentAmount > 0) {
        setReservationError({
          adjustment: {
            message: errorMessage,
            adjustmentAmount: adjustmentAmount,
            note: 'This is an adjustment amount. No refund will be processed.',
          },
        });
      } else {
        setReservationError(errorMessage);
      }

      setReservationPopupOpen(true);
      toast.error(`Update failed: ${error.message || errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment handler
  const handlePaymentOption = async (paymentMethod) => {
    if (!razorpayLoaded) {
      toast.error('Razorpay script is not loaded yet.');
      return;
    }

    const unpaidBillingIds = JSON.parse(localStorage.getItem('unpaidBillingIds') || []);
    if (unpaidBillingIds.length === 0) {
      toast.error('No unpaid billing information available. Please try again.');
      return;
    }

    if (paymentMethod === 'payNow') {
      try {
        setIsProcessing(true);
        const bookingId = booking?.bookingid || localStorage.getItem('reservationId');

        // Get the total amount to pay from preview data or use amount due
        const totalAmount =
          previewPrices.amountDueAfterPreview ||
          (previewData ? previewPrices.projectedTotalAfterPreview : 0);

        const apiUrl = `${CQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(unpaidBillingIds),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Payment order creation failed: ${response.statusText}`
          );
        }

        const orderData = await response.json();

        if (orderData && orderData.razorpay_order_id) {
          const options = {
            key: RAZORPAY_KEY,
            amount: Math.round(totalAmount * 100), // Convert to paise
            currency: 'INR',
            name: 'Pagoda Hotel',
            description: 'Hotel Reservation Payment',
            order_id: orderData.razorpay_order_id,
            handler: async function (response) {
              const paymentDetails = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                billing_ids: unpaidBillingIds,
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
                  // Store failed verification attempt
                  storePaymentVerification(
                    response.razorpay_payment_id,
                    response.razorpay_order_id,
                    response.razorpay_signature,
                    'verification_failed',
                    0,
                    unpaidBillingIds,
                    bookingId
                  );
                  throw new Error('Payment verification failed');
                }

                const verificationData = await verificationResponse.json();

                if (verificationData.status === 'success') {
                  // Store successful payment verification
                  storePaymentVerification(
                    response.razorpay_payment_id,
                    response.razorpay_order_id,
                    response.razorpay_signature,
                    'success',
                    totalAmount,
                    unpaidBillingIds,
                    bookingId
                  );
                  await Promise.all(
                    unpaidBillingIds.map((billingId) =>
                      fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          billing_id: billingId,
                          status: 'paid',
                          payment_method: 'razorpay',
                          payment_reference: response.razorpay_payment_id,
                        }),
                      })
                    )
                  );

                  window.location.href = '/modification-succesful';
                } else {
                  toast.error('Payment verification failed. Please contact support.');
                }
              } catch (error) {
                console.error('Verification error:', error);
                storePaymentVerification(
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature,
                  'error',
                  0,
                  unpaidBillingIds,
                  bookingId
                );
                toast.error('Error verifying payment. Please try again.');
              } finally {
                setIsProcessing(false);
              }
            },
            prefill: {
              name: `${firstName} ${lastName}`,
              email: email,
              contact: formatPhoneNumber(phoneNumber, countryCode),
            },
            theme: {
              color: '#3399cc',
            },
            notes: {
              bookingId: bookingId,
              billingIds: unpaidBillingIds.join(','),
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
    } else if (isCorporateGuest) {
      try {
        setIsProcessing(true);
        toast.info('Booking will be billed to your company.');
        window.location.href = '/modification-succesful';
      } catch (error) {
        toast.error('Error processing corporate billing. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      try {
        setIsProcessing(true);
        toast.info('Payment deferred. Please pay at the front desk.');
        window.location.href = '/modification-succesful';
      } catch (error) {
        toast.error('Error processing check-in. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAdditionalGuestChange = (index, field, value) => {
    const updatedGuest = {
      ...additionalGuests[index],
      [field]: value,
    };

    if (field === 'country') {
      updatedGuest.country = value;
    }

    dispatch(updateAdditionalGuest(index, updatedGuest));

    const errors = validateAdditionalGuest(updatedGuest);
    const updatedErrors = [...guestErrors];
    updatedErrors[index] = errors;
    setGuestErrors(updatedErrors);
  };

  // Load guest data on component mount
  useEffect(() => {
    const fetchGuestData = async () => {
      // First try to get from booking data
      if (booking?.primary_guest) {
        const primaryGuest = booking.primary_guest;
        setFirstName(primaryGuest.firstname || '');
        setLastName(primaryGuest.lastname || '');
        setPhoneNumber(primaryGuest.phonenumber ? primaryGuest.phonenumber.toString() : '');
        setEmail(primaryGuest.emailid || '');
        setCountryCode(primaryGuest.countrycode || '+91');

        const hasCompanyData = primaryGuest.companyid && primaryGuest.companyname;

        if (hasCompanyData) {
          setCompanyId(primaryGuest.companyid);
          setCompanyName(primaryGuest.companyname);
          setIsCorporateGuest(true);
          setClientType('Corporate');
        } else {
          setClientType(primaryGuest.clienttype || 'Leisure');
        }
        return;
      }

      // Fall back to profile data if no booking
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

        if (guestData.is_corporate) {
          setCompanyId(guestData.company_id || '');
          setCompanyName(guestData.company_name || '');
          setIsCorporateGuest(true);
          setClientType('Corporate');

          if (guestData.country) {
            const foundCountry = countries.find((c) => c.name === guestData.country);
            if (foundCountry) {
              setSelectedCountry(foundCountry);
            }
          }
        } else {
          setClientType(guestData.client_type || 'Leisure');
        }
      }
    };

    fetchGuestData();
  }, [booking]);

  const fallbackImages = [
    'https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg',
  ];

  if (!selectedRoom && !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg bg-white rounded-lg shadow-md p-6 text-center">
          <svg
            className="w-16 h-16 mx-auto text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Oops! Session Expired</h2>
          <p className="text-gray-600 mt-2">
            It looks like your reservation information wasn't saved. Please return to view your
            reservations and try again.
          </p>
          <button
            onClick={() => navigate('/profile_guest_options')}
            className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-950"
          >
            Return to reservations
          </button>
        </div>
      </div>
    );
  }

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
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Modification Message Component
  const ModificationMessage = ({
    modificationType,
    priceDifference,
    refundAmount,
    isAfterCutoff,
    isWithin24Hours,
  }) => {
    if (modificationType === 'downgrade') {
      if (isAfterCutoff || isWithin24Hours) {
        return (
          <div className="bg-yellow-50 p-3 rounded-md mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v6a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-yellow-700 text-sm">
                <strong>Downgrade Notice:</strong>{' '}
                {isAfterCutoff
                  ? "As it's after 11:00 AM on your check-in date"
                  : "As you're within 24 hours of check-in"}
                , you will be charged for one night at the previous room rate.
              </p>
            </div>
          </div>
        );
      } else if (refundAmount > 0) {
        return (
          <div className="bg-green-50 p-3 rounded-md mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-700 text-sm">
                <strong>Downgrade Approved:</strong> You will receive a refund of ₹
                {refundAmount.toLocaleString('en-IN')}. The refund will be processed within 5-7
                business days.
              </p>
            </div>
          </div>
        );
      }
    }

    if (priceDifference < 0) {
      return (
        <div className="bg-yellow-50 p-3 rounded-md mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v6a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-yellow-700 text-sm">
              <strong>Price Adjustment:</strong> Complex modification detected. Please contact our
              support team for detailed breakdown.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleClientTypeChange = (e) => {
    const newClientType = e.target.value;

    if (newClientType === 'Corporate' && (!companyId || !companyName)) {
      toast.error(
        'Your profile is not associated with any company. Please contact support to set up corporate billing.'
      );
      return;
    }

    setClientType(newClientType);

    if (newClientType === 'Corporate' && companyId && companyName) {
      setIsCorporateGuest(true);
    } else if (newClientType === 'Leisure') {
      setIsCorporateGuest(false);
    }
  };

  // Helper to get room charges display based on preview data
  const getRoomChargesDisplay = () => {
    if (isLoadingPreview) {
      return (
        <div className="flex justify-between text-sm text-gray-700">
          <span>Loading room charges...</span>
          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        </div>
      );
    }

    if (!previewData) {
      return (
        <div className="flex justify-between text-sm text-gray-700">
          <span>Room charges not available</span>
          <span>₹0.00</span>
        </div>
      );
    }

    const modificationType = previewPrices.modificationType || '';
    const isDowngrade = modificationType.includes('downgrade');

    if (isDowngrade && (isAfterCutoff || isWithin24Hours)) {
      return (
        <>
          <div className="mb-1 mt-1">
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-semibold">Previous Room - 1 Night</span>
              <span>
                ₹
                {(previewPrices.oldTotal / daysCount).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isAfterCutoff
                ? 'Charged for 1 night (after 11:00 AM check-in)'
                : 'Charged for 1 night (within 24 hours of check-in)'}
            </div>
          </div>

          {daysCount > 1 && (
            <div className="flex justify-between text-sm text-gray-700 mt-1 mb-2">
              <span className="font-semibold">New Room - {daysCount - 1} Night(s)</span>
              <span>
                ₹
                {(previewPrices.newTotal * ((daysCount - 1) / daysCount)).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </>
      );
    }

    // Normal case
    return (
      <div className="mb-2">
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span>
              Room × {Math.max(1, daysCount)} Night
              {Math.max(1, daysCount) > 1 ? 's' : ''}
            </span>
            <span>
              ₹
              {previewPrices.newTotalBasePrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    );
  };
  const AmenitiesCancellationMessage = () => {
    if (!previewData) return null;

    const cancelledItems = previewData?.service_preview?.cancelled_items || [];
    const existingItems = previewData?.service_preview?.existing_items || [];

    if (cancelledItems.length === 0) return null;

    // Separate items by refundability
    const refundableItems = [];
    const nonRefundableItems = [];

    cancelledItems.forEach((item) => {
      // Check if item is refundable based on API response
      if (item.refundable_amount && item.refundable_amount > 0) {
        refundableItems.push(item);
      } else {
        nonRefundableItems.push(item);
      }
    });

    // Calculate totals
    const refundableTotal = refundableItems.reduce(
      (sum, item) => sum + (item.refundable_amount || 0),
      0
    );

    const nonRefundableTotal = nonRefundableItems.reduce(
      (sum, item) => sum + (item.total_amount || 0),
      0
    );

    return (
      <div className="bg-green-50 p-3 rounded-md mt-4 border border-green-100">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-gray-700 text-sm font-medium">Amenities Cancellation Summary</p>

            {cancelledItems.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                You've cancelled {cancelledItems.length} item(s).
              </p>
            )}

            {/* Refundable Items */}
            {refundableItems.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-green-600 font-medium">Refundable Items:</p>
                {refundableItems.map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 flex justify-between ml-2">
                    <span>
                      {item.type === 'amenity'
                        ? 'Amenity'
                        : item.type === 'room_service'
                          ? 'Room Service'
                          : 'Food'}
                      : {item.name || `Item ${item.item_id || item.food_id}`}
                      {item.quantity_cancelled > 1 && ` × ${item.quantity_cancelled}`}
                      <span className="text-green-500 ml-1">(Refundable)</span>
                    </span>
                    <span className="font-medium">
                      ₹{item.refundable_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Non-Refundable Items */}
            {nonRefundableItems.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-red-600 font-medium">Non-Refundable Items:</p>
                {nonRefundableItems.map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 flex justify-between ml-2">
                    <span>
                      {item.type === 'amenity'
                        ? 'Amenity'
                        : item.type === 'room_service'
                          ? 'Room Service'
                          : 'Food'}
                      : {item.name || `Item ${item.item_id || item.food_id}`}
                      {item.quantity_cancelled > 1 && ` × ${item.quantity_cancelled}`}
                      <span className="text-red-500 ml-1">(Non-refundable)</span>
                    </span>
                    <span className="font-medium line-through">
                      ₹{item.total_amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 italic mt-1">
                  Non-refundable amount: ₹{nonRefundableTotal.toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Totals */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              {refundableTotal > 0 && (
                <div className="flex justify-between text-xs text-gray-700 mb-1">
                  <span className="text-green-600 font-medium">Total refundable:</span>
                  <span className="font-medium">₹{refundableTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              {nonRefundableTotal > 0 && (
                <div className="flex justify-between text-xs text-gray-700">
                  <span className="text-red-600 font-medium">Total non-refundable:</span>
                  <span className="font-medium line-through">
                    ₹{nonRefundableTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 italic mt-2">
              {refundableTotal > 0
                ? '(Refundable amount will be processed as per our refund policy)'
                : '(Non-refundable items are charged as per our cancellation policy)'}
            </p>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full px-10 py-4 mt-20 bg-white max-w-8xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 mt-6 ml-4">Reserve and Pay</h1>

      <div className="flex flex-col md:flex-row gap-6 mx-4">
        {/* Left Column (2/3 width) */}
        <div className="w-full md:w-2/3">
          {/* Fully Refundable Card */}
          <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
            <div className="flex justify-between items-start mb-4">
              {/* Icon and Room Info */}
              <div className="flex items-start gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mt-1 md:text[12px] lg:text-[14px]">
                    Room 1: {adults} Adult{adults !== 1 ? 's' : ''}
                    {childrenAges.length > 0 && (
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
                    )}
                    , {selectedRoom?.roomtypename || booking?.room_type || 'Deluxe'}
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
                  </p>
                </div>
              </div>

              {/* Floating Total Price */}
              <div className="bg-gray-100 px-3 py-1 rounded-md">
                <div className="text-sm font-bold text-gray-900">
                  <span className="text-sm font-semibold text-gray-600">Total :</span>{' '}
                  {isLoadingPreview ? (
                    <div className="animate-pulse bg-gray-200 h-4 w-16 inline-block rounded"></div>
                  ) : (
                    `₹${
                      previewData
                        ? previewPrices.projectedTotalAfterPreview.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00'
                    }`
                  )}
                </div>
              </div>
            </div>

            {/* Signed-in Info */}
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
                  {adults} Adult{adults !== 1 ? 's' : ''}
                  {childrenAges.length > 0 && (
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
                  )}
                  , {selectedRoom?.roomtypename || booking?.room_type || 'Deluxe'}
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
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Profile Type */}
                <div className="mb-1">
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                    Profile Type
                  </label>
                  <div className="relative">
                    <select
                      value={clientType}
                      onChange={handleClientTypeChange}
                      className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
                        isCorporateGuest
                          ? 'bg-gray-100 cursor-not-allowed text-gray-600'
                          : 'bg-white'
                      }`}
                      disabled={isCorporateGuest}
                    >
                      <option value="Leisure">Leisure</option>
                      <option value="Corporate">Corporate</option>
                    </select>

                    {isCorporateGuest && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Country Select (with flags) */}
                <div className="mb-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => !isCorporateGuest && setIsOpen(!isOpen)}
                      className={`w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm ${
                        isCorporateGuest ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                      }`}
                      disabled={isCorporateGuest}
                    >
                      <span className="flex items-center gap-2">
                        <img
                          src={selectedCountry.flag}
                          alt={selectedCountry.name}
                          className="w-5 h-4 object-cover rounded-sm"
                        />
                        {selectedCountry.name}
                      </span>
                      {!isCorporateGuest && <span className="ml-2 font-semibold">v</span>}
                    </button>

                    {isOpen && !isCorporateGuest && (
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
                  {isCorporateGuest && (
                    <p className="text-xs text-gray-500 mt-1">
                      Country selection is managed by your corporate profile
                    </p>
                  )}
                </div>
                {/* Corporate Details Section */}
                {isCorporateGuest && (
                  <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Company Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Corporate Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Corporate ID
                        </label>
                        <input
                          type="text"
                          value={companyId}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
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
            <div className="mt-6">
              <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
                {additionalGuests.map((guest, index) => {
                  // Ensure we have a valid guest object
                  const safeGuest = guest || {};

                  return (
                    <div
                      key={index}
                      className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
                    >
                      {/* Remove guest button */}
                      <button
                        onClick={() => {
                          dispatch(removeAdditionalGuest(index));
                          setHasUserEdited(true);
                        }}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>

                      <h4 className="text-md font-semibold text-gray-700 mb-2">
                        Guest {index + 2}
                      </h4>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First name*
                          </label>
                          <input
                            type="text"
                            value={safeGuest.firstName || ''}
                            onChange={(e) => {
                              setHasUserEdited(true);
                              const updatedGuest = {
                                ...safeGuest,
                                firstName: e.target.value,
                              };
                              dispatch(updateAdditionalGuest(index, updatedGuest));
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Enter first name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last name*
                          </label>
                          <input
                            type="text"
                            value={safeGuest.lastName || ''}
                            onChange={(e) => {
                              setHasUserEdited(true);
                              const updatedGuest = {
                                ...safeGuest,
                                lastName: e.target.value,
                              };
                              dispatch(updateAdditionalGuest(index, updatedGuest));
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Enter last name"
                          />
                        </div>

                        <div className="mt-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile number (optional)
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={safeGuest.countryCode || '+91'}
                              onChange={(e) => {
                                setHasUserEdited(true);
                                const updatedGuest = {
                                  ...safeGuest,
                                  countryCode: e.target.value,
                                };
                                dispatch(updateAdditionalGuest(index, updatedGuest));
                              }}
                              className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="+91">+91 (IND)</option>
                              <option value="+1">+1 (US)</option>
                            </select>
                            <input
                              type="text"
                              value={safeGuest.phoneNumber || ''}
                              onChange={(e) => {
                                setHasUserEdited(true);
                                const updatedGuest = {
                                  ...safeGuest,
                                  phoneNumber: e.target.value,
                                };
                                dispatch(updateAdditionalGuest(index, updatedGuest));
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Please enter a valid mobile number"
                            />
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
                                  src={safeGuest.country?.flag || countries[0].flag}
                                  alt={safeGuest.country?.name || countries[0].name}
                                  className="w-5 h-4 object-cover rounded-sm"
                                />
                                {safeGuest.country?.name || countries[0].name}
                              </span>
                              <span className="ml-2 font-semibold">v</span>
                            </button>

                            {guestDropdownStates[index] && (
                              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                                {countries.map((country) => (
                                  <div
                                    key={country.code}
                                    onClick={() => {
                                      setHasUserEdited(true);
                                      const updatedGuest = {
                                        ...safeGuest,
                                        country: country,
                                      };
                                      dispatch(updateAdditionalGuest(index, updatedGuest));
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
                  );
                })}
              </div>

              {additionalGuests.length < maxAdditionalGuests ? (
                <button
                  onClick={() => {
                    const newGuest = {
                      firstName: '',
                      lastName: '',
                      phoneNumber: '',
                      email: '',
                      countryCode: '+91',
                      country: countries[0],
                    };
                    dispatch(addAdditionalGuest(newGuest));
                    setHasUserEdited(true);
                  }}
                  className="flex items-center gap-2 pb-4 text-blue-600 hover:text-blue-800"
                >
                  <FiPlus className="w-4 h-4" />
                  Additional guest
                </button>
              ) : (
                <div className="relative flex items-center gap-2 pb-4 text-gray-400 cursor-not-allowed">
                  <FiPlus className="w-4 h-4" />
                  <span>Additional guest</span>
                  <div className="absolute left-0 top-full mt-1 w-48 bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100">
                    Maximum number of guests reached for this room
                  </div>
                </div>
              )}
            </div>
            {/* Additional Rooms and Guests */}
            {rooms > 1 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Additional Rooms</h3>

                {Array.from({ length: rooms - 1 }).map((_, roomIndex) => (
                  <div key={roomIndex} className="mb-6 border-b pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-700">
                        Room {roomIndex + 2}:
                      </span>
                      <span className="text-sm">
                        {selectedRoom?.roomtypename},
                        {selectedRoom?.amenities?.map((amenity, index) => (
                          <span key={index} className="inline-flex items-center gap-1 mr-2">
                            <ImCheckmark className="text-green-500 ml-2" />
                            {amenity.name}
                            {index !== selectedRoom.amenities.length - 1 && ','}
                          </span>
                        ))}
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
                            className="w-1/8 p-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+81">+81</option>
                          </select>
                          <input
                            type="text"
                            value={additionalGuests[roomIndex]?.phoneNumber || ''}
                            onChange={(e) =>
                              handleAdditionalGuestChange(roomIndex, 'phoneNumber', e.target.value)
                            }
                            className="w-[355px] p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Please enter a valid Mobile number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selected Amenities</h2>

            {allEnhancements.filter((amenity) => amenity.quantity > 0).length > 0 ? (
              <ul className="space-y-2">
                {allEnhancements
                  .filter((amenity) => amenity.quantity > 0)
                  .map((amenity) => (
                    <li key={amenity.id} className="flex justify-between py-1">
                      <div>
                        <span>
                          {amenity.name} × {amenity.quantity}
                        </span>
                      </div>
                      <span>
                        ₹
                        {amenity.totalPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No amenities selected.</p>
            )}
          </div>

          {/* Important Information Card  */}
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Important information</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li>
                Cancel your booking at least 24 hours before your scheduled check-in time to avoid
                cancellation fees
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
                Guests may check in from 11:00 AM onwards and are requested to check out by 12:00
                PM.
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
          <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
            {/* Signed-in Info */}
            <div className=" p-0.5 text-right">
              <p className="text-sm text-black">
                <span className="font-semibold ">Signed in as</span> {email}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 shadow-sm bg-white sticky top-4">
            {/* Image slider section */}
            <div className="relative w-full h-60 overflow-hidden rounded-t-2xl">
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
              {/* Slider controls */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-2 rounded-full"
              >
                &lt;
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 bg-opacity-50 text-white p-2 rounded-full"
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
                    <p className="text-gray-600 text-sm">
                      {checkInDate ? formatDate(checkInDate) : 'N/A'} (11:00 AM)
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Check-out:</h3>
                    <p className="text-gray-600 text-sm">
                      {checkOutDate ? formatDate(checkOutDate) : 'N/A'} (12:00 PM)
                    </p>
                  </div>
                </div>

                {/* Price Details section with preview API integration */}
                <div className="border-t pt-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Price Details
                    {previewError && (
                      <span className="ml-2 text-sm text-red-500">(Error loading prices)</span>
                    )}
                    <button
                      onClick={() => setPreviousPricePopupOpen(true)}
                      className="ml-2 text-blue-600 text-sm font-normal underline hover:text-blue-800"
                    >
                      (View previous reservation details)
                    </button>
                  </h3>

                  {previewError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700 text-sm">
                        Failed to load price preview: {previewError}
                      </p>
                      <button
                        onClick={loadPreviewData}
                        className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {isLoadingPreview ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : previewData ? (
                    <>
                      <div className="mb-3">
                        {previewPrices.modificationType === 'downgrade' ? (
                          <div className="flex justify-between text-sm text-gray-700 mb-2">
                            <span>
                              Room × {Math.max(1, daysCount)} Night
                              {Math.max(1, daysCount) > 1 ? 's' : ''}
                            </span>
                            <span>
                              ₹
                              {selectedRoom.dynamicPrice.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm text-gray-700 mb-2">
                            <span>
                              Room × {Math.max(1, daysCount)} Night
                              {Math.max(1, daysCount) > 1 ? 's' : ''}
                            </span>
                            <span>
                              ₹
                              {selectedRoom.dynamicPrice.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {allEnhancements.filter((amenity) => amenity.quantity > 0).length > 0 && (
                        <div className="space-y-2 mb-3">
                          {allEnhancements
                            .filter((amenity) => amenity.quantity > 0)
                            .map((amenity) => (
                              <div
                                key={amenity.id}
                                className="flex justify-between text-sm text-gray-700"
                              >
                                <span>
                                  {amenity.name} × {amenity.quantity}
                                </span>
                                <span>
                                  ₹
                                  {amenity.totalPrice.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      <hr className="my-2 border-t border-gray-300" />

                      {previewPrices.roomServiceFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-700 mt-2">
                          <span className="font-semibold">Modification fee:</span>
                          <span>
                            ₹
                            {previewPrices.roomServiceFee.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {previewPrices.serviceFeeHistorical > 0 && (
                        <div className="flex justify-between text-sm text-gray-700 mt-2">
                          <span className="text-gray-800 font-semibold">
                            Previous Modification Fees
                          </span>
                          <span>
                            ₹
                            {previewPrices.serviceFeeHistorical.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

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
                            {previewPrices.fixedCurrentTax.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {showTaxDetails && (
                          <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
                            {previewPrices.roomTaxAmount > 0 && (
                              <div className="mb-2">
                                <div className="flex justify-between">
                                  <span>Room Tax (5%)</span>
                                  <span>
                                    ₹
                                    {previewPrices.roomTaxAmount.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}

                            {previewPrices.serviceDeltaTax > 0 && (
                              <div className="mb-2">
                                <div className="flex justify-between">
                                  <span>New Amenities Tax</span>
                                  <span>
                                    ₹
                                    {previewPrices.serviceDeltaTax.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}

                            {previousAmenitiesTaxForUi > 0 && (
                              <div className="mb-2">
                                <div className="flex justify-between">
                                  <span>Existing Amenities Tax</span>
                                  <span>
                                    ₹
                                    {previousAmenitiesTaxForUi.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t pt-2 mt-3">
                        <h3 className="text-lg font-semibold text-gray-800">Total</h3>
                        <span className="text-lg font-bold text-gray-900">
                          ₹
                          {previewPrices.currentTotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {previewPrices.amountPaid > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <h3 className="text-lg font-semibold text-gray-950">Amount paid</h3>
                          <span className="text-lg font-semibold text-gray-950">
                            ₹
                            {previewPrices.amountPaid.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {previewPrices.amountDueAfterPreview > 0 && (
                        <div className="flex justify-between items-center mt-2">
                          <h3 className="text-lg font-semibold text-gray-950">Amount Due</h3>
                          <span className="text-lg font-bold text-gray-900">
                            ₹
                            {previewPrices.amountDueAfterPreview.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {refundCalculations.totalRefund > 0 && (
                        <>
                          <div className="flex justify-between items-center mt-2">
                            <h3 className="text-lg font-semibold text-gray-950">
                              {previewData?.room_preview?.financial_preview_type ===
                              'recalculation_via_discount'
                                ? 'Adjustment Amount'
                                : 'Refund Amount'}
                            </h3>
                            <span className="text-lg font-bold text-gray-900">
                              ₹
                              {refundCalculations.totalRefund.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-2 rounded-md mt-1 border ${
                              previewData?.room_preview?.financial_preview_type ===
                              'recalculation_via_discount'
                                ? 'bg-blue-50 border-blue-100'
                                : 'bg-green-50 border-green-100'
                            }`}
                          >
                            <div className="text-xs text-gray-600 space-y-1">
                              {refundCalculations.roomRefund > 0 && (
                                <div className="flex justify-between">
                                  <span>
                                    •{' '}
                                    {previewData?.room_preview?.financial_preview_type ===
                                    'recalculation_via_discount'
                                      ? 'Room adjustment:'
                                      : 'Room refund:'}
                                  </span>
                                  <span>
                                    ₹
                                    {refundCalculations.roomRefund.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              )}
                              {refundCalculations.amenitiesRefund > 0 && (
                                <div className="flex justify-between">
                                  <span>
                                    •{' '}
                                    {previewData?.room_preview?.financial_preview_type ===
                                    'recalculation_via_discount'
                                      ? 'Amenities adjustment:'
                                      : 'Amenities refund:'}
                                  </span>
                                  <span>
                                    ₹
                                    {refundCalculations.amenitiesRefund.toLocaleString('en-IN', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm py-2"></div>
                  )}
                </div>
                <RefundMessageComponent />
                {/* <AmenitiesCancellationMessage /> */}

                {/* Downgrade refund message */}

                {previewPrices.modificationType?.includes('downgrade') &&
                  previewPrices.priceDifference > 0 && (
                    <div
                      className={`p-3 rounded-md mt-2 border ${
                        previewData?.room_preview?.financial_preview_type ===
                        'recalculation_via_discount'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg
                          className={`w-5 h-5 mr-2 ${
                            previewData?.room_preview?.financial_preview_type ===
                            'recalculation_via_discount'
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {previewData?.room_preview?.financial_preview_type ===
                          'recalculation_via_discount' ? (
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        <div>
                          {previewData?.room_preview?.financial_preview_type ===
                          'recalculation_via_discount' ? (
                            <>
                              <p className="text-gray-700 text-sm">
                                <strong>
                                  Refund Adjustment: ₹
                                  {refundCalculations.totalRefund.toLocaleString('en-IN')}
                                </strong>
                              </p>
                              <p className="text-xs text-gray-600 italic mt-1">
                                (Modification fees of ₹
                                {previewPrices.roomServiceFee.toLocaleString('en-IN')} is deducted.
                                The net amount of ₹
                                {refundCalculations.totalRefund.toLocaleString('en-IN')} has been
                                adjusted against your total amount due.)
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-700 text-sm">
                                <strong>
                                  You will receive a refund of ₹
                                  {refundCalculations.totalRefund.toLocaleString('en-IN')}
                                </strong>
                              </p>
                              <p className="text-xs text-gray-600 italic mt-1">
                                (Modification fees of ₹
                                {previewPrices.roomServiceFee.toLocaleString('en-IN')} is deducted.
                                The remaining balance of ₹
                                {refundCalculations.totalRefund.toLocaleString('en-IN')} will be
                                refunded to your payment method within 5–7 business days.)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                {/* <div className="mt-3">
                  {previewPrices.amountDueAfterPreview > 0 &&
                    refundCalculations.totalRefund > 0 && (
                      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                        <p className="text-sm text-yellow-700 text-center">
                          <strong>Note:</strong> Please pay the amount due. Your
                          refund will be processed separately.
                        </p>
                      </div>
                    )}
                </div> */}

                {/* Adjustment Warning Message */}
                {adjustmentWarning && adjustmentWarning.has_adjustments && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">
                          Modification Restrictions
                        </p>

                        <div className="mt-2 text-sm text-red-600 font-medium">
                          {adjustmentWarning.manual_adjustment_count > 0 && (
                            <p>Manual adjustment(s) applied to this booking</p>
                          )}
                          {adjustmentWarning.voucher_count > 0 && (
                            <p>
                              • {adjustmentWarning.voucher_count} active voucher(s) applied to this
                              booking
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          Please contact the front desk to resolve these adjustments before making
                          any modifications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Render the popup component */}
                <LegalDocumentsPopup
                  isOpen={showLegalPopup}
                  onClose={() => setShowLegalPopup(false)}
                />
                {checkboxError && (
                  <p className="text-red-500 text-xs mb-2">
                    Please acknowledge the terms and conditions to proceed
                  </p>
                )}

                {/* Modify Reservation Button - Disabled when adjustments exist */}
                <button
                  onClick={handleBooking}
                  className={`w-full font-bold py-3 px-4 rounded-md transition duration-200 ${
                    adjustmentWarning?.has_adjustments
                      ? 'bg-purple-500 text-white cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                  disabled={
                    isLoading ||
                    isLoadingPreview ||
                    !email ||
                    email.trim() === '' ||
                    adjustmentWarning?.has_adjustments
                  }
                  title={
                    adjustmentWarning?.has_adjustments
                      ? 'Cannot modify booking with active adjustments. Please contact front desk.'
                      : !email || email.trim() === ''
                        ? 'Email is required to proceed'
                        : ''
                  }
                >
                  {isLoading ? 'Processing...' : 'Modify Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reservationPopupOpen && (
        <div className="fixed inset-0 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-white border border-gray-300 w-4/5 sm:w-2/5 p-8 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-4 text-red-600 text-xl hover:text-red-800 transition-colors"
              onClick={() => {
                setReservationPopupOpen(false);
                setReservationError(null);
                setAdjustmentErrorDetails(null);
                setShowAdjustmentErrorPopup(false);
                navigate('/profile_guest_options');
              }}
            >
              ✕
            </button>

            {reservationError || adjustmentErrorDetails ? (
              // ==================== ERROR SECTION ====================
              (() => {
                // Check if this is an adjustment error (409 conflict)
                const isAdjustmentError =
                  adjustmentErrorDetails &&
                  adjustmentErrorDetails.code === 'ACTIVE_ADJUSTMENTS_BLOCK_MODIFICATION';

                if (isAdjustmentError) {
                  // ADJUSTMENT ERROR UI (409 Conflict)
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          Cannot Modify Reservation
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {adjustmentErrorDetails.message ||
                            'There are active adjustments or vouchers on this booking.'}
                        </p>
                      </div>

                      {/* Adjustment Details */}
                      {adjustmentErrorDetails.adjustments && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start">
                            <svg
                              className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800 mb-2">
                                {adjustmentErrorDetails.adjustments.message}
                              </p>
                              <div className="space-y-2">
                                {adjustmentErrorDetails.adjustments.voucher_count > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-yellow-700">Active Vouchers:</span>
                                    <span className="font-semibold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">
                                      {adjustmentErrorDetails.adjustments.voucher_count}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Required */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                          <svg
                            className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-blue-800">Action Required:</p>
                            <p className="text-sm text-blue-700 mt-1">
                              {adjustmentErrorDetails.action_required ||
                                'Please contact the front desk or cancel adjustments/vouchers before making modifications.'}
                            </p>
                            {adjustmentErrorDetails.adjustments?.manual_adjustment_count > 0 && (
                              <p className="text-xs text-blue-600 mt-2">
                                • Manual adjustments need to be reviewed and cleared by hotel staff
                              </p>
                            )}
                            {adjustmentErrorDetails.adjustments?.voucher_count > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                • Active vouchers need to be redeemed or cancelled first
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setReservationPopupOpen(false);
                            setAdjustmentErrorDetails(null);
                            setShowAdjustmentErrorPopup(false);
                          }}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition duration-200"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            setReservationPopupOpen(false);
                            setAdjustmentErrorDetails(null);
                            setShowAdjustmentErrorPopup(false);
                            navigate('/edit-reservation/update-roomdetails');
                          }}
                          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  );
                } else if (typeof reservationError === 'object' && reservationError.detail) {
                  // DETAILED API ERROR UI
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          {reservationError.detail.title || 'Modification Failed'}
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {reservationError.detail.message ||
                            'An error occurred while processing your request.'}
                        </p>
                      </div>

                      {/* Error Details */}
                      {reservationError.detail.details &&
                        reservationError.detail.details.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                            {reservationError.detail.details.map((detail, index) => (
                              <p key={index} className="text-sm text-gray-600 mb-1">
                                {detail}
                              </p>
                            ))}
                          </div>
                        )}

                      {/* Missing Guests Info */}
                      {reservationError.detail.missingGuests > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Missing Information
                          </p>
                          <p className="text-sm text-yellow-700">
                            {reservationError.detail.actionRequired ||
                              `Please add information for ${reservationError.detail.missingGuests} additional guest(s).`}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          setReservationError(null);
                          setAdjustmentErrorDetails(null);
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
                      >
                        Close
                      </button>
                    </div>
                  );
                } else {
                  // GENERIC ERROR UI (string error)
                  return (
                    <div>
                      <div className="text-center mb-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                          Modification Failed
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {typeof reservationError === 'string'
                            ? reservationError
                            : 'We were unable to process your modification request at the moment. Your reservation is still secure. Please try again later.'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setReservationPopupOpen(false);
                          setReservationError(null);
                          setAdjustmentErrorDetails(null);
                        }}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
                      >
                        Close
                      </button>
                    </div>
                  );
                }
              })()
            ) : (
              // ==================== SUCCESS SECTION ====================
              <div>
                <div className="mb-4 mt-5">
                  <p className="text-md font-semibold">
                    Hello,{' '}
                    <span className="capitalize">
                      {firstName} {lastName}
                    </span>{' '}
                    you've reached last step of your modification
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="rounded-lg">
                    <p className="text-md font-semibold text-gray-700">Reservation Number</p>
                    <p className="text-md font-mono">
                      {booking?.orderid || localStorage.getItem('orderId')}
                    </p>
                  </div>
                  <div>
                    <p className="text-md font-semibold text-gray-700">Check-in</p>
                    <p className="text-md">
                      {booking?.checkindate
                        ? new Date(booking.checkindate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : checkInDate
                          ? new Date(checkInDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-md font-semibold text-gray-700">Check-out</p>
                    <p className="text-md">
                      {booking?.checkoutdate
                        ? new Date(booking.checkoutdate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : checkOutDate
                          ? new Date(checkOutDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* CHECK FOR ADJUSTMENT CASE FIRST */}
                {previewData?.room_preview?.financial_preview_type ===
                  'recalculation_via_discount' && refundCalculations.totalRefund > 0 ? (
                  // ADJUSTMENT CASE
                  <div className="bg-blue-50 p-4 rounded-t-md border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-center">
                      Adjustment Summary
                    </h4>

                    {refundCalculations.roomRefund > 0 && (
                      <div className="mb-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 px-4 font-semibold">Room Adjustment:</span>
                          <span className="font-semibold text-gray-700">
                            ₹
                            {refundCalculations.roomRefund.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-end text-gray-500 text-[10px] mt-0.5">
                          Including taxes
                        </div>
                      </div>
                    )}

                    {previewPrices.totalServiceFee > 0 && (
                      <div className="flex justify-between mb-2 text-gray-700">
                        <span className="text-xs font-semibold px-4">
                          Modification Fee Deduction:
                        </span>
                        <span className="font-semibold text-xs">
                          - ₹
                          {previewPrices.totalServiceFee.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 font-bold">
                      <span className="text-gray-800 px-4">Final Adjustment Amount:</span>
                      <span className="text-gray-800">
                        ₹
                        {(
                          refundCalculations.totalRefund - previewPrices.totalServiceFee
                        ).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 text-center mt-1 font-semibold">
                      This is an adjustment amount. The amount has been adjusted against your total
                      amount due. No separate refund will be processed.
                    </p>
                  </div>
                ) : refundCalculations.totalRefund > 0 ? (
                  // REFUND CASE (not adjustment)
                  <div className="bg-green-50 p-4 rounded-t-md border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 text-center">
                      Refund Breakdown
                    </h4>

                    {refundCalculations.roomRefund > 0 && (
                      <div className="mb-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 px-4 font-semibold">Room Refund:</span>
                          <span className="font-semibold text-gray-700">
                            ₹
                            {refundCalculations.roomRefund.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-end text-gray-500 text-[10px] mt-0.5">
                          Including taxes
                        </div>
                      </div>
                    )}

                    {previewPrices.modificationType?.includes('downgrade') &&
                      previewPrices.totalServiceFee > 0 && (
                        <div className="flex justify-between mb-2 text-gray-700">
                          <span className="text-xs font-semibold px-4">
                            Modification Fee Deduction:
                          </span>
                          <span className="font-semibold text-xs">
                            - ₹
                            {previewPrices.totalServiceFee.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 font-bold">
                      <span className="text-gray-800 px-4">Final Refund Amount:</span>
                      <span className="text-gray-800">
                        ₹
                        {(
                          refundCalculations.totalRefund - previewPrices.totalServiceFee
                        ).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 text-center mt-1">
                      {previewPrices.modificationType?.includes('downgrade') &&
                      previewPrices.totalServiceFee > 0 ? (
                        <>
                          (Modification fees of ₹
                          {previewPrices.totalServiceFee.toLocaleString('en-IN')}
                          have been deducted. The remaining amount will be refunded to your payment
                          method within 5–7 business days)
                        </>
                      ) : (
                        '(Refund will be processed to your payment method within 5–7 business days)'
                      )}
                    </p>
                  </div>
                ) : null}

                {/* PAYMENT SECTION */}
                {previewPrices.amountDueAfterPreview > 0 ? (
                  <div
                    className={`p-4 rounded-b-md mb-6 border ${
                      previewData?.room_preview?.financial_preview_type ===
                      'recalculation_via_discount'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    {previewData?.room_preview?.financial_preview_type ===
                      'recalculation_via_discount' && refundCalculations.totalRefund > 0 ? (
                      <>
                        <p className="text-center text-sm font-semibold text-black">
                          Please pay the adjusted amount of{' '}
                          <span className="text-gray-950 text-sm">
                            ₹
                            {previewPrices.amountDueAfterPreview.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </>
                    ) : refundCalculations.totalRefund > 0 ? (
                      <>
                        <p className="text-center text-sm font-semibold text-black mb-2">
                          Please pay the amount due of{' '}
                          <span className="text-gray-950 text-sm">
                            ₹
                            {previewPrices.amountDueAfterPreview.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </>
                    ) : (
                      <p className="text-center text-sm font-semibold text-black">
                        Please pay the amount due of{' '}
                        <span className="text-gray-950 text-sm">
                          ₹
                          {previewPrices.amountDueAfterPreview.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    )}

                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        onClick={() => {
                          storeBookingData();
                          handlePaymentOption('payLater');
                        }}
                        className="w-full text-lg font-semibold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                      >
                        {isCorporateGuest ? 'Bill to Company' : 'Pay at Front Desk'}
                      </button>
                      <button
                        onClick={() => {
                          storeBookingData();
                          handlePaymentOption('payNow');
                        }}
                        className="w-full text-lg font-semibold bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ) : (
                  // If amount due is 0, show proceed button
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    {previewData?.room_preview?.financial_preview_type ===
                      'recalculation_via_discount' &&
                      refundCalculations.totalRefund > 0 && (
                        <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
                          <div className="flex items-center">
                            <svg
                              className="w-5 h-5 text-blue-600 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm text-blue-700">
                              Adjustment of ₹
                              {refundCalculations.totalRefund.toLocaleString('en-IN')} applied
                              successfully.
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 ml-7">
                            This is an adjustment amount. No refund was processed.
                          </p>
                        </div>
                      )}

                    <button
                      onClick={() => {
                        storeBookingData();
                        navigate('/modification-succesful');
                      }}
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition duration-200"
                    >
                      Proceed
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Previous Price Details Popup */}
      {previousPricePopupOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-xl p-5 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Previous Reservation Details
            </h2>

            {/* Booking Information */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                RESERVATION INFORMATION
              </h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Reservation Number:</span>
                  <span className="font-medium text-gray-800">{booking?.orderid}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Room Type:</span>
                  <span className="font-medium text-gray-800">{booking?.room_type}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Number of Nights:</span>
                  <span className="text-gray-700">{booking?.number_of_nights || 1}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Check-in:</span>
                  <span className="text-gray-700">
                    {booking?.checkindate ? formatDate(booking.checkindate) : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Check-out:</span>
                  <span className="text-gray-700">
                    {booking?.checkoutdate ? formatDate(booking.checkoutdate) : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Number of Guests:</span>
                  <span className="text-gray-700">{booking?.number_of_guests || 1}</span>
                </div>
              </div>
            </div>

            {/* Billing Breakdown */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path
                    fillRule="evenodd"
                    d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                </svg>
                BILLING BREAKDOWN
              </h3>

              <div className="space-y-3 text-sm">
                {/* Room Charges from API breakdown_old */}
                {previewPrices.oldBreakdown && previewPrices.oldBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-1">
                      Room Charges(Including Taxes)
                    </div>
                    {previewPrices.oldBreakdown.map((day, index) => (
                      <div key={index} className="flex justify-between items-start border-gray-100">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Day {index + 1}: {formatDate(day.date)}
                            </span>
                            <span className="font-medium text-gray-800">
                              ₹
                              {day.day_total.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          {day.discount_amount > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Discount: -₹
                              {day.discount_amount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Total Room Charges */}
                    <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                      <span>Total Room Charges</span>
                      <span className="text-gray-800">
                        ₹
                        {previewPrices.oldTotal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* PREVIOUS AMENITIES SECTION - FIXED */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <div className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-1">
                    Amenities & Services(Including Taxes)
                  </div>

                  {previewData?.service_preview?.cancelled_items?.length > 0 && (
                    <div className="mb-3 p-2 bg-red-50 rounded border border-red-100">
                      <div className="flex items-center mb-1">
                        <svg
                          className="w-4 h-4 text-red-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-medium text-red-600">
                          Cancelled Amenities
                        </span>
                      </div>
                      {previewData.service_preview.cancelled_items.map((item, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-600 flex justify-between ml-5"
                        >
                          <span>
                            {item.type === 'amenity'
                              ? 'Amenity'
                              : item.type === 'room_service'
                                ? 'Room Service'
                                : 'Food'}
                            : {item.item_id || item.food_id}
                            {item.quantity_cancelled > 1 && ` × ${item.quantity_cancelled}`}
                          </span>
                          <span className="font-medium line-through">
                            ₹{item.total_amount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                      <div className="text-xs text-green-600 font-medium mt-1 ml-5">
                        Refund amount: ₹
                        {previewData.service_preview.refund_amount?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}

                  {/* Check all possible amenity locations */}
                  {(() => {
                    // Collect all amenities from different possible structures
                    const allAmenities = [];

                    // Check regular enhancements structure
                    if (booking?.enhancements) {
                      const { food, amenities, room_services } = booking.enhancements;

                      if (food?.items?.length > 0) {
                        food.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Food',
                            name: item.name,
                            quantity: item.selected_quantity || 1,
                            price: item.base_price || 0,
                            total: (item.base_price || 0) * (item.selected_quantity || 1),
                            is_refundable: item.refundable,
                          });
                        });
                      }

                      if (amenities?.items?.length > 0) {
                        amenities.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Amenity',
                            name: item.name,
                            quantity: item.selected_quantity || 1,
                            price: item.base_price || 0,
                            total: (item.base_price || 0) * (item.selected_quantity || 1),
                            is_refundable: item.refundable,
                          });
                        });
                      }

                      if (room_services?.items?.length > 0) {
                        room_services.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Room Service',
                            name: item.name,
                            quantity: item.selected_quantity || 1,
                            price: item.base_price || 0,
                            total: (item.base_price || 0) * (item.selected_quantity || 1),
                            is_refundable: item.refundable,
                          });
                        });
                      }
                    }

                    // Check detailed enhancements structure
                    if (booking?.enhancements_detailed) {
                      const { food, amenities, room_services } = booking.enhancements_detailed;

                      if (food?.items?.length > 0) {
                        food.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Food',
                            name: item.name,
                            quantity: item.quantity || 1,
                            price:
                              (item.base_price || item.total_amount || 0) / (item.quantity || 1),
                            total: item.total_amount || 0,
                            is_refundable: item.refundable,
                          });
                        });
                      }

                      if (amenities?.items?.length > 0) {
                        amenities.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Amenity',
                            name: item.name,
                            quantity: item.quantity || 1,
                            price:
                              (item.base_price || item.total_amount || 0) / (item.quantity || 1),
                            total: item.total_amount || 0,
                            is_refundable: item.refundable,
                          });
                        });
                      }

                      if (room_services?.items?.length > 0) {
                        room_services.items.forEach((item) => {
                          allAmenities.push({
                            type: 'Room Service',
                            name: item.name,
                            quantity: item.quantity || 1,
                            price:
                              (item.base_price || item.total_amount || 0) / (item.quantity || 1),
                            total: item.total_amount || 0,
                            is_refundable: item.refundable,
                          });
                        });
                      }
                    }

                    // Check booking_enhancements (another possible structure)
                    if (booking?.booking_enhancements?.length > 0) {
                      booking.booking_enhancements.forEach((item) => {
                        allAmenities.push({
                          type: item.type || 'Service',
                          name: item.name,
                          quantity: item.quantity || 1,
                          price: item.price || 0,
                          total: (item.price || 0) * (item.quantity || 1),
                          is_refundable: item.is_refundable,
                        });
                      });
                    }

                    if (allAmenities.length === 0) {
                      return (
                        <div className="text-center py-3">
                          <p className="text-gray-500 text-sm">No amenities were selected</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {allAmenities.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <span className="text-gray-600">
                                {item.name} × {item.quantity}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {item.is_refundable && (
                                  <span className="text-green-600">Refundable</span>
                                )}
                              </div>
                            </div>
                            <span className="font-medium text-gray-800">
                              ₹
                              {item.total.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}

                        {/* Total Amenities */}
                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                          <span>Amenities & Services Total</span>
                          <span className="text-gray-800">
                            ₹
                            {calculatePreviousAmenitiesTotal().toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Taxes and Charges Section */}
                <div className=" border-gray-200">
                  {/* <div className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-2">
                    Taxes and Charges
                  </div> */}

                  <div className="space-y-1">
                    {/* Room Tax */}
                    {/* {originalTaxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Tax (12%)</span>
                        <span className="font-medium text-gray-800">
                          ₹
                          {originalTaxAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )} */}
                    {/* 
                    {previousAmenitiesTaxForUi > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amenities Tax</span>
                        <span className="font-medium text-gray-800">
                          ₹
                          {previousAmenitiesTaxForUi.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )} */}

                    {/* Service Fee */}
                    {originalServiceFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="font-medium text-gray-800">
                          ₹
                          {originalServiceFee.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}

                    {/* Total Taxes and Charges */}
                    {/* <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                      <span>Total Taxes and Charges</span>
                      <span className="text-gray-800">
                        ₹
                        {(
                          originalTaxAmount +
                          previousAmenitiesTaxForUi +
                          originalServiceFee
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div> */}
                  </div>
                </div>

                {/* Total Amount Section */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-gray-800">Total Amount</span>
                    <span className="text-gray-900">
                      ₹
                      {totalFinalAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setPreviousPricePopupOpen(false)}
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2 rounded-md text-sm transition-colors"
              >
                Close
              </button>
            </div>
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

export default ReservationSummary;
// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import countries from "../Walk-In/countries";
// import { useNavigate } from "react-router-dom";
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
// import LegalDocumentsPopup from "../Walk-In/LegalDocumentsPopup";
// import {
//   addAdditionalGuest,
//   updateAdditionalGuest,
//   removeAdditionalGuest,
//   initAdditionalGuests,
// } from "../Walk-In/redux/action";
// import CancellationPolicy from "../Walk-In/CancellationPolicy";
// import ReservationSteps from "./ReservationSteps";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;
// const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

// const getGuestIdFromToken = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     return payload.sub;
//   } catch (e) {
//     console.error("Error parsing token:", e);
//     return null;
//   }
// };
// const getGuestData = async () => {
//   const accessToken = Cookies.get("access_token");
//   console.log(accessToken);
//   if (!accessToken) return null;

//   try {
//     const guestId = getGuestIdFromToken(accessToken) || Cookies.get("guest_id");
//     console.log(guestId);
//     if (!guestId) return null;

//     const guestResponse = await fetch(
//       `${CQ_BASE_URL}/bq/api/guests/${guestId}`,
//       {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     if (!guestResponse.ok) {
//       throw new Error(`Guest API Error: ${guestResponse.statusText}`);
//     }

//     const guestData = await guestResponse.json();

//     if (!guestData.success || !guestData.guest) {
//       return null;
//     }

//     const guest = guestData.guest;

//     const isCorporateGuest = guest.companyid && guest.companyname;

//     const isDecrypted = guest.emailid && guest.emailid.length < 50;

//     if (isDecrypted) {
//       return {
//         first_name: guest.firstname || "",
//         last_name: guest.lastname || "",
//         email: guest.emailid || "",
//         phone_number: guest.phonenumber ? guest.phonenumber.toString() : "",
//         country_code: guest.countrycode || "+91",
//         client_type: guest.clienttype || "Leisure",
//         company_id: guest.companyid || "",
//         company_name: guest.companyname || "",
//         is_corporate: isCorporateGuest,
//         country: guest.country || "India",
//       };
//     }

//     const decryptedFields = await decryptUserData({
//       email: guest.emailid,
//       phone_number: guest.phonenumber,
//       country_code: guest.countrycode,
//     });

//     return {
//       first_name: guest.firstname || "",
//       last_name: guest.lastname || "",
//       email: decryptedFields.email || guest.emailid || "",
//       phone_number:
//         decryptedFields.phone_number ||
//         (guest.phonenumber ? guest.phonenumber.toString() : ""),
//       country_code: guest.countrycode || "+91",
//       client_type: guest.clienttype || "Leisure",
//       company_id: guest.companyid || "",
//       company_name: guest.companyname || "",
//       is_corporate: isCorporateGuest,
//       country: guest.country || "India",
//     };
//   } catch (error) {
//     console.error("Error fetching guest data:", error);
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

// const ReservationSummary = () => {
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
//   const [editingGuestIndex, setEditingGuestIndex] = useState(null);
//   const [currentEditingGuest, setCurrentEditingGuest] = useState(null);
//   const [previousPricePopupOpen, setPreviousPricePopupOpen] = useState(false);
//   const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
//   const [showDetails, setShowDetails] = useState(false);
//   const [isDowngradeRefund, setIsDowngradeRefund] = useState(false);
//   const [refundDetails, setRefundDetails] = useState(null);
//   const [amenitiesRefundDetails, setAmenitiesRefundDetails] = useState(null);
//   const [showAmenitiesPopup, setShowAmenitiesPopup] = useState(false);
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find((country) => country.name === "India") || countries[0]
//   );
//   const [isOpen, setIsOpen] = useState(false);

//   const [guestDropdownStates, setGuestDropdownStates] = useState({});
//   const [companyName, setCompanyName] = useState("");
//   const [companyId, setCompanyId] = useState("");
//   const [isCorporateGuest, setIsCorporateGuest] = useState(false);

//   const [previewData, setPreviewData] = useState(null);
//   const [isLoadingPreview, setIsLoadingPreview] = useState(false);
//   const [previewError, setPreviewError] = useState(null);
//   const [unifiedBillingId, setUnifiedBillingId] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [showLegalPopup, setShowLegalPopup] = useState(false);
//   const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
//   const [unpaidBillingDetails, setUnpaidBillingDetails] = useState({
//     totalPaid: 0,
//     totalDue: 0,
//     unpaidBillingIds: [],
//   });

//   const [hasUserEdited, setHasUserEdited] = useState(false);
//   const [errors, setErrors] = useState({
//     firstName: "",
//     lastName: "",
//     phoneNumber: "",
//     email: "",
//   });
//   const [guestErrors, setGuestErrors] = useState([]);
//   const [hasInitializedGuests, setHasInitializedGuests] = useState(false);

//   const [razorpayLoaded, setRazorpayLoaded] = useState(false);

//   const validateName = (value) => {
//     const trimmed = value.trim();

//     if (!trimmed) {
//       return "Please enter a name";
//     }

//     if (trimmed.length < 2) {
//       return "Name must be at least 2 characters";
//     }
//     if (trimmed.length > 60) {
//       return "Name cannot exceed 60 characters";
//     }

//     if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
//       const invalidChars = trimmed.match(/[^A-Za-z\s'-]/g);
//       if (invalidChars) {
//         const uniqueChars = [...new Set(invalidChars)];
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
//       return "Only letters are allowed (no special characters)  ";
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

//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const booking = useSelector((state) => state.booking.selectedBooking);

//   const { checkInDate, checkOutDate, daysCount } = useSelector(
//     (state) => state.selectedModifyDates
//   );

//   const additionalGuests = useSelector(
//     (state) => state.formDetails.additionalGuests || []
//   );
//   const { selectedRoom } = useSelector((state) => state.roomtype);
//   const { rooms, adults, children, infants, childrenAges } = useSelector(
//     (state) => state.formDetails
//   );
//   const maxAdditionalGuests = Math.max(0, adults - 1);

//   const togglePopup = () => setPopupOpen(!popupOpen);
//   const selectedAmenities = useSelector((state) => {
//     const formAmenities = state.amenities?.selectedAmenities || [];

//     if (formAmenities.length > 0) {
//       return formAmenities;
//     }

//     const bookingEnhancements =
//       state.booking.selectedBooking?.enhancements || {};

//     const bookingFoodItems = bookingEnhancements.food?.items || [];
//     const bookingAmenityItems = bookingEnhancements.amenities?.items || [];
//     const bookingRoomServiceItems =
//       bookingEnhancements.room_service?.items || [];

//     return [
//       ...bookingFoodItems.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "food",
//         value: item.value,
//         value_type: item.value_type || "P",
//         refundable: item.refundable,
//       })),
//       ...bookingAmenityItems.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "amenity",
//         value: item.value || 12,
//         value_type: item.value_type || "P",
//         refundable: item.refundable,
//       })),
//       ...bookingRoomServiceItems.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "room_service",
//         value: item.value || 12,
//         value_type: item.value_type || "P",
//         refundable: item.refundable,
//       })),
//     ];
//   });

//   const countryCodes = [
//     { code: "+91" },
//     { code: "+1" },
//     { code: "+44" },
//     { code: "+61" },
//     { code: "+81" },
//   ];
//   const countryCodeEnum = countryCodes.map((item) => item.code);

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

//   const handleFirstNameChange = (e) => {
//     setHasUserEdited(true);
//     const value = e.target.value;
//     setFirstName(value);
//     const error = validateName(value, true);
//     setErrors((prev) => ({ ...prev, firstName: error }));
//   };

//   const handleLastNameChange = (e) => {
//     setHasUserEdited(true);
//     const value = e.target.value;
//     setLastName(value);
//     const error = validateName(value, false);
//     setErrors((prev) => ({ ...prev, lastName: error }));
//   };

//   const handlePhoneNumberChange = (e) => {
//     setHasUserEdited(true);
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

//   const validateAdditionalGuest = (guest) => {
//     const errors = {};

//     if (!guest.firstName?.trim()) {
//       errors.firstName = "First name is required";
//     } else if (!/^[A-Za-z\s'-]+$/.test(guest.firstName)) {
//       errors.firstName = "Only letters and basic punctuation allowed";
//     }

//     if (!guest.lastName?.trim()) {
//       errors.lastName = "Last name is required";
//     } else if (!/^[A-Za-z\s'-]+$/.test(guest.lastName)) {
//       errors.lastName = "Only letters and basic punctuation allowed";
//     }

//     if (guest.phoneNumber && !/^\d{10}$/.test(guest.phoneNumber)) {
//       errors.phoneNumber = "Phone must be 10 digits if provided";
//     }

//     return errors;
//   };

//   const saveAdditionalGuest = (index) => {
//     const guestToSave = additionalGuests[index];

//     const errors = validateAdditionalGuest(guestToSave);

//     if (Object.keys(errors).length > 0) {
//       const updatedErrors = [...guestErrors];
//       updatedErrors[index] = errors;
//       setGuestErrors(updatedErrors);
//       toast.error("Please fix the errors before saving");
//       return;
//     }

//     dispatch(updateAdditionalGuest(index, guestToSave));
//     setEditingGuestIndex(null);
//     toast.success("Guest saved successfully!");
//   };

//   const guestDetailsSchema = z.object({
//     firstName: z.string().min(1, "First Name is required."),
//     lastName: z.string().min(1, "Last Name is required."),
//     phoneNumber: z
//       .string()
//       .min(1, "Phone Number is required.")
//       .regex(/^\d+$/, "Phone Number must contain only digits.")
//       .length(10, "Phone Number must be exactly 10 digits."),
//     email: z.string().email("Email address is required."),
//     countryCode: z
//       .string()
//       .min(1, "Country Code is required.")
//       .refine((code) => countryCodeEnum.includes(code), {
//         message: "Invalid country code. Please select a valid country code.",
//       }),
//   });

//   const allEnhancements = useMemo(() => {
//     return selectedAmenities;
//   }, [JSON.stringify(selectedAmenities)]);

//   const ItemType = {
//     AMENITY: "Amenity",
//     ROOM_SERVICE: "RoomService",
//     FOOD: "Food",
//   };

//   useEffect(() => {
//     if (
//       booking?.additional_guests?.length > 0 &&
//       !hasInitializedGuests &&
//       additionalGuests.length === 0
//     ) {
//       console.log("Initializing guests from booking data...");

//       const formattedGuests = booking.additional_guests.map((guest) => ({
//         firstName: guest.firstname || "",
//         lastName: guest.lastname || "",
//         phoneNumber: guest.phonenumber || "",
//         email: guest.emailid || "",
//         countryCode: guest.countrycode || "+91",
//         country: guest.country
//           ? countries.find((c) => c.name === guest.country) || countries[0]
//           : countries[0],
//       }));

//       console.log("Formatted guests:", formattedGuests);

//       dispatch(initAdditionalGuests(formattedGuests));
//       setHasInitializedGuests(true);

//       const dropdownStates = {};
//       formattedGuests.forEach((_, index) => {
//         dropdownStates[index] = false;
//       });
//       setGuestDropdownStates(dropdownStates);
//     }
//   }, [booking, dispatch, hasInitializedGuests, additionalGuests.length]);

//   useEffect(() => {
//     if (additionalGuests.length > maxAdditionalGuests) {
//       const excess = additionalGuests.length - maxAdditionalGuests;
//       for (let i = 0; i < excess; i++) {
//         dispatch(removeAdditionalGuest(additionalGuests.length - 1 - i));
//       }
//       toast.warning(`Reduced additional guests to match room capacity`);
//     }
//   }, [maxAdditionalGuests, additionalGuests.length, dispatch]);

//   const handleAddAdditionalGuest = () => {
//     if (additionalGuests.length >= maxAdditionalGuests) {
//       toast.warning(`Maximum ${maxAdditionalGuests} additional guests allowed`);
//       return;
//     }

//     const newGuest = {
//       firstName: "",
//       lastName: "",
//       phoneNumber: "",
//       email: "",
//       countryCode: "+91",
//     };
//     dispatch(addAdditionalGuest(newGuest));
//     setEditingGuestIndex(additionalGuests.length);
//   };

//   const handleRemoveGuest = (index) => {
//     dispatch(removeAdditionalGuest(index));
//   };

//   useEffect(() => {
//     const totalGuests = 1 + additionalGuests.length;
//     const maxOccupancy = selectedRoom?.max_occupancy || 0;

//     if (totalGuests > maxOccupancy) {
//       const excess = totalGuests - maxOccupancy;
//       for (let i = 0; i < excess; i++) {
//         dispatch(removeAdditionalGuest(additionalGuests.length - 1 - i));
//       }
//       toast.warning(`Reduced additional guests to match room capacity`);
//     }
//   }, [selectedRoom?.max_occupancy, additionalGuests.length, dispatch]);

//   const compareAmenities = (currentAmenities = []) => {
//     const bookingEnhancements = booking?.enhancements || {};
//     const existingFood = bookingEnhancements.food?.items || [];
//     const existingAmenities = bookingEnhancements.amenities?.items || [];
//     const existingRoomService = bookingEnhancements.room_services?.items || [];

//     const allExisting = [
//       ...existingFood.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "food",
//         refundable: item.refundable === true,
//         originalQuantity: item.selected_quantity || 1,
//       })),
//       ...existingAmenities.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "amenity",
//         refundable: item.refundable === true,
//         originalQuantity: item.selected_quantity || 1,
//       })),
//       ...existingRoomService.map((item) => ({
//         id: item.id,
//         name: item.name,
//         price: item.base_price,
//         quantity: item.selected_quantity || 1,
//         totalPrice: item.base_price * (item.selected_quantity || 1),
//         type: "room_service",
//         refundable: item.refundable === true,
//         originalQuantity: item.selected_quantity || 1,
//       })),
//     ];

//     const safeCurrentAmenities = Array.isArray(currentAmenities)
//       ? currentAmenities
//       : [];

//     const modifiedAmenities = safeCurrentAmenities
//       .filter((selected) => {
//         const existing = allExisting.find((e) => e.id === selected.id);
//         return existing && existing.quantity !== selected.quantity;
//       })
//       .map((selected) => {
//         const existing = allExisting.find((e) => e.id === selected.id);
//         return {
//           ...selected,
//           originalQuantity: existing.quantity,
//           originalTotalPrice: existing.totalPrice,
//         };
//       });

//     const newAmenities = safeCurrentAmenities.filter(
//       (selected) => !allExisting.some((existing) => existing.id === selected.id)
//     );

//     const removedAmenities = allExisting.filter(
//       (existing) =>
//         !safeCurrentAmenities.some((selected) => selected.id === existing.id)
//     );

//     const unchangedAmenities = safeCurrentAmenities.filter((selected) => {
//       const existing = allExisting.find((e) => e.id === selected.id);
//       return existing && existing.quantity === selected.quantity;
//     });

//     const refundableChanges = modifiedAmenities
//       .filter(
//         (amenity) =>
//           amenity.refundable === true &&
//           amenity.quantity < amenity.originalQuantity
//       )
//       .map((amenity) => ({
//         ...amenity,
//         refundAmount:
//           amenity.price * (amenity.originalQuantity - amenity.quantity),
//       }));

//     const refundableRemovals = removedAmenities
//       .filter((amenity) => amenity.refundable === true)
//       .map((amenity) => ({
//         ...amenity,
//         refundAmount: amenity.totalPrice,
//       }));

//     return {
//       newAmenities,
//       removedAmenities,
//       modifiedAmenities,
//       unchangedAmenities,
//       allExisting,
//       refundableChanges: [...refundableChanges, ...refundableRemovals],
//     };
//   };
//   const RefundMessageComponent = () => {
//     const allAmenitiesFromRedux = useSelector((state) => {
//       const formAmenities = state.amenities?.selectedAmenities || [];

//       const booking = state.booking?.selectedBooking;
//       const bookingEnhancements = booking?.enhancements || {};

//       const bookingFoodItems = bookingEnhancements.food?.items || [];
//       const bookingAmenityItems = bookingEnhancements.amenities?.items || [];
//       const bookingRoomServiceItems =
//         bookingEnhancements.room_service?.items || [];

//       return [
//         ...formAmenities,
//         ...bookingFoodItems.map((item) => ({
//           id: item.id,
//           name: item.name,
//           price: item.base_price,
//           quantity: item.selected_quantity || 1,
//           totalPrice: item.base_price * (item.selected_quantity || 1),
//           type: "food",
//           refundable: item.refundable === true,
//         })),
//         ...bookingAmenityItems.map((item) => ({
//           id: item.id,
//           name: item.name,
//           price: item.base_price,
//           quantity: item.selected_quantity || 1,
//           totalPrice: item.base_price * (item.selected_quantity || 1),
//           type: "amenity",
//           refundable: item.refundable === true,
//         })),
//         ...bookingRoomServiceItems.map((item) => ({
//           id: item.id,
//           name: item.name,
//           price: item.base_price,
//           quantity: item.selected_quantity || 1,
//           totalPrice: item.base_price * (item.selected_quantity || 1),
//           type: "room_service",
//           refundable: item.refundable === true,
//         })),
//       ];
//     });

//     if (!previewData) return null;

//     const cancelledItems = previewData?.service_preview?.cancelled_items || [];
//     const refundAmount = previewData?.service_preview?.refund_amount || 0;
//     const financialPreviewType = previewData?.financial_preview_type || "";
//     const existingItems = previewData?.service_preview?.existing_items || [];
//     const servicePreview = previewData?.service_preview || {};

//     console.log("RefundMessageComponent - cancelledItems:", cancelledItems);
//     console.log(
//       "RefundMessageComponent - allAmenitiesFromRedux:",
//       allAmenitiesFromRedux
//     );
//     console.log("RefundMessageComponent - refundAmount:", refundAmount);

//     if (cancelledItems.length === 0 && refundAmount === 0) {
//       return null;
//     }

//     const isRecalculationViaDiscount =
//       financialPreviewType === "recalculation_via_discount";

//     const amountDueAfterPreview =
//       previewData?.combined?.amount_due_after_preview || 0;
//     const isFullyPaid = previewData?.is_paid || false;

//     if (cancelledItems.length === 0) {
//       return null;
//     }

//     const refundableItems = [];
//     const nonRefundableItems = [];

//     cancelledItems.forEach((item) => {
//       const itemId = item.type === "food" ? item.food_id : item.item_id;

//       const reduxAmenity = allAmenitiesFromRedux.find(
//         (a) =>
//           a.id === itemId ||
//           a.id?.toString() === itemId?.toString() ||
//           (item.type === "food" &&
//             a.type === "food" &&
//             a.id === item.food_id) ||
//           (item.type === "amenity" &&
//             a.type === "amenity" &&
//             a.id === item.item_id) ||
//           (item.type === "room_service" &&
//             a.type === "room_service" &&
//             a.id === item.item_id)
//       );

//       console.log(`Checking refundability for item:`, item);
//       console.log(`Redux amenity found:`, reduxAmenity);
//       console.log(`Redux refundable status:`, reduxAmenity?.refundable);

//       const isRefundable = reduxAmenity
//         ? reduxAmenity.refundable === true
//         : item.refundable_amount && item.refundable_amount > 0;

//       console.log(`Final isRefundable:`, isRefundable);

//       if (
//         isRefundable &&
//         item.refundable_amount &&
//         item.refundable_amount > 0
//       ) {
//         refundableItems.push({
//           ...item,
//           name: item.name || reduxAmenity?.name || `Item ${itemId}`,
//           isRefundable: true,
//           source: reduxAmenity ? "redux" : "api",
//         });
//       } else {
//         nonRefundableItems.push({
//           ...item,
//           name: item.name || reduxAmenity?.name || `Item ${itemId}`,
//           isRefundable: false,
//           source: reduxAmenity ? "redux" : "api",
//           reason: reduxAmenity
//             ? "Marked as non-refundable in reservation"
//             : "No refund amount specified",
//         });
//       }
//     });

//     const refundableAmount = refundableItems.reduce(
//       (sum, item) => sum + (item.refundable_amount || item.total_amount || 0),
//       0
//     );

//     const nonRefundableAmount = nonRefundableItems.reduce(
//       (sum, item) => sum + (item.total_amount || 0),
//       0
//     );

//     console.log("Refundable items:", refundableItems);
//     console.log("Non-refundable items:", nonRefundableItems);
//     console.log("Refundable amount:", refundableAmount);
//     console.log("Non-refundable amount:", nonRefundableAmount);

//     if (isFullyPaid && !isRecalculationViaDiscount && refundableAmount > 0) {
//       return (
//         <div className="bg-green-50 p-3 rounded-md mt-4 border border-green-100">
//           <div className="flex items-start">
//             <svg
//               className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <div>
//               <p className="text-gray-700 text-sm font-medium">
//                 Refundable Items Cancelled
//               </p>
//               {refundableItems.map((item, index) => (
//                 <div key={index} className="text-xs text-gray-600 mt-1">
//                   <div className="flex justify-between">
//                     <span>
//                       {item.type === "food"
//                         ? "Food"
//                         : item.type === "room_service"
//                         ? "Room Service"
//                         : "Amenity"}
//                       : {item.name}
//                       {item.quantity_cancelled > 1 &&
//                         ` (×${item.quantity_cancelled})`}
//                     </span>
//                     <span className="font-medium">
//                       ₹
//                       {item.refundable_amount?.toLocaleString("en-IN") ||
//                         item.total_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                   <div className="text-[10px] text-green-600 mt-0.5">
//                     Refundable as per booking policy
//                   </div>
//                 </div>
//               ))}

//               {nonRefundableItems.length > 0 && (
//                 <div className="mt-2">
//                   <p className="text-xs text-red-600 font-medium">
//                     Non-Refundable Items:
//                   </p>
//                   {nonRefundableItems.map((item, index) => (
//                     <div key={index} className="text-xs text-gray-600 mt-1">
//                       <div className="flex justify-between">
//                         <span>
//                           {item.type === "food"
//                             ? "Food"
//                             : item.type === "room_service"
//                             ? "Room Service"
//                             : "Amenity"}
//                           : {item.name}
//                           {item.quantity_cancelled > 1 &&
//                             ` (×${item.quantity_cancelled})`}
//                           <span className="text-red-500 ml-1">
//                             (Non-refundable)
//                           </span>
//                         </span>
//                         <span className="line-through">
//                           ₹{item.total_amount?.toLocaleString("en-IN")}
//                         </span>
//                       </div>
//                       <div className="text-[10px] text-red-500 mt-0.5">
//                         {item.reason}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <p className="text-xs text-gray-600 italic mt-1">
//                 (Refund of ₹{refundableAmount.toLocaleString("en-IN")} will be
//                 processed within 5–7 business days)
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (isRecalculationViaDiscount && refundableAmount > 0) {
//       return (
//         <div className="bg-blue-50 p-3 rounded-md mt-4 border border-blue-100">
//           <div className="flex items-start">
//             <svg
//               className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
//                 clipRule="evenodd"
//               />
//               <path d="M10 12h4a1 1 0 001-1V6a1 1 0 00-1-1h-4v7z" />
//             </svg>
//             <div>
//               <p className="text-gray-700 text-sm font-medium">
//                 Refund Adjustment Applied
//               </p>
//               <p className="text-xs text-gray-600 mt-1">
//                 The refund amount of ₹{refundableAmount.toLocaleString("en-IN")}{" "}
//                 has been adjusted against your total amount due.
//               </p>
//               {refundableItems.map((item, index) => (
//                 <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
//                   <div className="flex justify-between">
//                     <span>• {item.name}:</span>
//                     <span className="font-medium">
//                       ₹
//                       {item.refundable_amount?.toLocaleString("en-IN") ||
//                         item.total_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                   <div className="text-[10px] text-green-600 ml-1">
//                     Refundable
//                   </div>
//                 </div>
//               ))}

//               {nonRefundableItems.length > 0 && (
//                 <div className="mt-2">
//                   <p className="text-xs text-red-600 font-medium">
//                     Non-Refundable Items (not adjusted):
//                   </p>
//                   {nonRefundableItems.map((item, index) => (
//                     <div
//                       key={index}
//                       className="text-xs text-gray-600 mt-1 ml-2"
//                     >
//                       <div className="flex justify-between">
//                         <span>• {item.name}:</span>
//                         <span className="line-through">
//                           ₹{item.total_amount?.toLocaleString("en-IN")}
//                         </span>
//                       </div>
//                       <div className="text-[10px] text-red-500 ml-1">
//                         Non-refundable
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <p className="text-xs text-gray-600 italic mt-1">
//                 (No refund will be processed as the amount has been adjusted in
//                 your total)
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (nonRefundableItems.length > 0) {
//       return (
//         <div className="bg-red-50 p-3 rounded-md mt-4 border border-red-100">
//           <div className="flex items-start">
//             <svg
//               className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <div>
//               <p className="text-gray-700 text-sm font-medium">
//                 Non-Refundable Items Cancelled
//               </p>
//               <p className="text-xs text-gray-600 mt-1">
//                 The following items are non-refundable and will not be refunded:
//               </p>
//               {nonRefundableItems.map((item, index) => (
//                 <div key={index} className="text-xs text-gray-600 mt-1 ml-2">
//                   <div className="flex justify-between">
//                     <span>
//                       •{" "}
//                       {item.type === "food"
//                         ? "Food"
//                         : item.type === "room_service"
//                         ? "Room Service"
//                         : "Amenity"}
//                       :{item.name}
//                       {item.quantity_cancelled > 1 &&
//                         ` (×${item.quantity_cancelled})`}
//                     </span>
//                     <span className="line-through">
//                       ₹{item.total_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                   <div className="text-[10px] text-red-500 ml-1">
//                     {item.reason}
//                   </div>
//                 </div>
//               ))}

//               {refundableItems.length > 0 && (
//                 <div className="mt-2">
//                   <p className="text-xs text-green-600 font-medium">
//                     Refundable Items:
//                   </p>
//                   {refundableItems.map((item, index) => (
//                     <div
//                       key={index}
//                       className="text-xs text-gray-600 mt-1 ml-2"
//                     >
//                       <div className="flex justify-between">
//                         <span>• {item.name}:</span>
//                         <span className="font-medium">
//                           ₹{item.refundable_amount?.toLocaleString("en-IN")}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <p className="text-xs text-gray-500 italic mt-1">
//                 Non-refundable items are charged as per our cancellation policy
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (
//       refundableItems.length > 0 &&
//       !isFullyPaid &&
//       amountDueAfterPreview > 0
//     ) {
//       return (
//         <div className="bg-yellow-50 p-3 rounded-md mt-4 border border-yellow-100">
//           <div className="flex items-start">
//             <svg
//               className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <div>
//               <p className="text-gray-700 text-sm font-medium">
//                 Refundable Items Cancelled
//               </p>
//               <p className="text-xs text-gray-600 mt-1">
//                 The refund amount will be adjusted against your outstanding
//                 balance.
//               </p>
//               {refundableItems.map((item, index) => (
//                 <div key={index} className="text-xs text-gray-600 mt-1">
//                   <div className="flex justify-between">
//                     <span>
//                       {item.type === "food"
//                         ? "Food"
//                         : item.type === "room_service"
//                         ? "Room Service"
//                         : "Amenity"}
//                       :{item.name}
//                     </span>
//                     <span className="font-medium">
//                       ₹{item.refundable_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               <p className="text-xs text-gray-600 italic mt-1">
//                 Total refundable amount: ₹
//                 {refundableAmount.toLocaleString("en-IN")}
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     return null;
//   };
//   const calculatePreviousAmenitiesTotal = () => {
//     if (!booking) return 0;

//     let totalAmount = 0;

//     if (booking.enhancements) {
//       const { food, amenities, room_services } = booking.enhancements;

//       if (food?.items?.length > 0) {
//         food.items.forEach((item) => {
//           totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
//         });
//       }

//       if (amenities?.items?.length > 0) {
//         amenities.items.forEach((item) => {
//           totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
//         });
//       }

//       if (room_services?.items?.length > 0) {
//         room_services.items.forEach((item) => {
//           totalAmount += (item.base_price || 0) * (item.selected_quantity || 1);
//         });
//       }
//     }

//     if (booking.enhancements_detailed) {
//       const { food, amenities, room_services } = booking.enhancements_detailed;

//       if (food?.items?.length > 0) {
//         food.items.forEach((item) => {
//           totalAmount += item.total_amount || 0;
//         });
//       }

//       if (amenities?.items?.length > 0) {
//         amenities.items.forEach((item) => {
//           totalAmount += item.total_amount || 0;
//         });
//       }

//       if (room_services?.items?.length > 0) {
//         room_services.items.forEach((item) => {
//           totalAmount += item.total_amount || 0;
//         });
//       }
//     }

//     return totalAmount;
//   };

//   const calculatePreviousAmenitiesTaxForUi = () => {
//     if (!booking) return 0;

//     let totalTax = 0;

//     if (booking.enhancements) {
//       const { food, amenities, room_services } = booking.enhancements;

//       if (food?.total?.tax_amount) {
//         totalTax += food.total.tax_amount;
//       }

//       if (amenities?.total?.tax_amount) {
//         totalTax += amenities.total.tax_amount;
//       }

//       if (room_services?.total?.tax_amount) {
//         totalTax += room_services.total.tax_amount;
//       }
//     }

//     if (booking.enhancements_detailed) {
//       const { food, amenities, room_services } = booking.enhancements_detailed;

//       if (food?.items?.length > 0) {
//         food.items.forEach((item) => {
//           totalTax += item.tax_amount || 0;
//         });
//       }

//       if (amenities?.items?.length > 0) {
//         amenities.items.forEach((item) => {
//           totalTax += item.tax_amount || 0;
//         });
//       }

//       if (room_services?.items?.length > 0) {
//         room_services.items.forEach((item) => {
//           totalTax += item.tax_amount || 0;
//         });
//       }
//     }

//     return totalTax;
//   };
//   const formatPhoneNumber = (phoneNumber, countryCode) => {
//     if (!phoneNumber || !countryCode) return phoneNumber;
//     return `${countryCode}${phoneNumber}`;
//   };

//   const selected = useSelector(
//     (state) => state.amenities?.selectedAmenities || []
//   );

//   const formatLocalDate = (dateString) => {
//     if (!dateString) return null;
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   const fetchModificationPreview = async () => {
//     if (!booking?.bookingid) return null;

//     try {
//       const accessToken = Cookies.get("access_token");
//       const bookingId = booking.bookingid;
//       const newRoomTypeName = selectedRoom?.roomtypename;
//       const newCheckinDate = checkInDate || booking?.checkindate;
//       const newCheckoutDate = checkOutDate || booking?.checkoutdate;

//       const requestBody = {
//         new_checkin_date: formatLocalDate(newCheckinDate),
//         new_checkout_date: formatLocalDate(newCheckoutDate),
//         new_room_type_name: newRoomTypeName || null,
//         amenities: [],
//         room_services: [],
//         food_orders: [],
//       };

//       selectedAmenities.forEach((amenity) => {
//         const baseItem = {
//           itemid: amenity.id,
//           quantity: amenity.quantity,
//           urgencylevel: "Normal",
//           scheduledtime: new Date().toISOString(),
//           specialinstructions: "",
//         };

//         if (amenity.type === "food") {
//           if (!requestBody.food_orders.some((fo) => fo.item_type === "food")) {
//             requestBody.food_orders.push({
//               item_type: "food",
//               items: [],
//             });
//           }
//           requestBody.food_orders[0].items.push({
//             foodid: amenity.id,
//             quantity: amenity.quantity,
//           });
//         } else if (amenity.type === "room_service") {
//           requestBody.room_services.push({
//             ...baseItem,
//             item_type: "room_service",
//           });
//         } else {
//           requestBody.amenities.push({
//             ...baseItem,
//             item_type: "amenity",
//           });
//         }
//       });

//       if (requestBody.amenities.length === 0) delete requestBody.amenities;
//       if (requestBody.room_services.length === 0)
//         delete requestBody.room_services;
//       if (requestBody.food_orders.length === 0) delete requestBody.food_orders;

//       console.log(
//         "Preview API Request Body (with zero quantities):",
//         JSON.stringify(requestBody, null, 2)
//       );

//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/modify/${bookingId}/preview`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
//           },
//           body: JSON.stringify(requestBody),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Failed to fetch preview");
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Preview API error:", error);
//       throw error;
//     }
//   };

//   const loadPreviewData = async () => {
//     if (!booking?.bookingid) return;

//     setIsLoadingPreview(true);
//     setPreviewError(null);

//     try {
//       const previewResponse = await fetchModificationPreview();

//       if (previewResponse && previewResponse.status === "success") {
//         setPreviewData(previewResponse.data);
//       } else {
//         throw new Error("Invalid preview response");
//       }
//     } catch (error) {
//       console.error("Error loading preview:", error);
//       setPreviewError(error.message);
//       toast.error("Failed to load price preview. Please try again.");
//     } finally {
//       setIsLoadingPreview(false);
//     }
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       loadPreviewData();
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [
//     booking?.bookingid,
//     selectedRoom?.roomtypename,
//     checkInDate,
//     checkOutDate,
//     JSON.stringify(selectedAmenities),
//   ]);

//   const getPreviewValue = (path, defaultValue = 0) => {
//     if (!previewData) return defaultValue;

//     const paths = path.split(".");
//     let value = previewData;

//     for (const p of paths) {
//       if (value && typeof value === "object" && p in value) {
//         value = value[p];
//       } else {
//         return defaultValue;
//       }
//     }

//     return value || defaultValue;
//   };

//   const previewPrices = useMemo(() => {
//     if (!previewData) {
//       return {
//         roomBasePrice: 0,
//         roomTaxAmount: 0,
//         roomServiceFee: 0,
//         roomFinalAmount: 0,
//         totalDeltaBase: 0,
//         fixedCurrentTax: 0,
//         totalDeltaTax: 0,
//         totalServiceFee: 0,
//         totalRefund: 0,
//         netFinancialImpact: 0,
//         amountPaid: 0,
//         currentTotal: 0,
//         amountDueAfterPreview: 0,
//         currentDueBeforePreview: 0,
//         projectedTotalAfterPreview: 0,
//         modificationType: "",
//         oldTotal: 0,
//         newTotal: 0,
//         priceDifference: 0,
//         finalPriceDifference: 0,
//         serviceDeltaBase: 0,
//         serviceDeltaTax: 0,
//         serviceRefundAmount: 0,
//         serviceNetImpact: 0,
//         serviceFeeHistorical: 0,
//         serviceFeeTotalAllModifications: 0,
//         redzone: {},
//         policy: {},
//         oldBreakdown: [],
//         newBreakdown: [],
//         cancelledItems: [],
//         newItems: [],
//         isPaid: false,
//       };
//     }

//     const getPreviewValue = (path, defaultValue = 0) => {
//       const paths = path.split(".");
//       let value = previewData;

//       for (const p of paths) {
//         if (value && typeof value === "object" && p in value) {
//           value = value[p];
//         } else {
//           return defaultValue;
//         }
//       }

//       return value || defaultValue;
//     };

//     return {
//       roomBasePrice: getPreviewValue(
//         "room_preview.room_details.new_room_base_total",
//         0
//       ),
//       roomTaxAmount: getPreviewValue(
//         "room_preview.room_details.new_room_tax_total",
//         0
//       ),
//       roomServiceFee: getPreviewValue(
//         "room_preview.price_details.service_fee",
//         0
//       ),
//       roomFinalAmount: getPreviewValue(
//         "room_preview.room_details.new_room_final_total",
//         0
//       ),
//       totalDeltaBase: getPreviewValue("combined.total_delta_base", 0),
//       fixedCurrentTax: getPreviewValue("combined.fixed_current_tax", 0),
//       totalDeltaTax: getPreviewValue("combined.total_delta_tax", 0),
//       totalServiceFee: getPreviewValue("combined.total_service_fee", 0),
//       totalRefund: getPreviewValue("combined.total_refund", 0),
//       netFinancialImpact: getPreviewValue("combined.net_financial_impact", 0),
//       amountPaid: getPreviewValue("combined.amount_paid", 0),
//       currentTotal: getPreviewValue("combined.fixed_current_total", 0),
//       amountDueAfterPreview: getPreviewValue(
//         "combined.amount_due_after_preview",
//         0
//       ),
//       currentDueBeforePreview: getPreviewValue(
//         "combined.current_due_before_preview",
//         0
//       ),
//       projectedTotalAfterPreview: getPreviewValue(
//         "combined.projected_total_after_preview",
//         0
//       ),
//       modificationType: getPreviewValue("room_preview.modification_type", ""),
//       oldTotal: getPreviewValue("room_preview.old_total", 0),
//       newTotal: getPreviewValue("room_preview.new_total", 0),
//       priceDifference: getPreviewValue("room_preview.price_difference", 0),
//       finalPriceDifference: getPreviewValue(
//         "room_preview.final_price_difference",
//         0
//       ),
//       serviceDeltaBase: getPreviewValue("service_preview.delta_base", 0),
//       serviceDeltaTax: getPreviewValue("service_preview.delta_tax", 0),
//       serviceRefundAmount: getPreviewValue("service_preview.refund_amount", 0),
//       serviceNetImpact: getPreviewValue("service_preview.net_impact", 0),
//       serviceFeeHistorical: getPreviewValue(
//         "room_preview.service_fee_historical",
//         0
//       ),
//       serviceFeeTotalAllModifications: getPreviewValue(
//         "room_preview.service_fee_total_all_modifications",
//         0
//       ),
//       redzone: getPreviewValue("redzone", {}),
//       policy: getPreviewValue("policy", {}),
//       oldBreakdown: getPreviewValue("room_preview.breakdown_old", []),
//       newBreakdown: getPreviewValue("room_preview.breakdown_new", []),
//       cancelledItems: getPreviewValue("service_preview.cancelled_items", []),
//       newItems: getPreviewValue("service_preview.new_items", []),
//       isPaid: getPreviewValue("is_paid", false),
//     };
//   }, [previewData]);

//   const isAfterCutoff = previewPrices.redzone?.level === "modification_closed";
//   const isWithin24Hours = previewPrices.redzone?.level === "restricted_window";
//   const hasRefund = previewPrices.totalRefund > 0;
//   const hasAmountDue = previewPrices.amountDueAfterPreview > 0;
//   const totalTaxAmount = previewPrices.totalDeltaTax;
//   const totalServiceFee = previewPrices.totalServiceFee;
//   const totalFinalAmount = booking?.total_final_amount;

//   const previousAmenitiesTotal = calculatePreviousAmenitiesTotal();
//   const previousAmenitiesTaxForUi = calculatePreviousAmenitiesTaxForUi();
//   const originalRoomPrice = booking?.final_amount || 0;
//   const originalTaxAmount = booking?.tax_amount || 0;
//   const originalServiceFee = booking?.service_fee || 0;

//   const refundCalculations = useMemo(() => {
//     if (!previewData)
//       return {
//         roomRefund: 0,
//         amenitiesRefund: 0,
//         totalRefund: 0,
//         shouldShowRefund: false,
//         refundableChanges: [],
//         financialPreviewType: "",
//       };

//     const isDowngrade =
//       previewData?.room_preview?.modification_type === "downgrade";
//     const hasRoomRefund =
//       isDowngrade && previewData?.room_preview?.final_price_difference > 0;

//     const roomRefund = hasRoomRefund
//       ? previewData.room_preview.final_price_difference
//       : 0;

//     const amenitiesRefund = previewData?.service_preview?.refund_amount || 0;

//     const totalRefund = roomRefund + amenitiesRefund;
//     const shouldShowRefund = totalRefund > 0;
//     const financialPreviewType = previewData?.financial_preview_type || "";

//     return {
//       roomRefund,
//       amenitiesRefund,
//       totalRefund,
//       shouldShowRefund,
//       refundableChanges: previewData?.service_preview?.cancelled_items || [],
//       isDowngrade,
//       modificationType: previewData?.room_preview?.modification_type || "",
//       financialPreviewType,
//     };
//   }, [previewData]);

//   useEffect(() => {
//     const {
//       roomRefund,
//       amenitiesRefund,
//       amenitiesTaxRefund,
//       totalRefund,
//       shouldShowRefund,
//       refundableChanges,
//     } = refundCalculations;

//     if (shouldShowRefund) {
//       setIsDowngradeRefund(true);
//       setRefundDetails({
//         base_refund: roomRefund,
//         amenities_refund: amenitiesRefund,
//         amenities_tax_refund: amenitiesTaxRefund,
//         service_fee: totalServiceFee,
//         cancellation_charges: 0,
//         final_refund: totalRefund - totalServiceFee,
//         currency: "INR",
//       });

//       if (amenitiesRefund > 0) {
//         setAmenitiesRefundDetails({
//           base_refund: amenitiesRefund,
//           tax_refund: amenitiesTaxRefund,
//           total_refund: amenitiesRefund + amenitiesTaxRefund,
//           currency: "INR",
//         });
//       } else {
//         setAmenitiesRefundDetails(null);
//       }
//     } else {
//       setIsDowngradeRefund(false);
//       setRefundDetails(null);
//       setAmenitiesRefundDetails(null);
//     }
//   }, [refundCalculations, totalServiceFee]);

//   const updateBookingFull = async (bookingId, guestData) => {
//     try {
//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/guest/${bookingId}/details`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify({
//             guest_details: {
//               firstname: guestData.firstName,
//               lastname: guestData.lastName,
//               emailid: guestData.email,
//               countrycode: guestData.countryCode,
//               phonenumber: guestData.phoneNumber,
//               clienttype: guestData.clientType,
//               date_of_birth: guestData.date_of_birth || null,
//               preferred_payment_method:
//                 guestData.preferred_payment_method || "",
//               is_senior: guestData.is_senior || false,
//               country: selectedCountry.name,
//             },
//             booking_guests: guestData.additionalGuests.map((guest) => ({
//               firstname: guest.firstName,
//               lastname: guest.lastName,
//               emailid: guest.email || "user@example.com",
//               countrycode: guest.countryCode || "+91",
//               phonenumber: guest.phoneNumber || "",
//               clienttype: guest.clientType || "Leisure",
//               country: guest.country?.name || selectedCountry.name,
//             })),
//             booking_details: {
//               number_of_guests: guestData.totalGuests,
//               special_requests: guestData.specialRequest || "",
//               remark: guestData.remark || "",
//               booking_type: guestData.booking_type || "Walk In",
//               country: selectedCountry.name,
//             },
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.message ||
//             "We were unable to process your modification request at the moment. Your reservation is still secure. Please try again later."
//         );
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Full update error:", error);
//       throw error;
//     }
//   };
//   const modifyBookingDetails = async (
//     bookingId,
//     newRoomTypeName,
//     newCheckinDate,
//     newCheckoutDate
//   ) => {
//     try {
//       const params = new URLSearchParams();

//       if (newRoomTypeName) params.append("new_room_type_name", newRoomTypeName);

//       if (newCheckinDate) {
//         params.append("new_checkin_date", formatLocalDate(newCheckinDate));
//       }

//       if (newCheckoutDate) {
//         params.append("new_checkout_date", formatLocalDate(newCheckoutDate));
//       }

//       const url = `${CQ_BASE_URL}/bq/api/modify/${bookingId}/modify?${params.toString()}`;

//       console.log("Calling modify API:", url);

//       const response = await fetch(url, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: "",
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         const errorMessage =
//           errorData.detail ||
//           errorData.message ||
//           "We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.";

//         throw new Error(errorMessage);
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Modify booking error:", error);
//       throw error;
//     }
//   };
//   const updateSmartReservation = async (bookingId, selectedAmenities) => {
//     try {
//       const amenities = [];
//       const roomServices = [];
//       const foodOrders = [];

//       selectedAmenities.forEach((amenity) => {
//         const baseItem = {
//           itemid: amenity.id,
//           quantity: amenity.quantity,
//           urgencylevel: "Normal",
//           scheduledtime: new Date().toISOString(),
//           specialinstructions: "",
//         };

//         if (amenity.type === "food") {
//           foodOrders.push({
//             item_type: "food",
//             items: [
//               {
//                 foodid: amenity.id,
//                 quantity: amenity.quantity,
//               },
//             ],
//           });
//         } else if (amenity.type === "room_service") {
//           roomServices.push({
//             ...baseItem,
//             item_type: "room_service",
//           });
//         } else {
//           amenities.push({
//             ...baseItem,
//             item_type: "amenity",
//           });
//         }
//       });

//       const requestBody = {
//         bookingid: bookingId,
//         billing_type: "Enhance stay modification",
//       };

//       if (amenities.length > 0) {
//         requestBody.amenities = amenities;
//       }
//       if (roomServices.length > 0) {
//         requestBody.room_services = roomServices;
//       }
//       if (foodOrders.length > 0) {
//         requestBody.food_orders = foodOrders;
//       }

//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/update-smart-reservation`,
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(requestBody),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.message ||
//             "We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later."
//         );
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Smart reservation error:", error);
//       throw error;
//     }
//   };

//   const getUnpaidBillingIds = async (orderId) => {
//     try {
//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/guest/billing-summary/?order_id=${orderId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.message ||
//             "We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later."
//         );
//       }
//       const data = await response.json();

//       setUnpaidBillingDetails({
//         totalPaid: data.payment_summary.total_paid,
//         totalDue: data.payment_summary.total_due,
//         unpaidBillingIds: data.payment_summary.unpaid_billing_ids,
//       });

//       return data;
//     } catch (error) {
//       console.error("Get unpaid billing error:", error);
//       throw error;
//     }
//   };
//   const storeBookingData = () => {
//     try {
//       const bookingData = {
//         bookingId: booking?.bookingid || localStorage.getItem("reservationId"),
//         orderId: booking?.orderid || localStorage.getItem("orderId"),
//         guestDetails: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
//         },
//         bookingDetails: {
//           roomType: selectedRoom?.roomtypename || booking?.room_type,
//           checkInDate: checkInDate || booking?.checkindate,
//           checkOutDate: checkOutDate || booking?.checkoutdate,
//           numberOfGuests: 1 + additionalGuests.length,
//           specialRequest,
//           daysCount,
//         },
//         amenities: {
//           selectedAmenities: selectedAmenities.map((amenity) => ({
//             id: amenity.id,
//             name: amenity.name,
//             price: amenity.price,
//             quantity: amenity.quantity,
//             totalPrice: amenity.totalPrice,
//             type: amenity.type,
//             value: amenity.value,
//             value_type: amenity.value_type,
//             refundable: amenity.refundable,
//           })),
//           currentState: {
//             quantity: selectedAmenities.reduce(
//               (sum, amenity) => sum + amenity.quantity,
//               0
//             ),
//             totalAmount: selectedAmenities.reduce(
//               (sum, amenity) => sum + amenity.totalPrice,
//               0
//             ),
//             refundableAmount: selectedAmenities
//               .filter((amenity) => amenity.refundable === true)
//               .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
//             nonRefundableAmount: selectedAmenities
//               .filter((amenity) => amenity.refundable !== true)
//               .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
//           },
//         },
//         financialData: {
//           previewData,
//           refundCalculations,
//           previewPrices,
//           financialPreviewType:
//             previewData?.room_preview?.financial_preview_type || "",
//           isAdjustment:
//             previewData?.room_preview?.financial_preview_type ===
//             "recalculation_via_discount",
//           adjustmentAmount:
//             previewData?.room_preview?.financial_preview_type ===
//             "recalculation_via_discount"
//               ? refundCalculations.totalRefund
//               : 0,
//           refundAmount:
//             previewData?.room_preview?.financial_preview_type !==
//             "recalculation_via_discount"
//               ? refundCalculations.totalRefund
//               : 0,
//         },
//         apiResponses: {
//           previewResponse: previewData,
//           timestamp: new Date().toISOString(),
//         },
//         currentState: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber,
//           countryCode,
//           clientType,
//           isCorporateGuest,
//           additionalGuests,
//           specialRequest,
//           selectedCountry: selectedCountry.name,
//         },
//       };

//       localStorage.setItem("bookingData", JSON.stringify(bookingData));
//       console.log("Booking data stored successfully:", bookingData);
//     } catch (error) {
//       console.error("Error storing booking data:", error);
//     }
//   };

//   const storePaymentVerification = (
//     paymentId,
//     orderId,
//     signature,
//     status,
//     amount,
//     billingIds,
//     bookingId
//   ) => {
//     try {
//       const paymentRecord = {
//         razorpay_payment_id: paymentId,
//         razorpay_order_id: orderId,
//         razorpay_signature: signature,
//         status: status,
//         amount: amount,
//         billing_ids: billingIds,
//         booking_id: bookingId,
//         timestamp: new Date().toISOString(),
//         verified: status === "success",
//       };

//       localStorage.setItem(
//         "payment_verification",
//         JSON.stringify(paymentRecord)
//       );
//       console.log("Payment verification stored in localStorage");
//       return true;
//     } catch (error) {
//       console.error("Error storing payment verification:", error);
//       return false;
//     }
//   };
//   const handleBooking = async () => {
//     if (!isAcknowledged) {
//       setCheckboxError(true);
//       toast.error("Please acknowledge the terms and conditions to proceed");
//       return;
//     }

//     if (!email || email.trim() === "") {
//       toast.error("Email address is required to proceed with the modification");
//       return;
//     }

//     const totalGuests = 1 + additionalGuests.length;

//     if (totalGuests === 2 && additionalGuests.length === 0) {
//       setReservationError({
//         detail: {
//           title: "Additional Guest Information Required",
//           message:
//             "For 2 guests staying in the room, we require complete information for both guests as per hotel policy and government regulations.",
//           details: [
//             "✓ Primary guest information is complete",
//             "✗ Additional guest information is missing",
//             "✓ Room capacity allows for 2 guests",
//           ],
//           missingGuests: 1,
//           actionRequired:
//             "Please add information for 1 additional guest to proceed with the reservation.",
//         },
//       });
//       setReservationPopupOpen(true);
//       setIsLoading(false);

//       storeBookingData();
//       return;
//     }

//     const incompleteAdditionalGuests = additionalGuests.filter(
//       (guest) => !guest.firstName?.trim() || !guest.lastName?.trim()
//     );

//     if (incompleteAdditionalGuests.length > 0) {
//       setReservationError({
//         detail: {
//           title: "Additional Guest Information Required",
//           message:
//             "Please complete all required fields for additional guests before proceeding.",
//           details: [
//             "✓ Primary guest information is complete",
//             "✗ Additional guest information is incomplete",
//             "✓ Room capacity allows for additional guests",
//           ],
//           missingGuests: incompleteAdditionalGuests.length,
//           actionRequired: `Please complete information for ${incompleteAdditionalGuests.length} additional guest(s).`,
//         },
//       });
//       setReservationPopupOpen(true);
//       setIsLoading(false);

//       storeBookingData();
//       return;
//     }

//     setIsLoading(true);
//     setCheckboxError(false);

//     let fullUpdateResponse = null;
//     let modificationResponse = null;
//     let smartReservationResponse = null;

//     try {
//       const bookingId =
//         booking?.bookingid || localStorage.getItem("reservationId");
//       const orderId = booking?.orderid || localStorage.getItem("orderId");

//       if (!bookingId || !orderId) {
//         throw new Error("Booking information not found");
//       }

//       const guestData = {
//         firstName,
//         lastName,
//         email,
//         phoneNumber,
//         countryCode,
//         clientType,
//         additionalGuests: additionalGuests.map((g) => ({
//           firstName: g.firstName || "",
//           lastName: g.lastName || "",
//           phoneNumber: g.phoneNumber || "",
//           email: g.email || "user@example.com",
//           countryCode: g.countryCode || "+91",
//           country: g.country?.name || selectedCountry.name,
//         })),
//         totalGuests: 1 + additionalGuests.length,
//         specialRequest,
//         country: selectedCountry.name,
//         date_of_birth: booking?.primary_guest?.date_of_birth || null,
//         preferred_payment_method:
//           booking?.primary_guest?.preferred_payment_method || "",
//         is_senior: booking?.primary_guest?.is_senior || false,
//         remark: "",
//         booking_type: booking?.booking_type || "Walk In",
//       };

//       const needsModification =
//         (selectedRoom && booking?.room_type !== selectedRoom.roomtypename) ||
//         (checkInDate && booking?.checkindate !== checkInDate) ||
//         (checkOutDate && booking?.checkoutdate !== checkOutDate);

//       storeBookingData();

//       fullUpdateResponse = await updateBookingFull(bookingId, guestData);
//       console.log("Full update response:", fullUpdateResponse);

//       if (needsModification) {
//         modificationResponse = await modifyBookingDetails(
//           bookingId,
//           selectedRoom?.roomtypename,
//           checkInDate,
//           checkOutDate
//         );
//         console.log("Modification response:", modificationResponse);

//         if (modificationResponse && modificationResponse.success === false) {
//           throw new Error(
//             modificationResponse.message || "Modification failed"
//           );
//         }
//       }

//       if (selectedAmenities.length > 0) {
//         smartReservationResponse = await updateSmartReservation(
//           bookingId,
//           selectedAmenities
//         );
//         console.log("Smart reservation response:", smartReservationResponse);
//       }

//       const billingDetails = await getUnpaidBillingIds(orderId);
//       console.log("Unpaid billing details:", billingDetails);

//       if (
//         !billingDetails.success ||
//         !billingDetails.payment_summary?.unpaid_billing_ids
//       ) {
//         throw new Error("Failed to get unpaid billing information");
//       }

//       const unpaidBillingIds =
//         billingDetails.payment_summary.unpaid_billing_ids;

//       localStorage.setItem(
//         "unpaidBillingIds",
//         JSON.stringify(unpaidBillingIds)
//       );

//       const bookingData = {
//         bookingId,
//         orderId,
//         guestDetails: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
//         },
//         bookingDetails: {
//           roomType: selectedRoom?.roomtypename || booking?.room_type,
//           checkInDate: checkInDate || booking?.checkindate,
//           checkOutDate: checkOutDate || booking?.checkoutdate,
//           numberOfGuests: 1 + additionalGuests.length,
//           specialRequest,
//         },
//         amenities: {
//           selectedAmenities: selectedAmenities.map((amenity) => ({
//             id: amenity.id,
//             name: amenity.name,
//             price: amenity.price,
//             quantity: amenity.quantity,
//             totalPrice: amenity.totalPrice,
//             type: amenity.type,
//             value: amenity.value,
//             value_type: amenity.value_type,
//             refundable: amenity.refundable,
//           })),
//           currentState: {
//             quantity: selectedAmenities.reduce(
//               (sum, amenity) => sum + amenity.quantity,
//               0
//             ),
//             totalAmount: selectedAmenities.reduce(
//               (sum, amenity) => sum + amenity.totalPrice,
//               0
//             ),
//             refundableAmount: selectedAmenities
//               .filter((amenity) => amenity.refundable === true)
//               .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
//             nonRefundableAmount: selectedAmenities
//               .filter((amenity) => amenity.refundable !== true)
//               .reduce((sum, amenity) => sum + amenity.totalPrice, 0),
//           },
//         },
//         financialData: {
//           previewData,
//           refundCalculations,
//           previewPrices,
//           financialPreviewType:
//             previewData?.room_preview?.financial_preview_type || "",
//           isAdjustment:
//             previewData?.room_preview?.financial_preview_type ===
//             "recalculation_via_discount",
//           adjustmentAmount:
//             previewData?.room_preview?.financial_preview_type ===
//             "recalculation_via_discount"
//               ? refundCalculations.totalRefund
//               : 0,
//           refundAmount:
//             previewData?.room_preview?.financial_preview_type !==
//             "recalculation_via_discount"
//               ? refundCalculations.totalRefund
//               : 0,
//           amountDueAfterPreview: previewPrices.amountDueAfterPreview || 0,
//           totalServiceFee: previewPrices.totalServiceFee || 0,
//         },
//         paymentDetails: {
//           unpaidBillingIds: billingDetails.payment_summary.unpaid_billing_ids,
//           totalDue: billingDetails.payment_summary.total_due,
//           totalTax: billingDetails.payment_summary.total_tax,
//           fullyPaid: billingDetails.payment_summary.fully_paid,
//         },
//         apiResponses: {
//           fullUpdate: fullUpdateResponse,
//           modification: modificationResponse,
//           smartReservation: smartReservationResponse,
//           billingDetails: billingDetails,
//           previewData: previewData,
//         },
//         currentState: {
//           firstName,
//           lastName,
//           email,
//           phoneNumber,
//           countryCode,
//           clientType,
//           isCorporateGuest,
//           additionalGuests: additionalGuests.map((g) => ({
//             firstName: g.firstName,
//             lastName: g.lastName,
//             phoneNumber: g.phoneNumber,
//             email: g.email,
//             countryCode: g.countryCode,
//             country: g.country?.name,
//           })),
//           specialRequest,
//           selectedCountry: selectedCountry.name,
//           isAcknowledged,
//           checkboxError,
//         },
//         timestamp: new Date().toISOString(),
//       };

//       localStorage.setItem("bookingData", JSON.stringify(bookingData));
//       console.log("Booking data stored successfully after API calls");

//       setReservationMessage(
//         `Booking ${
//           needsModification ? "modified" : "updated"
//         } successfully! Reservation ID: ${bookingId}`
//       );
//       setReservationError("");
//       setReservationPopupOpen(true);

//       storeBookingData();
//     } catch (error) {
//       console.error("Booking Update Error:", error);

//       storeBookingData();

//       let errorMessage =
//         "We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later.";

//       if (
//         error.message &&
//         error.message !==
//           "We were unable to process your modification request at the moment.Your reservation is still secure, Please try again later."
//       ) {
//         errorMessage = `${errorMessage}\n\n  ${error.message}`;
//       }

//       const isAdjustment =
//         previewData?.room_preview?.financial_preview_type ===
//         "recalculation_via_discount";
//       const adjustmentAmount = refundCalculations.totalRefund;

//       if (isAdjustment && adjustmentAmount > 0) {
//         setReservationError({
//           adjustment: {
//             message: errorMessage,
//             adjustmentAmount: adjustmentAmount,
//             note: "This is an adjustment amount. No refund will be processed.",
//           },
//         });
//       } else {
//         setReservationError(errorMessage);
//       }

//       setReservationPopupOpen(true);
//       toast.error(`Update failed: ${error.message || errorMessage}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePaymentOption = async (paymentMethod) => {
//     if (!razorpayLoaded) {
//       toast.error("Razorpay script is not loaded yet.");
//       return;
//     }

//     const unpaidBillingIds = JSON.parse(
//       localStorage.getItem("unpaidBillingIds") || []
//     );
//     if (unpaidBillingIds.length === 0) {
//       toast.error("No unpaid billing information available. Please try again.");
//       return;
//     }

//     if (paymentMethod === "payNow") {
//       try {
//         setIsProcessing(true);
//         const bookingId =
//           booking?.bookingid || localStorage.getItem("reservationId");

//         const totalAmount =
//           previewPrices.amountDueAfterPreview ||
//           (previewData ? previewPrices.projectedTotalAfterPreview : 0);

//         const apiUrl = `${CQ_BASE_URL}/bq/api/razorpay/create_payment_order_multiple?bookingid=${bookingId}`;

//         const response = await fetch(apiUrl, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           body: JSON.stringify(unpaidBillingIds),
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
//           const options = {
//             key: RAZORPAY_KEY,
//             amount: Math.round(totalAmount * 100),
//             currency: "INR",
//             name: "Pagoda Hotel",
//             description: "Hotel Reservation Payment",
//             order_id: orderData.razorpay_order_id,
//             handler: async function (response) {
//               const paymentDetails = {
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 billing_ids: unpaidBillingIds,
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
//                   }
//                 );

//                 if (!verificationResponse.ok) {
//                   storePaymentVerification(
//                     response.razorpay_payment_id,
//                     response.razorpay_order_id,
//                     response.razorpay_signature,
//                     "verification_failed",
//                     0,
//                     unpaidBillingIds,
//                     bookingId
//                   );
//                   throw new Error("Payment verification failed");
//                 }

//                 const verificationData = await verificationResponse.json();

//                 if (verificationData.status === "success") {
//                   storePaymentVerification(
//                     response.razorpay_payment_id,
//                     response.razorpay_order_id,
//                     response.razorpay_signature,
//                     "success",
//                     totalAmount,
//                     unpaidBillingIds,
//                     bookingId
//                   );
//                   await Promise.all(
//                     unpaidBillingIds.map((billingId) =>
//                       fetch(`${CQ_BASE_URL}/bq/api/update-billing-status`, {
//                         method: "POST",
//                         headers: {
//                           "Content-Type": "application/json",
//                         },
//                         body: JSON.stringify({
//                           billing_id: billingId,
//                           status: "paid",
//                           payment_method: "razorpay",
//                           payment_reference: response.razorpay_payment_id,
//                         }),
//                       })
//                     )
//                   );

//                   window.location.href = "/modification-succesful";
//                 } else {
//                   toast.error(
//                     "Payment verification failed. Please contact support."
//                   );
//                 }
//               } catch (error) {
//                 console.error("Verification error:", error);
//                 storePaymentVerification(
//                   response.razorpay_payment_id,
//                   response.razorpay_order_id,
//                   response.razorpay_signature,
//                   "error",
//                   0,
//                   unpaidBillingIds,
//                   bookingId
//                 );
//                 toast.error("Error verifying payment. Please try again.");
//               } finally {
//                 setIsProcessing(false);
//               }
//             },
//             prefill: {
//               name: `${firstName} ${lastName}`,
//               email: email,
//               contact: formatPhoneNumber(phoneNumber, countryCode),
//             },
//             theme: {
//               color: "#3399cc",
//             },
//             notes: {
//               bookingId: bookingId,
//               billingIds: unpaidBillingIds.join(","),
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
//     } else if (isCorporateGuest) {
//       try {
//         setIsProcessing(true);
//         toast.info("Booking will be billed to your company.");
//         window.location.href = "/modification-succesful";
//       } catch (error) {
//         toast.error("Error processing corporate billing. Please try again.");
//       } finally {
//         setIsProcessing(false);
//       }
//     } else {
//       try {
//         setIsProcessing(true);
//         toast.info("Payment deferred. Please pay at the front desk.");
//         window.location.href = "/modification-succesful";
//       } catch (error) {
//         toast.error("Error processing check-in. Please try again.");
//       } finally {
//         setIsProcessing(false);
//       }
//     }
//   };

//   const handleAdditionalGuestChange = (index, field, value) => {
//     const updatedGuest = {
//       ...additionalGuests[index],
//       [field]: value,
//     };

//     if (field === "country") {
//       updatedGuest.country = value;
//     }

//     dispatch(updateAdditionalGuest(index, updatedGuest));

//     const errors = validateAdditionalGuest(updatedGuest);
//     const updatedErrors = [...guestErrors];
//     updatedErrors[index] = errors;
//     setGuestErrors(updatedErrors);
//   };

//   useEffect(() => {
//     const fetchGuestData = async () => {
//       if (booking?.primary_guest) {
//         const primaryGuest = booking.primary_guest;
//         setFirstName(primaryGuest.firstname || "");
//         setLastName(primaryGuest.lastname || "");
//         setPhoneNumber(
//           primaryGuest.phonenumber ? primaryGuest.phonenumber.toString() : ""
//         );
//         setEmail(primaryGuest.emailid || "");
//         setCountryCode(primaryGuest.countrycode || "+91");

//         const hasCompanyData =
//           primaryGuest.companyid && primaryGuest.companyname;

//         if (hasCompanyData) {
//           setCompanyId(primaryGuest.companyid);
//           setCompanyName(primaryGuest.companyname);
//           setIsCorporateGuest(true);
//           setClientType("Corporate");
//         } else {
//           setClientType(primaryGuest.clienttype || "Leisure");
//         }
//         return;
//       }

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
//             : "+91"
//         );

//         if (guestData.is_corporate) {
//           setCompanyId(guestData.company_id || "");
//           setCompanyName(guestData.company_name || "");
//           setIsCorporateGuest(true);
//           setClientType("Corporate");

//           if (guestData.country) {
//             const foundCountry = countries.find(
//               (c) => c.name === guestData.country
//             );
//             if (foundCountry) {
//               setSelectedCountry(foundCountry);
//             }
//           }
//         } else {
//           setClientType(guestData.client_type || "Leisure");
//         }
//       }
//     };

//     fetchGuestData();
//   }, [booking]);

//   const fallbackImages = [
//     "https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg",
//   ];

//   if (!selectedRoom && !booking) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
//         <div className="max-w-lg bg-white rounded-lg shadow-md p-6 text-center">
//           <svg
//             className="w-16 h-16 mx-auto text-yellow-500"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//             />
//           </svg>
//           <h2 className="text-2xl font-bold text-gray-800 mt-4">
//             Oops! Session Expired
//           </h2>
//           <p className="text-gray-600 mt-2">
//             It looks like your reservation information wasn't saved. Please
//             return to view your reservations and try again.
//           </p>
//           <button
//             onClick={() => navigate("/profile_guest_options")}
//             className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-950"
//           >
//             Return to reservations
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const nextImage = () => {
//     setCurrentImageIndex(
//       (prev) =>
//         (prev + 1) % (selectedRoom?.image_urls?.length || fallbackImages.length)
//     );
//   };

//   const prevImage = () => {
//     setCurrentImageIndex(
//       (prev) =>
//         (prev -
//           1 +
//           (selectedRoom?.image_urls?.length || fallbackImages.length)) %
//         (selectedRoom?.image_urls?.length || fallbackImages.length)
//     );
//   };
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";

//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   const ModificationMessage = ({
//     modificationType,
//     priceDifference,
//     refundAmount,
//     isAfterCutoff,
//     isWithin24Hours,
//   }) => {
//     if (modificationType === "downgrade") {
//       if (isAfterCutoff || isWithin24Hours) {
//         return (
//           <div className="bg-yellow-50 p-3 rounded-md mb-4">
//             <div className="flex items-center">
//               <svg
//                 className="w-5 h-5 text-yellow-600 mr-2"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v6a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               <p className="text-yellow-700 text-sm">
//                 <strong>Downgrade Notice:</strong>{" "}
//                 {isAfterCutoff
//                   ? "As it's after 11:00 AM on your check-in date"
//                   : "As you're within 24 hours of check-in"}
//                 , you will be charged for one night at the previous room rate.
//               </p>
//             </div>
//           </div>
//         );
//       } else if (refundAmount > 0) {
//         return (
//           <div className="bg-green-50 p-3 rounded-md mb-4">
//             <div className="flex items-center">
//               <svg
//                 className="w-5 h-5 text-green-600 mr-2"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               <p className="text-green-700 text-sm">
//                 <strong>Downgrade Approved:</strong> You will receive a refund
//                 of ₹{refundAmount.toLocaleString("en-IN")}. The refund will be
//                 processed within 5-7 business days.
//               </p>
//             </div>
//           </div>
//         );
//       }
//     }

//     if (priceDifference < 0) {
//       return (
//         <div className="bg-yellow-50 p-3 rounded-md mb-4">
//           <div className="flex items-center">
//             <svg
//               className="w-5 h-5 text-yellow-600 mr-2"
//               fill="currentColor"
//               viewBox="0 0 20 20"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v6a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             <p className="text-yellow-700 text-sm">
//               <strong>Price Adjustment:</strong> Complex modification detected.
//               Please contact our support team for detailed breakdown.
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return null;
//   };

//   const handleClientTypeChange = (e) => {
//     const newClientType = e.target.value;

//     if (newClientType === "Corporate" && (!companyId || !companyName)) {
//       toast.error(
//         "Your profile is not associated with any company. Please contact support to set up corporate billing."
//       );
//       return;
//     }

//     setClientType(newClientType);

//     if (newClientType === "Corporate" && companyId && companyName) {
//       setIsCorporateGuest(true);
//     } else if (newClientType === "Leisure") {
//       setIsCorporateGuest(false);
//     }
//   };

//   const getRoomChargesDisplay = () => {
//     if (isLoadingPreview) {
//       return (
//         <div className="flex justify-between text-sm text-gray-700">
//           <span>Loading room charges...</span>
//           <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
//         </div>
//       );
//     }

//     if (!previewData) {
//       return (
//         <div className="flex justify-between text-sm text-gray-700">
//           <span>Room charges not available</span>
//           <span>₹0.00</span>
//         </div>
//       );
//     }

//     const modificationType = previewPrices.modificationType || "";
//     const isDowngrade = modificationType.includes("downgrade");

//     if (isDowngrade && (isAfterCutoff || isWithin24Hours)) {
//       return (
//         <>
//           <div className="mb-1 mt-1">
//             <div className="flex justify-between text-sm text-gray-700">
//               <span className="font-semibold">Previous Room - 1 Night</span>
//               <span>
//                 ₹
//                 {(previewPrices.oldTotal / daysCount).toLocaleString("en-IN", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//             <div className="text-xs text-gray-500 mt-1">
//               {isAfterCutoff
//                 ? "Charged for 1 night (after 11:00 AM check-in)"
//                 : "Charged for 1 night (within 24 hours of check-in)"}
//             </div>
//           </div>

//           {daysCount > 1 && (
//             <div className="flex justify-between text-sm text-gray-700 mt-1 mb-2">
//               <span className="font-semibold">
//                 New Room - {daysCount - 1} Night(s)
//               </span>
//               <span>
//                 ₹
//                 {(
//                   previewPrices.newTotal *
//                   ((daysCount - 1) / daysCount)
//                 ).toLocaleString("en-IN", {
//                   minimumFractionDigits: 2,
//                 })}
//               </span>
//             </div>
//           )}
//         </>
//       );
//     }

//     return (
//       <div className="mb-2">
//         <div className="mb-3">
//           <div className="flex justify-between text-sm text-gray-700 mb-2">
//             <span>
//               Room × {Math.max(1, daysCount)} Night
//               {Math.max(1, daysCount) > 1 ? "s" : ""}
//             </span>
//             <span>
//               ₹
//               {previewPrices.newTotalBasePrice.toLocaleString("en-IN", {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2,
//               })}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   };
//   const AmenitiesCancellationMessage = () => {
//     if (!previewData) return null;

//     const cancelledItems = previewData?.service_preview?.cancelled_items || [];
//     const existingItems = previewData?.service_preview?.existing_items || [];

//     if (cancelledItems.length === 0) return null;

//     const refundableItems = [];
//     const nonRefundableItems = [];

//     cancelledItems.forEach((item) => {
//       if (item.refundable_amount && item.refundable_amount > 0) {
//         refundableItems.push(item);
//       } else {
//         nonRefundableItems.push(item);
//       }
//     });

//     const refundableTotal = refundableItems.reduce(
//       (sum, item) => sum + (item.refundable_amount || 0),
//       0
//     );

//     const nonRefundableTotal = nonRefundableItems.reduce(
//       (sum, item) => sum + (item.total_amount || 0),
//       0
//     );

//     return (
//       <div className="bg-green-50 p-3 rounded-md mt-4 border border-green-100">
//         <div className="flex items-start">
//           <svg
//             className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
//             fill="currentColor"
//             viewBox="0 0 20 20"
//           >
//             <path
//               fillRule="evenodd"
//               d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//               clipRule="evenodd"
//             />
//           </svg>
//           <div>
//             <p className="text-gray-700 text-sm font-medium">
//               Amenities Cancellation Summary
//             </p>

//             {cancelledItems.length > 0 && (
//               <p className="text-xs text-gray-600 mt-1">
//                 You've cancelled {cancelledItems.length} item(s).
//               </p>
//             )}

//             {refundableItems.length > 0 && (
//               <div className="mt-2">
//                 <p className="text-xs text-green-600 font-medium">
//                   Refundable Items:
//                 </p>
//                 {refundableItems.map((item, index) => (
//                   <div
//                     key={index}
//                     className="text-xs text-gray-600 flex justify-between ml-2"
//                   >
//                     <span>
//                       {item.type === "amenity"
//                         ? "Amenity"
//                         : item.type === "room_service"
//                         ? "Room Service"
//                         : "Food"}
//                       : {item.name || `Item ${item.item_id || item.food_id}`}
//                       {item.quantity_cancelled > 1 &&
//                         ` × ${item.quantity_cancelled}`}
//                       <span className="text-green-500 ml-1">(Refundable)</span>
//                     </span>
//                     <span className="font-medium">
//                       ₹{item.refundable_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {nonRefundableItems.length > 0 && (
//               <div className="mt-2">
//                 <p className="text-xs text-red-600 font-medium">
//                   Non-Refundable Items:
//                 </p>
//                 {nonRefundableItems.map((item, index) => (
//                   <div
//                     key={index}
//                     className="text-xs text-gray-600 flex justify-between ml-2"
//                   >
//                     <span>
//                       {item.type === "amenity"
//                         ? "Amenity"
//                         : item.type === "room_service"
//                         ? "Room Service"
//                         : "Food"}
//                       : {item.name || `Item ${item.item_id || item.food_id}`}
//                       {item.quantity_cancelled > 1 &&
//                         ` × ${item.quantity_cancelled}`}
//                       <span className="text-red-500 ml-1">
//                         (Non-refundable)
//                       </span>
//                     </span>
//                     <span className="font-medium line-through">
//                       ₹{item.total_amount?.toLocaleString("en-IN")}
//                     </span>
//                   </div>
//                 ))}
//                 <p className="text-xs text-gray-500 italic mt-1">
//                   Non-refundable amount: ₹
//                   {nonRefundableTotal.toLocaleString("en-IN")}
//                 </p>
//               </div>
//             )}

//             <div className="mt-2 pt-2 border-t border-gray-200">
//               {refundableTotal > 0 && (
//                 <div className="flex justify-between text-xs text-gray-700 mb-1">
//                   <span className="text-green-600 font-medium">
//                     Total refundable:
//                   </span>
//                   <span className="font-medium">
//                     ₹{refundableTotal.toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               )}

//               {nonRefundableTotal > 0 && (
//                 <div className="flex justify-between text-xs text-gray-700">
//                   <span className="text-red-600 font-medium">
//                     Total non-refundable:
//                   </span>
//                   <span className="font-medium line-through">
//                     ₹{nonRefundableTotal.toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               )}
//             </div>

//             <p className="text-xs text-gray-500 italic mt-2">
//               {refundableTotal > 0
//                 ? "(Refundable amount will be processed as per our refund policy)"
//                 : "(Non-refundable items are charged as per our cancellation policy)"}
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   };
//   return (
//     <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-4 mt-20 bg-white max-w-8xl mx-auto">
//       <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 mt-6 ml-0 sm:ml-4">
//         Reserve and Pay
//       </h1>

//       <div className="flex flex-col lg:flex-row gap-6 mx-0 sm:mx-4">
//         {/* Left Column - Mobile first (full width on mobile) */}
//         <div className="w-full lg:w-2/3">
//           {/* Fully Refundable Card - Responsive */}
//           <div className="bg-white border rounded-lg shadow-sm p-3 sm:p-4 mb-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
//               <div className="flex items-start gap-2">
//                 <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
//                   <MdOutlineBedroomChild className="w-4 h-4 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-900 text-sm sm:text-base">
//                     Room 1: {adults} Adult{adults !== 1 ? "s" : ""}
//                     {childrenAges.length > 0 && (
//                       <>
//                         , {childrenAges.length} Child
//                         {childrenAges.length > 1 ? "ren" : ""} (
//                         {childrenAges.map((age, index) => (
//                           <span key={index}>
//                             {age} yr{age > 1 ? "s" : ""}
//                             {index !== childrenAges.length - 1 && ", "}
//                           </span>
//                         ))}
//                         )
//                       </>
//                     )}
//                     ,{" "}
//                     {selectedRoom?.roomtypename ||
//                       booking?.room_type ||
//                       "Deluxe"}
//                   </p>
//                   {selectedRoom?.amenities?.length > 0 && (
//                     <div className="flex flex-wrap gap-1 mt-1">
//                       {selectedRoom.amenities.map((amenity, index) => (
//                         <span
//                           key={index}
//                           className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"
//                         >
//                           <ImCheckmark className="text-green-500" />
//                           {amenity.name}
//                           {index !== selectedRoom.amenities.length - 1 && ","}
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="bg-gray-100 px-3 py-1 rounded-md w-full sm:w-auto text-center sm:text-left">
//                 <div className="text-sm font-bold text-gray-900">
//                   <span className="text-sm font-semibold text-gray-600">
//                     Total :
//                   </span>{" "}
//                   {isLoadingPreview ? (
//                     <div className="animate-pulse bg-gray-200 h-4 w-16 inline-block rounded"></div>
//                   ) : (
//                     `₹${
//                       previewData
//                         ? previewPrices.projectedTotalAfterPreview.toLocaleString(
//                             "en-IN",
//                             {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             }
//                           )
//                         : "0.00"
//                     }`
//                   )}
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

//           {/* Guest Details Card - Responsive */}
//           <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Guest Details
//             </h2>
//             <div className="mb-6">
//               <div className="flex flex-wrap items-center gap-2 mb-3">
//                 <span className="text-sm font-semibold text-gray-700">
//                   Room 1:
//                 </span>
//                 <span className="text-sm text-gray-700 break-words">
//                   {adults} Adult{adults !== 1 ? "s" : ""}
//                   {childrenAges.length > 0 && (
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
//                   )}
//                   ,{" "}
//                   {selectedRoom?.roomtypename || booking?.room_type || "Deluxe"}
//                 </span>
//               </div>

//               <div className="space-y-4">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       First name*
//                     </label>
//                     <input
//                       type="text"
//                       value={firstName}
//                       placeholder="Enter first name"
//                       onChange={handleFirstNameChange}
//                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
//                       className="w-full p-2 border border-gray-300 rounded-md text-sm"
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
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Mobile number*
//                     </label>
//                     <div className="flex flex-col sm:flex-row gap-2">
//                       <select
//                         value={countryCode}
//                         onChange={(e) => setCountryCode(e.target.value)}
//                         className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md text-sm"
//                       >
//                         <option value="+91">+91 (IND)</option>
//                         <option value="+1">+1 (US)</option>
//                       </select>
//                       <input
//                         type="tel"
//                         value={phoneNumber}
//                         onChange={handlePhoneNumberChange}
//                         className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
//                         placeholder="Phone number"
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

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Email*
//                     </label>
//                     <input
//                       type="email"
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
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Profile Type
//                   </label>
//                   <div className="relative">
//                     <select
//                       value={clientType}
//                       onChange={handleClientTypeChange}
//                       className={`w-full p-2 border border-gray-300 rounded-md text-sm ${
//                         isCorporateGuest
//                           ? "bg-gray-100 cursor-not-allowed text-gray-600"
//                           : "bg-white"
//                       }`}
//                       disabled={isCorporateGuest}
//                     >
//                       <option value="Leisure">Leisure</option>
//                       <option value="Corporate">Corporate</option>
//                     </select>

//                     {isCorporateGuest && (
//                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
//                         <svg
//                           className="h-5 w-5 text-gray-400"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="relative">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Country
//                   </label>
//                   <div className="relative">
//                     <button
//                       type="button"
//                       onClick={() => !isCorporateGuest && setIsOpen(!isOpen)}
//                       className={`w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm ${
//                         isCorporateGuest
//                           ? "bg-gray-100 cursor-not-allowed"
//                           : "bg-white"
//                       }`}
//                       disabled={isCorporateGuest}
//                     >
//                       <span className="flex items-center gap-2">
//                         <img
//                           src={selectedCountry.flag}
//                           alt={selectedCountry.name}
//                           className="w-5 h-4 object-cover rounded-sm"
//                         />
//                         <span className="truncate">{selectedCountry.name}</span>
//                       </span>
//                       {!isCorporateGuest && (
//                         <span className="ml-2 font-semibold">▼</span>
//                       )}
//                     </button>

//                     {isOpen && !isCorporateGuest && (
//                       <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                         {countries.map((country) => (
//                           <div
//                             key={country.code}
//                             onClick={() => {
//                               setSelectedCountry(country);
//                               setIsOpen(false);
//                             }}
//                             className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                           >
//                             <img
//                               src={country.flag}
//                               alt={country.name}
//                               className="w-5 h-4 object-cover rounded-sm"
//                             />
//                             <span className="truncate">{country.name}</span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                   {isCorporateGuest && (
//                     <p className="text-xs text-gray-500 mt-1">
//                       Country selection is managed by your corporate profile
//                     </p>
//                   )}
//                 </div>

//                 {isCorporateGuest && (
//                   <div className="col-span-1 sm:col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200 mt-2">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-3">
//                       Company Details
//                     </h3>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Corporate Name
//                         </label>
//                         <input
//                           type="text"
//                           value={companyName}
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
//                           disabled
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Corporate ID
//                         </label>
//                         <input
//                           type="text"
//                           value={companyId}
//                           className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
//                           disabled
//                         />
//                       </div>
//                     </div>
//                     <p className="text-xs font-semibold text-gray-900 bg-yellow-200 px-2 py-1 rounded-md mt-2">
//                       Note: Corporate details can't be edited here. Update them
//                       in your profile to reflect changes.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//             <div className="mt-6">
//               <div className="guest-list-container max-h-[300px] overflow-y-auto mb-4">
//                 {additionalGuests.map((guest, index) => {
//                   const safeGuest = guest || {};

//                   return (
//                     <div
//                       key={index}
//                       className="additional-guest bg-gray-50 p-4 rounded-lg mb-4 relative"
//                     >
//                       <button
//                         onClick={() => {
//                           dispatch(removeAdditionalGuest(index));
//                           setHasUserEdited(true);
//                         }}
//                         className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
//                       >
//                         <FiMinus className="w-4 h-4" />
//                       </button>

//                       <h4 className="text-md font-semibold text-gray-700 mb-2">
//                         Guest {index + 2}
//                       </h4>

//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             First name*
//                           </label>
//                           <input
//                             type="text"
//                             value={safeGuest.firstName || ""}
//                             onChange={(e) => {
//                               setHasUserEdited(true);
//                               const updatedGuest = {
//                                 ...safeGuest,
//                                 firstName: e.target.value,
//                               };
//                               dispatch(
//                                 updateAdditionalGuest(index, updatedGuest)
//                               );
//                             }}
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Enter first name"
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Last name*
//                           </label>
//                           <input
//                             type="text"
//                             value={safeGuest.lastName || ""}
//                             onChange={(e) => {
//                               setHasUserEdited(true);
//                               const updatedGuest = {
//                                 ...safeGuest,
//                                 lastName: e.target.value,
//                               };
//                               dispatch(
//                                 updateAdditionalGuest(index, updatedGuest)
//                               );
//                             }}
//                             className="w-full p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Enter last name"
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Mobile number (optional)
//                           </label>
//                           <div className="flex flex-col sm:flex-row gap-2">
//                             <select
//                               value={safeGuest.countryCode || "+91"}
//                               onChange={(e) => {
//                                 setHasUserEdited(true);
//                                 const updatedGuest = {
//                                   ...safeGuest,
//                                   countryCode: e.target.value,
//                                 };
//                                 dispatch(
//                                   updateAdditionalGuest(index, updatedGuest)
//                                 );
//                               }}
//                               className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md text-sm"
//                             >
//                               <option value="+91">+91 (IND)</option>
//                               <option value="+1">+1 (US)</option>
//                             </select>
//                             <input
//                               type="tel"
//                               value={safeGuest.phoneNumber || ""}
//                               onChange={(e) => {
//                                 setHasUserEdited(true);
//                                 const updatedGuest = {
//                                   ...safeGuest,
//                                   phoneNumber: e.target.value,
//                                 };
//                                 dispatch(
//                                   updateAdditionalGuest(index, updatedGuest)
//                                 );
//                               }}
//                               className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
//                               placeholder="Phone number"
//                             />
//                           </div>
//                         </div>

//                         <div className="relative">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Country
//                           </label>
//                           <div className="relative">
//                             <button
//                               type="button"
//                               onClick={() => toggleGuestDropdown(index)}
//                               className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
//                             >
//                               <span className="flex items-center gap-2">
//                                 <img
//                                   src={
//                                     safeGuest.country?.flag || countries[0].flag
//                                   }
//                                   alt={
//                                     safeGuest.country?.name || countries[0].name
//                                   }
//                                   className="w-5 h-4 object-cover rounded-sm"
//                                 />
//                                 <span className="truncate">
//                                   {safeGuest.country?.name || countries[0].name}
//                                 </span>
//                               </span>
//                               <span className="ml-2 font-semibold">▼</span>
//                             </button>

//                             {guestDropdownStates[index] && (
//                               <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                                 {countries.map((country) => (
//                                   <div
//                                     key={country.code}
//                                     onClick={() => {
//                                       setHasUserEdited(true);
//                                       const updatedGuest = {
//                                         ...safeGuest,
//                                         country: country,
//                                       };
//                                       dispatch(
//                                         updateAdditionalGuest(
//                                           index,
//                                           updatedGuest
//                                         )
//                                       );
//                                       toggleGuestDropdown(index);
//                                     }}
//                                     className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                                   >
//                                     <img
//                                       src={country.flag}
//                                       alt={country.name}
//                                       className="w-5 h-4 object-cover rounded-sm"
//                                     />
//                                     <span className="truncate">
//                                       {country.name}
//                                     </span>
//                                   </div>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {additionalGuests.length < maxAdditionalGuests ? (
//                 <button
//                   onClick={() => {
//                     const newGuest = {
//                       firstName: "",
//                       lastName: "",
//                       phoneNumber: "",
//                       email: "",
//                       countryCode: "+91",
//                       country: countries[0],
//                     };
//                     dispatch(addAdditionalGuest(newGuest));
//                     setHasUserEdited(true);
//                   }}
//                   className="flex items-center gap-2 pb-4 text-blue-600 hover:text-blue-800"
//                 >
//                   <FiPlus className="w-4 h-4" />
//                   Additional guest
//                 </button>
//               ) : (
//                 <div className="relative flex items-center gap-2 pb-4 text-gray-400 cursor-not-allowed group">
//                   <FiPlus className="w-4 h-4" />
//                   <span>Additional guest</span>
//                   <div className="absolute left-0 top-full mt-1 w-48 bg-black text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
//                     Maximum number of guests reached for this room
//                   </div>
//                 </div>
//               )}
//             </div>
//             {rooms > 1 && (
//               <div className="border-t pt-6">
//                 <h3 className="text-lg font-bold text-gray-800 mb-4">
//                   Additional Rooms
//                 </h3>

//                 {Array.from({ length: rooms - 1 }).map((_, roomIndex) => (
//                   <div key={roomIndex} className="mb-6 border-b pb-6">
//                     <div className="flex flex-wrap items-center gap-2 mb-3">
//                       <span className="text-sm font-semibold text-gray-700">
//                         Room {roomIndex + 2}:
//                       </span>
//                       <span className="text-sm break-words">
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
//                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
//                                 e.target.value
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
//                                 e.target.value
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
//                         <div className="flex flex-col sm:flex-row gap-2">
//                           <select
//                             value={
//                               additionalGuests[roomIndex]?.countryCode || "+91"
//                             }
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "countryCode",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md text-sm"
//                           >
//                             <option value="+91">+91</option>
//                             <option value="+1">+1</option>
//                             <option value="+44">+44</option>
//                             <option value="+81">+81</option>
//                           </select>
//                           <input
//                             type="tel"
//                             value={
//                               additionalGuests[roomIndex]?.phoneNumber || ""
//                             }
//                             onChange={(e) =>
//                               handleAdditionalGuestChange(
//                                 roomIndex,
//                                 "phoneNumber",
//                                 e.target.value
//                               )
//                             }
//                             className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
//                             placeholder="Phone number"
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

//           {/* Selected Amenities Card - Responsive */}
//           <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-2">
//               Selected Amenities
//             </h2>

//             {allEnhancements.filter((amenity) => amenity.quantity > 0).length >
//             0 ? (
//               <ul className="space-y-2">
//                 {allEnhancements
//                   .filter((amenity) => amenity.quantity > 0)
//                   .map((amenity) => (
//                     <li key={amenity.id} className="flex justify-between py-1">
//                       <div className="break-words pr-2">
//                         <span>
//                           {amenity.name} × {amenity.quantity}
//                         </span>
//                       </div>
//                       <span className="whitespace-nowrap">
//                         ₹
//                         {amenity.totalPrice.toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </span>
//                     </li>
//                   ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-sm">No amenities selected.</p>
//             )}
//           </div>

//           {/* Important Information Card - Responsive */}
//           <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
//             <h2 className="text-xl font-bold text-gray-800 mb-4">
//               Important information
//             </h2>
//             <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
//               <li>
//                 Cancel your booking at least 24 hours before your scheduled
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

//         {/* Right Column - Booking Summary (sticky on desktop) */}
//         <div className="w-full lg:w-1/3">
//           <div className="bg-white border rounded-lg shadow-sm p-3 mb-6">
//             <div className="p-0.5 text-right">
//               <p className="text-sm text-black break-words">
//                 <span className="font-semibold">Signed in as</span> {email}
//               </p>
//             </div>
//           </div>
//           <div className="rounded-2xl border border-gray-200 shadow-sm bg-white lg:sticky lg:top-4">
//             {/* Image slider section - responsive height */}
//             <div className="relative w-full h-48 sm:h-56 md:h-60 overflow-hidden rounded-t-2xl">
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
//               <button
//                 onClick={prevImage}
//                 className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full text-sm"
//               >
//                 ❮
//               </button>
//               <button
//                 onClick={nextImage}
//                 className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full text-sm"
//               >
//                 ❯
//               </button>
//             </div>

//             <div className="p-4 sm:p-6">
//               <div className="pt-2">
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
//                   <div>
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Check-in:
//                     </h3>
//                     <p className="text-gray-600 text-sm">
//                       {checkInDate ? formatDate(checkInDate) : "N/A"} (11:00 AM)
//                     </p>
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-bold text-gray-800">
//                       Check-out:
//                     </h3>
//                     <p className="text-gray-600 text-sm">
//                       {checkOutDate ? formatDate(checkOutDate) : "N/A"} (12:00
//                       PM)
//                     </p>
//                   </div>
//                 </div>

//                 <div className="border-t pt-4 mb-4">
//                   <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 flex flex-wrap items-center gap-2">
//                     Price Details
//                     {previewError && (
//                       <span className="text-sm text-red-500">
//                         (Error loading prices)
//                       </span>
//                     )}
//                     <button
//                       onClick={() => setPreviousPricePopupOpen(true)}
//                       className="text-blue-600 text-xs sm:text-sm font-normal underline hover:text-blue-800"
//                     >
//                       (View previous reservation details)
//                     </button>
//                   </h3>

//                   {previewError && (
//                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
//                       <p className="text-red-700 text-sm">
//                         Failed to load price preview: {previewError}
//                       </p>
//                       <button
//                         onClick={loadPreviewData}
//                         className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
//                       >
//                         Retry
//                       </button>
//                     </div>
//                   )}

//                   {isLoadingPreview ? (
//                     <div className="flex justify-center py-4">
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//                     </div>
//                   ) : previewData ? (
//                     <>
//                       <div className="mb-3">
//                         {previewPrices.modificationType === "downgrade" ? (
//                           <div className="flex justify-between text-sm text-gray-700 mb-2">
//                             <span>
//                               Room × {Math.max(1, daysCount)} Night
//                               {Math.max(1, daysCount) > 1 ? "s" : ""}
//                             </span>
//                             <span>
//                               ₹
//                               {selectedRoom.dynamicPrice.toLocaleString(
//                                 "en-IN",
//                                 {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 2,
//                                 }
//                               )}
//                             </span>
//                           </div>
//                         ) : (
//                           <div className="flex justify-between text-sm text-gray-700 mb-2">
//                             <span>
//                               Room × {Math.max(1, daysCount)} Night
//                               {Math.max(1, daysCount) > 1 ? "s" : ""}
//                             </span>
//                             <span>
//                               ₹
//                               {selectedRoom.dynamicPrice.toLocaleString(
//                                 "en-IN",
//                                 {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 2,
//                                 }
//                               )}
//                             </span>
//                           </div>
//                         )}
//                       </div>

//                       {allEnhancements.filter((amenity) => amenity.quantity > 0)
//                         .length > 0 && (
//                         <div className="space-y-2 mb-3">
//                           {allEnhancements
//                             .filter((amenity) => amenity.quantity > 0)
//                             .map((amenity) => (
//                               <div
//                                 key={amenity.id}
//                                 className="flex justify-between text-sm text-gray-700"
//                               >
//                                 <div className="break-words pr-2">
//                                   <span>
//                                     {amenity.name} × {amenity.quantity}
//                                   </span>
//                                 </div>
//                                 <span className="whitespace-nowrap">
//                                   ₹
//                                   {amenity.totalPrice.toLocaleString("en-IN", {
//                                     minimumFractionDigits: 2,
//                                   })}
//                                 </span>
//                               </div>
//                             ))}
//                         </div>
//                       )}

//                       <hr className="my-2 border-t border-gray-300" />

//                       {previewPrices.roomServiceFee > 0 && (
//                         <div className="flex justify-between text-sm text-gray-700 mt-2">
//                           <span className="font-semibold">
//                             Modification fee:
//                           </span>
//                           <span>
//                             ₹
//                             {previewPrices.roomServiceFee.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                       )}

//                       {previewPrices.serviceFeeHistorical > 0 && (
//                         <div className="flex justify-between text-sm text-gray-700 mt-2">
//                           <span className="text-gray-800 font-semibold">
//                             Previous Modification Fees
//                           </span>
//                           <span>
//                             ₹
//                             {previewPrices.serviceFeeHistorical.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                       )}

//                       <div className="mt-3 mb-1">
//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center gap-1">
//                             <span className="text-sm font-semibold text-gray-800">
//                               Total Taxes and Charges
//                             </span>
//                             <button
//                               onClick={() => setShowTaxDetails(!showTaxDetails)}
//                               className="text-gray-400 hover:text-gray-600 focus:outline-none"
//                             >
//                               {showTaxDetails ? (
//                                 <FiChevronUp />
//                               ) : (
//                                 <FiChevronDown />
//                               )}
//                             </button>
//                           </div>
//                           <span className="text-sm text-gray-700">
//                             ₹
//                             {previewPrices.fixedCurrentTax.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>

//                         {showTaxDetails && (
//                           <div className="mt-2 bg-gray-50 p-3 rounded-md text-sm">
//                             {previewPrices.roomTaxAmount > 0 && (
//                               <div className="mb-2">
//                                 <div className="flex justify-between">
//                                   <span>Room Tax (5%)</span>
//                                   <span>
//                                     ₹
//                                     {previewPrices.roomTaxAmount.toLocaleString(
//                                       "en-IN",
//                                       {
//                                         minimumFractionDigits: 2,
//                                       }
//                                     )}
//                                   </span>
//                                 </div>
//                               </div>
//                             )}

//                             {previewPrices.serviceDeltaTax > 0 && (
//                               <div className="mb-2">
//                                 <div className="flex justify-between">
//                                   <span>New Amenities Tax</span>
//                                   <span>
//                                     ₹
//                                     {previewPrices.serviceDeltaTax.toLocaleString(
//                                       "en-IN",
//                                       {
//                                         minimumFractionDigits: 2,
//                                       }
//                                     )}
//                                   </span>
//                                 </div>
//                               </div>
//                             )}

//                             {previousAmenitiesTaxForUi > 0 && (
//                               <div className="mb-2">
//                                 <div className="flex justify-between">
//                                   <span>Existing Amenities Tax</span>
//                                   <span>
//                                     ₹
//                                     {previousAmenitiesTaxForUi.toLocaleString(
//                                       "en-IN",
//                                       {
//                                         minimumFractionDigits: 2,
//                                       }
//                                     )}
//                                   </span>
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>

//                       <div className="flex justify-between items-center border-t pt-2 mt-3">
//                         <h3 className="text-base sm:text-lg font-semibold text-gray-800">
//                           Total
//                         </h3>
//                         <span className="text-base sm:text-lg font-bold text-gray-900">
//                           ₹
//                           {previewPrices.currentTotal.toLocaleString("en-IN", {
//                             minimumFractionDigits: 2,
//                             maximumFractionDigits: 2,
//                           })}
//                         </span>
//                       </div>

//                       {previewPrices.amountPaid > 0 && (
//                         <div className="flex justify-between items-center mt-2">
//                           <h3 className="text-base sm:text-lg font-semibold text-gray-950">
//                             Amount paid
//                           </h3>
//                           <span className="text-base sm:text-lg font-semibold text-gray-950">
//                             ₹
//                             {previewPrices.amountPaid.toLocaleString("en-IN", {
//                               minimumFractionDigits: 2,
//                               maximumFractionDigits: 2,
//                             })}
//                           </span>
//                         </div>
//                       )}

//                       {previewPrices.amountDueAfterPreview > 0 && (
//                         <div className="flex justify-between items-center mt-2">
//                           <h3 className="text-base sm:text-lg font-semibold text-gray-950">
//                             Amount Due
//                           </h3>
//                           <span className="text-base sm:text-lg font-bold text-gray-900">
//                             ₹
//                             {previewPrices.amountDueAfterPreview.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                       )}

//                       {refundCalculations.totalRefund > 0 && (
//                         <>
//                           <div className="flex justify-between items-center mt-2">
//                             <h3 className="text-base sm:text-lg font-semibold text-gray-950">
//                               {previewData?.room_preview
//                                 ?.financial_preview_type ===
//                               "recalculation_via_discount"
//                                 ? "Adjustment Amount"
//                                 : "Refund Amount"}
//                             </h3>
//                             <span className="text-base sm:text-lg font-bold text-gray-900">
//                               ₹
//                               {refundCalculations.totalRefund.toLocaleString(
//                                 "en-IN",
//                                 {
//                                   minimumFractionDigits: 2,
//                                   maximumFractionDigits: 2,
//                                 }
//                               )}
//                             </span>
//                           </div>

//                           <div
//                             className={`p-2 rounded-md mt-1 border ${
//                               previewData?.room_preview
//                                 ?.financial_preview_type ===
//                               "recalculation_via_discount"
//                                 ? "bg-blue-50 border-blue-100"
//                                 : "bg-green-50 border-green-100"
//                             }`}
//                           >
//                             <div className="text-xs text-gray-600 space-y-1">
//                               {refundCalculations.roomRefund > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>
//                                     •{" "}
//                                     {previewData?.room_preview
//                                       ?.financial_preview_type ===
//                                     "recalculation_via_discount"
//                                       ? "Room adjustment:"
//                                       : "Room refund:"}
//                                   </span>
//                                   <span>
//                                     ₹
//                                     {refundCalculations.roomRefund.toLocaleString(
//                                       "en-IN",
//                                       {
//                                         minimumFractionDigits: 2,
//                                       }
//                                     )}
//                                   </span>
//                                 </div>
//                               )}
//                               {refundCalculations.amenitiesRefund > 0 && (
//                                 <div className="flex justify-between">
//                                   <span>
//                                     •{" "}
//                                     {previewData?.room_preview
//                                       ?.financial_preview_type ===
//                                     "recalculation_via_discount"
//                                       ? "Amenities adjustment:"
//                                       : "Amenities refund:"}
//                                   </span>
//                                   <span>
//                                     ₹
//                                     {refundCalculations.amenitiesRefund.toLocaleString(
//                                       "en-IN",
//                                       {
//                                         minimumFractionDigits: 2,
//                                       }
//                                     )}
//                                   </span>
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </>
//                       )}
//                     </>
//                   ) : (
//                     <div className="text-gray-500 text-sm py-2"></div>
//                   )}
//                 </div>
//                 <RefundMessageComponent />

//                 {previewPrices.modificationType?.includes("downgrade") &&
//                   previewPrices.priceDifference > 0 && (
//                     <div
//                       className={`p-3 rounded-md mt-2 border ${
//                         previewData?.room_preview?.financial_preview_type ===
//                         "recalculation_via_discount"
//                           ? "bg-blue-50 border-blue-200"
//                           : "bg-green-50 border-green-200"
//                       }`}
//                     >
//                       <div className="flex items-start">
//                         <svg
//                           className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
//                             previewData?.room_preview
//                               ?.financial_preview_type ===
//                             "recalculation_via_discount"
//                               ? "text-blue-600"
//                               : "text-gray-600"
//                           }`}
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           {previewData?.room_preview?.financial_preview_type ===
//                           "recalculation_via_discount" ? (
//                             <path
//                               fillRule="evenodd"
//                               d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
//                               clipRule="evenodd"
//                             />
//                           ) : (
//                             <path
//                               fillRule="evenodd"
//                               d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                               clipRule="evenodd"
//                             />
//                           )}
//                         </svg>
//                         <div>
//                           {previewData?.room_preview?.financial_preview_type ===
//                           "recalculation_via_discount" ? (
//                             <>
//                               <p className="text-gray-700 text-sm">
//                                 <strong>
//                                   Refund Adjustment: ₹
//                                   {refundCalculations.totalRefund.toLocaleString(
//                                     "en-IN"
//                                   )}
//                                 </strong>
//                               </p>
//                               <p className="text-xs text-gray-600 italic mt-1">
//                                 (Modification fees of ₹
//                                 {previewPrices.roomServiceFee.toLocaleString(
//                                   "en-IN"
//                                 )}{" "}
//                                 is deducted. The net amount of ₹
//                                 {refundCalculations.totalRefund.toLocaleString(
//                                   "en-IN"
//                                 )}{" "}
//                                 has been adjusted against your total amount
//                                 due.)
//                               </p>
//                             </>
//                           ) : (
//                             <>
//                               <p className="text-gray-700 text-sm">
//                                 <strong>
//                                   You will receive a refund of ₹
//                                   {refundCalculations.totalRefund.toLocaleString(
//                                     "en-IN"
//                                   )}
//                                 </strong>
//                               </p>
//                               <p className="text-xs text-gray-600 italic mt-1">
//                                 (Modification fees of ₹
//                                 {previewPrices.roomServiceFee.toLocaleString(
//                                   "en-IN"
//                                 )}{" "}
//                                 is deducted. The remaining balance of ₹
//                                 {refundCalculations.totalRefund.toLocaleString(
//                                   "en-IN"
//                                 )}{" "}
//                                 will be refunded to your payment method within
//                                 5–7 business days.)
//                               </p>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                 <div className="flex items-start mt-4 mb-6 text-xs text-gray-500">
//                   <input
//                     type="checkbox"
//                     id="acknowledgement"
//                     className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
//                     checked={isAcknowledged}
//                     onChange={(e) => setIsAcknowledged(e.target.checked)}
//                   />
//                   <label htmlFor="acknowledgement" className="leading-tight">
//                     By proceeding, I confirm that I have read and agree to
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
//                   className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-80 disabled:cursor-not-allowed text-sm sm:text-base"
//                   disabled={
//                     isLoading ||
//                     isLoadingPreview ||
//                     !email ||
//                     email.trim() === ""
//                   }
//                   title={
//                     !email || email.trim() === ""
//                       ? "Email is required to proceed"
//                       : ""
//                   }
//                 >
//                   {isLoading ? "Processing..." : "Modify Reservation"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {reservationPopupOpen && (
//         <div className="fixed inset-0 backdrop-blur-lg flex justify-center items-center z-50 p-4">
//           <div className="bg-white border border-gray-300 w-full max-w-md sm:max-w-lg p-4 sm:p-8 rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
//             <button
//               className="absolute top-3 right-4 text-red-600 text-2xl"
//               onClick={() => navigate("/profile_guest_options")}
//             >
//               ✕
//             </button>

//             {reservationError ? (
//               <div>{/* Error handling code remains the same... */}</div>
//             ) : (
//               <div>
//                 <div className="mb-4 mt-5">
//                   <p className="text-md font-semibold">
//                     Hello,{" "}
//                     <span className="capitalize">
//                       {firstName} {lastName}
//                     </span>{" "}
//                     you've reached last step of your modification
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Reservation Number
//                     </p>
//                     <p className="text-md font-mono break-all">
//                       {booking?.orderid || localStorage.getItem("orderId")}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-md font-semibold text-gray-700">
//                       Check-in
//                     </p>
//                     <p className="text-md">
//                       {booking?.checkindate
//                         ? new Date(booking.checkindate).toLocaleDateString(
//                             "en-US",
//                             {
//                               month: "short",
//                               day: "numeric",
//                               year: "numeric",
//                             }
//                           )
//                         : checkInDate
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
//                       {booking?.checkoutdate
//                         ? new Date(booking.checkoutdate).toLocaleDateString(
//                             "en-US",
//                             {
//                               month: "short",
//                               day: "numeric",
//                               year: "numeric",
//                             }
//                           )
//                         : checkOutDate
//                         ? new Date(checkOutDate).toLocaleDateString("en-US", {
//                             month: "short",
//                             day: "numeric",
//                             year: "numeric",
//                           })
//                         : "N/A"}
//                     </p>
//                   </div>
//                 </div>

//                 {previewData?.room_preview?.financial_preview_type ===
//                   "recalculation_via_discount" &&
//                 refundCalculations.totalRefund > 0 ? (
//                   <div className="bg-blue-50 p-4 rounded-t-md border border-blue-200">
//                     <h4 className="font-semibold text-gray-800 mb-3 text-center">
//                       Adjustment Summary
//                     </h4>

//                     {refundCalculations.roomRefund > 0 && (
//                       <div className="mb-2 text-xs">
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-700 px-4 font-semibold">
//                             Room Adjustment:
//                           </span>
//                           <span className="font-semibold text-gray-700">
//                             ₹
//                             {refundCalculations.roomRefund.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                         <div className="flex justify-end text-gray-500 text-[10px] mt-0.5">
//                           Including taxes
//                         </div>
//                       </div>
//                     )}

//                     {previewPrices.totalServiceFee > 0 && (
//                       <div className="flex justify-between mb-2 text-gray-700">
//                         <span className="text-xs font-semibold px-4">
//                           Modification Fee Deduction:
//                         </span>
//                         <span className="font-semibold text-xs">
//                           - ₹
//                           {previewPrices.totalServiceFee.toLocaleString(
//                             "en-IN",
//                             {
//                               minimumFractionDigits: 2,
//                             }
//                           )}
//                         </span>
//                       </div>
//                     )}

//                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 font-bold">
//                       <span className="text-gray-800 px-4">
//                         Final Adjustment Amount:
//                       </span>
//                       <span className="text-gray-800">
//                         ₹
//                         {(
//                           refundCalculations.totalRefund -
//                           previewPrices.totalServiceFee
//                         ).toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </span>
//                     </div>

//                     <p className="text-xs text-gray-600 text-center mt-1 font-semibold">
//                       This is an adjustment amount. The amount has been adjusted
//                       against your total amount due. No separate refund will be
//                       processed.
//                     </p>
//                   </div>
//                 ) : refundCalculations.totalRefund > 0 ? (
//                   <div className="bg-green-50 p-4 rounded-t-md border border-gray-200">
//                     <h4 className="font-semibold text-gray-800 mb-3 text-center">
//                       Refund Breakdown
//                     </h4>

//                     {refundCalculations.roomRefund > 0 && (
//                       <div className="mb-2 text-xs">
//                         <div className="flex justify-between items-center">
//                           <span className="text-gray-700 px-4 font-semibold">
//                             Room Refund:
//                           </span>
//                           <span className="font-semibold text-gray-700">
//                             ₹
//                             {refundCalculations.roomRefund.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                         <div className="flex justify-end text-gray-500 text-[10px] mt-0.5">
//                           Including taxes
//                         </div>
//                       </div>
//                     )}

//                     {previewPrices.modificationType?.includes("downgrade") &&
//                       previewPrices.totalServiceFee > 0 && (
//                         <div className="flex justify-between mb-2 text-gray-700">
//                           <span className="text-xs font-semibold px-4">
//                             Modification Fee Deduction:
//                           </span>
//                           <span className="font-semibold text-xs">
//                             - ₹
//                             {previewPrices.totalServiceFee.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                       )}

//                     {previewData?.service_preview?.cancelled_items?.length >
//                       0 && (
//                       <div className="ml-3 mt-2 border-t border-gray-200 pt-2">
//                         <p className="text-xs font-semibold text-gray-700 mb-1">
//                           Amenities Cancellation Details:
//                         </p>

//                         {(() => {
//                           const cancelledItems =
//                             previewData?.service_preview?.cancelled_items || [];
//                           const isAdjustment =
//                             refundCalculations.financialPreviewType ===
//                             "recalculation_via_discount";

//                           const refundableItems = [];
//                           const nonRefundableItems = [];

//                           cancelledItems.forEach((item) => {
//                             const itemId =
//                               item.type === "food"
//                                 ? item.food_id
//                                 : item.item_id;
//                             const reduxAmenity = selectedAmenities.find(
//                               (a) =>
//                                 a.id === itemId ||
//                                 a.id?.toString() === itemId?.toString() ||
//                                 (item.type === "food" &&
//                                   a.type === "food" &&
//                                   a.id === item.food_id) ||
//                                 (item.type === "amenity" &&
//                                   a.type === "amenity" &&
//                                   a.id === item.item_id) ||
//                                 (item.type === "room_service" &&
//                                   a.type === "room_service" &&
//                                   a.id === item.item_id)
//                             );

//                             let isRefundable = false;
//                             if (reduxAmenity) {
//                               isRefundable = reduxAmenity.refundable === true;
//                             } else {
//                               isRefundable =
//                                 item.refundable_amount &&
//                                 item.refundable_amount > 0;
//                             }

//                             if (isRefundable) {
//                               refundableItems.push({
//                                 ...item,
//                                 name:
//                                   item.name ||
//                                   reduxAmenity?.name ||
//                                   `Item ${itemId}`,
//                                 isRefundable: true,
//                                 refundable_amount:
//                                   item.refundable_amount || item.total_amount,
//                               });
//                             } else {
//                               nonRefundableItems.push({
//                                 ...item,
//                                 name:
//                                   item.name ||
//                                   reduxAmenity?.name ||
//                                   `Item ${itemId}`,
//                                 isRefundable: false,
//                                 total_amount: item.total_amount,
//                               });
//                             }
//                           });

//                           const refundableTotal = refundableItems.reduce(
//                             (sum, item) => sum + (item.refundable_amount || 0),
//                             0
//                           );

//                           const nonRefundableTotal = nonRefundableItems.reduce(
//                             (sum, item) => sum + (item.total_amount || 0),
//                             0
//                           );

//                           return (
//                             <>
//                               {refundableItems.length > 0 && (
//                                 <div className="mb-3">
//                                   <p className="text-xs text-green-600 font-medium mb-1">
//                                     Refundable Items:
//                                   </p>
//                                   {refundableItems.map((item, index) => (
//                                     <div
//                                       key={index}
//                                       className="flex flex-col text-xs text-gray-600 mb-1"
//                                     >
//                                       <div className="flex justify-between font-semibold">
//                                         <span className="break-words pr-2">
//                                           •{" "}
//                                           {item.type === "food"
//                                             ? "Food"
//                                             : item.type === "room_service"
//                                             ? "Room Service"
//                                             : "Amenity"}
//                                           : {item.name}
//                                           {item.quantity_cancelled > 1 &&
//                                             ` × ${item.quantity_cancelled}`}
//                                           <span className="text-green-600 ml-1">
//                                             (Refundable)
//                                           </span>
//                                         </span>
//                                         <span className="font-medium whitespace-nowrap">
//                                           ₹
//                                           {item.refundable_amount?.toLocaleString(
//                                             "en-IN"
//                                           )}
//                                         </span>
//                                       </div>
//                                     </div>
//                                   ))}
//                                   <div className="flex justify-between text-xs text-gray-700 mt-1">
//                                     <span className="text-green-600 font-medium">
//                                       Total refundable:
//                                     </span>
//                                     <span className="font-medium">
//                                       ₹{refundableTotal.toLocaleString("en-IN")}
//                                     </span>
//                                   </div>
//                                 </div>
//                               )}

//                               {nonRefundableItems.length > 0 && (
//                                 <div className="mb-3">
//                                   <p className="text-xs text-red-600 font-medium mb-1">
//                                     Non-Refundable Items:
//                                   </p>
//                                   {nonRefundableItems.map((item, index) => (
//                                     <div
//                                       key={index}
//                                       className="flex flex-col text-xs text-gray-600 mb-1"
//                                     >
//                                       <div className="flex justify-between font-semibold">
//                                         <span className="break-words pr-2">
//                                           •{" "}
//                                           {item.type === "food"
//                                             ? "Food"
//                                             : item.type === "room_service"
//                                             ? "Room Service"
//                                             : "Amenity"}
//                                           : {item.name}
//                                           {item.quantity_cancelled > 1 &&
//                                             ` × ${item.quantity_cancelled}`}
//                                           <span className="text-red-500 ml-1">
//                                             (Non-refundable)
//                                           </span>
//                                         </span>
//                                         <span className="font-medium line-through whitespace-nowrap">
//                                           ₹
//                                           {item.total_amount?.toLocaleString(
//                                             "en-IN"
//                                           )}
//                                         </span>
//                                       </div>
//                                       <div className="flex justify-end ml-2 text-gray-500 text-[10px]">
//                                         Non-refundable
//                                       </div>
//                                     </div>
//                                   ))}
//                                   <div className="flex justify-between text-xs text-gray-700 mt-1">
//                                     <span className="text-red-600 font-medium">
//                                       Total non-refundable:
//                                     </span>
//                                     <span className="font-medium line-through">
//                                       ₹
//                                       {nonRefundableTotal.toLocaleString(
//                                         "en-IN"
//                                       )}
//                                     </span>
//                                   </div>
//                                 </div>
//                               )}

//                               {refundableTotal > 0 && (
//                                 <div className="mt-2 pt-2 border-t border-gray-200">
//                                   <div className="flex justify-between text-xs text-gray-700 mb-1">
//                                     <span className="font-medium">
//                                       Amenities Refund Total:
//                                     </span>
//                                     <span className="font-medium">
//                                       ₹{refundableTotal.toLocaleString("en-IN")}
//                                     </span>
//                                   </div>
//                                 </div>
//                               )}
//                             </>
//                           );
//                         })()}
//                       </div>
//                     )}

//                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 font-bold">
//                       <span className="text-gray-800 px-4">
//                         Final Refund Amount:
//                       </span>
//                       <span className="text-gray-800">
//                         ₹
//                         {(
//                           refundCalculations.totalRefund -
//                           previewPrices.totalServiceFee
//                         ).toLocaleString("en-IN", {
//                           minimumFractionDigits: 2,
//                         })}
//                       </span>
//                     </div>

//                     <p className="text-xs text-gray-600 text-center mt-1">
//                       {previewPrices.modificationType?.includes("downgrade") &&
//                       previewPrices.totalServiceFee > 0 ? (
//                         <>
//                           (Modification fees of ₹
//                           {previewPrices.totalServiceFee.toLocaleString(
//                             "en-IN"
//                           )}
//                           have been deducted. The remaining amount will be
//                           refunded to your payment method within 5–7 business
//                           days)
//                         </>
//                       ) : (
//                         "(Refund will be processed to your payment method within 5–7 business days)"
//                       )}
//                     </p>

//                     {(() => {
//                       const cancelledItems =
//                         previewData?.service_preview?.cancelled_items || [];
//                       const hasNonRefundableItems = cancelledItems.some(
//                         (item) => {
//                           const itemId =
//                             item.type === "food" ? item.food_id : item.item_id;
//                           const reduxAmenity = selectedAmenities.find(
//                             (a) =>
//                               a.id === itemId ||
//                               a.id?.toString() === itemId?.toString() ||
//                               (item.type === "food" &&
//                                 a.type === "food" &&
//                                 a.id === item.food_id) ||
//                               (item.type === "amenity" &&
//                                 a.type === "amenity" &&
//                                 a.id === item.item_id) ||
//                               (item.type === "room_service" &&
//                                 a.type === "room_service" &&
//                                 a.id === item.item_id)
//                           );

//                           let isRefundable = false;
//                           if (reduxAmenity) {
//                             isRefundable = reduxAmenity.refundable === true;
//                           } else {
//                             isRefundable =
//                               item.refundable_amount &&
//                               item.refundable_amount > 0;
//                           }

//                           return !isRefundable;
//                         }
//                       );

//                       if (hasNonRefundableItems) {
//                         return (
//                           <div className="mt-2 p-2 bg-red-50 rounded border border-red-100">
//                             <div className="flex items-center">
//                               <svg
//                                 className="w-4 h-4 text-red-500 mr-2 flex-shrink-0"
//                                 fill="currentColor"
//                                 viewBox="0 0 20 20"
//                               >
//                                 <path
//                                   fillRule="evenodd"
//                                   d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                                   clipRule="evenodd"
//                                 />
//                               </svg>
//                               <p className="text-xs text-red-700 font-medium">
//                                 Note: Some cancelled items are non-refundable as
//                                 per our policy
//                               </p>
//                             </div>
//                           </div>
//                         );
//                       }
//                       return null;
//                     })()}
//                   </div>
//                 ) : null}

//                 {previewPrices.amountDueAfterPreview > 0 ? (
//                   <div
//                     className={`p-4 rounded-b-md mb-6 border ${
//                       previewData?.room_preview?.financial_preview_type ===
//                       "recalculation_via_discount"
//                         ? "bg-blue-50 border-blue-200"
//                         : "bg-blue-50 border-blue-200"
//                     }`}
//                   >
//                     {previewData?.room_preview?.financial_preview_type ===
//                       "recalculation_via_discount" &&
//                     refundCalculations.totalRefund > 0 ? (
//                       <>
//                         <p className="text-center text-sm font-semibold text-black">
//                           Please pay the adjusted amount of{" "}
//                           <span className="text-gray-950 text-sm">
//                             ₹
//                             {previewPrices.amountDueAfterPreview.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </p>
//                       </>
//                     ) : refundCalculations.totalRefund > 0 ? (
//                       <>
//                         <p className="text-center text-sm font-semibold text-black mb-2">
//                           Please pay the amount due of{" "}
//                           <span className="text-gray-950 text-sm">
//                             ₹
//                             {previewPrices.amountDueAfterPreview.toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </p>
//                       </>
//                     ) : (
//                       <p className="text-center text-sm font-semibold text-black">
//                         Please pay the amount due of{" "}
//                         <span className="text-gray-950 text-sm">
//                           ₹
//                           {previewPrices.amountDueAfterPreview.toLocaleString(
//                             "en-IN",
//                             {
//                               minimumFractionDigits: 2,
//                             }
//                           )}
//                         </span>
//                       </p>
//                     )}

//                     <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
//                       <button
//                         onClick={() => {
//                           storeBookingData();
//                           handlePaymentOption("payLater");
//                         }}
//                         className="w-full text-base font-semibold text-white px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600"
//                       >
//                         {isCorporateGuest
//                           ? "Bill to Company"
//                           : "Pay at Front Desk"}
//                       </button>
//                       <button
//                         onClick={() => {
//                           storeBookingData();
//                           handlePaymentOption("payNow");
//                         }}
//                         className="w-full text-base font-semibold bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
//                       >
//                         Pay Now
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="bg-green-50 p-4 rounded-md border border-green-200">
//                     {previewData?.room_preview?.financial_preview_type ===
//                       "recalculation_via_discount" &&
//                       refundCalculations.totalRefund > 0 && (
//                         <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
//                           <div className="flex items-start">
//                             <svg
//                               className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
//                               fill="currentColor"
//                               viewBox="0 0 20 20"
//                             >
//                               <path
//                                 fillRule="evenodd"
//                                 d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 100-2 1 1 0 000 2z"
//                                 clipRule="evenodd"
//                               />
//                             </svg>
//                             <div>
//                               <p className="text-sm text-blue-700">
//                                 Adjustment of ₹
//                                 {refundCalculations.totalRefund.toLocaleString(
//                                   "en-IN"
//                                 )}{" "}
//                                 applied successfully.
//                               </p>
//                               <p className="text-xs text-gray-600 mt-1">
//                                 This is an adjustment amount. No refund was
//                                 processed.
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                     <button
//                       onClick={() => {
//                         storeBookingData();
//                         navigate("/modification-succesful");
//                       }}
//                       className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-md transition duration-200"
//                     >
//                       Proceed
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//       {previousPricePopupOpen && (
//         <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
//           <div className="bg-white border border-gray-200 w-full max-w-xl p-4 sm:p-5 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
//             <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
//               Previous Reservation Details
//             </h2>

//             <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
//               <h3 className="font-semibold text-gray-700 mb-2 text-sm flex items-center">
//                 <svg
//                   className="w-4 h-4 mr-2"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
//                 </svg>
//                 RESERVATION INFORMATION
//               </h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Reservation Number:</span>
//                   <span className="font-medium text-gray-800 break-all">
//                     {booking?.orderid}
//                   </span>
//                 </div>
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Room Type:</span>
//                   <span className="font-medium text-gray-800">
//                     {booking?.room_type}
//                   </span>
//                 </div>
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Number of Nights:</span>
//                   <span className="text-gray-700">
//                     {booking?.number_of_nights || 1}
//                   </span>
//                 </div>
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Check-in:</span>
//                   <span className="text-gray-700">
//                     {booking?.checkindate
//                       ? formatDate(booking.checkindate)
//                       : "N/A"}
//                   </span>
//                 </div>
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Check-out:</span>
//                   <span className="text-gray-700">
//                     {booking?.checkoutdate
//                       ? formatDate(booking.checkoutdate)
//                       : "N/A"}
//                   </span>
//                 </div>
//                 <div className="flex flex-col">
//                   <span className="text-gray-500">Number of Guests:</span>
//                   <span className="text-gray-700">
//                     {booking?.number_of_guests || 1}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mb-4">
//               <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center">
//                 <svg
//                   className="w-4 h-4 mr-2"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
//                   <path
//                     fillRule="evenodd"
//                     d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//                 BILLING BREAKDOWN
//               </h3>

//               <div className="space-y-3 text-sm">
//                 {previewPrices.oldBreakdown &&
//                   previewPrices.oldBreakdown.length > 0 && (
//                     <div className="space-y-2">
//                       <div className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-1">
//                         Room Charges(Including Taxes)
//                       </div>
//                       {previewPrices.oldBreakdown.map((day, index) => (
//                         <div
//                           key={index}
//                           className="flex justify-between items-start border-gray-100"
//                         >
//                           <div className="flex-1">
//                             <div className="flex justify-between">
//                               <span className="text-gray-600">
//                                 Day {index + 1}: {formatDate(day.date)}
//                               </span>
//                               <span className="font-medium text-gray-800">
//                                 ₹
//                                 {day.day_total.toLocaleString("en-IN", {
//                                   minimumFractionDigits: 2,
//                                 })}
//                               </span>
//                             </div>
//                             {day.discount_amount > 0 && (
//                               <div className="text-xs text-gray-500 mt-1">
//                                 Discount: -₹
//                                 {day.discount_amount.toLocaleString("en-IN", {
//                                   minimumFractionDigits: 2,
//                                 })}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       ))}

//                       <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
//                         <span>Total Room Charges</span>
//                         <span className="text-gray-800">
//                           ₹
//                           {previewPrices.oldTotal.toLocaleString("en-IN", {
//                             minimumFractionDigits: 2,
//                           })}
//                         </span>
//                       </div>
//                     </div>
//                   )}

//                 <div className="space-y-2 pt-3 border-t border-gray-200">
//                   <div className="font-medium text-gray-700 text-xs uppercase tracking-wide mb-1">
//                     Amenities & Services(Including Taxes)
//                   </div>

//                   {previewData?.service_preview?.cancelled_items?.length >
//                     0 && (
//                     <div className="mb-3 p-2 bg-red-50 rounded border border-red-100">
//                       <div className="flex items-center mb-1">
//                         <svg
//                           className="w-4 h-4 text-red-500 mr-1 flex-shrink-0"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                         <span className="text-xs font-medium text-red-600">
//                           Cancelled Amenities
//                         </span>
//                       </div>
//                       {previewData.service_preview.cancelled_items.map(
//                         (item, index) => (
//                           <div
//                             key={index}
//                             className="text-xs text-gray-600 flex justify-between ml-5"
//                           >
//                             <span className="break-words pr-2">
//                               {item.type === "amenity"
//                                 ? "Amenity"
//                                 : item.type === "room_service"
//                                 ? "Room Service"
//                                 : "Food"}
//                               : {item.item_id || item.food_id}
//                               {item.quantity_cancelled > 1 &&
//                                 ` × ${item.quantity_cancelled}`}
//                             </span>
//                             <span className="font-medium line-through whitespace-nowrap">
//                               ₹{item.total_amount?.toLocaleString("en-IN")}
//                             </span>
//                           </div>
//                         )
//                       )}
//                       <div className="text-xs text-green-600 font-medium mt-1 ml-5">
//                         Refund amount: ₹
//                         {previewData.service_preview.refund_amount?.toLocaleString(
//                           "en-IN"
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {(() => {
//                     const allAmenities = [];

//                     if (booking?.enhancements) {
//                       const { food, amenities, room_services } =
//                         booking.enhancements;

//                       if (food?.items?.length > 0) {
//                         food.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Food",
//                             name: item.name,
//                             quantity: item.selected_quantity || 1,
//                             price: item.base_price || 0,
//                             total:
//                               (item.base_price || 0) *
//                               (item.selected_quantity || 1),
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }

//                       if (amenities?.items?.length > 0) {
//                         amenities.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Amenity",
//                             name: item.name,
//                             quantity: item.selected_quantity || 1,
//                             price: item.base_price || 0,
//                             total:
//                               (item.base_price || 0) *
//                               (item.selected_quantity || 1),
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }

//                       if (room_services?.items?.length > 0) {
//                         room_services.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Room Service",
//                             name: item.name,
//                             quantity: item.selected_quantity || 1,
//                             price: item.base_price || 0,
//                             total:
//                               (item.base_price || 0) *
//                               (item.selected_quantity || 1),
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }
//                     }

//                     if (booking?.enhancements_detailed) {
//                       const { food, amenities, room_services } =
//                         booking.enhancements_detailed;

//                       if (food?.items?.length > 0) {
//                         food.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Food",
//                             name: item.name,
//                             quantity: item.quantity || 1,
//                             price:
//                               (item.base_price || item.total_amount || 0) /
//                               (item.quantity || 1),
//                             total: item.total_amount || 0,
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }

//                       if (amenities?.items?.length > 0) {
//                         amenities.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Amenity",
//                             name: item.name,
//                             quantity: item.quantity || 1,
//                             price:
//                               (item.base_price || item.total_amount || 0) /
//                               (item.quantity || 1),
//                             total: item.total_amount || 0,
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }

//                       if (room_services?.items?.length > 0) {
//                         room_services.items.forEach((item) => {
//                           allAmenities.push({
//                             type: "Room Service",
//                             name: item.name,
//                             quantity: item.quantity || 1,
//                             price:
//                               (item.base_price || item.total_amount || 0) /
//                               (item.quantity || 1),
//                             total: item.total_amount || 0,
//                             is_refundable: item.refundable,
//                           });
//                         });
//                       }
//                     }

//                     if (booking?.booking_enhancements?.length > 0) {
//                       booking.booking_enhancements.forEach((item) => {
//                         allAmenities.push({
//                           type: item.type || "Service",
//                           name: item.name,
//                           quantity: item.quantity || 1,
//                           price: item.price || 0,
//                           total: (item.price || 0) * (item.quantity || 1),
//                           is_refundable: item.is_refundable,
//                         });
//                       });
//                     }

//                     if (allAmenities.length === 0) {
//                       return (
//                         <div className="text-center py-3">
//                           <p className="text-gray-500 text-sm">
//                             No amenities were selected
//                           </p>
//                         </div>
//                       );
//                     }

//                     return (
//                       <div className="space-y-2">
//                         {allAmenities.map((item, index) => (
//                           <div
//                             key={index}
//                             className="flex justify-between items-center"
//                           >
//                             <div className="break-words pr-2">
//                               <span className="text-gray-600">
//                                 {item.name} × {item.quantity}
//                               </span>
//                               {item.is_refundable && (
//                                 <div className="text-xs text-green-600">
//                                   Refundable
//                                 </div>
//                               )}
//                             </div>
//                             <span className="font-medium text-gray-800 whitespace-nowrap">
//                               ₹
//                               {item.total.toLocaleString("en-IN", {
//                                 minimumFractionDigits: 2,
//                               })}
//                             </span>
//                           </div>
//                         ))}

//                         <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
//                           <span>Amenities & Services Total</span>
//                           <span className="text-gray-800">
//                             ₹
//                             {calculatePreviousAmenitiesTotal().toLocaleString(
//                               "en-IN",
//                               {
//                                 minimumFractionDigits: 2,
//                               }
//                             )}
//                           </span>
//                         </div>
//                       </div>
//                     );
//                   })()}
//                 </div>

//                 <div className=" border-gray-200">
//                   <div className="space-y-1">
//                     {originalServiceFee > 0 && (
//                       <div className="flex justify-between">
//                         <span className="text-gray-600">Service Fee</span>
//                         <span className="font-medium text-gray-800">
//                           ₹
//                           {originalServiceFee.toLocaleString("en-IN", {
//                             minimumFractionDigits: 2,
//                           })}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="pt-3 border-t border-gray-200">
//                   <div className="flex justify-between font-bold text-base sm:text-lg">
//                     <span className="text-gray-800">Total Amount</span>
//                     <span className="text-gray-900">
//                       ₹
//                       {totalFinalAmount.toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 text-right">
//               <button
//                 onClick={() => setPreviousPricePopupOpen(false)}
//                 className="bg-purple-500 hover:bg-purple-600 text-white px-6 sm:px-8 py-2 rounded-md text-sm transition-colors"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {popupOpen && (
//         <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
//           <div className="bg-white border border-gray-300 w-full max-w-md md:max-w-lg lg:max-w-2xl p-6 rounded-2xl shadow-xl relative">
//             <button
//               className="absolute top-3 right-4 text-red-600 text-3xl"
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
//             {/* <PanolensViewer imageUrl={hotel3} /> */}
//             <div className="text-center text-gray-500">360° View Placeholder</div>
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

// export default ReservationSummary;
