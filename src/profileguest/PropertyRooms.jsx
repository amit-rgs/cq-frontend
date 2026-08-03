import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaUser,
  FaArrowUp,
  FaTag,
  FaPercent,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { IoImagesOutline } from 'react-icons/io5';
import { FiClock } from 'react-icons/fi';
import ProfileCreationPopup from '../Walk-In/ProfileCreationPopup';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// Redux action for selected room
const setSelectedRoom = (room) => ({
  type: 'SET_SELECTED_ROOM',
  payload: room,
});

// Redux action to clear selected room
const clearSelectedRoom = () => ({
  type: 'CLEAR_SELECTED_ROOM',
});

// Redux action to set total price
const setTotalPrice = (price) => ({
  type: 'SET_TOTAL_PRICE',
  payload: price,
});

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
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-lg font-semibold">View Room Images</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={images[currentImage]}
            alt={`Room ${currentImage + 1}`}
            className="max-w-full max-h-[calc(80vh-120px)] object-cover"
          />

          <button
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition z-50"
            onClick={handlePrev}
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition z-50"
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
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                  currentImage === index ? 'bg-gray-800' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentImage(index)}
                aria-label={`Go to image ${index + 1}`}
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

const PropertyRooms = ({ dates, booking }) => {
  const [modificationOptions, setModificationOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoomDetails, setCurrentRoomDetails] = useState(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const hasCheckedProfile = useRef(false);
  const navigate = useNavigate();

  const { checkin_date, checkout_date } = dates || {};
  console.log('Dates received in PropertyRooms:', dates);
  const { adults, children, rooms, childrenAges } = useSelector((state) => state.formDetails);

  // Get selected room from Redux store
  const selectedRoom = useSelector((state) => state.selectedRoom);

  // Get current room type from booking
  const currentRoomType = booking?.room_type;

  const dispatch = useDispatch();

  // Calculate average taxable amount from price_breakdown (per day price)
  const getAverageTaxableAmount = (priceBreakdown) => {
    if (!priceBreakdown || !Array.isArray(priceBreakdown) || priceBreakdown.length === 0) {
      return 0;
    }

    const totalTaxableAmount = priceBreakdown.reduce(
      (sum, day) => sum + (day.taxable_amount || 0),
      0
    );
    return Math.round(totalTaxableAmount / priceBreakdown.length);
  };

  // Calculate total taxable amount from price_breakdown (total for all nights)
  const getTotalTaxableAmount = (priceBreakdown) => {
    if (!priceBreakdown || !Array.isArray(priceBreakdown) || priceBreakdown.length === 0) {
      return 0;
    }

    return priceBreakdown.reduce((sum, day) => sum + (day.taxable_amount || 0), 0);
  };

  // Get discount information from new API structure
  const getDiscountInfo = (priceBreakdown) => {
    if (!priceBreakdown || !Array.isArray(priceBreakdown) || priceBreakdown.length === 0) {
      return {
        hasDiscount: false,
        isPercentage: false,
        isFlat: false,
        percentage: 0,
        flatAmount: 0,
        savings: 0,
      };
    }

    // Check if first day has discount
    const firstDay = priceBreakdown[0];
    if (firstDay.discount_amount && firstDay.discount_amount > 0) {
      const basePrice = firstDay.applied_price_before_discount || firstDay.base_price;
      const discountAmount = firstDay.discount_amount;

      // Check discount type
      const isFlat = firstDay.discount_type === 'flat';
      const isPercentage = firstDay.discount_type === 'percentage';

      let percentage = 0;
      if (isPercentage) {
        percentage = discountAmount;
      } else if (isFlat && basePrice > 0) {
        percentage = (discountAmount / basePrice) * 100;
      }

      return {
        hasDiscount: true,
        isPercentage: isPercentage,
        isFlat: isFlat,
        percentage: percentage,
        flatAmount: isFlat ? discountAmount : 0,
        savings: discountAmount,
      };
    }

    return {
      hasDiscount: false,
      isPercentage: false,
      isFlat: false,
      percentage: 0,
      flatAmount: 0,
      savings: 0,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchModificationOptions = async () => {
      try {
        if (!booking?.bookingid || !checkin_date || !checkout_date) {
          console.error('Missing required parameters for modification preview');
          return;
        }

        const response = await fetch(
          `${CQ_BASE_URL}/bq/api/modify/${booking.bookingid}/options?new_checkin=${checkin_date}&new_checkout=${checkout_date}`
        );

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (isMounted && data.status === 'success') {
          setModificationOptions(data.data);

          // Set current room details from new API structure
          if (data.data.current_room_type_details) {
            const totalNights = Math.ceil(
              (new Date(checkout_date) - new Date(checkin_date)) / (24 * 60 * 60 * 1000)
            );

            // For current room, we need to calculate taxable amount differently
            // Since current room doesn't have price_breakdown in the response
            // We'll use current_room_total as a fallback
            const currentRoom = {
              roomtypename: data.data.current_room_type_details.roomtypename,
              description: data.data.current_room_type_details.description,
              baseprice: data.data.current_room_type_details.baseprice,
              max_occupancy: data.data.current_room_type_details.max_occupancy || 2,
              image_urls: data.data.current_room_type_details.images || [],
              dynamicPrice: data.data.current_room_total || 0,
              pricePerNight: data.data.current_room_total / totalNights,
              modification_type: 'current',
              price_difference: 0,
              total_nights: totalNights,
              effective_date: new Date().toISOString().split('T')[0],
              amenities: data.data.current_room_type_details.amenities || [],
              service_categories: data.data.current_room_type_details.service_categories || [],
              price_details: {
                base_amount: data.data.current_room_total || 0,
                service_fee: 0,
                tax_amount: data.data.current_room_total - (data.data.billed_total || 0),
                final_amount: data.data.billed_total || 0,
              },
              is_after_checkin: data.data.is_after_checkin || false,
              corporate_booking: data.data.client_type === 'Corporate',
              discountInfo: {
                hasDiscount: false,
                isPercentage: false,
                isFlat: false,
                percentage: 0,
                flatAmount: 0,
                savings: 0,
              },
            };

            setCurrentRoomDetails(currentRoom);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching modification options:', error);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchModificationOptions();
    return () => {
      isMounted = false;
    };
  }, [booking?.bookingid, checkin_date, checkout_date]);

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

  // Check if profile is incomplete (email or phone missing)
  const checkProfileCompleteness = async () => {
    // Prevent multiple API calls
    if (hasCheckedProfile.current) {
      return;
    }

    const accessToken = Cookies.get('access_token');
    if (!accessToken) return false;

    try {
      const guestId = Cookies.get('guest_id') || getGuestIdFromToken(accessToken);
      if (!guestId) {
        hasCheckedProfile.current = true;
        return true; // No guest ID means incomplete
      }

      const profileResponse = await fetch(`${CQ_BASE_URL}/bq/api/guests/${guestId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        hasCheckedProfile.current = true;
        return true;
      }

      const profileData = await profileResponse.json();
      const guest = profileData.guest;

      // Check if email or phone number is missing
      const isEmailMissing = !guest.emailid || guest.emailid.trim() === '';
      const isPhoneMissing = !guest.phonenumber || guest.phonenumber.toString().trim() === '';

      hasCheckedProfile.current = true;
      return isEmailMissing || isPhoneMissing;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      hasCheckedProfile.current = true;
      return true; // Show popup on error
    }
  };

  // Check profile completeness AFTER data is loaded
  useEffect(() => {
    const checkProfileAfterLoad = async () => {
      // Only check when loading is finished and modification options are loaded
      if (!isLoading && modificationOptions && !hasCheckedProfile.current) {
        const isIncomplete = await checkProfileCompleteness();
        if (isIncomplete) {
          setShowProfilePopup(true);
        }
      }
    };

    checkProfileAfterLoad();
  }, [isLoading, modificationOptions]); // Runs when loading finishes

  // Handle continue as guest
  const handleContinueAsGuest = () => {
    setShowProfilePopup(false);
    toast.info(
      'You can continue as guest, but please complete your profile later for a better experience.'
    );
  };

  // Handle room selection with modification details
  const handleRoomSelect = (modification) => {
    const parseDateWithoutTimezone = (dateString) => {
      if (!dateString) return new Date();
      const [year, month, day] = dateString.split('-');
      return new Date(year, month - 1, day, 12, 0, 0);
    };

    const checkInDate = parseDateWithoutTimezone(checkin_date);
    const checkOutDate = parseDateWithoutTimezone(checkout_date);

    const totalNights = Math.ceil((checkOutDate - checkInDate) / (24 * 60 * 60 * 1000));

    // Calculate prices using taxable_amount from price_breakdown
    const averageTaxableAmount = getAverageTaxableAmount(modification.price_breakdown);
    const totalTaxableAmount = getTotalTaxableAmount(modification.price_breakdown);
    const discountInfo = getDiscountInfo(modification.price_breakdown);

    const roomWithDetails = {
      roomtypeid: modification.roomtypeid,
      roomtypename: modification.roomtypename,
      description: modification.description,
      baseprice: averageTaxableAmount, // Use average taxable amount as per day price
      total_base_amount: totalTaxableAmount, // Total taxable amount for all nights
      max_occupancy: modification.max_occupancy,
      image_urls: modification.images,
      dynamicPrice: totalTaxableAmount,
      pricePerNight: averageTaxableAmount,
      modification_type: modification.modification_type,
      price_difference: modification.price_difference,
      final_price_difference: modification.final_price_difference,
      total_nights: totalNights,
      effective_date: modification.effective_date,
      amenities: modification.amenities,
      service_categories: modification.service_categories,
      price_details: modification.price_details,
      price_breakdown: modification.price_breakdown,
      is_after_checkin: modification.is_after_checkin,
      corporate_booking: modificationOptions?.client_type === 'Corporate',
      discountInfo: discountInfo,
      preview_total: modification.preview_total,
      estimated_total: modification.estimated_total,
      available: modification.available,
    };

    console.log('Selected modification details:', roomWithDetails);

    // Dispatch the selected room to Redux
    dispatch(setSelectedRoom(roomWithDetails));

    // Also dispatch the total price to Redux
    dispatch(setTotalPrice(totalTaxableAmount));

    dispatch({
      type: 'SET_MODIFY_DATES',
      payload: {
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        daysCount: totalNights,
      },
    });
    navigate('/edit-reservation/update-enhancements');
  };

  const handleBack = () => {
    dispatch(clearSelectedRoom());
    navigate('/profile_guest_options');
  };

  const handleProceed = () => {
    if (!currentRoomDetails) {
      console.error('No current room details to proceed with!');
      return;
    }

    console.log(currentRoomDetails);

    // Calculate total nights for consistency
    const totalNights = Math.ceil(
      (new Date(checkout_date) - new Date(checkin_date)) / (24 * 60 * 60 * 1000)
    );

    // For current room, we don't have taxable_amount breakdown
    // So we'll use the current_room_total divided by nights as per day price
    const pricePerNight = currentRoomDetails.dynamicPrice / totalNights;
    const totalPrice = currentRoomDetails.dynamicPrice;
    // IMPORTANT: Get the current room type ID from modificationOptions
    const currentRoomTypeId = modificationOptions?.current_room_type_details?.roomtypeid;

    // Update current room details with calculated prices
    const updatedCurrentRoom = {
      ...currentRoomDetails,
      roomtypeid: currentRoomTypeId,
      baseprice: pricePerNight,
      total_base_amount: totalPrice,
      pricePerNight: pricePerNight,
    };

    dispatch(setSelectedRoom(updatedCurrentRoom));

    // Also dispatch the total price to Redux
    dispatch(setTotalPrice(totalPrice));

    // Also dispatch the dates to Redux for consistency
    dispatch({
      type: 'SET_MODIFY_DATES',
      payload: {
        checkInDate: checkin_date,
        checkOutDate: checkout_date,
        daysCount: totalNights,
      },
    });

    navigate('/edit-reservation/update-enhancements');
  };

  const canRoomAccommodateGuests = (room) => {
    const maxOccupancy = room.max_occupancy || 2;
    // Basic rule: Adults cannot exceed max occupancy
    if (adults > maxOccupancy) return false;
    // Additional rule: Adults + children cannot exceed max occupancy + 1 (assuming 1 child can share bed)
    if (adults + children > maxOccupancy + 1) return false;
    return true;
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

    const openGallery = () => {
      setShowGallery(true);
      setIsPaused(true);
    };

    return (
      <div className="relative w-full h-full">
        <div className="w-full h-full cursor-pointer" onClick={openGallery}>
          <img
            src={validImages[currentImage]}
            alt="Room"
            className="w-full h-full object-cover transition-opacity duration-500"
          />
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
          onClick={(e) => {
            e.stopPropagation();
            openGallery();
          }}
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

  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const renderDiscountBadge = (discountInfo) => {
    if (!discountInfo.hasDiscount) return null;

    if (discountInfo.isPercentage && discountInfo.percentage > 0) {
      return (
        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <FaPercent size={10} />
          {discountInfo.percentage}% OFF
        </span>
      );
    }

    if (discountInfo.isFlat && discountInfo.flatAmount > 0) {
      return (
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <FaTag size={10} />₹{discountInfo.flatAmount} OFF
        </span>
      );
    }

    return null;
  };

  // Function to calculate average taxable amount from price_breakdown (per day price)
  const calculateAverageTaxableAmount = (priceBreakdown) => {
    if (!priceBreakdown || !Array.isArray(priceBreakdown) || priceBreakdown.length === 0) {
      return 0;
    }

    const totalTaxableAmount = priceBreakdown.reduce(
      (sum, day) => sum + (day.taxable_amount || 0),
      0
    );
    return Math.round(totalTaxableAmount / priceBreakdown.length);
  };

  // Function to calculate total taxable amount from price_breakdown (total for all nights)
  const calculateTotalTaxableAmount = (priceBreakdown) => {
    if (!priceBreakdown || !Array.isArray(priceBreakdown) || priceBreakdown.length === 0) {
      return 0;
    }

    return priceBreakdown.reduce((sum, day) => sum + (day.taxable_amount || 0), 0);
  };

  // Function to calculate price per night using taxable_amount (average)
  const calculatePricePerNight = (priceBreakdown) => {
    return calculateAverageTaxableAmount(priceBreakdown);
  };

  // Function to calculate total price for all nights using taxable_amount
  const calculateTotalPrice = (priceBreakdown) => {
    return calculateTotalTaxableAmount(priceBreakdown);
  };

  return (
    <div className="mx-auto mt-1 flex flex-col gap-4 px-5 py-2 pb-20">
      {/* Current Room Info */}
      {!isLoading && currentRoomType && currentRoomDetails && (
        <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Your Current Room: {modificationOptions?.current_room_type || currentRoomType}
            </h3>
            <p className="text-gray-600 text-sm">
              Below are available modification options. Select one to change your stay.
            </p>
          </div>
          <div className="text-right">
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">
                ₹
                {Math.round(
                  currentRoomDetails.dynamicPrice / currentRoomDetails.total_nights
                ).toLocaleString('en-IN')}
                <span className="text-xs">/ Per night</span>
              </p>
              <p className="text-xl font-bold text-black">
                ₹{currentRoomDetails.dynamicPrice.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-gray-600">/ Including taxes</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading
        ? Array(4)
            .fill(null)
            .map((_, index) => <SkeletonLoader key={index} />)
        : // Create rows with 2 cards each
          [...(modificationOptions?.available_modifications || [])]
            .sort((a, b) => {
              const priceA = calculateTotalTaxableAmount(a.price_breakdown);
              const priceB = calculateTotalTaxableAmount(b.price_breakdown);
              return priceA - priceB; // Ascending order
            })
            .reduce((rows, room, index) => {
              if (index % 2 === 0) rows.push([]);
              rows[rows.length - 1].push(room);
              return rows;
            }, [])
            .map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-4 w-full">
                {row.map((modification, index) => {
                  const discountInfo = getDiscountInfo(modification.price_breakdown);
                  const hasCorporateDiscount = modificationOptions?.client_type === 'Corporate';

                  // Calculate prices using taxable_amount from price_breakdown
                  const averageTaxableAmount = calculateAverageTaxableAmount(
                    modification.price_breakdown
                  );
                  const totalTaxableAmount = calculateTotalTaxableAmount(
                    modification.price_breakdown
                  );
                  const pricePerNight = calculatePricePerNight(modification.price_breakdown);
                  const totalPrice = calculateTotalPrice(modification.price_breakdown);

                  return (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden shadow-md bg-white flex hover:shadow-xl transition duration-300 w-1/2"
                    >
                      {/* Custom Image Carousel */}
                      <div className="w-1/3">
                        <ImageCarousel images={modification.images} />
                      </div>

                      <div className="p-4 flex flex-col space-y-2 w-2/3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-poppins font-bold text-gray-800">
                              {modification.roomtypename}
                            </h2>
                          </div>

                          {/* Effective Date and Price Difference - Top Right */}
                          <div className="flex flex-col items-end">
                            <span className="px-3 py-1 rounded text-sm font-semibold bg-gray-100 text-gray-800 mb-2">
                              <FiClock className="inline-block mr-1 mb-1" />
                              Effective from {formatDate(modification.effective_date)}
                            </span>
                            {/* <span
                              className={`text-lg font-bold ${
                                modification.price_difference >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {modification.price_difference >= 0 ? "+" : "-"}₹
                              {Math.abs(
                                modification.price_difference
                              ).toLocaleString("en-IN")}
                              <span className="text-[10px] font-normal text-gray-600">
                                {" "}
                                /Including taxes
                              </span>
                            </span> */}
                          </div>
                        </div>

                        <p className="text-sm text-gray-900 font-md font-light">
                          {modification.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <h3 className="text-lg font-poppins font-semibold text-gray-800">
                              Amenities:
                            </h3>
                            <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
                              {modification.amenities && modification.amenities.length > 0 ? (
                                modification.amenities
                                  .slice(0, 3)
                                  .map((amenity, i) => <li key={i}>{amenity.name}</li>)
                              ) : (
                                <li>No amenities available</li>
                              )}
                              {modification.amenities?.length > 3 && (
                                <li className="text-blue-500">
                                  +{modification.amenities.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <h3 className="text-lg font-poppins font-semibold text-gray-800">
                              Services:
                            </h3>
                            <ul className="list-disc font-poppins list-inside text-sm text-gray-600">
                              {modification.service_categories &&
                              modification.service_categories.length > 0 ? (
                                modification.service_categories
                                  .slice(0, 3)
                                  .map((service, i) => <li key={i}>{service.name}</li>)
                              ) : (
                                <li>No services available</li>
                              )}
                              {modification.service_categories?.length > 3 && (
                                <li className="text-blue-500">
                                  +{modification.service_categories.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mt-2 flex items-center gap-1 font-semibold">
                          <span className="text-lg font-poppins font-semibold text-gray-800">
                            Max occupancy:
                          </span>
                          {modification.max_occupancy || 2} Guests
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t">
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-600">
                              ₹{pricePerNight.toLocaleString('en-IN')}
                              <span className="text-xs">/ Per night</span>
                            </p>
                            <p className="text-xl font-bold text-black">
                              ₹{totalPrice.toLocaleString('en-IN')}
                              <span className="text-xs font-normal text-gray-600">
                                / Excluding taxes & fees
                              </span>
                            </p>
                          </div>

                          <button
                            className={`py-2 font-semibold rounded-md transition text-sm flex items-center justify-center gap-2 ${
                              canRoomAccommodateGuests(modification) && modification.available
                                ? 'bg-purple-500 text-white hover:bg-purple-600 px-4'
                                : 'bg-gray-400 text-white cursor-not-allowed text-sm px-2'
                            }`}
                            disabled={
                              !canRoomAccommodateGuests(modification) || !modification.available
                            }
                            onClick={() => handleRoomSelect(modification)}
                          >
                            {/* Show upgrade icon if price difference is positive */}
                            {modification.modification_type === 'upgrade' && (
                              <FaArrowUp className="w-2.5 h-2.5" />
                            )}

                            {/* Show downgrade icon if price difference is negative */}
                            {modification.modification_type === 'downgrade' && (
                              <FaArrowUp className="w-2.5 h-2.5 transform rotate-180" />
                            )}

                            {canRoomAccommodateGuests(modification) && modification.available
                              ? 'Modify Reservation'
                              : !modification.available
                                ? 'Not Available'
                                : 'Not available'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

      {/* Sticky navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 sm:px-6 shadow-lg">
        <div className="max-w-8xl mx-auto flex justify-between gap-4">
          <button
            onClick={handleBack}
            className="flex items-center justify-center px-3 py-2 sm:px-28 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition flex-1 sm:flex-none"
          >
            <span className="text-sm sm:text-base">Back</span>
          </button>

          <button
            onClick={handleProceed}
            className="px-4 py-2 sm:px-6 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition flex-1 sm:flex-none text-sm sm:text-base"
            disabled={!currentRoomType}
          >
            Proceed with current room
          </button>
        </div>
      </div>

      {showProfilePopup && (
        <ProfileCreationPopup
          isOpen={showProfilePopup}
          onClose={() => setShowProfilePopup(false)}
          onContinueAsGuest={handleContinueAsGuest}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default PropertyRooms;

// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   FaChevronLeft,
//   FaChevronRight,
//   FaTimes,
//   FaUser,
//   FaArrowUp,
//   FaTag,
//   FaPercent,
// } from "react-icons/fa";
// import { Link, useNavigate } from "react-router-dom";
// import { IoImagesOutline } from "react-icons/io5";
// import { FiClock } from "react-icons/fi";
// import ProfileCreationPopup from "../Walk-In/ProfileCreationPopup";
// import Cookies from "js-cookie";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// // Redux action for selected room
// const setSelectedRoom = (room) => ({
//   type: "SET_SELECTED_ROOM",
//   payload: room,
// });

// // Redux action to clear selected room
// const clearSelectedRoom = () => ({
//   type: "CLEAR_SELECTED_ROOM",
// });

// // Redux action to set total price
// const setTotalPrice = (price) => ({
//   type: "SET_TOTAL_PRICE",
//   payload: price,
// });

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
//       if (e.key === "ArrowLeft") {
//         handlePrev();
//       } else if (e.key === "ArrowRight") {
//         handleNext();
//       } else if (e.key === "Escape") {
//         onClose();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
//       <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
//         <div className="flex justify-between items-center p-4 border-b">
//           <h1 className="text-lg font-semibold">View Room Images</h1>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 transition text-2xl"
//           >
//             <FaTimes />
//           </button>
//         </div>

//         <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
//           <img
//             src={images[currentImage]}
//             alt={`Room ${currentImage + 1}`}
//             className="max-w-full max-h-[calc(80vh-120px)] object-cover"
//           />

//           <button
//             className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition z-50"
//             onClick={handlePrev}
//           >
//             <FaChevronLeft size={20} />
//           </button>
//           <button
//             className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition z-50"
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
//                 className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
//                   currentImage === index ? "bg-gray-800" : "bg-gray-300"
//                 }`}
//                 onClick={() => setCurrentImage(index)}
//                 aria-label={`Go to image ${index + 1}`}
//               />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const SkeletonLoader = () => (
//   <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
//     {[...Array(2)].map((_, index) => (
//       <div
//         key={index}
//         className="border rounded-lg overflow-hidden shadow-md bg-gray-200 flex animate-pulse w-full md:w-1/2 flex-col md:flex-row"
//       >
//         <div className="w-full md:w-1/3 bg-gray-300 h-48 md:h-64" />
//         <div className="p-4 flex flex-col space-y-3 w-full md:w-2/3">
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

// const PropertyRooms = ({ dates, booking }) => {
//   const [modificationOptions, setModificationOptions] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentRoomDetails, setCurrentRoomDetails] = useState(null);
//   const [showProfilePopup, setShowProfilePopup] = useState(false);
//   const hasCheckedProfile = useRef(false);
//   const navigate = useNavigate();

//   const { checkin_date, checkout_date } = dates || {};
//   console.log("Dates received in PropertyRooms:", dates);
//   const { adults, children, rooms, childrenAges } = useSelector(
//     (state) => state.formDetails
//   );

//   // Get selected room from Redux store
//   const selectedRoom = useSelector((state) => state.selectedRoom);

//   // Get current room type from booking
//   const currentRoomType = booking?.room_type;

//   const dispatch = useDispatch();

//   // Calculate average taxable amount from price_breakdown (per day price)
//   const getAverageTaxableAmount = (priceBreakdown) => {
//     if (
//       !priceBreakdown ||
//       !Array.isArray(priceBreakdown) ||
//       priceBreakdown.length === 0
//     ) {
//       return 0;
//     }

//     const totalTaxableAmount = priceBreakdown.reduce(
//       (sum, day) => sum + (day.taxable_amount || 0),
//       0
//     );
//     return Math.round(totalTaxableAmount / priceBreakdown.length);
//   };

//   // Calculate total taxable amount from price_breakdown (total for all nights)
//   const getTotalTaxableAmount = (priceBreakdown) => {
//     if (
//       !priceBreakdown ||
//       !Array.isArray(priceBreakdown) ||
//       priceBreakdown.length === 0
//     ) {
//       return 0;
//     }

//     return priceBreakdown.reduce(
//       (sum, day) => sum + (day.taxable_amount || 0),
//       0
//     );
//   };

//   // Get discount information from new API structure
//   const getDiscountInfo = (priceBreakdown) => {
//     if (
//       !priceBreakdown ||
//       !Array.isArray(priceBreakdown) ||
//       priceBreakdown.length === 0
//     ) {
//       return {
//         hasDiscount: false,
//         isPercentage: false,
//         isFlat: false,
//         percentage: 0,
//         flatAmount: 0,
//         savings: 0,
//       };
//     }

//     // Check if first day has discount
//     const firstDay = priceBreakdown[0];
//     if (firstDay.discount_amount && firstDay.discount_amount > 0) {
//       const basePrice =
//         firstDay.applied_price_before_discount || firstDay.base_price;
//       const discountAmount = firstDay.discount_amount;

//       // Check discount type
//       const isFlat = firstDay.discount_type === "flat";
//       const isPercentage = firstDay.discount_type === "percentage";

//       let percentage = 0;
//       if (isPercentage) {
//         percentage = discountAmount;
//       } else if (isFlat && basePrice > 0) {
//         percentage = (discountAmount / basePrice) * 100;
//       }

//       return {
//         hasDiscount: true,
//         isPercentage: isPercentage,
//         isFlat: isFlat,
//         percentage: percentage,
//         flatAmount: isFlat ? discountAmount : 0,
//         savings: discountAmount,
//       };
//     }

//     return {
//       hasDiscount: false,
//       isPercentage: false,
//       isFlat: false,
//       percentage: 0,
//       flatAmount: 0,
//       savings: 0,
//     };
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const fetchModificationOptions = async () => {
//       try {
//         if (!booking?.bookingid || !checkin_date || !checkout_date) {
//           console.error("Missing required parameters for modification preview");
//           return;
//         }

//         const response = await fetch(
//           `${CQ_BASE_URL}/bq/api/modify/${booking.bookingid}/options?new_checkin=${checkin_date}&new_checkout=${checkout_date}`
//         );

//         if (!response.ok) throw new Error("Network response was not ok");

//         const data = await response.json();

//         if (isMounted && data.status === "success") {
//           setModificationOptions(data.data);

//           // Set current room details from new API structure
//           if (data.data.current_room_type_details) {
//             const totalNights = Math.ceil(
//               (new Date(checkout_date) - new Date(checkin_date)) /
//                 (24 * 60 * 60 * 1000)
//             );

//             // For current room, we need to calculate taxable amount differently
//             // Since current room doesn't have price_breakdown in the response
//             // We'll use current_room_total as a fallback
//             const currentRoom = {
//               roomtypename: data.data.current_room_type_details.roomtypename,
//               description: data.data.current_room_type_details.description,
//               baseprice: data.data.current_room_type_details.baseprice,
//               max_occupancy:
//                 data.data.current_room_type_details.max_occupancy || 2,
//               image_urls: data.data.current_room_type_details.images || [],
//               dynamicPrice: data.data.current_room_total || 0,
//               pricePerNight: data.data.current_room_total / totalNights,
//               modification_type: "current",
//               price_difference: 0,
//               total_nights: totalNights,
//               effective_date: new Date().toISOString().split("T")[0],
//               amenities: data.data.current_room_type_details.amenities || [],
//               service_categories:
//                 data.data.current_room_type_details.service_categories || [],
//               price_details: {
//                 base_amount: data.data.current_room_total || 0,
//                 service_fee: 0,
//                 tax_amount:
//                   data.data.current_room_total - (data.data.billed_total || 0),
//                 final_amount: data.data.billed_total || 0,
//               },
//               is_after_checkin: data.data.is_after_checkin || false,
//               corporate_booking: data.data.client_type === "Corporate",
//               discountInfo: {
//                 hasDiscount: false,
//                 isPercentage: false,
//                 isFlat: false,
//                 percentage: 0,
//                 flatAmount: 0,
//                 savings: 0,
//               },
//             };

//             setCurrentRoomDetails(currentRoom);
//           }
//           setIsLoading(false);
//         }
//       } catch (error) {
//         console.error("Error fetching modification options:", error);
//         if (isMounted) setIsLoading(false);
//       }
//     };

//     fetchModificationOptions();
//     return () => {
//       isMounted = false;
//     };
//   }, [booking?.bookingid, checkin_date, checkout_date]);

//   // Helper function to get guest ID from token
//   const getGuestIdFromToken = (token) => {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       return payload.sub;
//     } catch (e) {
//       console.error("Error parsing token:", e);
//       return null;
//     }
//   };

//   // Check if profile is incomplete (email or phone missing)
//   const checkProfileCompleteness = async () => {
//     // Prevent multiple API calls
//     if (hasCheckedProfile.current) {
//       return;
//     }

//     const accessToken = Cookies.get("access_token");
//     if (!accessToken) return false;

//     try {
//       const guestId =
//         Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
//       if (!guestId) {
//         hasCheckedProfile.current = true;
//         return true; // No guest ID means incomplete
//       }

//       const profileResponse = await fetch(
//         `${CQ_BASE_URL}/bq/api/guests/${guestId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (!profileResponse.ok) {
//         hasCheckedProfile.current = true;
//         return true;
//       }

//       const profileData = await profileResponse.json();
//       const guest = profileData.guest;

//       // Check if email or phone number is missing
//       const isEmailMissing = !guest.emailid || guest.emailid.trim() === "";
//       const isPhoneMissing =
//         !guest.phonenumber || guest.phonenumber.toString().trim() === "";

//       hasCheckedProfile.current = true;
//       return isEmailMissing || isPhoneMissing;
//     } catch (error) {
//       console.error("Error checking profile completeness:", error);
//       hasCheckedProfile.current = true;
//       return true; // Show popup on error
//     }
//   };

//   // Check profile completeness AFTER data is loaded
//   useEffect(() => {
//     const checkProfileAfterLoad = async () => {
//       // Only check when loading is finished and modification options are loaded
//       if (!isLoading && modificationOptions && !hasCheckedProfile.current) {
//         const isIncomplete = await checkProfileCompleteness();
//         if (isIncomplete) {
//           setShowProfilePopup(true);
//         }
//       }
//     };

//     checkProfileAfterLoad();
//   }, [isLoading, modificationOptions]); // Runs when loading finishes

//   // Handle continue as guest
//   const handleContinueAsGuest = () => {
//     setShowProfilePopup(false);
//     toast.info(
//       "You can continue as guest, but please complete your profile later for a better experience."
//     );
//   };

//   // Handle room selection with modification details
//   const handleRoomSelect = (modification) => {
//     const parseDateWithoutTimezone = (dateString) => {
//       if (!dateString) return new Date();
//       const [year, month, day] = dateString.split("-");
//       return new Date(year, month - 1, day, 12, 0, 0);
//     };

//     const checkInDate = parseDateWithoutTimezone(checkin_date);
//     const checkOutDate = parseDateWithoutTimezone(checkout_date);

//     const totalNights = Math.ceil(
//       (checkOutDate - checkInDate) / (24 * 60 * 60 * 1000)
//     );

//     // Calculate prices using taxable_amount from price_breakdown
//     const averageTaxableAmount = getAverageTaxableAmount(
//       modification.price_breakdown
//     );
//     const totalTaxableAmount = getTotalTaxableAmount(
//       modification.price_breakdown
//     );
//     const discountInfo = getDiscountInfo(modification.price_breakdown);

//     const roomWithDetails = {
//       roomtypename: modification.roomtypename,
//       description: modification.description,
//       baseprice: averageTaxableAmount, // Use average taxable amount as per day price
//       total_base_amount: totalTaxableAmount, // Total taxable amount for all nights
//       max_occupancy: modification.max_occupancy,
//       image_urls: modification.images,
//       dynamicPrice: totalTaxableAmount,
//       pricePerNight: averageTaxableAmount,
//       modification_type: modification.modification_type,
//       price_difference: modification.price_difference,
//       final_price_difference: modification.final_price_difference,
//       total_nights: totalNights,
//       effective_date: modification.effective_date,
//       amenities: modification.amenities,
//       service_categories: modification.service_categories,
//       price_details: modification.price_details,
//       price_breakdown: modification.price_breakdown,
//       is_after_checkin: modification.is_after_checkin,
//       corporate_booking: modificationOptions?.client_type === "Corporate",
//       discountInfo: discountInfo,
//       preview_total: modification.preview_total,
//       estimated_total: modification.estimated_total,
//       available: modification.available,
//     };

//     console.log("Selected modification details:", roomWithDetails);

//     // Dispatch the selected room to Redux
//     dispatch(setSelectedRoom(roomWithDetails));

//     // Also dispatch the total price to Redux
//     dispatch(setTotalPrice(totalTaxableAmount));

//     dispatch({
//       type: "SET_MODIFY_DATES",
//       payload: {
//         checkInDate: checkInDate.toISOString(),
//         checkOutDate: checkOutDate.toISOString(),
//         daysCount: totalNights,
//       },
//     });
//     navigate("/edit-reservation/update-enhancements");
//   };

//   const handleBack = () => {
//     dispatch(clearSelectedRoom());
//     navigate("/profile_guest_options");
//   };

//   const handleProceed = () => {
//     if (!currentRoomDetails) {
//       console.error("No current room details to proceed with!");
//       return;
//     }

//     console.log(currentRoomDetails);

//     // Calculate total nights for consistency
//     const totalNights = Math.ceil(
//       (new Date(checkout_date) - new Date(checkin_date)) / (24 * 60 * 60 * 1000)
//     );

//     // For current room, we don't have taxable_amount breakdown
//     // So we'll use the current_room_total divided by nights as per day price
//     const pricePerNight = currentRoomDetails.dynamicPrice / totalNights;
//     const totalPrice = currentRoomDetails.dynamicPrice;

//     // Update current room details with calculated prices
//     const updatedCurrentRoom = {
//       ...currentRoomDetails,
//       baseprice: pricePerNight,
//       total_base_amount: totalPrice,
//       pricePerNight: pricePerNight,
//     };

//     dispatch(setSelectedRoom(updatedCurrentRoom));

//     // Also dispatch the total price to Redux
//     dispatch(setTotalPrice(totalPrice));

//     // Also dispatch the dates to Redux for consistency
//     dispatch({
//       type: "SET_MODIFY_DATES",
//       payload: {
//         checkInDate: checkin_date,
//         checkOutDate: checkout_date,
//         daysCount: totalNights,
//       },
//     });

//     navigate("/edit-reservation/update-enhancements");
//   };

//   const canRoomAccommodateGuests = (room) => {
//     const maxOccupancy = room.max_occupancy || 2;
//     // Basic rule: Adults cannot exceed max occupancy
//     if (adults > maxOccupancy) return false;
//     // Additional rule: Adults + children cannot exceed max occupancy + 1 (assuming 1 child can share bed)
//     if (adults + children > maxOccupancy + 1) return false;
//     return true;
//   };

//   const ImageCarousel = ({ images = [] }) => {
//     const [currentImage, setCurrentImage] = useState(0);
//     const [isPaused, setIsPaused] = useState(false);
//     const [showGallery, setShowGallery] = useState(false);

//     const validImages =
//       Array.isArray(images) && images.length > 0
//         ? images
//         : [
//             "https://community.softr.io/uploads/db9110/original/2X/7/74e6e7e382d0ff5d7773ca9a87e6f6f8817a68a6.jpeg",
//           ];

//     useEffect(() => {
//       if (isPaused || validImages.length === 0) return;

//       const interval = setInterval(() => {
//         setCurrentImage((prev) => (prev + 1) % validImages.length);
//       }, 3000);

//       return () => clearInterval(interval);
//     }, [validImages.length, isPaused]);

//     const handlePrev = (e) => {
//       e.stopPropagation();
//       setCurrentImage((prev) =>
//         prev === 0 ? validImages.length - 1 : prev - 1
//       );
//       setIsPaused(true);
//     };

//     const handleNext = (e) => {
//       e.stopPropagation();
//       setCurrentImage((prev) => (prev + 1) % validImages.length);
//       setIsPaused(true);
//     };

//     const openGallery = () => {
//       setShowGallery(true);
//       setIsPaused(true);
//     };

//     return (
//       <div className="relative w-full h-full">
//         <div className="w-full h-full cursor-pointer" onClick={openGallery}>
//           <img
//             src={validImages[currentImage]}
//             alt="Room"
//             className="w-full h-full object-cover transition-opacity duration-500"
//           />
//         </div>

//         <button
//           className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
//           onClick={handlePrev}
//         >
//           <FaChevronLeft size={20} />
//         </button>
//         <button
//           className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition"
//           onClick={handleNext}
//         >
//           <FaChevronRight size={20} />
//         </button>

//         <button
//           className="absolute right-2 bottom-2 bg-gray-800 text-white p-2 text-xs rounded-full hover:bg-gray-700 transition"
//           onClick={(e) => {
//             e.stopPropagation();
//             openGallery();
//           }}
//         >
//           <IoImagesOutline size={20} />
//         </button>

//         {showGallery && (
//           <ImageGalleryModal
//             images={validImages}
//             currentIndex={currentImage}
//             onClose={() => setShowGallery(false)}
//           />
//         )}
//       </div>
//     );
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";

//     try {
//       const date = new Date(dateString);
//       const day = String(date.getDate()).padStart(2, "0");
//       const month = String(date.getMonth() + 1).padStart(2, "0");
//       const year = date.getFullYear();

//       return `${day}-${month}-${year}`;
//     } catch (e) {
//       console.error("Error formatting date:", e);
//       return dateString;
//     }
//   };

//   const renderDiscountBadge = (discountInfo) => {
//     if (!discountInfo.hasDiscount) return null;

//     if (discountInfo.isPercentage && discountInfo.percentage > 0) {
//       return (
//         <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
//           <FaPercent size={10} />
//           {discountInfo.percentage}% OFF
//         </span>
//       );
//     }

//     if (discountInfo.isFlat && discountInfo.flatAmount > 0) {
//       return (
//         <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
//           <FaTag size={10} />₹{discountInfo.flatAmount} OFF
//         </span>
//       );
//     }

//     return null;
//   };

//   // Function to calculate average taxable amount from price_breakdown (per day price)
//   const calculateAverageTaxableAmount = (priceBreakdown) => {
//     if (
//       !priceBreakdown ||
//       !Array.isArray(priceBreakdown) ||
//       priceBreakdown.length === 0
//     ) {
//       return 0;
//     }

//     const totalTaxableAmount = priceBreakdown.reduce(
//       (sum, day) => sum + (day.taxable_amount || 0),
//       0
//     );
//     return Math.round(totalTaxableAmount / priceBreakdown.length);
//   };

//   // Function to calculate total taxable amount from price_breakdown (total for all nights)
//   const calculateTotalTaxableAmount = (priceBreakdown) => {
//     if (
//       !priceBreakdown ||
//       !Array.isArray(priceBreakdown) ||
//       priceBreakdown.length === 0
//     ) {
//       return 0;
//     }

//     return priceBreakdown.reduce(
//       (sum, day) => sum + (day.taxable_amount || 0),
//       0
//     );
//   };

//   // Function to calculate price per night using taxable_amount (average)
//   const calculatePricePerNight = (priceBreakdown) => {
//     return calculateAverageTaxableAmount(priceBreakdown);
//   };

//   // Function to calculate total price for all nights using taxable_amount
//   const calculateTotalPrice = (priceBreakdown) => {
//     return calculateTotalTaxableAmount(priceBreakdown);
//   };

//   return (
//     <div className="mx-auto mt-1 flex flex-col gap-4 px-4 sm:px-5 py-2 pb-20">
//       {/* Current Room Info */}
//       {!isLoading && currentRoomType && currentRoomDetails && (
//         <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//           <div>
//             <h3 className="text-base sm:text-lg font-semibold text-gray-800">
//               Your Current Room:{" "}
//               {modificationOptions?.current_room_type || currentRoomType}
//             </h3>
//             <p className="text-gray-600 text-xs sm:text-sm">
//               Below are available modification options. Select one to change
//               your stay.
//             </p>
//           </div>
//           <div className="text-left sm:text-right w-full sm:w-auto">
//             <div className="flex flex-col">
//               <p className="text-xs sm:text-sm text-gray-600">
//                 ₹
//                 {Math.round(
//                   currentRoomDetails.dynamicPrice /
//                     currentRoomDetails.total_nights
//                 ).toLocaleString("en-IN")}
//                 <span className="text-xs">/ Per night</span>
//               </p>
//               <p className="text-lg sm:text-xl font-bold text-black">
//                 ₹{currentRoomDetails.dynamicPrice.toLocaleString("en-IN")}
//                 <span className="text-xs font-normal text-gray-600">
//                   / Including taxes
//                 </span>
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {isLoading
//         ? Array(4)
//             .fill(null)
//             .map((_, index) => <SkeletonLoader key={index} />)
//         : // Create rows with 2 cards each
//           [...(modificationOptions?.available_modifications || [])]
//             .sort((a, b) => {
//               const priceA = calculateTotalTaxableAmount(a.price_breakdown);
//               const priceB = calculateTotalTaxableAmount(b.price_breakdown);
//               return priceA - priceB; // Ascending order
//             })
//             .reduce((rows, room, index) => {
//               if (index % 2 === 0) rows.push([]);
//               rows[rows.length - 1].push(room);
//               return rows;
//             }, [])
//             .map((row, rowIndex) => (
//               <div
//                 key={rowIndex}
//                 className="flex flex-col md:flex-row gap-4 w-full"
//               >
//                 {row.map((modification, index) => {
//                   const discountInfo = getDiscountInfo(
//                     modification.price_breakdown
//                   );
//                   const hasCorporateDiscount =
//                     modificationOptions?.client_type === "Corporate";

//                   // Calculate prices using taxable_amount from price_breakdown
//                   const averageTaxableAmount = calculateAverageTaxableAmount(
//                     modification.price_breakdown
//                   );
//                   const totalTaxableAmount = calculateTotalTaxableAmount(
//                     modification.price_breakdown
//                   );
//                   const pricePerNight = calculatePricePerNight(
//                     modification.price_breakdown
//                   );
//                   const totalPrice = calculateTotalPrice(
//                     modification.price_breakdown
//                   );

//                   return (
//                     <div
//                       key={index}
//                       className="border rounded-lg overflow-hidden shadow-md bg-white flex flex-col md:flex-row hover:shadow-xl transition duration-300 w-full md:w-1/2"
//                     >
//                       {/* Custom Image Carousel */}
//                       <div className="w-full md:w-1/3 h-64 md:h-auto">
//                         <ImageCarousel images={modification.images} />
//                       </div>

//                       <div className="p-4 flex flex-col space-y-2 w-full md:w-2/3">
//                         <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
//                           <div>
//                             <h2 className="text-xl sm:text-2xl font-poppins font-bold text-gray-800">
//                               {modification.roomtypename}
//                             </h2>
//                           </div>

//                           {/* Effective Date - Top Right on desktop, below on mobile */}
//                           <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
//                             <span className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-semibold bg-gray-100 text-gray-800">
//                               <FiClock className="inline-block mr-1 mb-1" />
//                               Effective from{" "}
//                               {formatDate(modification.effective_date)}
//                             </span>
//                           </div>
//                         </div>

//                         <p className="text-xs sm:text-sm text-gray-900 font-md font-light">
//                           {modification.description}
//                         </p>

//                         <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
//                           <div>
//                             <h3 className="text-base sm:text-lg font-poppins font-semibold text-gray-800">
//                               Amenities:
//                             </h3>
//                             <ul className="list-disc font-poppins list-inside text-xs sm:text-sm text-gray-600">
//                               {modification.amenities &&
//                               modification.amenities.length > 0 ? (
//                                 modification.amenities
//                                   .slice(0, 3)
//                                   .map((amenity, i) => (
//                                     <li key={i}>{amenity.name}</li>
//                                   ))
//                               ) : (
//                                 <li>No amenities available</li>
//                               )}
//                               {modification.amenities?.length > 3 && (
//                                 <li className="text-blue-500 text-xs sm:text-sm">
//                                   +{modification.amenities.length - 3} more
//                                 </li>
//                               )}
//                             </ul>
//                           </div>

//                           <div>
//                             <h3 className="text-base sm:text-lg font-poppins font-semibold text-gray-800">
//                               Services:
//                             </h3>
//                             <ul className="list-disc font-poppins list-inside text-xs sm:text-sm text-gray-600">
//                               {modification.service_categories &&
//                               modification.service_categories.length > 0 ? (
//                                 modification.service_categories
//                                   .slice(0, 3)
//                                   .map((service, i) => (
//                                     <li key={i}>{service.name}</li>
//                                   ))
//                               ) : (
//                                 <li>No services available</li>
//                               )}
//                               {modification.service_categories?.length > 3 && (
//                                 <li className="text-blue-500 text-xs sm:text-sm">
//                                   +{modification.service_categories.length - 3}{" "}
//                                   more
//                                 </li>
//                               )}
//                             </ul>
//                           </div>
//                         </div>

//                         <div className="text-xs sm:text-sm text-gray-600 mt-2 flex items-center gap-1 font-semibold">
//                           <span className="text-base sm:text-lg font-poppins font-semibold text-gray-800">
//                             Max occupancy:
//                           </span>
//                           {modification.max_occupancy || 2} Guests
//                         </div>

//                         <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t gap-3 sm:gap-0">
//                           <div className="flex flex-col w-full sm:w-auto">
//                             <p className="text-xs sm:text-sm text-gray-600">
//                               ₹{pricePerNight.toLocaleString("en-IN")}
//                               <span className="text-xs">/ Per night</span>
//                             </p>
//                             <p className="text-base sm:text-xl font-bold text-black">
//                               ₹{totalPrice.toLocaleString("en-IN")}
//                               <span className="text-[10px] sm:text-xs font-normal text-gray-600">
//                                 / Excluding taxes & fees
//                               </span>
//                             </p>
//                           </div>

//                           <button
//                             className={`py-2 font-semibold rounded-md transition text-xs sm:text-sm flex items-center justify-center gap-2 w-full sm:w-auto ${
//                               canRoomAccommodateGuests(modification) &&
//                               modification.available
//                                 ? "bg-purple-500 text-white hover:bg-purple-600 px-3 sm:px-4"
//                                 : "bg-gray-400 text-white cursor-not-allowed px-2 sm:px-3"
//                             }`}
//                             disabled={
//                               !canRoomAccommodateGuests(modification) ||
//                               !modification.available
//                             }
//                             onClick={() => handleRoomSelect(modification)}
//                           >
//                             {/* Show upgrade icon if price difference is positive */}
//                             {modification.modification_type === "upgrade" && (
//                               <FaArrowUp className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
//                             )}

//                             {/* Show downgrade icon if price difference is negative */}
//                             {modification.modification_type === "downgrade" && (
//                               <FaArrowUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 transform rotate-180" />
//                             )}

//                             {canRoomAccommodateGuests(modification) &&
//                             modification.available
//                               ? "Modify Reservation"
//                               : !modification.available
//                               ? "Not Available"
//                               : "Not available"}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ))}

//       {/* Sticky navigation buttons */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 sm:px-6 shadow-lg z-50">
//         <div className="max-w-8xl mx-auto flex justify-between gap-4 sm:gap-6">
//           <button
//             onClick={handleBack}
//             className="flex items-center justify-center px-3 py-2 sm:px-6 md:px-28 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition flex-1 sm:flex-initial text-sm sm:text-base"
//           >
//             Back
//           </button>

//           <button
//             onClick={handleProceed}
//             className="px-4 py-2 sm:px-6 md:px-8 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition flex-1 sm:flex-initial text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
//             disabled={!currentRoomType}
//           >
//             Proceed with current room
//           </button>
//         </div>
//       </div>

//       {showProfilePopup && (
//         <ProfileCreationPopup
//           isOpen={showProfilePopup}
//           onClose={() => setShowProfilePopup(false)}
//           onContinueAsGuest={handleContinueAsGuest}
//         />
//       )}
//       <ToastContainer />
//     </div>
//   );
// };

// export default PropertyRooms;
