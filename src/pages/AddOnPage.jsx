import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

const EnhanceYourStay = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [amenityItems, setAmenityItems] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    adults: 0,
    children: 0,
    nights: 0,
    rooms: 0,
    dateRange: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    loadBookingDetails();
  }, []);

  const loadBookingDetails = () => {
    try {
      // Read from localStorage
      const storedAdults = localStorage.getItem('adults');
      const storedChildren = localStorage.getItem('children');
      const storedRooms = localStorage.getItem('rooms');
      const storedCheckin = localStorage.getItem('checkin');
      const storedCheckout = localStorage.getItem('checkout');
      const storedRoomType = localStorage.getItem('roomType');
      const storedBookingRef = localStorage.getItem('bookingReference');

      let nights = 0;
      let dateRange = '';

      // Calculate nights from checkin and checkout dates
      if (storedCheckin && storedCheckout) {
        const checkinDate = new Date(storedCheckin);
        const checkoutDate = new Date(storedCheckout);

        // Calculate difference in days (nights)
        const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
        nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Format date range
        dateRange = `${formatDate(checkinDate)} - ${formatDate(checkoutDate)}`;
      }

      setBookingDetails({
        adults: parseInt(storedAdults) || 0,
        children: parseInt(storedChildren) || 0,
        nights: nights || 1,
        rooms: parseInt(storedRooms) || 1,
        dateRange: dateRange,
        roomType: storedRoomType || '',
        bookingReference: storedBookingRef || '',
        checkin: storedCheckin || '',
        checkout: storedCheckout || '',
      });
    } catch (error) {
      console.error('Error loading booking details:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/bq/api/enhance-your-stay', {
        headers: { accept: 'application/json' },
      });
      const data = await response.json();

      setFoodItems(data.food || []);
      setAmenityItems(data.amenities || []);
      setServiceItems(data.room_services || []);

      // Initialize selected items
      const allItems = [
        ...(data.food || []),
        ...(data.amenities || []),
        ...(data.room_services || []),
      ];
      const initialSelected = allItems.map((item) => ({
        ...item,
        type: item.item_type, // Use item_type from API
        quantity: 0,
      }));
      setSelectedItems(initialSelected);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine all items for display
  const getAllItems = () => {
    const allItems = [];

    foodItems.forEach((item) => {
      allItems.push({
        ...item,
        type: item.item_type || 'food',
        price: item.price || item.base_price,
        urgentPrice: item.urgent_price || 0,
        price_type: item.price_type,
        name: item.title || item.name,
        image: item.image || item.image_url,
        refundable: item.refundable !== false,
      });
    });

    amenityItems.forEach((item) => {
      allItems.push({
        ...item,
        type: item.item_type || 'amenity',
        price: item.price || item.base_price,
        urgentPrice: item.urgent_price || 0,
        price_type: item.price_type,
        name: item.title || item.name,
        image: item.image || item.image_url,
        refundable: item.refundable !== false,
      });
    });

    serviceItems.forEach((item) => {
      allItems.push({
        ...item,
        type: item.item_type || 'room_service',
        price: item.price || item.base_price,
        urgentPrice: item.urgent_price || 0,
        price_type: item.price_type,
        name: item.title || item.name,
        image: item.image || item.image_url,
        refundable: item.refundable !== false,
      });
    });

    return allItems;
  };

  const incrementQuantity = (item) => {
    setSelectedItems((prev) => {
      const updatedItems = prev.map((selected) => {
        // Match by id AND type to ensure uniqueness
        if (selected.id === item.id && selected.type === item.type) {
          const maxQty = selected.max_quantity || 10;
          const newQty = Math.min((selected.quantity || 0) + 1, maxQty);
          return { ...selected, quantity: newQty };
        }
        return selected;
      });
      return updatedItems;
    });
  };

  const decrementQuantity = (item) => {
    setSelectedItems((prev) => {
      const updatedItems = prev.map((selected) => {
        if (selected.id === item.id && selected.type === item.type) {
          const newQty = Math.max((selected.quantity || 0) - 1, 0);
          return { ...selected, quantity: newQty };
        }
        return selected;
      });
      return updatedItems;
    });
  };

  const handleRemoveItem = (id, type) => {
    setSelectedItems((prev) =>
      prev.map((selected) => {
        if (selected.id === id && selected.type === type) {
          return { ...selected, quantity: 0 };
        }
        return selected;
      })
    );
  };

  const getSelectedItems = () => {
    return selectedItems.filter((item) => item.quantity > 0);
  };

  const calculateTotal = () => {
    return getSelectedItems().reduce((total, item) => {
      const price = item.price || item.base_price;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTax = (subtotal) => {
    // Assuming 18% GST
    const taxRate = 0.18;
    return subtotal * taxRate;
  };

  const handleContinue = () => {
    try {
      const selectedItemsList = getSelectedItems();

      if (selectedItemsList.length === 0) {
        alert('Please select at least one item before continuing');
        return;
      }

      // Validate and prepare item data
      const validatedItems = selectedItemsList
        .map((item) => {
          return {
            id: item.id || '',
            type: item.type || 'unknown',
            item_type: item.item_type || item.type,
            name: item.title || item.name || 'Unnamed Item',
            description: item.description || '',
            image: item.image || item.image_url || '',
            price: Number(item.price) || Number(item.base_price) || 0,
            base_price: Number(item.base_price) || Number(item.price) || 0,
            urgent_price: Number(item.urgent_price) || 0,
            price_type: item.price_type || 'Per unit',
            quantity: Number(item.quantity) || 0,
            refundable: Boolean(item.refundable),
            max_quantity: Number(item.max_quantity) || 10,
            category: item.category || item.type,
            subcategory: item.subcategory || '',
            available_time: item.available_time || '',
            preparation_time: item.preparation_time || '',
            dietary_info: item.dietary_info || '',
            service_type: item.service_type || '',
            item_total: (Number(item.price) || 0) * (Number(item.quantity) || 0),
            added_at: new Date().toISOString(),
          };
        })
        .filter((item) => item !== null);

      if (validatedItems.length === 0) {
        alert('No valid items selected');
        return;
      }

      const subtotal = calculateTotal();
      const taxAmount = calculateTax(subtotal);
      const totalAmount = subtotal + taxAmount;

      // Create comprehensive data object
      const selectedData = {
        // Items array with all details
        items: validatedItems,

        // Financial summary
        summary: {
          subtotal: subtotal,
          tax_rate: 0.18,
          tax_amount: taxAmount,
          total: totalAmount,
          items_count: validatedItems.length,
          total_quantity: validatedItems.reduce((sum, item) => sum + item.quantity, 0),
          currency: 'INR',
        },

        // Booking details
        booking_details: {
          date_range: bookingDetails.dateRange,
          checkin: bookingDetails.checkin,
          checkout: bookingDetails.checkout,
          adults: bookingDetails.adults,
          children: bookingDetails.children,
          nights: bookingDetails.nights,
          rooms: bookingDetails.rooms,
          room_type: bookingDetails.roomType,
          booking_reference: bookingDetails.bookingReference,
          guest_count: bookingDetails.adults + bookingDetails.children,
        },

        // Payment information
        payment_info: {
          status: 'pending',
          payment_method: '',
          transaction_id: '',
          paid_amount: 0,
        },

        // Metadata
        metadata: {
          selected_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          stored_at: new Date().toISOString(),
          version: '1.0',
          source: 'enhance_your_stay_page',
        },
      };

      // Store in localStorage with timestamp as part of key for versioning
      const storageKey = 'enhancedStayItems';
      const timestamp = new Date().getTime();

      // Store the main data
      localStorage.setItem(storageKey, JSON.stringify(selectedData));

      // Also store a backup with timestamp
      localStorage.setItem(`${storageKey}_backup_${timestamp}`, JSON.stringify(selectedData));

      // Store a simplified version for quick access
      localStorage.setItem(
        'enhancedStay_summary',
        JSON.stringify({
          total: selectedData.summary.total,
          items_count: selectedData.summary.items_count,
          last_updated: selectedData.metadata.last_updated,
          booking_reference: bookingDetails.bookingReference,
        })
      );

      // Store individual items count for badge display
      // localStorage.setItem("enhanced_items_count", validatedItems.length.toString());

      // // Store total amount for payment page
      // localStorage.setItem("enhanced_stay_total", totalAmount.toString());

      console.log('Successfully stored enhanced stay items:', {
        itemsCount: validatedItems.length,
        totalAmount: totalAmount,
        data: selectedData,
      });

      // Navigate to payment
      navigate('/payment');
    } catch (error) {
      console.error('Error storing enhanced stay items:', error);
      alert('An error occurred while saving your selections. Please try again.');
    }
  };

  // Function to verify stored data (for debugging)
  const verifyStoredData = () => {
    const stored = localStorage.getItem('enhancedStayItems');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Verified stored data:', parsed);
        return parsed;
      } catch (e) {
        console.error('Error parsing stored data:', e);
        return null;
      }
    }
    return null;
  };

  const handleSkip = () => {
    // Clear any previous enhanced stay data if skipping
    localStorage.removeItem('enhancedStayItems');
    localStorage.removeItem('enhancedStay_summary');
    localStorage.removeItem('enhanced_items_count');
    localStorage.removeItem('enhanced_stay_total');

    navigate('/payment');
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const allItems = getAllItems();
  const selectedItemsList = getSelectedItems();
  const total = calculateTotal();
  const taxAmount = calculateTax(total);
  const totalWithTax = total + taxAmount;

  return (
    <div className="min-h-screen bg-white text-black p-6 mt- relative pb-14">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-gray-700 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl text-black font-bold mb-1 mt-8">Enhance Your Stay</h1>
                  <div className="mb-2">
                    {/* Display booking details from localStorage */}
                    <p>
                      {bookingDetails.adults > 0 && (
                        <>
                          {bookingDetails.adults} Adult{bookingDetails.adults !== 1 ? 's' : ''}
                        </>
                      )}
                      {bookingDetails.children > 0 && (
                        <>
                          {bookingDetails.adults > 0 && ', '}
                          {bookingDetails.children} Child
                          {bookingDetails.children !== 1 ? 'ren' : ''}
                        </>
                      )}
                      {bookingDetails.nights > 0 && (
                        <>
                          {bookingDetails.adults > 0 || bookingDetails.children > 0 ? ' · ' : ''}
                          {bookingDetails.nights} Night{bookingDetails.nights !== 1 ? 's' : ''}
                        </>
                      )}
                      {bookingDetails.rooms > 0 && (
                        <>
                          {bookingDetails.adults > 0 ||
                          bookingDetails.children > 0 ||
                          bookingDetails.nights > 0
                            ? ' · '
                            : ''}
                          {bookingDetails.rooms} Room{bookingDetails.rooms !== 1 ? 's' : ''}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {allItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No amenities available at this time</p>
            <button
              onClick={handleSkip}
              className="mt-4 py-2 px-6 rounded-md font-medium border border-black text-black hover:bg-gray-100"
            >
              Continue to Payment
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {allItems.map((item) => {
                // Find the current selected item state
                const selectedItem = selectedItems.find(
                  (s) => s.id === item.id && s.type === item.type
                );
                const quantity = selectedItem ? selectedItem.quantity : 0;
                const maxQty = item.max_quantity || 10;
                const isSelected = quantity > 0;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`relative flex flex-col border rounded-md overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="h-48 w-full">
                      <img
                        src={item.image}
                        alt={item.name}
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
                          <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                          {/* Display refundable badge */}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              item.refundable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.refundable ? 'Refundable' : 'Non-Refundable'}
                          </span>
                        </div>

                        {/* Price per unit */}
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">
                            {item.price_type === 'Per Person'
                              ? 'Per person'
                              : item.price_type === 'Per day'
                                ? 'Per day'
                                : item.price_type === 'Per session'
                                  ? 'Per session'
                                  : item.price_type}
                          </p>
                        </div>

                        {/* Description if available */}
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.description.length > 80
                              ? `${item.description.substring(0, 80)}...`
                              : item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {item.urgentPrice > item.price && (
                              <p className="text-xs text-gray-500 line-through">
                                ₹{item.urgentPrice.toLocaleString('en-IN')}
                              </p>
                            )}
                            <p className="font-semibold text-gray-900 lowercase">
                              ₹{item.price.toLocaleString('en-IN')}/
                              {item.price_type === 'Per Person'
                                ? 'per person'
                                : item.price_type === 'Per day'
                                  ? 'per day'
                                  : item.price_type === 'Per session'
                                    ? 'per session'
                                    : 'unit'}
                            </p>
                            <p className="text-xs text-gray-500">Excluding taxes & fees</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {quantity === 0 ? (
                              <button
                                onClick={() => incrementQuantity(item)}
                                className="px-6 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
                              >
                                Add
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    if (quantity === 1) {
                                      handleRemoveItem(item.id, item.type);
                                    } else {
                                      decrementQuantity(item);
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
                                  onClick={() => incrementQuantity(item)}
                                  disabled={quantity >= maxQty}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                    quantity >= maxQty
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

                      {/* Item total section */}
                      {quantity > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Item Total:</span>
                            <span className="font-bold">
                              ₹{(item.price * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            Excluding taxes & fees
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total summary at bottom */}
          </>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4">
        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="py-2 px-6 w-[250px] rounded-md font-medium border border-black text-black hover:bg-gray-100 transition-colors"
          >
            Skip & Continue
          </button>
          <button
            onClick={handleContinue}
            disabled={selectedItemsList.length === 0}
            className={`py-2 px-6 w-[250px] rounded-md font-medium transition-all ${
              selectedItemsList.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-md'
            }`}
          >
            {selectedItemsList.length > 0
              ? `Continue with ${selectedItemsList.length} item${selectedItemsList.length !== 1 ? 's' : ''}`
              : 'Select items to continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhanceYourStay;
