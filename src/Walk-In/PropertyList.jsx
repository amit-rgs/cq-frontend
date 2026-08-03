import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaChevronLeft, FaChevronRight, FaTimes, FaHotel } from 'react-icons/fa';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { Link, useLocation } from 'react-router-dom';
import { IoImagesOutline } from 'react-icons/io5';
import { toast, ToastContainer } from 'react-toastify';
import { FiClock } from 'react-icons/fi';
import Cookies from 'js-cookie';
import { MdBreakfastDining, MdElderly, MdOutlineFreeBreakfast } from 'react-icons/md';
import ProfileCreationPopup from './ProfileCreationPopup';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// Redux action for selected room
const setSelectedRoom = (room) => ({
  type: 'SET_SELECTED_ROOM',
  payload: room,
});

// Helper function to get guest ID from token
const getGuestIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
};

// Function to get guest data with company information
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

    return {
      company_id: profileData.companyid || null,
      company_name: profileData.companyname || null,
    };
  } catch (error) {
    console.error('Error fetching guest data:', error);
    return null;
  }
};

// Map special rate types to contract IDs
const getContractIdFromSpecialRate = (specialRateType, corporateCode, promoCode) => {
  if (specialRateType === 'corporate' && corporateCode) {
    return corporateCode;
  }

  if (specialRateType === 'promo' && promoCode) {
    return promoCode;
  }

  if (specialRateType === 'senior') {
    return 'SENIOR_CITIZEN_DISCOUNT';
  }

  return null;
};

// Helper to get the applied discount source from API response
const getAppliedDiscountSource = (roomData) => {
  if (!roomData || !roomData.applied_sources_per_day) return null;

  const uniqueSources = [...new Set(roomData.applied_sources_per_day)];

  if (uniqueSources.includes('corporate')) {
    return 'corporate';
  } else if (uniqueSources.includes('senior')) {
    return 'senior';
  } else if (uniqueSources.includes('promo')) {
    return 'promo';
  }

  return null;
};

// Helper to get discount badge based on applied source
const getAppliedDiscountBadge = (appliedSource, corporateDetails, roomData) => {
  if (!appliedSource) return null;

  switch (appliedSource) {
    case 'corporate':
      return {
        text: 'Corporate Rate',
        color: 'bg-blue-100 text-blue-800',
        icon: <FaHotel />,
        type: 'corporate',
        discountText:
          corporateDetails?.contract_discount_structure?.discount_type === 'flat'
            ? `Flat ₹${corporateDetails.contract_discount_structure.flat_discount} OFF`
            : corporateDetails?.contract_discount_structure?.discount_type === 'percent'
              ? `${corporateDetails.contract_discount_structure.discount_percent}% OFF`
              : 'Corporate Discount',
      };
    case 'senior':
      const seniorPercent = roomData?.senior_discount?.percent || 20;
      return {
        text: 'Senior Citizen Rate',
        color: 'bg-green-100 text-green-800',
        icon: <MdElderly />,
        type: 'senior',
        discountText: `${seniorPercent}% OFF`,
      };
    case 'promo':
      return {
        text: 'Promo Code Applied',
        color: 'bg-purple-100 text-purple-800',
        icon: '🎟️',
        type: 'promo',
        discountText: 'Promo Discount',
      };
    default:
      return null;
  }
};

