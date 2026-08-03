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

  // Use Redux state directly
  const selectedAmenities = useSelector((state) => state.amenities.selectedAmenities);

  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const MAX_QUANTITY = 10;

  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const roomTypeId = selectedRoom?.roomtypeid || selectedRoom?.id;

        if (!roomTypeId) {
          console.warn('No room type ID available');
          setAmenities([]);
          setLoading(false);
          return;
        }

        const url = new URL(`${CQ_BASE_URL}/bq/api/enhance-your-stay`);
        url.searchParams.append('roomtypeid', roomTypeId);

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

        if (data.status !== 'success') {
          throw new Error('API returned unsuccessful status');
        }

        const foodWith5PercentValue = (data.food || []).map((item) => ({
          ...item,
          value: item.value,
          value_type: item.value_type ?? 'P',
        }));

        const transformedAmenities = [
          ...foodWith5PercentValue.map((item) => ({
            id: item.id,
            name: item.title || item.name,
            description: item.description || '',
            price: item.price || item.base_price || 0,
            urgentPrice: item.urgent_price || item.price || 0,
            image: item.image || item.image_url,
            price_type: item.price_type || 'Per day',
            type: 'food',
            refundable: false,
            value: item.value || 0,
            value_type: item.value_type || 'P',
            is_multi: item.is_multi || false,
            max_quantity: item.max_quantity || 10,
          })),
          ...(data.amenities || []).map((item) => ({
            id: item.id,
            name: item.name,
            description: '',
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
          })),
          ...(data.room_services || []).map((item) => ({
            id: item.id,
            name: item.name,
            description: '',
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
          })),
        ];

        setAmenities(transformedAmenities);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching amenities:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchAmenities();
  }, [selectedRoom]);

  const updateReduxAmenities = (updatedAmenities) => {
    dispatch(setSelectedAmenities(updatedAmenities));
  };

  const handleAddAmenity = (amenity, quantity) => {
    let updatedAmenities;

    if (quantity === 0) {
      updatedAmenities = selectedAmenities.filter((a) => a.id !== amenity.id);
    } else {
      const amenityWithQuantity = {
        ...amenity,
        quantity,
        totalPrice: amenity.price * quantity,
      };

      const existingIndex = selectedAmenities.findIndex((a) => a.id === amenity.id);

      if (existingIndex >= 0) {
        updatedAmenities = [...selectedAmenities];
        updatedAmenities[existingIndex] = amenityWithQuantity;
      } else {
        updatedAmenities = [...selectedAmenities, amenityWithQuantity];
      }
    }

    updateReduxAmenities(updatedAmenities);
  };

  const handleRemoveAmenity = (amenityId) => {
    const updatedAmenities = selectedAmenities.filter((a) => a.id !== amenityId);
    updateReduxAmenities(updatedAmenities);
  };

  const handleContinue = () => {
    navigate('/walk-in/booking-summary');
  };

  const handleSkip = () => {
    dispatch(setSelectedAmenities([]));
    navigate('/walk-in/booking-summary');
  };

  const handleBack = () => {
    // 🔥 THIS IS THE KEY CHANGE - Clear all selected amenities when going back
    dispatch(setSelectedAmenities([]));
    navigate('/search-page');
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

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
        {/* <ProgressSteps currentStep={2} /> */}
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
                          <p className="font-semibold text-gray-900 lowercase">
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

                    <div className="">
                      {quantity > 0 && (
                        <>
                          <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium">Total:</span>
                            <span className="font-bold">
                              ₹{(amenity.price * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right text-xs text-gray-500">
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
// import ProgressSteps from "./ProgressSteps";
// import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const EnhanceCheckinStay = ({ currentStep }) => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { reservationMadeOn, checkInDate, checkOutDate, daysCount } =
//     useSelector((state) => state.selectedDates);

//   const { selectedRoom } = useSelector((state) => state.roomtype);
//   const { rooms, adults, children, infants, extraBedCount, childrenAges } =
//     useSelector((state) => state.formDetails);

//   const storedAmenities = useSelector(
//     (state) => state.amenities.selectedAmenities
//   );
//   const [selectedAmenities, setLocalSelectedAmenities] = useState(
//     storedAmenities || []
//   );
//   const [amenities, setAmenities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const MAX_QUANTITY = 10;

//   useEffect(() => {
//     const fetchAmenities = async () => {
//       try {
//         // Get room type ID from selectedRoom
//         const roomTypeId = selectedRoom?.roomtypeid || selectedRoom?.id;

//         if (!roomTypeId) {
//           console.warn("No room type ID available");
//           setAmenities([]);
//           setLoading(false);
//           return;
//         }

//         // Construct URL with roomtypeid query parameter
//         const url = new URL(`${CQ_BASE_URL}/bq/api/enhance-your-stay`);
//         url.searchParams.append("roomtypeid", roomTypeId);

//         const response = await fetch(url, {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//           },
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();

//         // Check if response has the expected structure
//         if (data.status !== "success") {
//           throw new Error("API returned unsuccessful status");
//         }

//         const foodWith5PercentValue = (data.food || []).map((item) => ({
//           ...item,
//           value: item.value,
//           value_type: item.value_type ?? "P",
//         }));

//         const transformedAmenities = [
//           ...foodWith5PercentValue.map((item) => ({
//             id: item.id,
//             name: item.title || item.name,
//             description: item.description || "",
//             price: item.price || item.base_price || 0,
//             urgentPrice: item.urgent_price || item.price || 0,
//             image: item.image || item.image_url,
//             price_type: item.price_type || "Per day",
//             type: "food",
//             refundable: false, // Food items typically not refundable
//             value: item.value || 0,
//             value_type: item.value_type || "P",
//             is_multi: item.is_multi || false,
//             max_quantity: item.max_quantity || 10,
//           })),
//           ...(data.amenities || []).map((item) => ({
//             id: item.id,
//             name: item.name,
//             description: "",
//             price: item.base_price || 0,
//             urgentPrice: item.urgent_price || item.base_price || 0,
//             image: item.image_url,
//             price_type: item.price_type || "Per day",
//             type: "amenity",
//             refundable: item.refundable || false,
//             value: item.value || 0,
//             value_type: item.value_type || "P",
//             is_multi: item.is_multi || false,
//             max_quantity: item.max_quantity || 10,
//           })),
//           ...(data.room_services || []).map((item) => ({
//             id: item.id,
//             name: item.name,
//             description: "",
//             price: item.base_price || 0,
//             urgentPrice: item.urgent_price || item.base_price || 0,
//             image: item.image_url,
//             price_type: item.price_type || "Per day",
//             type: "room_service",
//             refundable: item.refundable || false,
//             value: item.value || 0,
//             value_type: item.value_type || "P",
//             is_multi: item.is_multi || false,
//             max_quantity: item.max_quantity || 10,
//           })),
//         ];

//         setAmenities(transformedAmenities);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching amenities:", error);
//         setError(error.message);
//         setLoading(false);
//       }
//     };

//     fetchAmenities();
//   }, [selectedRoom]); // Add selectedRoom as dependency to refetch when room changes

//   const handleAddAmenity = (amenity, quantity) => {
//     if (quantity === 0) {
//       // Remove the amenity if quantity is 0
//       const newAmenities = selectedAmenities.filter((a) => a.id !== amenity.id);
//       setLocalSelectedAmenities(newAmenities);
//     } else {
//       const amenityWithQuantity = {
//         ...amenity,
//         quantity,
//         totalPrice: amenity.price * quantity,
//       };

//       const existingIndex = selectedAmenities.findIndex(
//         (a) => a.id === amenity.id
//       );

//       let newAmenities;
//       if (existingIndex >= 0) {
//         newAmenities = [...selectedAmenities];
//         newAmenities[existingIndex] = amenityWithQuantity;
//       } else {
//         newAmenities = [...selectedAmenities, amenityWithQuantity];
//       }

//       setLocalSelectedAmenities(newAmenities);
//     }
//   };

//   const handleRemoveAmenity = (amenityId) => {
//     const newAmenities = selectedAmenities.filter((a) => a.id !== amenityId);
//     setLocalSelectedAmenities(newAmenities);
//   };

//   const handleContinue = () => {
//     dispatch(setSelectedAmenities(selectedAmenities));
//     navigate("/walk-in/booking-summary");
//   };

//   const handleSkip = () => {
//     dispatch(setSelectedAmenities([]));
//     navigate("/walk-in/booking-summary");
//   };

//   const handleBack = () => {
//     navigate("/search-page");
//   };

//   const incrementQuantity = (amenity) => {
//     const existingAmenity = selectedAmenities.find((a) => a.id === amenity.id);
//     const currentQty = existingAmenity ? existingAmenity.quantity : 0;
//     const maxQty = amenity.max_quantity || 10; // Fallback to 10 if not specified

//     if (currentQty < maxQty) {
//       handleAddAmenity(amenity, currentQty + 1);
//     } else {
//       toast.warn(
//         "For larger requests or group arrangements, please contact the front desk. We'll be happy to assist you personally.",
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
//     const existingAmenity = selectedAmenities.find((a) => a.id === amenity.id);
//     const currentQty = existingAmenity ? existingAmenity.quantity : 0;

//     if (currentQty > 0) {
//       handleAddAmenity(amenity, currentQty - 1);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
//         <ProgressSteps currentStep={2} />
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

//   // Show message if no room type is selected
//   if (!selectedRoom) {
//     return (
//       <div className="min-h-screen bg-white text-black p-6 mt-16 relative">
//         <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
//           <p className="text-yellow-600">Please select a room type first</p>
//         </div>
//       </div>
//     );
//   }

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
//                   {` · ${Math.max(1, daysCount)} Night${
//                     daysCount !== 1 ? "s" : ""
//                   }`}
//                   {` · ${rooms} Room${rooms !== 1 ? "s" : ""}`}
//                   {selectedRoom?.roomtypename &&
//                     ` · ${selectedRoom.roomtypename}`}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {amenities.length === 0 ? (
//           <div className="text-center py-8">
//             <p>No amenities available for this room type</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//             {amenities.map((amenity) => {
//               const isSelected = selectedAmenities.some(
//                 (a) => a.id === amenity.id
//               );
//               const selectedItem = selectedAmenities.find(
//                 (a) => a.id === amenity.id
//               );
//               const quantity = selectedItem ? selectedItem.quantity : 0;

//               return (
//                 <div
//                   key={amenity.id}
//                   className={`relative flex flex-col border rounded-md overflow-hidden transition-all duration-200 ${
//                     isSelected
//                       ? "ring-2 ring-black bg-gray-50"
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
//                         {/* Display refundable badge if applicable */}
//                         {amenity.refundable ? (
//                           <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
//                             Refundable
//                           </span>
//                         ) : (
//                           <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
//                             Non-Refundable
//                           </span>
//                         )}
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
//                             {amenity.value === 0
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
//                                     handleRemoveAmenity(amenity.id);
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

//                     {/* Quantity controls - always visible */}
//                     <div className="">
//                       {quantity > 0 && (
//                         <>
//                           <div className="mt-3 flex justify-between items-center  pt-2 border-t border-gray-200">
//                             <span className="text-sm font-medium">Total:</span>
//                             <span className="font-bold">
//                               ₹
//                               {(amenity.price * quantity).toLocaleString(
//                                 "en-IN"
//                               )}
//                             </span>
//                           </div>
//                           <div className="text-right text-xs text-gray-500 ">
//                             Excluding taxes & fees
//                           </div>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* Bottom action buttons */}
//       {/* <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between gap-4">
//         <button
//           onClick={handleBack}
//           className="py-2 px-6 w-1/5 rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
//         >
//           Back
//         </button>
//         <div className="flex gap-4">
//           <button
//             onClick={handleSkip}
//             className="py-2 px-6 w-[250px] rounded-md font-medium border border-black text-black hover:bg-gray-100"
//           >
//             Skip
//           </button>
//           <button
//             onClick={handleContinue}
//             className="py-2 px-6 w-[250px] rounded-md font-medium bg-purple-500 text-white hover:bg-purple-600"
//           >
//             {selectedAmenities.length > 0 ? "Confirm Purchase" : "Continue"}
//           </button>
//         </div>
//       </div> */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
//   {/* Mobile layout (stacked) */}
//   <div className="block md:hidden space-y-3">
//     <button
//       onClick={handleBack}
//       className="w-full py-3 px-6 rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
//     >
//       Back
//     </button>
//     <div className="flex gap-3">
//       <button
//         onClick={handleSkip}
//         className="flex-1 py-3 px-6 rounded-md font-medium border border-black text-black hover:bg-gray-100"
//       >
//         Skip
//       </button>
//       <button
//         onClick={handleContinue}
//         className="flex-1 py-3 px-6 rounded-md font-medium bg-purple-500 text-white hover:bg-purple-600"
//       >
//         {selectedAmenities.length > 0 ? "Confirm Purchase" : "Continue"}
//       </button>
//     </div>
//   </div>

//   {/* Desktop layout (horizontal) */}
//   <div className="hidden md:flex justify-between gap-4">
//     <button
//       onClick={handleBack}
//       className="py-2 px-6 w-1/5 rounded-md font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
//     >
//       Back
//     </button>
//     <div className="flex gap-4">
//       <button
//         onClick={handleSkip}
//         className="py-2 px-6 w-[250px] rounded-md font-medium border border-black text-black hover:bg-gray-100"
//       >
//         Skip
//       </button>
//       <button
//         onClick={handleContinue}
//         className="py-2 px-6 w-[250px] rounded-md font-medium bg-purple-500 text-white hover:bg-purple-600"
//       >
//         {selectedAmenities.length > 0 ? "Confirm Purchase" : "Continue"}
//       </button>
//     </div>
//   </div>
// </div>
//       <ToastContainer autoClose={5000} />
//     </div>
//   );
// };

// export default EnhanceCheckinStay;
