import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedAmenities } from './redux/action';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const EnhanceCheckinStay = ({ currentStep }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { reservationMadeOn, checkInDate, checkOutDate, daysCount } = useSelector(
    (state) => state.selectedDates
  );

  const { selectedRoom } = useSelector((state) => state.roomtype);
  const { rooms, adults, children, infants, extraBedCount, childrenAges } = useSelector(
    (state) => state.formDetails
  );

  // Get booking data from Redux
  const booking = useSelector((state) => state.booking.selectedBooking);

  const storedAmenities = useSelector((state) => state.amenities.selectedAmenities);
  const [selectedAmenities, setLocalSelectedAmenities] = useState(storedAmenities || []);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for stay length modification message
  const [stayLengthModified, setStayLengthModified] = useState(false);

  // Calculate original stay length from booking
  const originalCheckIn = booking?.checkindate ? new Date(booking.checkindate) : null;
  const originalCheckOut = booking?.checkoutdate ? new Date(booking.checkoutdate) : null;
  const originalNights =
    originalCheckIn && originalCheckOut
      ? Math.ceil((originalCheckOut - originalCheckIn) / (1000 * 60 * 60 * 24))
      : 0;

  // Calculate new stay length
  const newCheckIn = checkInDate ? new Date(checkInDate) : null;
  const newCheckOut = checkOutDate ? new Date(checkOutDate) : null;
  const newNights =
    newCheckIn && newCheckOut
      ? Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24))
      : daysCount || 0;

  // Check if stay length has changed
  useEffect(() => {
    if (booking && originalCheckIn && originalCheckOut && newCheckIn && newCheckOut) {
      const checkInChanged = originalCheckIn.getTime() !== newCheckIn.getTime();
      const checkOutChanged = originalCheckOut.getTime() !== newCheckOut.getTime();
      setStayLengthModified(checkInChanged || checkOutChanged);
    }
  }, [booking, checkInDate, checkOutDate]);

  // Fetch existing enhancements from the booking
  const fetchExistingEnhancements = async () => {
    try {
      const bookingId = booking?.bookingid;
      if (!bookingId) {
        console.log('No booking ID found, skipping existing enhancements fetch');
        return [];
      }

      console.log('Fetching existing enhancements for booking:', bookingId);

      const response = await fetch(`${CQ_BASE_URL}/bq/api/enhancements-for-booking/${bookingId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch existing enhancements: ${response.status}`);
        return [];
      }

      const data = await response.json();
      console.log('Existing enhancements from API:', data);

      // Transform existing enhancements to match our format
      const existingEnhancements = [
        ...(data.food || []).map((item) => ({
          id: item.id,
          name: item.title || item.name,
          description: item.description || '',
          price: item.price || item.base_price || 0,
          urgentPrice: item.urgent_price || item.price || 0,
          image: item.image || item.image_url,
          price_type: item.price_type || 'Per day',
          type: 'food',
          refundable: item.refundable ?? false,
          value: item.value || 0,
          value_type: item.value_type || 'P',
          is_multi: item.is_multi || false,
          max_quantity: item.max_quantity || 10,
          quantity: item.selected_quantity || 1,
          totalPrice: (item.price || item.base_price || 0) * (item.selected_quantity || 1),
          is_selected: true,
        })),
        ...(data.amenities || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.base_price || 0,
          urgentPrice: item.urgent_price || item.base_price || 0,
          image: item.image_url,
          price_type: item.price_type || 'Per day',
          type: 'amenity',
          refundable: item.refundable || false,
          value: item.value || 0,
          value_type: item.value_type || 'P',
          is_multi: item.is_multi || false,
          max_quantity: item.max_quantity || 10,
          quantity: item.selected_quantity || 1,
          totalPrice: (item.base_price || 0) * (item.selected_quantity || 1),
          is_selected: true,
        })),
        ...(data.room_services || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.base_price || 0,
          urgentPrice: item.urgent_price || item.base_price || 0,
          image: item.image_url,
          price_type: item.price_type || 'Per day',
          type: 'room_service',
          refundable: item.refundable || false,
          value: item.value || 0,
          value_type: item.value_type || 'P',
          is_multi: item.is_multi || false,
          max_quantity: item.max_quantity || 10,
          quantity: item.selected_quantity || 1,
          totalPrice: (item.base_price || 0) * (item.selected_quantity || 1),
          is_selected: true,
        })),
      ];

      return existingEnhancements;
    } catch (error) {
      console.error('Error fetching existing enhancements:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        // Get room type ID from selectedRoom
        const roomTypeId = selectedRoom?.roomtypeid || selectedRoom?.id || selectedRoom?.roomTypeId;

        console.log('Selected Room object:', selectedRoom);
        console.log('Room Type ID being used:', roomTypeId);

        if (!roomTypeId) {
          console.warn('No room type ID available - selectedRoom:', selectedRoom);
          setAmenities([]);
          setLoading(false);
          return;
        }

        // 1. Fetch existing enhancements from the booking
        const existingEnhancements = await fetchExistingEnhancements();

        // 2. Construct URL with roomtypeid query parameter
        const url = `${CQ_BASE_URL}/bq/api/enhance-your-stay?roomtypeid=${roomTypeId}`;

        console.log('Fetching amenities from URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Check if response has the expected structure
        if (data.status !== 'success') {
          throw new Error('API returned unsuccessful status');
        }

        // Create maps of existing enhancements for quick lookup
        const existingFoodMap = new Map();
        const existingAmenityMap = new Map();
        const existingRoomServiceMap = new Map();

        existingEnhancements.forEach((item) => {
          if (item.type === 'food') {
            existingFoodMap.set(item.id, item);
          } else if (item.type === 'amenity') {
            existingAmenityMap.set(item.id, item);
          } else if (item.type === 'room_service') {
            existingRoomServiceMap.set(item.id, item);
          }
        });

        // Transform amenities with existing selections
        const transformedAmenities = [
          ...(data.food || []).map((item) => {
            const existingItem = existingFoodMap.get(item.id);
            return {
              id: item.id,
              name: item.title || item.name,
              description: item.description || '',
              price: item.price || item.base_price || 0,
              urgentPrice: item.urgent_price || item.price || 0,
              image: item.image || item.image_url,
              price_type: item.price_type || 'Per day',
              type: 'food',
              refundable: item.refundable ?? false,
              value: item.value || 0,
              value_type: item.value_type || 'P',
              is_multi: item.is_multi || false,
              max_quantity: item.max_quantity || 10,
              quantity: existingItem?.quantity || 0,
              totalPrice: existingItem?.totalPrice || 0,
            };
          }),
          ...(data.amenities || []).map((item) => {
            const existingItem = existingAmenityMap.get(item.id);
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.base_price || 0,
              urgentPrice: item.urgent_price || item.base_price || 0,
              image: item.image_url,
              price_type: item.price_type || 'Per day',
              type: 'amenity',
              refundable: item.refundable || false,
              value: item.value || 0,
              value_type: item.value_type || 'P',
              is_multi: item.is_multi || false,
              max_quantity: item.max_quantity || 10,
              quantity: existingItem?.quantity || 0,
              totalPrice: existingItem?.totalPrice || 0,
            };
          }),
          ...(data.room_services || []).map((item) => {
            const existingItem = existingRoomServiceMap.get(item.id);
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.base_price || 0,
              urgentPrice: item.urgent_price || item.base_price || 0,
              image: item.image_url,
              price_type: item.price_type || 'Per day',
              type: 'room_service',
              refundable: item.refundable || false,
              value: item.value || 0,
              value_type: item.value_type || 'P',
              is_multi: item.is_multi || false,
              max_quantity: item.max_quantity || 10,
              quantity: existingItem?.quantity || 0,
              totalPrice: existingItem?.totalPrice || 0,
            };
          }),
        ];

        setAmenities(transformedAmenities);

        // Set selected amenities from existing ones
        const preselectedAmenities = transformedAmenities.filter((item) => item.quantity > 0);

        if (preselectedAmenities.length > 0) {
          console.log('Preselecting amenities:', preselectedAmenities);
          setLocalSelectedAmenities(preselectedAmenities);
          // Also dispatch to Redux to keep state in sync
          dispatch(setSelectedAmenities(preselectedAmenities));
        } else if (storedAmenities && storedAmenities.length > 0) {
          // Fallback to stored amenities from Redux
          setLocalSelectedAmenities(storedAmenities);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchAmenities();
  }, [selectedRoom, booking?.bookingid]);

  const handleAddAmenity = (amenity, quantity) => {
    if (quantity === 0) {
      // Remove the amenity if quantity is 0
      const newAmenities = selectedAmenities.filter((a) => a.id !== amenity.id);
      setLocalSelectedAmenities(newAmenities);
    } else {
      const amenityWithQuantity = {
        ...amenity,
        quantity,
        totalPrice: amenity.price * quantity,
      };

      const existingIndex = selectedAmenities.findIndex((a) => a.id === amenity.id);

      let newAmenities;
      if (existingIndex >= 0) {
        newAmenities = [...selectedAmenities];
        newAmenities[existingIndex] = amenityWithQuantity;
      } else {
        newAmenities = [...selectedAmenities, amenityWithQuantity];
      }

      setLocalSelectedAmenities(newAmenities);
      // Update Redux store
      dispatch(setSelectedAmenities(newAmenities));
    }
  };

  const handleRemoveAmenity = (amenityId) => {
    const newAmenities = selectedAmenities.filter((a) => a.id !== amenityId);
    setLocalSelectedAmenities(newAmenities);
    dispatch(setSelectedAmenities(newAmenities));
  };

  const handleContinue = () => {
    dispatch(setSelectedAmenities(selectedAmenities));
    navigate('/edit-reservation/update-reservation-summary');
  };

  const handleSkip = () => {
    dispatch(setSelectedAmenities([]));
    navigate('/edit-reservation/update-reservation-summary');
  };

  const handleBack = () => {
    navigate('/edit-reservation/update-roomdetails');
  };

  const incrementQuantity = (amenity) => {
    const existingAmenity = selectedAmenities.find((a) => a.id === amenity.id);
    const currentQty = existingAmenity ? existingAmenity.quantity : 0;
    const maxQty = amenity.max_quantity || 10;

    if (currentQty < maxQty) {
      handleAddAmenity(amenity, currentQty + 1);
    } else {
      toast.warn(
        "For larger requests or group arrangements, please contact the front desk. We'll be happy to assist you personally.",
        {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }
  };

  const decrementQuantity = (amenity) => {
    const existingAmenity = selectedAmenities.find((a) => a.id === amenity.id);
    const currentQty = existingAmenity ? existingAmenity.quantity : 0;

    if (currentQty > 0) {
      handleAddAmenity(amenity, currentQty - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
        {/* <ProgressSteps currentStep={2} /> */}
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <p>Loading amenities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
        {/* <ProgressSteps currentStep={2} /> */}
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <p className="text-red-500">Error loading amenities: {error}</p>
        </div>
      </div>
    );
  }

  // Show message if no room type is selected
  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
        <ProgressSteps currentStep={2} />
        <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
          <p className="text-yellow-600">Please select a room type first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 mt-16 relative pb-24">
      {/* <ProgressSteps currentStep={2} /> */}

      <div className="max-w-7xl mx-auto">
        <div className="text-gray-700 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl text-black font-bold mb-1 mt-8">Enhance Your Stay</h1>
              <div className="mb-2">
                <p>
                  {adults} Adult{adults !== 1 ? 's' : ''}
                  {children > 0 && (
                    <>
                      , {children} Child{children !== 1 ? 'ren' : ''}
                    </>
                  )}
                  {` · ${Math.max(1, daysCount)} Night${daysCount !== 1 ? 's' : ''}`}
                  {` · ${rooms} Room${rooms !== 1 ? 's' : ''}`}
                  {selectedRoom?.roomtypename && ` · ${selectedRoom.roomtypename}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SELECTED AMENITIES SUMMARY SECTION WITH MESSAGE ========== */}
        {selectedAmenities.filter((item) => item.quantity > 0).length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your selected amenities</h2>
              {/* Stay length modification message - top right */}
              {stayLengthModified && (
                <div className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm">
                  You have modified your stay length, please add/remove the selected amenities
                  accordingly
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedAmenities
                .filter((item) => item.quantity > 0)
                .map((item) => (
                  <div
                    key={`${item.id}-${item.type}`}
                    className="border rounded-lg p-4 bg-gray-50 border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">
                          {item.name} X {item.quantity}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium">Total:</span>
                      <div className="text-right">
                        <span className="font-bold block">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.value === 0 ? (
                          <span className="text-xs text-gray-500 block mt-1">
                            Tax not applicable
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 block mt-1">
                            Excluding taxes & fees
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Main amenities grid */}
        {amenities.length === 0 ? (
          <div className="text-center py-8">
            <p>No amenities available for this room type</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {amenities.map((amenity) => {
              const isSelected = selectedAmenities.some((a) => a.id === amenity.id);
              const selectedItem = selectedAmenities.find((a) => a.id === amenity.id);
              const quantity = selectedItem ? selectedItem.quantity : 0;

              return (
                <div
                  key={amenity.id}
                  className={`relative flex flex-col border rounded-md overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="h-48 w-full">
                    <img
                      src={amenity.image}
                      alt={amenity.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                  </div>

                  <div className="p-4 flex flex-col">
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-lg text-gray-800">{amenity.name}</h3>
                        {/* Display refundable badge if applicable */}
                        {amenity.refundable ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Refundable
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Non-Refundable
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {amenity.urgentPrice > amenity.price && (
                            <p className="text-xs text-gray-500 line-through">
                              ₹{amenity.urgentPrice.toLocaleString('en-IN')}
                            </p>
                          )}
                          <p className="font-semibold text-gray-900 lowercase ">
                            ₹{amenity.price.toLocaleString('en-IN')}/{amenity.price_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {amenity.value === 0 ? 'Tax not applicable' : 'Excluding taxes & fees'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {quantity === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementQuantity(amenity);
                              }}
                              className="px-6 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                            >
                              Add
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (quantity === 1) {
                                    handleRemoveAmenity(amenity.id);
                                  } else {
                                    decrementQuantity(amenity);
                                  }
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-gray-400 ${
                                  quantity === 1
                                    ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                    : 'text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {quantity === 1 ? <FiTrash2 size={16} /> : <FiMinus size={16} />}
                              </button>
                              <span className="text-base font-medium w-8 text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  incrementQuantity(amenity);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  quantity >= amenity.max_quantity
                                    ? 'text-gray-400 cursor-not-allowed border border-gray-400'
                                    : 'text-gray-700 hover:bg-gray-200 border border-gray-400'
                                }`}
                              >
                                <FiPlus size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls - always visible */}
                    <div className="">
                      {quantity > 0 && (
                        <>
                          <div className="mt-3 flex justify-between items-center  pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium">Total:</span>
                            <span className="font-bold">
                              ₹{(amenity.price * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right text-xs text-gray-500 ">
                            Excluding taxes & fees
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between gap-4">
        <button
          onClick={handleBack}
          className="py-2 px-6 w-1/5 rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Back
        </button>
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="py-2 px-6 w-[250px] rounded-md font-medium border border-black text-black hover:bg-gray-100"
          >
            Skip
          </button>
          <button
            onClick={handleContinue}
            className="py-2 px-6 w-[250px] rounded-md font-medium bg-purple-500 text-white hover:bg-purple-600"
          >
            {selectedAmenities.length > 0 ? 'Confirm Purchase' : 'Continue'}
          </button>
        </div>
      </div>
      <ToastContainer autoClose={5000} />
    </div>
  );
};

export default EnhanceCheckinStay;

// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { setSelectedAmenities } from "./redux/action";
// import { useNavigate } from "react-router-dom";
// import ProgressSteps from "./ReservationSteps";
// import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const EnhanceStayModify = ({ currentStep }) => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   // Get all necessary data from Redux
//   const booking = useSelector((state) => state.booking.selectedBooking);
//   const { reservationMadeOn, checkInDate, checkOutDate, daysCount } =
//     useSelector((state) => state.selectedModifyDates);
//   const { selectedRoom } = useSelector((state) => state.roomtype);
//   const { rooms, adults, children, infants, extraBedCount, childrenAges } =
//     useSelector((state) => state.formDetails);

//   // Get selected amenities from Redux (persisted state)
//   const reduxSelectedAmenities = useSelector(
//     (state) => state.amenities.selectedAmenities
//   );

//   // Check if stay length has been modified
//   const [stayLengthModified, setStayLengthModified] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [amenities, setAmenities] = useState([]);
//   const [activeTab, setActiveTab] = useState("all");

//   // State for selected amenities (will be populated from API first, then user selections)
//   const [selectedAmenities, setLocalSelectedAmenities] = useState([]);

//   // Calculate original stay length from booking
//   const originalCheckIn = new Date(booking?.checkindate);
//   const originalCheckOut = new Date(booking?.checkoutdate);
//   const originalNights = Math.ceil(
//     (originalCheckOut - originalCheckIn) / (1000 * 60 * 60 * 24)
//   );

//   // Calculate new stay length
//   const newCheckIn = new Date(checkInDate);
//   const newCheckOut = new Date(checkOutDate);
//   const newNights = Math.ceil(
//     (newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24)
//   );

//   // Check if stay length has changed
//   useEffect(() => {
//     if (booking) {
//       const originalCheckIn = new Date(booking.checkindate);
//       const originalCheckOut = new Date(booking.checkoutdate);
//       const modifiedCheckIn = new Date(checkInDate);
//       const modifiedCheckOut = new Date(checkOutDate);

//       // Check if either check-in or check-out date has changed
//       const checkInChanged =
//         originalCheckIn.getTime() !== modifiedCheckIn.getTime();
//       const checkOutChanged =
//         originalCheckOut.getTime() !== modifiedCheckOut.getTime();

//       setStayLengthModified(checkInChanged || checkOutChanged);
//     }
//   }, [booking, checkInDate, checkOutDate]);

//   // Fetch existing selected enhancements from API
//   const fetchExistingEnhancements = async () => {
//     try {
//       const bookingId = booking?.bookingid;
//       if (!bookingId) {
//         throw new Error("No booking ID found");
//       }

//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/enhancements-for-booking/${bookingId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       // Transform API response to match our format
//       // Transform API response to match our format
//       const existingEnhancements = [
//         ...(data.food || []).map((item) => ({
//           id: item.id,
//           name: item.title || item.name,
//           description: item.description,
//           price: item.price || item.base_price,
//           urgentPrice: item.price || item.base_price,
//           image: item.image,
//           price_type: item.price_type,
//           type: "food",
//           refundable: false,
//           value: item.value, // Use actual value
//           value_type: item.value_type, // Use actual value_type
//           is_multi: item.is_multi,
//           max_quantity: item.max_quantity || 10,
//           is_selected: item.is_selected || false,
//           quantity: item.selected_quantity || 0,
//           totalPrice:
//             (item.price || item.base_price) * (item.selected_quantity || 0),
//         })),
//         ...(data.room_services || []).map((item) => ({
//           id: item.id,
//           name: item.name,
//           description: item.description || "",
//           price: item.base_price,
//           urgentPrice: item.urgent_price || item.base_price,
//           image: item.image_url || item.image,
//           price_type: item.price_type,
//           type: "room_service",
//           refundable: item.refundable || false,
//           value: item.value || 5,
//           value_type: item.value_type || "P",
//           is_multi: item.is_multi || true,
//           max_quantity: item.max_quantity || 10,
//           is_selected: item.is_selected || false,
//           quantity: item.selected_quantity || 0,
//           selected_urgent: item.selected_urgent || false,
//           selected_notes: item.selected_notes || null,
//           totalPrice: item.base_price * (item.selected_quantity || 0),
//         })),
//         ...(data.amenities || []).map((item) => ({
//           id: item.id,
//           name: item.name,
//           description: item.description || "",
//           price: item.base_price,
//           urgentPrice: item.urgent_price || item.base_price,
//           image: item.image_url || item.image,
//           price_type: item.price_type,
//           type: "amenity",
//           refundable: item.refundable || false,
//           value: item.value || 5,
//           value_type: item.value_type || "P",
//           is_multi: item.is_multi || true,
//           max_quantity: item.max_quantity || 10,
//           is_selected: item.is_selected || false,
//           quantity: item.selected_quantity || 0,
//           selected_urgent: item.selected_urgent || false,
//           selected_notes: item.selected_notes || null,
//           totalPrice: item.base_price * (item.selected_quantity || 0),
//         })),
//       ];
//       // If we have existing enhancements from API, use them
//       // Otherwise check if we have persisted selections in Redux
//       if (existingEnhancements.length > 0) {
//         setLocalSelectedAmenities(
//           existingEnhancements.filter(
//             (item) => item.is_selected && item.quantity > 0
//           )
//         );
//       } else if (reduxSelectedAmenities && reduxSelectedAmenities.length > 0) {
//         setLocalSelectedAmenities(reduxSelectedAmenities);
//       }

//       return existingEnhancements;
//     } catch (error) {
//       console.error("Error fetching existing enhancements:", error);
//       setError(`Failed to load existing enhancements: ${error.message}`);
//       return [];
//     }
//   };

//   // Fetch all available amenities
//   const fetchAllAmenities = async () => {
//     try {
//       const response = await fetch(`${CQ_BASE_URL}/bq/api/enhance-your-stay`, {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error("Error fetching amenities:", error);
//       throw error;
//     }
//   };

//   // Main data fetching effect
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         // 1. First fetch existing selected enhancements from API
//         const existingEnhancements = await fetchExistingEnhancements();

//         // 2. Fetch all available amenities
//         const allAmenitiesData = await fetchAllAmenities();

//         // Transform all amenities data to match our format
//         const transformedAmenities = [
//           ...(allAmenitiesData.food || []).map((item) => {
//             // Check if this item already exists in our selected enhancements
//             const existingItem =
//               existingEnhancements.find(
//                 (e) => e.id === item.id && e.type === "food"
//               ) ||
//               selectedAmenities.find(
//                 (e) => e.id === item.id && e.type === "food"
//               );

//             return {
//               id: item.id,
//               name: item.title || item.name,
//               description: item.description,
//               price: item.price || item.base_price,
//               urgentPrice: item.price || item.base_price,
//               image: item.image,
//               price_type: item.price_type,
//               type: "food",
//               refundable: false,
//               value: item.value, // Use the actual value from API instead of hardcoding 5
//               value_type: item.value_type, // Use the actual value_type from API
//               is_multi: item.is_multi,
//               max_quantity: item.max_quantity || 10,
//               is_selected: !!existingItem && existingItem.quantity > 0,
//               quantity: existingItem?.quantity || 0,
//             };
//           }),
//           ...(allAmenitiesData.amenities || []).map((item) => {
//             const existingItem =
//               existingEnhancements.find(
//                 (e) => e.id === item.id && e.type === "amenity"
//               ) ||
//               selectedAmenities.find(
//                 (e) => e.id === item.id && e.type === "amenity"
//               );

//             return {
//               id: item.id,
//               name: item.name,
//               description: item.description || "",
//               price: item.base_price,
//               urgentPrice: item.urgent_price || item.base_price,
//               image: item.image_url || item.image,
//               price_type: item.price_type,
//               type: "amenity",
//               refundable: item.refundable || false,
//               value: item.value || 12,
//               value_type: item.value_type || "P",
//               is_multi: item.is_multi || true,
//               max_quantity: item.max_quantity || 10,
//               is_selected: !!existingItem && existingItem.quantity > 0,
//               quantity: existingItem?.quantity || 0,
//             };
//           }),
//           ...(allAmenitiesData.room_services || []).map((item) => {
//             const existingItem =
//               existingEnhancements.find(
//                 (e) => e.id === item.id && e.type === "room_service"
//               ) ||
//               selectedAmenities.find(
//                 (e) => e.id === item.id && e.type === "room_service"
//               );

//             return {
//               id: item.id,
//               name: item.name,
//               description: item.description || "",
//               price: item.base_price,
//               urgentPrice: item.urgent_price || item.base_price,
//               image: item.image_url || item.image,
//               price_type: item.price_type,
//               type: "room_service",
//               refundable: item.refundable || false,
//               value: item.value || 12,
//               value_type: item.value_type || "P",
//               is_multi: item.is_multi || true,
//               max_quantity: item.max_quantity || 10,
//               is_selected: !!existingItem && existingItem.quantity > 0,
//               quantity: existingItem?.quantity || 0,
//             };
//           }),
//         ];

//         setAmenities(transformedAmenities);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setError(error.message);
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []); // Empty dependency array - only run on mount

//   // Update Redux store whenever selectedAmenities changes
//   useEffect(() => {
//     dispatch(setSelectedAmenities(selectedAmenities));
//   }, [selectedAmenities, dispatch]);

//   const filteredAmenities = amenities.filter((item) => {
//     if (activeTab === "all") return true;
//     return item.type === activeTab;
//   });

//   const handleAddAmenity = (amenity, quantity) => {
//     const amenityWithQuantity = {
//       ...amenity,
//       quantity,
//       totalPrice: amenity.price * quantity,
//       is_selected: quantity > 0,
//     };

//     const existingIndex = selectedAmenities.findIndex(
//       (a) => a.id === amenity.id && a.type === amenity.type
//     );

//     let newAmenities;
//     if (existingIndex >= 0) {
//       newAmenities = [...selectedAmenities];
//       // ALWAYS update the item, even if quantity is 0
//       newAmenities[existingIndex] = amenityWithQuantity;
//     } else {
//       // ALWAYS add the item, even if quantity is 0
//       newAmenities = [...selectedAmenities, amenityWithQuantity];
//     }

//     setLocalSelectedAmenities(newAmenities);
//   };
//   const handleRemoveAmenity = (amenityId) => {
//     // Instead of removing, find the amenity and set quantity to 0
//     const amenityToRemove = selectedAmenities.find((a) => a.id === amenityId);
//     if (amenityToRemove) {
//       handleAddAmenity(amenityToRemove, 0);
//     }
//   };

//   const handleContinue = () => {
//     navigate("/edit-reservation/update-reservation-summary");
//   };

//   const handleSkip = () => {
//     dispatch(setSelectedAmenities([]));
//     navigate("/edit-reservation/update-reservation-summary");
//   };

//   const handleBack = () => {
//     navigate("/edit-reservation/update-roomdetails");
//   };

//   const incrementQuantity = (amenity) => {
//     const existingAmenity = selectedAmenities.find(
//       (a) => a.id === amenity.id && a.type === amenity.type
//     );
//     const currentQty = existingAmenity ? existingAmenity.quantity : 0;
//     const maxQty = amenity.max_quantity || 10;

//     if (currentQty < maxQty) {
//       handleAddAmenity(amenity, currentQty + 1);
//     } else {
//       toast.warn(
//         "Maximum quantity reached. For larger requests, please contact the front desk.",
//         {
//           position: "top-center",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//         }
//       );
//     }
//   };

//   const decrementQuantity = (amenity) => {
//     const existingAmenity = selectedAmenities.find(
//       (a) => a.id === amenity.id && a.type === amenity.type
//     );
//     const currentQty = existingAmenity ? existingAmenity.quantity : 0;

//     if (currentQty > 0) {
//       // This will set quantity to 0 when going from 1 to 0
//       handleAddAmenity(amenity, currentQty - 1);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
//         <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
//           <p>Loading amenities...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
//         <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
//           <p className="text-red-500">Error loading amenities: {error}</p>
//         </div>
//       </div>
//     );
//   }

//   const calculateNights = (startDate, endDate) => {
//     if (!startDate || !endDate) return 0;

//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     // Handle same day (minimum 1 night)
//     if (start.toDateString() === end.toDateString()) return 1;

//     const timeDiff = end.getTime() - start.getTime();
//     return Math.ceil(timeDiff / (1000 * 3600 * 24));
//   };

//   return (
//     <div className="min-h-screen bg-white text-black p-6 mt-16 relative pb-24">
//       <div className="max-w-7xl mx-auto">
//         <div className="text-gray-700 mb-4">
//           <div className="flex justify-between items-start">
//             <div>
//               <h1 className="text-2xl text-black font-bold mb-1 mt-8">
//                 Enhance Your Stay
//               </h1>
//               <div className="mb-2">
//                 <p>
//                   {adults} Adult{adults !== 1 ? "s" : ""}
//                   {children > 0 && (
//                     <>
//                       , {children} Child{children !== 1 ? "ren" : ""}
//                     </>
//                   )}
//                   {` · ${
//                     daysCount || calculateNights(checkInDate, checkOutDate)
//                   } Night${
//                     (daysCount ||
//                       calculateNights(checkInDate, checkOutDate)) !== 1
//                       ? "s"
//                       : ""
//                   }`}
//                   {` · ${rooms} Room${rooms !== 1 ? "s" : ""}`}
//                   {selectedRoom?.roomtypename &&
//                     ` · ${selectedRoom.roomtypename}`}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Tab navigation */}
//         <div className="flex border-b border-gray-200 mb-6">
//           <button
//             onClick={() => setActiveTab("all")}
//             className={`px-4 py-2 font-medium text-sm ${
//               activeTab === "all"
//                 ? "text-gray-900 border-b-2 border-gray-900"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//           >
//             All
//           </button>
//           <button
//             onClick={() => setActiveTab("food")}
//             className={`px-4 py-2 font-medium text-sm ${
//               activeTab === "food"
//                 ? "text-gray-900 border-b-2 border-gray-900"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//           >
//             Food & Beverages
//           </button>
//           <button
//             onClick={() => setActiveTab("amenity")}
//             className={`px-4 py-2 font-medium text-sm ${
//               activeTab === "amenity"
//                 ? "text-gray-900 border-b-2 border-gray-900"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//           >
//             Amenities
//           </button>
//           <button
//             onClick={() => setActiveTab("room_service")}
//             className={`px-4 py-2 font-medium text-sm ${
//               activeTab === "room_service"
//                 ? "text-gray-900 border-b-2 border-gray-900"
//                 : "text-gray-500 hover:text-gray-700"
//             }`}
//           >
//             Room Services
//           </button>
//         </div>

//         {/* Display current enhancements */}
//         {selectedAmenities.filter((item) => item.quantity > 0).length > 0 && (
//           <div className="mb-8">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Your selected amenities</h2>
//               {stayLengthModified && (
//                 <div className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2 rounded-md text-sm">
//                   You have modified your stay length, please add/remove the
//                   selected amenities accordingly
//                 </div>
//               )}
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {selectedAmenities
//                 .filter((item) => item.quantity > 0)
//                 .map((item) => (
//                   <div
//                     key={`${item.id}-${item.type}`}
//                     className="border rounded-lg p-4 bg-gray-50 border-gray-200"
//                   >
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="font-bold">
//                           {item.name} X {item.quantity}
//                         </h3>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-semibold">
//                           ₹{item.price.toLocaleString("en-IN")}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="mt-2 flex justify-between items-center">
//                       <span className="text-sm font-medium">Total:</span>
//                       <div className="text-right">
//                         <span className="font-bold block">
//                           ₹
//                           {(item.price * item.quantity).toLocaleString("en-IN")}
//                         </span>
//                         {item.value === 0 ? (
//                           <span className="text-xs text-gray-500 block mt-1">
//                             Tax not applicable
//                           </span>
//                         ) : (
//                           <span className="text-xs text-gray-500 block mt-1">
//                             Excluding taxes & fees
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//             </div>
//           </div>
//         )}

//         {filteredAmenities.length === 0 ? (
//           <div className="text-center py-8">
//             <p>
//               No {activeTab === "all" ? "enhancements" : activeTab} available at
//               this time
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//             {filteredAmenities.map((amenity) => {
//               const selectedItem = selectedAmenities.find(
//                 (a) => a.id === amenity.id && a.type === amenity.type
//               );
//               const quantity = selectedItem ? selectedItem.quantity : 0;

//               return (
//                 <div
//                   key={`${amenity.id}-${amenity.type}`}
//                   className={`relative flex flex-col border rounded-md overflow-hidden transition-all duration-200 ${
//                     quantity > 0
//                       ? "ring-2 ring-gray-700 bg-gray-50"
//                       : "border-gray-200 hover:border-gray-300 hover:shadow-md"
//                   }`}
//                 >
//                   <div className="h-48 w-full">
//                     <img
//                       src={amenity.image}
//                       alt={amenity.name}
//                       className="w-full h-full object-cover"
//                       onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src =
//                           "https://via.placeholder.com/400x300?text=Image+Not+Available";
//                       }}
//                     />
//                   </div>

//                   <div className="p-4 flex flex-col">
//                     <div className="flex-grow">
//                       <div className="flex justify-between items-start mb-1">
//                         <h3 className="font-bold text-lg text-gray-800">
//                           {amenity.name}
//                         </h3>
//                         <div className="flex flex-col items-end">
//                           {amenity.refundable ? (
//                             <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mb-1">
//                               Refundable
//                             </span>
//                           ) : (
//                             <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full mb-1">
//                               Non-Refundable
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     <div className="mt-2">
//                       <div className="flex items-center justify-between">
//                         <div className="flex flex-col">
//                           {amenity.urgentPrice > amenity.price && (
//                             <p className="text-xs text-gray-500 line-through">
//                               ₹{amenity.urgentPrice.toLocaleString("en-IN")}
//                             </p>
//                           )}
//                           <p className="font-semibold text-gray-900 lowercase ">
//                             ₹{amenity.price.toLocaleString("en-IN")}/
//                             {amenity.price_type}
//                           </p>
//                           <p className="text-xs text-gray-500">
//                             {amenity.value == 0
//                               ? "Tax not applicable"
//                               : "Excluding taxes & fees"}
//                           </p>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           {quantity === 0 ? (
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 incrementQuantity(amenity);
//                               }}
//                               className="px-6 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
//                             >
//                               Add
//                             </button>
//                           ) : (
//                             <>
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   if (quantity === 1) {
//                                     handleAddAmenity(amenity, 0);
//                                   } else {
//                                     decrementQuantity(amenity);
//                                   }
//                                 }}
//                                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-gray-400 ${
//                                   quantity === 1
//                                     ? "text-red-500 hover:text-red-700 hover:bg-red-50"
//                                     : "text-gray-700 hover:bg-gray-200"
//                                 }`}
//                               >
//                                 {quantity === 1 ? (
//                                   <FiTrash2 size={16} />
//                                 ) : (
//                                   <FiMinus size={16} />
//                                 )}
//                               </button>
//                               <span className="text-base font-medium w-8 text-center">
//                                 {quantity}
//                               </span>
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   incrementQuantity(amenity);
//                                 }}
//                                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
//                                   quantity >= amenity.max_quantity
//                                     ? "text-gray-400 cursor-not-allowed border border-gray-400"
//                                     : "text-gray-700 hover:bg-gray-200 border border-gray-400"
//                                 }`}
//                               >
//                                 <FiPlus size={16} />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {quantity > 0 && (
//                       <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-200">
//                         <span className="text-sm font-medium">Total:</span>
//                         <span className="font-bold">
//                           ₹{(amenity.price * quantity).toLocaleString("en-IN")}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Bottom action buttons */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between gap-4">
//         <button
//           onClick={handleBack}
//           className="py-2 px-6 w-[250px] max-w-[calc(50%-8px)] rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
//         >
//           Back
//         </button>
//         <button
//           onClick={handleContinue}
//           className="py-2 px-6 w-[250px] max-w-[calc(50%-8px)] rounded-md font-medium bg-purple-500 hover:bg-purple-600 text-white"
//         >
//           Confirm Purchase
//         </button>
//       </div>
//       <ToastContainer autoClose={5000} />
//     </div>
//   );
// };

// export default EnhanceStayModify;