// Pricing Info Modal Component
const PricingInfoModal = ({ roomData, roomName, nights, onClose }) => {
  const {
    daily_prices = [],
    total_standard_price,
    total_dynamic_price,
    average_daily_price,
    applied_sources_per_day = [],
  } = roomData || {};

  const hasDiscount = total_standard_price > total_dynamic_price;
  const discountAmount = total_standard_price - total_dynamic_price;
  const discountPercentage = hasDiscount
    ? Math.round(((total_standard_price - total_dynamic_price) / total_standard_price) * 100)
    : 0;

  const hasCorporateDiscount = applied_sources_per_day.includes('corporate');
  const hasSeniorDiscount = applied_sources_per_day.includes('senior');
  const perDayPrice = average_daily_price || total_dynamic_price / nights;

  const getDiscountTypeLabel = () => {
    if (hasCorporateDiscount) return 'Corporate Rate Applied';
    if (hasSeniorDiscount) return 'Senior Citizen Rate Applied';
    return 'Discount Applied';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Price Breakdown for {roomName}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-xl p-2 hover:bg-gray-50 rounded-full"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Stay Duration
                </h3>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Average Per Night
                </h3>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ₹{Number(perDayPrice).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Price Calculation</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-sm text-gray-600">Base Price</span>
                <span className="text-sm font-medium text-gray-800">
                  ₹{Number(total_standard_price).toLocaleString('en-IN')}
                </span>
              </div>

              {(hasCorporateDiscount || hasSeniorDiscount) && hasDiscount && (
                <div className="flex justify-between items-center py-1 border-b border-gray-100">
                  <div>
                    <span className="text-sm text-gray-600">{getDiscountTypeLabel()}</span>
                    {discountPercentage > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {discountPercentage}% discount applied
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    -₹{Number(discountAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {(hasCorporateDiscount || hasSeniorDiscount) && hasDiscount && (
                <div className="flex justify-between items-center py-2 bg-gray-50 -mx-2 px-2 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Savings</span>
                  <span className="text-base font-bold text-gray-900">
                    ₹{Number(discountAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-xs text-gray-500 mt-0.5">
                For {nights} {nights === 1 ? 'night' : 'nights'} stay
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ₹{Number(total_dynamic_price).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Excluding taxes and fees</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              * Final amount includes applicable taxes and additional charges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageGalleryModal = ({ images, currentIndex, onClose }) => {
  const [currentImage, setCurrentImage] = useState(currentIndex);

  const handlePrev = () => {
    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-lg font-semibold">View Room Images</h1>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <div className="relative flex-1 flex items-center justify-center p-4">
          <img
            src={images[currentImage]}
            alt={`Room ${currentImage + 1}`}
            className="max-w-full max-h-[calc(80vh-120px)] object-cover"
          />
          <button
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full"
            onClick={handlePrev}
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full"
            onClick={handleNext}
          >
            <FaChevronRight size={20} />
          </button>
        </div>
        <div className="p-4 flex justify-center">
          <div className="flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentImage === index ? 'bg-gray-800' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentImage(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="flex gap-6 w-full">
    {[...Array(2)].map((_, index) => (
      <div
        key={index}
        className="border rounded-lg overflow-hidden shadow-md bg-gray-200 flex animate-pulse w-1/2"
      >
        <div className="w-1/3 bg-gray-300 h-64" />
        <div className="p-4 flex flex-col space-y-3 w-2/3">
          <div className="bg-gray-300 w-3/4 h-6" />
          <div className="bg-gray-300 w-1/2 h-4" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-2">
              <div className="bg-gray-300 w-3/4 h-4" />
              <div className="bg-gray-300 w-3/5 h-4" />
              <div className="bg-gray-300 w-2/3 h-4" />
            </div>
            <div className="space-y-2">
              <div className="bg-gray-300 w-3/4 h-4" />
              <div className="bg-gray-300 w-3/5 h-4" />
              <div className="bg-gray-300 w-2/3 h-4" />
            </div>
          </div>
          <div className="mt-auto flex justify-between items-center border-t pt-4">
            <div>
              <div className="bg-gray-300 w-16 h-4 mb-1" />
              <div className="bg-gray-300 w-24 h-6" />
            </div>
            <div className="bg-gray-300 w-20 h-8 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const PropertyList = ({ dates }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [dynamicPrices, setDynamicPrices] = useState({});
  const [availableRoomsCount, setAvailableRoomsCount] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [pricingType, setPricingType] = useState('public');
  const [corporateDetails, setCorporateDetails] = useState(null);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedRoomForPricing, setSelectedRoomForPricing] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const hasCheckedPopup = useRef(false);

  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  const reduxDates = useSelector((state) => state.selectedDates);
  const { adults, children, rooms, childrenAges } = useSelector((state) => state.formDetails);

  const { specialRateType, corporateCode, seniorCitizenDiscount, promoCode, isSpecialRateApplied } =
    useSelector((state) => state.specialRates || {});

  const { checkin_date, checkout_date } = dates || reduxDates;
  const dispatch = useDispatch();

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const nights = calculateNights(checkin_date, checkout_date);

  // Function to check if profile is complete for logged-in users
  // MODIFIED: Only checks for email AND phone number
  const checkProfileCompleteness = async () => {
    const accessToken = Cookies.get('access_token');

    // If no access token (guest user) - SHOULD SHOW POPUP
    if (!accessToken) {
      console.log('No access token found - Guest user, should show profile popup');
      return false; // Return false meaning profile is NOT complete (needs popup)
    }

    // Has access token - check profile completeness
    try {
      const guestId = Cookies.get('guest_id') || getGuestIdFromToken(accessToken);
      if (!guestId) {
        console.log('No guest ID found - Should show popup');
        return false;
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/guests/${guestId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        console.log('Profile API failed - Should show popup');
        return false;
      }

      const data = await response.json();
      const guest = data.guest;
      const profilePhoto = data.guest.profile_photo;

      console.log('Guest data received:', {
        firstname: guest.firstname,
        lastname: guest.lastname,
        emailid: guest.emailid,
        phonenumber: guest.phonenumber,
        aadhar_image_url: guest.aadhar_image_url ? 'exists' : 'missing',
        profile_photo: profilePhoto ? 'exists' : 'missing',
        companyid: guest.companyid,
        companyname: guest.companyname,
      });

      // ONLY CHECK FOR EMAIL AND PHONE NUMBER
      // If user has BOTH email AND phone number, consider profile complete
      // No need to show popup for missing Aadhar, profile photo, or company details
      const hasEmail = !!(guest.emailid && guest.emailid.trim());
      const hasPhone = !!(guest.phonenumber && guest.phonenumber.toString().trim());

      const hasEssentialInfo = hasEmail && hasPhone;

      console.log('Profile completeness check:', {
        hasEmail,
        hasPhone,
        hasEssentialInfo,
        message: hasEssentialInfo
          ? 'Has email and phone - No popup needed'
          : 'Missing email or phone - Show popup',
      });

      return hasEssentialInfo; // Return true if has both email AND phone, false otherwise
    } catch (error) {
      console.error('Error checking profile:', error);
      return false; // On error, show popup
    }
  };

  // AUTOMATICALLY SHOW POPUP ON PAGE LOAD
  useEffect(() => {
    const checkAndShowPopup = async () => {
      // Only check once
      if (hasCheckedPopup.current) return;

      console.log('=== Checking if popup should be shown automatically ===');

      // Wait for loading to complete
      if (isLoading) {
        console.log('Still loading, waiting...');
        return;
      }

      const accessToken = Cookies.get('access_token');
      console.log('Has access token:', !!accessToken);

      // Case 1: No access token (guest user) - SHOW POPUP
      if (!accessToken) {
        console.log('✅ GUEST USER - Showing profile popup automatically');
        hasCheckedPopup.current = true;
        setShowProfilePopup(true);
        return;
      }

      // Case 2: Has access token - check profile completeness
      console.log('Logged in user - checking profile completeness');
      const isComplete = await checkProfileCompleteness();
      console.log('Profile is complete:', isComplete);

      if (!isComplete) {
        console.log('✅ INCOMPLETE PROFILE - Showing profile popup automatically');
        hasCheckedPopup.current = true;
        setShowProfilePopup(true);
      } else {
        console.log('✅ Profile is complete - No popup needed');
      }
    };

    checkAndShowPopup();
  }, [isLoading]);

  // Handle continue as guest
  const handleContinueAsGuest = () => {
    console.log('Continue as guest clicked');
    setShowProfilePopup(false);
    toast.info(
      'You can continue as guest, but please complete your profile later for a better experience.'
    );
  };

  // Handle popup close
  const handlePopupClose = () => {
    console.log('Popup closed');
    setShowProfilePopup(false);
  };

  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const formatDate = (date) => date.toISOString().split('T')[0];
    return {
      checkin_date: formatDate(today),
      checkout_date: formatDate(tomorrow),
    };
  };

  const { checkin_date: initialCheckinDate, checkout_date: initialCheckoutDate } =
    checkin_date && checkout_date ? { checkin_date, checkout_date } : getDefaultDates();

  // Fetch guest company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      const data = await getGuestData();
      setCompanyData(data);
    };
    fetchCompanyData();
  }, []);

  // Fetch room types
  useEffect(() => {
    if (roomTypes.length === 0) {
      fetch(`${CQ_BASE_URL}/bq/api/roomtypes/`)
        .then((response) => response.json())
        .then((data) => setRoomTypes(data))
        .catch((error) => console.error('Error fetching room types:', error));
    }
  }, []);

  // Fetch dynamic prices
  useEffect(() => {
    const checkin_date_to_use = checkin_date || initialCheckinDate;
    const checkout_date_to_use = checkout_date || initialCheckoutDate;

    if (checkin_date_to_use && checkout_date_to_use) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          let apiUrl = `${CQ_BASE_URL}/bq/api/get-dynamic-price/?checkin_date=${checkin_date_to_use}&checkout_date=${checkout_date_to_use}`;

          const contractIdFromSpecialRate = getContractIdFromSpecialRate(
            specialRateType,
            corporateCode,
            promoCode
          );

          if (seniorCitizenDiscount) apiUrl += `&apply_senior_discount=true`;
          if (corporateCode) apiUrl += `&apply_corporate_discount=true`;
          if (contractIdFromSpecialRate) {
            apiUrl += `&contract_id=${encodeURIComponent(contractIdFromSpecialRate)}`;
          } else if (companyData && companyData.company_id) {
            apiUrl += `&companyid=${encodeURIComponent(companyData.company_id)}`;
          }

          console.log('Fetching dynamic prices from:', apiUrl);

          const response = await fetch(apiUrl);
          const data = await response.json();

          setDynamicPrices(data.dynamic_prices || {});
          setPricingType(data.pricing_type || 'public');
          setCorporateDetails(data.corporate_details || null);

          const counts = {};
          for (const roomType of roomTypes) {
            try {
              const availResponse = await fetch(
                `${CQ_BASE_URL}/bq/api/availability-room-type?room_type=${encodeURIComponent(roomType.roomtypename)}`
              );
              const availData = await availResponse.json();
              counts[roomType.roomtypename] = availData.available_rooms?.length || 0;
            } catch (error) {
              console.error(`Error fetching available rooms for ${roomType.roomtypename}:`, error);
              counts[roomType.roomtypename] = 0;
            }
          }
          setAvailableRoomsCount(counts);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
          setIsNavigatingBack(false);
        }
      };

      fetchData();
    }
  }, [
    checkin_date,
    checkout_date,
    initialCheckinDate,
    initialCheckoutDate,
    companyData,
    specialRateType,
    corporateCode,
    promoCode,
    seniorCitizenDiscount,
    isSpecialRateApplied,
    roomTypes,
  ]);

  // Track navigation
  useEffect(() => {
    const currentPath = location.pathname;
    const prevPath = prevLocationRef.current;

    if (prevPath.includes('enhance') && currentPath.includes('search')) {
      setIsNavigatingBack(true);
      setIsLoading(true);
      setDynamicPrices({});
      setAvailableRoomsCount({});
      setCorporateDetails(null);
      setPricingType('public');
    }

    prevLocationRef.current = currentPath;
  }, [location.pathname]);

  const calculateDiscountPercentage = (room) => {
    const roomData = dynamicPrices[room.roomtypename];
    if (!roomData) return 0;
    const appliedSource = getAppliedDiscountSource(roomData);
    if (!appliedSource || (appliedSource !== 'corporate' && appliedSource !== 'senior')) return 0;

    const totalStandardPrice =
      roomData.total_standard_price || roomData.average_daily_price * nights;
    const totalDynamicPrice = roomData.total_dynamic_price || roomData.total_final_price;

    if (totalStandardPrice && totalDynamicPrice && totalStandardPrice > totalDynamicPrice) {
      return Math.round(((totalStandardPrice - totalDynamicPrice) / totalStandardPrice) * 100);
    }
    return 0;
  };

  const getRoomDiscountInfo = (room) => {
    const roomData = dynamicPrices[room.roomtypename];
    if (!roomData) return null;
    const appliedSource = getAppliedDiscountSource(roomData);
    if (appliedSource === 'corporate' || appliedSource === 'senior') {
      const discountPercent = calculateDiscountPercentage(room);
      if (discountPercent > 0) {
        return {
          type: appliedSource,
          text: appliedSource === 'corporate' ? 'Corporate Rate' : 'Senior Citizen Rate',
          badgeText: `${discountPercent}% OFF`,
          color:
            appliedSource === 'corporate'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800',
          icon: appliedSource === 'corporate' ? <FaHotel /> : <MdElderly />,
        };
      }
    }
    return null;
  };

  // Handle room selection
  const handleRoomSelect = (room) => {
    const roomData = dynamicPrices[room.roomtypename] || {};
    const dynamicPrice = roomData.total_dynamic_price || room.baseprice;
    const totalTax = roomData.total_tax || 0;

    const roomWithPrice = {
      ...room,
      dynamicPrice,
      pricingType,
      corporateDetails,
      specialRateApplied: isSpecialRateApplied,
      specialRateType,
      discountType: roomData.discount_type,
      discountAmount: roomData.discount_amount,
      tax_applicable: totalTax,
      average_daily_price: roomData.average_daily_price,
      total_final_price: roomData.total_final_price,
      total_standard_price: roomData.total_standard_price,
      total_dynamic_price: roomData.total_dynamic_price,
      applied_sources_per_day: roomData.applied_sources_per_day,
      senior_discount: roomData.senior_discount || null,
      corporate_discount: roomData.corporate_discount || null,
      daily_prices: roomData.daily_prices || [],
      nights: nights,
    };

    dispatch(setSelectedRoom(roomWithPrice));
  };

  const canRoomAccommodateGuests = (room) => {
    const maxOccupancy = room.max_occupancy || 2;
    if (adults > maxOccupancy) return false;
    if (adults + children > maxOccupancy + 1) return false;
    return true;
  };

  const handleShowPricingInfo = (e, room) => {
    e.stopPropagation();
    const roomData = dynamicPrices[room.roomtypename] || {};
    setSelectedRoomForPricing({
      roomData,
      roomName: room.roomtypename,
      nights,
    });
    setShowPricingModal(true);
  };

  if (isLoading || isNavigatingBack) {
    return (
      <div className="mx-auto mt-2 flex flex-col gap-4 px-5 py-6">
        {[...Array(2)].map((_, index) => (
          <SkeletonLoader key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-2 flex flex-col gap-4 px-3 md:px-5 py-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Select Your Room
        </h1>
        <p className="text-sm md:text-base text-black mt-1 mb-4">
          Enter your stay details and reserve your preferred room
        </p>

        {roomTypes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No room types available</p>
          </div>
        ) : (
          [...roomTypes]
            .sort((a, b) => {
              const priceA = dynamicPrices[a.roomtypename]?.total_dynamic_price || a.baseprice;
              const priceB = dynamicPrices[b.roomtypename]?.total_dynamic_price || b.baseprice;
              return priceA - priceB;
            })
            .reduce((rows, room, index) => {
              if (window.innerWidth < 768) {
                rows.push([room]);
              } else if (index % 2 === 0) {
                rows.push([]);
                rows[rows.length - 1].push(room);
              } else {
                rows[rows.length - 1].push(room);
              }
              return rows;
            }, [])
            .map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-col md:flex-row gap-4 w-full">
                {row.map((room, index) => {
                  const roomData = dynamicPrices[room.roomtypename] || {};
                  const totalStandardPrice =
                    roomData.total_standard_price || room.baseprice * nights;
                  const totalDynamicPrice = roomData.total_dynamic_price || room.baseprice * nights;
                  const discountInfo = getRoomDiscountInfo(room);
                  const appliedSource = getAppliedDiscountSource(roomData);
                  const showDiscount = appliedSource === 'corporate' || appliedSource === 'senior';
                  const perDayPrice = roomData.average_daily_price || totalDynamicPrice / nights;
                  const discountAmount = totalStandardPrice - totalDynamicPrice;

                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden shadow-md bg-white flex flex-col md:flex-row hover:shadow-xl transition duration-300 w-full md:w-1/2"
                      onClick={() => handleRoomSelect(room)}
                    >
                      <div className="w-full md:w-1/3 h-64 md:h-auto">
                        <ImageCarousel images={room.image_urls} />
                      </div>

                      <div className="p-4 flex flex-col space-y-2 w-full md:w-2/3">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                          <div>
                            <h2 className="text-xl md:text-2xl font-poppins font-bold text-gray-800">
                              {room.roomtypename}
                            </h2>
                            {discountInfo && (
                              <div className="mt-1">
                                <p
                                  className={`text-sm font-semibold ${discountInfo.color} px-2 py-1 inline-block rounded`}
                                >
                                  {discountInfo.text}
                                </p>
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded text-sm font-semibold whitespace-nowrap ${
                              availableRoomsCount[room.roomtypename] > 0
                                ? 'bg-white text-red-500'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {availableRoomsCount[room.roomtypename] > 0 ? (
                              <>
                                <FiClock className="inline-block mr-1 mb-1" />
                                Only {availableRoomsCount[room.roomtypename]} rooms left
                              </>
                            ) : (
                              'Sold Out'
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-gray-900 font-md font-light">
                          {room.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div>
                            <h3 className="text-lg font-poppins font-semibold text-gray-800">
                              Amenities:
                            </h3>
                            <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
                              {room.amenities && room.amenities.length > 0 ? (
                                room.amenities
                                  .slice(0, 3)
                                  .map((amenity, i) => <li key={i}>{amenity.name}</li>)
                              ) : (
                                <li>No amenities available</li>
                              )}
                              {room.amenities?.length > 3 && (
                                <li className="text-blue-500">+{room.amenities.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-poppins font-semibold text-gray-800">
                              Services:
                            </h3>
                            <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
                              {room.service_categories && room.service_categories.length > 0 ? (
                                room.service_categories
                                  .slice(0, 3)
                                  .map((service, i) => <li key={i}>{service.name}</li>)
                              ) : (
                                <li>No services available</li>
                              )}
                              {room.service_categories?.length > 3 && (
                                <li className="text-blue-500">
                                  +{room.service_categories.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-1">
                          <p className="text-sm font-semibold bg-orange-100 text-orange-800 px-2 py-1 inline-block rounded">
                            <MdOutlineFreeBreakfast className="inline mr-1" /> Breakfast
                            Complimentary
                          </p>
                        </div>

                        <div className="text-sm text-gray-600 mt-2 flex items-center gap-1 font-semibold flex-wrap">
                          <span className="text-lg font-poppins font-semibold text-gray-800">
                            Max occupancy:
                          </span>
                          {room.max_occupancy || 2} Guests
                        </div>

                        <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t gap-3">
                          <div className="flex flex-col w-full sm:w-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                              {showDiscount ? (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-sm text-gray-500 line-through">
                                      ₹{Number(totalStandardPrice).toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">/total stay</span>
                                  </div>
                                  <button
                                    onClick={(e) => handleShowPricingInfo(e, room)}
                                    className="flex items-center justify-center rounded-full text-black transition"
                                    title="View pricing details"
                                  >
                                    <IoMdInformationCircleOutline size={20} />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-700">
                                    ₹{Number(perDayPrice).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">/night</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <div>
                                <p className="text-xl md:text-2xl font-bold text-black">
                                  ₹{Number(totalDynamicPrice).toLocaleString('en-IN')}
                                  <span className="text-[10px] md:text-[12px] font-normal text-gray-600 whitespace-normal">
                                    {' '}
                                    /Excluding taxes and fees
                                  </span>
                                </p>
                              </div>
                            </div>
                            {showDiscount && discountAmount > 0 && (
                              <div className="mb-2">
                                <p className="text-xs md:text-sm font-semibold text-green-600">
                                  Special Rate Applied • Save ₹
                                  {Number(discountAmount).toLocaleString('en-IN')}
                                </p>
                              </div>
                            )}
                          </div>

                          <Link to="/enhance-checkin-stay" className="w-full sm:w-auto">
                            <button
                              className={`py-2 font-semibold rounded-md transition text-sm w-full sm:w-auto ${
                                availableRoomsCount[room.roomtypename] > 0 &&
                                canRoomAccommodateGuests(room)
                                  ? 'bg-purple-500 text-white hover:bg-purple-600 px-4 md:px-6'
                                  : 'bg-gray-400 text-white cursor-not-allowed px-2'
                              }`}
                              disabled={
                                availableRoomsCount[room.roomtypename] === 0 ||
                                !canRoomAccommodateGuests(room)
                              }
                            >
                              {availableRoomsCount[room.roomtypename] > 0 &&
                              canRoomAccommodateGuests(room)
                                ? 'Select'
                                : 'Not available'}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
        )}

        {/* Pricing Info Modal */}
        {showPricingModal && selectedRoomForPricing && (
          <PricingInfoModal
            roomData={selectedRoomForPricing.roomData}
            roomName={selectedRoomForPricing.roomName}
            nights={selectedRoomForPricing.nights}
            onClose={() => setShowPricingModal(false)}
          />
        )}

        {/* Profile Creation Popup - Shows automatically based on conditions */}
        {showProfilePopup && (
          <ProfileCreationPopup
            isOpen={showProfilePopup}
            onClose={handlePopupClose}
            onContinueAsGuest={handleContinueAsGuest}
          />
        )}

        <ToastContainer />
      </div>
    </div>
  );
};

const ImageCarousel = ({ images = [] }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const validImages =
    Array.isArray(images) && images.length > 0
      ? images
      : [
          'https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg',
        ];

  useEffect(() => {
    if (isPaused || validImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % validImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [validImages.length, isPaused]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    setIsPaused(true);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % validImages.length);
    setIsPaused(true);
  };

  const openGallery = (e) => {
    e.stopPropagation();
    setShowGallery(true);
    setIsPaused(true);
  };

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full cursor-pointer" onClick={openGallery}>
        <img src={validImages[currentImage]} alt="Room" className="w-full h-full object-cover" />
      </div>
      <button
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
        onClick={handlePrev}
      >
        <FaChevronLeft size={20} />
      </button>
      <button
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
        onClick={handleNext}
      >
        <FaChevronRight size={20} />
      </button>
      <button
        className="absolute right-2 bottom-2 bg-gray-800 text-white p-2 text-xs rounded-full hover:bg-gray-700 transition"
        onClick={openGallery}
      >
        <IoImagesOutline size={20} />
      </button>
      {showGallery && (
        <ImageGalleryModal
          images={validImages}
          currentIndex={currentImage}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default PropertyList;

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   FaChevronLeft,
//   FaChevronRight,
//   FaTimes,
//   FaHotel,
// } from "react-icons/fa";
// import { IoMdInformationCircleOutline } from "react-icons/io";
// import { Link, useLocation } from "react-router-dom";
// import { IoImagesOutline } from "react-icons/io5";
// import { toast, ToastContainer } from "react-toastify";
// import { FiClock } from "react-icons/fi";
// import Cookies from "js-cookie";
// import {
//   MdBreakfastDining,
//   MdElderly,
//   MdOutlineFreeBreakfast,
// } from "react-icons/md";
// import ProfileCreationPopup from "./ProfileCreationPopup";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// // Redux action for selected room
// const setSelectedRoom = (room) => ({
//   type: "SET_SELECTED_ROOM",
//   payload: room,
// });

// // Helper function to get guest ID from token
// const getGuestIdFromToken = (token) => {
//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     return payload.sub;
//   } catch (e) {
//     console.error("Error parsing token:", e);
//     return null;
//   }
// };

// // Function to get guest data with company information
// const getGuestData = async () => {
//   const accessToken = Cookies.get("access_token");
//   if (!accessToken) return null;

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

//     return {
//       company_id: profileData.companyid || null,
//       company_name: profileData.companyname || null,
//     };
//   } catch (error) {
//     console.error("Error fetching guest data:", error);
//     return null;
//   }
// };

// // Map special rate types to contract IDs
// const getContractIdFromSpecialRate = (
//   specialRateType,
//   corporateCode,
//   promoCode
// ) => {
//   if (specialRateType === "corporate" && corporateCode) {
//     return corporateCode;
//   }

//   if (specialRateType === "promo" && promoCode) {
//     return promoCode;
//   }

//   if (specialRateType === "senior") {
//     return "SENIOR_CITIZEN_DISCOUNT";
//   }

//   return null;
// };

// // Helper to get the applied discount source from API response
// const getAppliedDiscountSource = (roomData) => {
//   if (!roomData || !roomData.applied_sources_per_day) return null;

//   const uniqueSources = [...new Set(roomData.applied_sources_per_day)];

//   if (uniqueSources.includes("corporate")) {
//     return "corporate";
//   } else if (uniqueSources.includes("senior")) {
//     return "senior";
//   } else if (uniqueSources.includes("promo")) {
//     return "promo";
//   }

//   return null;
// };

// // Helper to get discount badge based on applied source
// const getAppliedDiscountBadge = (appliedSource, corporateDetails, roomData) => {
//   if (!appliedSource) return null;

//   switch (appliedSource) {
//     case "corporate":
//       return {
//         text: "Corporate Rate",
//         color: "bg-blue-100 text-blue-800",
//         icon: <FaHotel />,
//         type: "corporate",
//         discountText:
//           corporateDetails?.contract_discount_structure?.discount_type ===
//           "flat"
//             ? `Flat ₹${corporateDetails.contract_discount_structure.flat_discount} OFF`
//             : corporateDetails?.contract_discount_structure?.discount_type ===
//               "percent"
//             ? `${corporateDetails.contract_discount_structure.discount_percent}% OFF`
//             : "Corporate Discount",
//       };
//     case "senior":
//       const seniorPercent = roomData?.senior_discount?.percent || 20;
//       return {
//         text: "Senior Citizen Rate",
//         color: "bg-green-100 text-green-800",
//         icon: <MdElderly />,
//         type: "senior",
//         discountText: `${seniorPercent}% OFF`,
//       };
//     case "promo":
//       return {
//         text: "Promo Code Applied",
//         color: "bg-purple-100 text-purple-800",
//         icon: "🎟️",
//         type: "promo",
//         discountText: "Promo Discount",
//       };
//     default:
//       return null;
//   }
// };

// // Pricing Info Modal Component
// const PricingInfoModal = ({ roomData, roomName, nights, onClose }) => {
//   const {
//     daily_prices = [],
//     total_standard_price,
//     total_dynamic_price,
//     average_daily_price,
//     applied_sources_per_day = [],
//   } = roomData || {};

//   const hasDiscount = total_standard_price > total_dynamic_price;
//   const discountAmount = total_standard_price - total_dynamic_price;
//   const discountPercentage = hasDiscount
//     ? Math.round(
//         ((total_standard_price - total_dynamic_price) / total_standard_price) *
//           100
//       )
//     : 0;

//   const hasCorporateDiscount = applied_sources_per_day.includes("corporate");
//   const hasSeniorDiscount = applied_sources_per_day.includes("senior");
//   const perDayPrice = average_daily_price || total_dynamic_price / nights;

//   const getDiscountTypeLabel = () => {
//     if (hasCorporateDiscount) return "Corporate Rate Applied";
//     if (hasSeniorDiscount) return "Senior Citizen Rate Applied";
//     return "Discount Applied";
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
//       <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
//         <div className="flex justify-between items-center p-6 border-b border-gray-100">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900 tracking-tight">
//               Price Breakdown for {roomName}
//             </h1>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-xl p-2 hover:bg-gray-50 rounded-full"
//           >
//             <FaTimes />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50">
//             <div className="flex justify-between items-center mb-4">
//               <div>
//                 <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//                   Stay Duration
//                 </h3>
//                 <p className="text-lg font-bold text-gray-900 mt-1">
//                   {nights} {nights === 1 ? "Night" : "Nights"}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//                   Average Per Night
//                 </h3>
//                 <p className="text-lg font-bold text-gray-900 mt-1">
//                   ₹{Number(perDayPrice).toLocaleString("en-IN")}
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="px-6 py-3">
//             <h3 className="text-sm font-semibold text-gray-700 mb-1">
//               Price Calculation
//             </h3>

//             <div className="space-y-2">
//               <div className="flex justify-between items-center py-1 border-b border-gray-100">
//                 <span className="text-sm text-gray-600">Base Price</span>
//                 <span className="text-sm font-medium text-gray-800">
//                   ₹{Number(total_standard_price).toLocaleString("en-IN")}
//                 </span>
//               </div>

//               {(hasCorporateDiscount || hasSeniorDiscount) && hasDiscount && (
//                 <div className="flex justify-between items-center py-1 border-b border-gray-100">
//                   <div>
//                     <span className="text-sm text-gray-600">
//                       {getDiscountTypeLabel()}
//                     </span>
//                     {discountPercentage > 0 && (
//                       <p className="text-xs text-gray-500 mt-0.5">
//                         {discountPercentage}% discount applied
//                       </p>
//                     )}
//                   </div>
//                   <span className="text-sm font-semibold text-gray-900">
//                     -₹{Number(discountAmount).toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               )}

//               {(hasCorporateDiscount || hasSeniorDiscount) && hasDiscount && (
//                 <div className="flex justify-between items-center py-2 bg-gray-50 -mx-2 px-2 rounded-lg">
//                   <span className="text-sm font-medium text-gray-700">
//                     Total Savings
//                   </span>
//                   <span className="text-base font-bold text-gray-900">
//                     ₹{Number(discountAmount).toLocaleString("en-IN")}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-gray-100 bg-gray-50 px-6 py-2">
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-sm font-medium text-gray-600">Total Amount</p>
//               <p className="text-xs text-gray-500 mt-0.5">
//                 For {nights} {nights === 1 ? "night" : "nights"} stay
//               </p>
//             </div>
//             <div className="text-right">
//               <p className="text-2xl font-bold text-gray-900">
//                 ₹{Number(total_dynamic_price).toLocaleString("en-IN")}
//               </p>
//               <p className="text-xs text-gray-500 mt-1">
//                 Excluding taxes and fees
//               </p>
//             </div>
//           </div>
//           <div className="mt-4 pt-4 border-t border-gray-200">
//             <p className="text-xs text-gray-400 text-center">
//               * Final amount includes applicable taxes and additional charges
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ImageGalleryModal = ({ images, currentIndex, onClose }) => {
//   const [currentImage, setCurrentImage] = useState(currentIndex);

//   const handlePrev = () => {
//     setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
//   };

//   const handleNext = () => {
//     setCurrentImage((prev) => (prev + 1) % images.length);
//   };

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "ArrowLeft") handlePrev();
//       else if (e.key === "ArrowRight") handleNext();
//       else if (e.key === "Escape") onClose();
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
//       <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
//         <div className="flex justify-between items-center p-4 border-b">
//           <h1 className="text-lg font-semibold">View Room Images</h1>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             <FaTimes />
//           </button>
//         </div>
//         <div className="relative flex-1 flex items-center justify-center p-4">
//           <img
//             src={images[currentImage]}
//             alt={`Room ${currentImage + 1}`}
//             className="max-w-full max-h-[calc(80vh-120px)] object-cover"
//           />
//           <button
//             className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full"
//             onClick={handlePrev}
//           >
//             <FaChevronLeft size={20} />
//           </button>
//           <button
//             className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full"
//             onClick={handleNext}
//           >
//             <FaChevronRight size={20} />
//           </button>
//         </div>
//         <div className="p-4 flex justify-center">
//           <div className="flex space-x-2">
//             {images.map((_, index) => (
//               <button
//                 key={index}
//                 className={`w-2 h-2 rounded-full ${
//                   currentImage === index ? "bg-gray-800" : "bg-gray-300"
//                 }`}
//                 onClick={() => setCurrentImage(index)}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const SkeletonLoader = () => (
//   <div className="flex gap-6 w-full">
//     {[...Array(2)].map((_, index) => (
//       <div
//         key={index}
//         className="border rounded-lg overflow-hidden shadow-md bg-gray-200 flex animate-pulse w-1/2"
//       >
//         <div className="w-1/3 bg-gray-300 h-64" />
//         <div className="p-4 flex flex-col space-y-3 w-2/3">
//           <div className="bg-gray-300 w-3/4 h-6" />
//           <div className="bg-gray-300 w-1/2 h-4" />
//           <div className="grid grid-cols-2 gap-2 mt-2">
//             <div className="space-y-2">
//               <div className="bg-gray-300 w-3/4 h-4" />
//               <div className="bg-gray-300 w-3/5 h-4" />
//               <div className="bg-gray-300 w-2/3 h-4" />
//             </div>
//             <div className="space-y-2">
//               <div className="bg-gray-300 w-3/4 h-4" />
//               <div className="bg-gray-300 w-3/5 h-4" />
//               <div className="bg-gray-300 w-2/3 h-4" />
//             </div>
//           </div>
//           <div className="mt-auto flex justify-between items-center border-t pt-4">
//             <div>
//               <div className="bg-gray-300 w-16 h-4 mb-1" />
//               <div className="bg-gray-300 w-24 h-6" />
//             </div>
//             <div className="bg-gray-300 w-20 h-8 rounded-md" />
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// const PropertyList = ({ dates }) => {
//   const [roomTypes, setRoomTypes] = useState([]);
//   const [dynamicPrices, setDynamicPrices] = useState({});
//   const [availableRoomsCount, setAvailableRoomsCount] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [companyData, setCompanyData] = useState(null);
//   const [pricingType, setPricingType] = useState("public");
//   const [corporateDetails, setCorporateDetails] = useState(null);
//   const [isNavigatingBack, setIsNavigatingBack] = useState(false);
//   const [showPricingModal, setShowPricingModal] = useState(false);
//   const [selectedRoomForPricing, setSelectedRoomForPricing] = useState(null);
//   const [showProfilePopup, setShowProfilePopup] = useState(false);

//   const hasCheckedPopup = useRef(false);

//   const location = useLocation();
//   const prevLocationRef = useRef(location.pathname);

//   const reduxDates = useSelector((state) => state.selectedDates);
//   const { adults, children, rooms, childrenAges } = useSelector(
//     (state) => state.formDetails
//   );

//   const {
//     specialRateType,
//     corporateCode,
//     seniorCitizenDiscount,
//     promoCode,
//     isSpecialRateApplied,
//   } = useSelector((state) => state.specialRates || {});

//   const { checkin_date, checkout_date } = dates || reduxDates;
//   const dispatch = useDispatch();

//   const calculateNights = (checkIn, checkOut) => {
//     if (!checkIn || !checkOut) return 0;
//     const checkInDate = new Date(checkIn);
//     const checkOutDate = new Date(checkOut);
//     const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//     return Math.ceil(timeDiff / (1000 * 3600 * 24));
//   };

//   const nights = calculateNights(checkin_date, checkout_date);

//   // Function to check if profile is complete for logged-in users
//   const checkProfileCompleteness = async () => {
//     const accessToken = Cookies.get("access_token");

//     // If no access token (guest user) - SHOULD SHOW POPUP
//     if (!accessToken) {
//       console.log("No access token found - Guest user, should show profile popup");
//       return false; // Return false meaning profile is NOT complete (needs popup)
//     }

//     // Has access token - check profile completeness
//     try {
//       const guestId = Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
//       if (!guestId) {
//         console.log("No guest ID found - Should show popup");
//         return false;
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/guests/${guestId}`, {
//         headers: { Authorization: `Bearer ${accessToken}` }
//       });

//       if (!response.ok) {
//         console.log("Profile API failed - Should show popup");
//         return false;
//       }

//       const data = await response.json();
//       const guest = data.guest;
//       const profilePhoto = data.guest.profile_photo;

//       console.log("Guest data received:", {
//         firstname: guest.firstname,
//         lastname: guest.lastname,
//         emailid: guest.emailid,
//         phonenumber: guest.phonenumber,
//         aadhar_image_url: guest.aadhar_image_url ? "exists" : "missing",
//         profile_photo: profilePhoto ? "exists" : "missing",
//         companyid: guest.companyid,
//         companyname: guest.companyname
//       });

//       // Check if all required fields are present - ensure boolean return
//       const hasFirstname = !!(guest.firstname && guest.firstname.trim());
//       const hasLastname = !!(guest.lastname && guest.lastname.trim());
//       const hasEmail = !!(guest.emailid && guest.emailid.trim());
//       const hasPhone = !!(guest.phonenumber && guest.phonenumber.toString().trim());
//       const hasAadhar = !!(guest.aadhar_image_url && guest.aadhar_image_url.trim());
//       const hasProfilePhoto = !!(profilePhoto && profilePhoto.trim());
//       const hasCompanyId = !!(guest.companyid && guest.companyid.trim());
//       const hasCompanyName = !!(guest.companyname && guest.companyname.trim());

//       const isComplete = hasFirstname && hasLastname && hasEmail && hasPhone &&
//                          hasAadhar && hasProfilePhoto && hasCompanyId && hasCompanyName;

//       console.log("Profile completeness check:", {
//         hasFirstname, hasLastname, hasEmail, hasPhone,
//         hasAadhar, hasProfilePhoto, hasCompanyId, hasCompanyName,
//         isComplete
//       });

//       return isComplete; // Return true if complete, false if incomplete
//     } catch (error) {
//       console.error("Error checking profile:", error);
//       return false; // On error, show popup
//     }
//   };

//   // AUTOMATICALLY SHOW POPUP ON PAGE LOAD
//   useEffect(() => {
//     const checkAndShowPopup = async () => {
//       // Only check once
//       if (hasCheckedPopup.current) return;

//       console.log("=== Checking if popup should be shown automatically ===");

//       // Wait for loading to complete
//       if (isLoading) {
//         console.log("Still loading, waiting...");
//         return;
//       }

//       const accessToken = Cookies.get("access_token");
//       console.log("Has access token:", !!accessToken);

//       // Case 1: No access token (guest user) - SHOW POPUP
//       if (!accessToken) {
//         console.log("✅ GUEST USER - Showing profile popup automatically");
//         hasCheckedPopup.current = true;
//         setShowProfilePopup(true);
//         return;
//       }

//       // Case 2: Has access token - check profile completeness
//       console.log("Logged in user - checking profile completeness");
//       const isComplete = await checkProfileCompleteness();
//       console.log("Profile is complete:", isComplete);

//       if (!isComplete) {
//         console.log("✅ INCOMPLETE PROFILE - Showing profile popup automatically");
//         hasCheckedPopup.current = true;
//         setShowProfilePopup(true);
//       } else {
//         console.log("✅ Profile is complete - No popup needed");
//       }
//     };

//     checkAndShowPopup();
//   }, [isLoading]);

//   // Handle continue as guest
//   const handleContinueAsGuest = () => {
//     console.log("Continue as guest clicked");
//     setShowProfilePopup(false);
//     toast.info(
//       "You can continue as guest, but please complete your profile later for a better experience."
//     );
//   };

//   // Handle popup close
//   const handlePopupClose = () => {
//     console.log("Popup closed");
//     setShowProfilePopup(false);
//   };

//   const getDefaultDates = () => {
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);
//     const formatDate = (date) => date.toISOString().split("T")[0];
//     return {
//       checkin_date: formatDate(today),
//       checkout_date: formatDate(tomorrow),
//     };
//   };

//   const {
//     checkin_date: initialCheckinDate,
//     checkout_date: initialCheckoutDate,
//   } =
//     checkin_date && checkout_date
//       ? { checkin_date, checkout_date }
//       : getDefaultDates();

//   // Fetch guest company data
//   useEffect(() => {
//     const fetchCompanyData = async () => {
//       const data = await getGuestData();
//       setCompanyData(data);
//     };
//     fetchCompanyData();
//   }, []);

//   // Fetch room types
//   useEffect(() => {
//     if (roomTypes.length === 0) {
//       fetch(`${CQ_BASE_URL}/bq/api/roomtypes/`)
//         .then((response) => response.json())
//         .then((data) => setRoomTypes(data))
//         .catch((error) => console.error("Error fetching room types:", error));
//     }
//   }, []);

//   // Fetch dynamic prices
//   useEffect(() => {
//     const checkin_date_to_use = checkin_date || initialCheckinDate;
//     const checkout_date_to_use = checkout_date || initialCheckoutDate;

//     if (checkin_date_to_use && checkout_date_to_use) {
//       const fetchData = async () => {
//         setIsLoading(true);
//         try {
//           let apiUrl = `${CQ_BASE_URL}/bq/api/get-dynamic-price/?checkin_date=${checkin_date_to_use}&checkout_date=${checkout_date_to_use}`;

//           const contractIdFromSpecialRate = getContractIdFromSpecialRate(
//             specialRateType,
//             corporateCode,
//             promoCode
//           );

//           if (seniorCitizenDiscount) apiUrl += `&apply_senior_discount=true`;
//           if (corporateCode) apiUrl += `&apply_corporate_discount=true`;
//           if (contractIdFromSpecialRate) {
//             apiUrl += `&contract_id=${encodeURIComponent(contractIdFromSpecialRate)}`;
//           } else if (companyData && companyData.company_id) {
//             apiUrl += `&companyid=${encodeURIComponent(companyData.company_id)}`;
//           }

//           console.log("Fetching dynamic prices from:", apiUrl);

//           const response = await fetch(apiUrl);
//           const data = await response.json();

//           setDynamicPrices(data.dynamic_prices || {});
//           setPricingType(data.pricing_type || "public");
//           setCorporateDetails(data.corporate_details || null);

//           const counts = {};
//           for (const roomType of roomTypes) {
//             try {
//               const availResponse = await fetch(
//                 `${CQ_BASE_URL}/bq/api/availability-room-type?room_type=${encodeURIComponent(roomType.roomtypename)}`
//               );
//               const availData = await availResponse.json();
//               counts[roomType.roomtypename] = availData.available_rooms?.length || 0;
//             } catch (error) {
//               console.error(`Error fetching available rooms for ${roomType.roomtypename}:`, error);
//               counts[roomType.roomtypename] = 0;
//             }
//           }
//           setAvailableRoomsCount(counts);
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         } finally {
//           setIsLoading(false);
//           setIsNavigatingBack(false);
//         }
//       };

//       fetchData();
//     }
//   }, [
//     checkin_date,
//     checkout_date,
//     initialCheckinDate,
//     initialCheckoutDate,
//     companyData,
//     specialRateType,
//     corporateCode,
//     promoCode,
//     seniorCitizenDiscount,
//     isSpecialRateApplied,
//     roomTypes,
//   ]);

//   // Track navigation
//   useEffect(() => {
//     const currentPath = location.pathname;
//     const prevPath = prevLocationRef.current;

//     if (prevPath.includes("enhance") && currentPath.includes("search")) {
//       setIsNavigatingBack(true);
//       setIsLoading(true);
//       setDynamicPrices({});
//       setAvailableRoomsCount({});
//       setCorporateDetails(null);
//       setPricingType("public");
//     }

//     prevLocationRef.current = currentPath;
//   }, [location.pathname]);

//   const calculateDiscountPercentage = (room) => {
//     const roomData = dynamicPrices[room.roomtypename];
//     if (!roomData) return 0;
//     const appliedSource = getAppliedDiscountSource(roomData);
//     if (!appliedSource || (appliedSource !== "corporate" && appliedSource !== "senior")) return 0;

//     const totalStandardPrice = roomData.total_standard_price || roomData.average_daily_price * nights;
//     const totalDynamicPrice = roomData.total_dynamic_price || roomData.total_final_price;

//     if (totalStandardPrice && totalDynamicPrice && totalStandardPrice > totalDynamicPrice) {
//       return Math.round(((totalStandardPrice - totalDynamicPrice) / totalStandardPrice) * 100);
//     }
//     return 0;
//   };

//   const getRoomDiscountInfo = (room) => {
//     const roomData = dynamicPrices[room.roomtypename];
//     if (!roomData) return null;
//     const appliedSource = getAppliedDiscountSource(roomData);
//     if (appliedSource === "corporate" || appliedSource === "senior") {
//       const discountPercent = calculateDiscountPercentage(room);
//       if (discountPercent > 0) {
//         return {
//           type: appliedSource,
//           text: appliedSource === "corporate" ? "Corporate Rate" : "Senior Citizen Rate",
//           badgeText: `${discountPercent}% OFF`,
//           color: appliedSource === "corporate" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800",
//           icon: appliedSource === "corporate" ? <FaHotel /> : <MdElderly />,
//         };
//       }
//     }
//     return null;
//   };

//   // Handle room selection
//   const handleRoomSelect = (room) => {
//     const roomData = dynamicPrices[room.roomtypename] || {};
//     const dynamicPrice = roomData.total_dynamic_price || room.baseprice;
//     const totalTax = roomData.total_tax || 0;

//     const roomWithPrice = {
//       ...room,
//       dynamicPrice,
//       pricingType,
//       corporateDetails,
//       specialRateApplied: isSpecialRateApplied,
//       specialRateType,
//       discountType: roomData.discount_type,
//       discountAmount: roomData.discount_amount,
//       tax_applicable: totalTax,
//       average_daily_price: roomData.average_daily_price,
//       total_final_price: roomData.total_final_price,
//       total_standard_price: roomData.total_standard_price,
//       total_dynamic_price: roomData.total_dynamic_price,
//       applied_sources_per_day: roomData.applied_sources_per_day,
//       senior_discount: roomData.senior_discount || null,
//       corporate_discount: roomData.corporate_discount || null,
//       daily_prices: roomData.daily_prices || [],
//       nights: nights,
//     };

//     dispatch(setSelectedRoom(roomWithPrice));
//   };

//   const canRoomAccommodateGuests = (room) => {
//     const maxOccupancy = room.max_occupancy || 2;
//     if (adults > maxOccupancy) return false;
//     if (adults + children > maxOccupancy + 1) return false;
//     return true;
//   };

//   const handleShowPricingInfo = (e, room) => {
//     e.stopPropagation();
//     const roomData = dynamicPrices[room.roomtypename] || {};
//     setSelectedRoomForPricing({
//       roomData,
//       roomName: room.roomtypename,
//       nights,
//     });
//     setShowPricingModal(true);
//   };

//   if (isLoading || isNavigatingBack) {
//     return (
//       <div className="mx-auto mt-2 flex flex-col gap-4 px-5 py-6">
//         {[...Array(2)].map((_, index) => (
//           <SkeletonLoader key={index} />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto mt-2 flex flex-col gap-4 px-3 md:px-5 py-6">
//       <div className="mb-6 border-b border-gray-200 pb-4">
//         <h1 className="text-xl md:text-3xl font-bold text-gray-900 tracking-tight">
//           Select Your Room
//         </h1>
//         <p className="text-sm md:text-base text-black mt-1 mb-4">
//           Enter your stay details and reserve your preferred room
//         </p>

//         {roomTypes.length === 0 ? (
//           <div className="text-center py-10">
//             <p className="text-gray-600">No room types available</p>
//           </div>
//         ) : (
//           [...roomTypes]
//             .sort((a, b) => {
//               const priceA = dynamicPrices[a.roomtypename]?.total_dynamic_price || a.baseprice;
//               const priceB = dynamicPrices[b.roomtypename]?.total_dynamic_price || b.baseprice;
//               return priceA - priceB;
//             })
//             .reduce((rows, room, index) => {
//               if (window.innerWidth < 768) {
//                 rows.push([room]);
//               } else if (index % 2 === 0) {
//                 rows.push([]);
//                 rows[rows.length - 1].push(room);
//               } else {
//                 rows[rows.length - 1].push(room);
//               }
//               return rows;
//             }, [])
//             .map((row, rowIndex) => (
//               <div key={rowIndex} className="flex flex-col md:flex-row gap-4 w-full">
//                 {row.map((room, index) => {
//                   const roomData = dynamicPrices[room.roomtypename] || {};
//                   const totalStandardPrice = roomData.total_standard_price || room.baseprice * nights;
//                   const totalDynamicPrice = roomData.total_dynamic_price || room.baseprice * nights;
//                   const discountInfo = getRoomDiscountInfo(room);
//                   const appliedSource = getAppliedDiscountSource(roomData);
//                   const showDiscount = appliedSource === "corporate" || appliedSource === "senior";
//                   const perDayPrice = roomData.average_daily_price || totalDynamicPrice / nights;
//                   const discountAmount = totalStandardPrice - totalDynamicPrice;

//                   return (
//                     <div
//                       key={index}
//                       className="border rounded-lg overflow-hidden shadow-md bg-white flex flex-col md:flex-row hover:shadow-xl transition duration-300 w-full md:w-1/2"
//                       onClick={() => handleRoomSelect(room)}
//                     >
//                       <div className="w-full md:w-1/3 h-64 md:h-auto">
//                         <ImageCarousel images={room.image_urls} />
//                       </div>

//                       <div className="p-4 flex flex-col space-y-2 w-full md:w-2/3">
//                         <div className="flex flex-col md:flex-row justify-between items-start gap-2">
//                           <div>
//                             <h2 className="text-xl md:text-2xl font-poppins font-bold text-gray-800">
//                               {room.roomtypename}
//                             </h2>
//                             {discountInfo && (
//                               <div className="mt-1">
//                                 <p className={`text-sm font-semibold ${discountInfo.color} px-2 py-1 inline-block rounded`}>
//                                   {discountInfo.text}
//                                 </p>
//                               </div>
//                             )}
//                           </div>
//                           <span className={`px-3 py-1 rounded text-sm font-semibold whitespace-nowrap ${
//                             availableRoomsCount[room.roomtypename] > 0
//                               ? "bg-white text-red-500"
//                               : "bg-red-500 text-white"
//                           }`}>
//                             {availableRoomsCount[room.roomtypename] > 0 ? (
//                               <>
//                                 <FiClock className="inline-block mr-1 mb-1" />
//                                 Only {availableRoomsCount[room.roomtypename]} rooms left
//                               </>
//                             ) : (
//                               "Sold Out"
//                             )}
//                           </span>
//                         </div>

//                         <p className="text-sm text-gray-900 font-md font-light">
//                           {room.description}
//                         </p>

//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
//                           <div>
//                             <h3 className="text-lg font-poppins font-semibold text-gray-800">
//                               Amenities:
//                             </h3>
//                             <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
//                               {room.amenities && room.amenities.length > 0 ? (
//                                 room.amenities.slice(0, 3).map((amenity, i) => (
//                                   <li key={i}>{amenity.name}</li>
//                                 ))
//                               ) : (
//                                 <li>No amenities available</li>
//                               )}
//                               {room.amenities?.length > 3 && (
//                                 <li className="text-blue-500">
//                                   +{room.amenities.length - 3} more
//                                 </li>
//                               )}
//                             </ul>
//                           </div>
//                           <div>
//                             <h3 className="text-lg font-poppins font-semibold text-gray-800">
//                               Services:
//                             </h3>
//                             <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
//                               {room.service_categories && room.service_categories.length > 0 ? (
//                                 room.service_categories.slice(0, 3).map((service, i) => (
//                                   <li key={i}>{service.name}</li>
//                                 ))
//                               ) : (
//                                 <li>No services available</li>
//                               )}
//                               {room.service_categories?.length > 3 && (
//                                 <li className="text-blue-500">
//                                   +{room.service_categories.length - 3} more
//                                 </li>
//                               )}
//                             </ul>
//                           </div>
//                         </div>

//                         <div className="mt-1">
//                           <p className="text-sm font-semibold bg-orange-100 text-orange-800 px-2 py-1 inline-block rounded">
//                             <MdOutlineFreeBreakfast className="inline mr-1" /> Breakfast Complimentary
//                           </p>
//                         </div>

//                         <div className="text-sm text-gray-600 mt-2 flex items-center gap-1 font-semibold flex-wrap">
//                           <span className="text-lg font-poppins font-semibold text-gray-800">
//                             Max occupancy:
//                           </span>
//                           {room.max_occupancy || 2} Guests
//                         </div>

//                         <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t gap-3">
//                           <div className="flex flex-col w-full sm:w-auto">
//                             <div className="flex items-center gap-2 flex-wrap">
//                               {showDiscount ? (
//                                 <>
//                                   <div className="flex items-center">
//                                     <span className="text-sm text-gray-500 line-through">
//                                       ₹{Number(totalStandardPrice).toLocaleString("en-IN")}
//                                     </span>
//                                     <span className="text-xs text-gray-500 ml-1">
//                                       /total stay
//                                     </span>
//                                   </div>
//                                   <button
//                                     onClick={(e) => handleShowPricingInfo(e, room)}
//                                     className="flex items-center justify-center rounded-full text-black transition"
//                                     title="View pricing details"
//                                   >
//                                     <IoMdInformationCircleOutline size={20} />
//                                   </button>
//                                 </>
//                               ) : (
//                                 <div className="flex items-center">
//                                   <span className="text-sm text-gray-700">
//                                     ₹{Number(perDayPrice).toLocaleString("en-IN")}
//                                   </span>
//                                   <span className="text-xs text-gray-500 ml-1">
//                                     /night
//                                   </span>
//                                 </div>
//                               )}
//                             </div>

//                             <div className="flex items-center gap-2 mt-1">
//                               <div>
//                                 <p className="text-xl md:text-2xl font-bold text-black">
//                                   ₹{Number(totalDynamicPrice).toLocaleString("en-IN")}
//                                   <span className="text-[10px] md:text-[12px] font-normal text-gray-600 whitespace-normal">
//                                     {" "}/Excluding taxes and fees
//                                   </span>
//                                 </p>
//                               </div>
//                             </div>
//                             {showDiscount && discountAmount > 0 && (
//                               <div className="mb-2">
//                                 <p className="text-xs md:text-sm font-semibold text-green-600">
//                                   Special Rate Applied • Save ₹{Number(discountAmount).toLocaleString("en-IN")}
//                                 </p>
//                               </div>
//                             )}
//                           </div>

//                           <Link to="/enhance-checkin-stay" className="w-full sm:w-auto">
//                             <button
//                               className={`py-2 font-semibold rounded-md transition text-sm w-full sm:w-auto ${
//                                 availableRoomsCount[room.roomtypename] > 0 && canRoomAccommodateGuests(room)
//                                   ? "bg-purple-500 text-white hover:bg-purple-600 px-4 md:px-6"
//                                   : "bg-gray-400 text-white cursor-not-allowed px-2"
//                               }`}
//                               disabled={availableRoomsCount[room.roomtypename] === 0 || !canRoomAccommodateGuests(room)}
//                             >
//                               {availableRoomsCount[room.roomtypename] > 0 && canRoomAccommodateGuests(room)
//                                 ? "Select"
//                                 : "Not available"}
//                             </button>
//                           </Link>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ))
//         )}

//         {/* Pricing Info Modal */}
//         {showPricingModal && selectedRoomForPricing && (
//           <PricingInfoModal
//             roomData={selectedRoomForPricing.roomData}
//             roomName={selectedRoomForPricing.roomName}
//             nights={selectedRoomForPricing.nights}
//             onClose={() => setShowPricingModal(false)}
//           />
//         )}

//         {/* Profile Creation Popup - Shows automatically based on conditions */}
//         {showProfilePopup && (
//           <ProfileCreationPopup
//             isOpen={showProfilePopup}
//             onClose={handlePopupClose}
//             onContinueAsGuest={handleContinueAsGuest}
//           />
//         )}

//         <ToastContainer />
//       </div>
//     </div>
//   );
// };

// const ImageCarousel = ({ images = [] }) => {
//   const [currentImage, setCurrentImage] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);
//   const [showGallery, setShowGallery] = useState(false);

//   const validImages = Array.isArray(images) && images.length > 0
//     ? images
//     : ["https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg"];

//   useEffect(() => {
//     if (isPaused || validImages.length === 0) return;
//     const interval = setInterval(() => {
//       setCurrentImage((prev) => (prev + 1) % validImages.length);
//     }, 3000);
//     return () => clearInterval(interval);
//   }, [validImages.length, isPaused]);

//   const handlePrev = (e) => {
//     e.stopPropagation();
//     setCurrentImage((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
//     setIsPaused(true);
//   };

//   const handleNext = (e) => {
//     e.stopPropagation();
//     setCurrentImage((prev) => (prev + 1) % validImages.length);
//     setIsPaused(true);
//   };

//   const openGallery = (e) => {
//     e.stopPropagation();
//     setShowGallery(true);
//     setIsPaused(true);
//   };

//   return (
//     <div className="relative w-full h-full">
//       <div className="w-full h-full cursor-pointer" onClick={openGallery}>
//         <img src={validImages[currentImage]} alt="Room" className="w-full h-full object-cover" />
//       </div>
//       <button
//         className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
//         onClick={handlePrev}
//       >
//         <FaChevronLeft size={20} />
//       </button>
//       <button
//         className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
//         onClick={handleNext}
//       >
//         <FaChevronRight size={20} />
//       </button>
//       <button
//         className="absolute right-2 bottom-2 bg-gray-800 text-white p-2 text-xs rounded-full hover:bg-gray-700 transition"
//         onClick={openGallery}
//       >
//         <IoImagesOutline size={20} />
//       </button>
//       {showGallery && (
//         <ImageGalleryModal
//           images={validImages}
//           currentIndex={currentImage}
//           onClose={() => setShowGallery(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default PropertyList;
