import React, { useEffect, useState } from 'react';
import { LiaCheckCircle } from 'react-icons/lia';
import { FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import ReservationSteps from '../profileguest/ReservationSteps';

const ModificationSuccessful = () => {
  const [bookingData, setBookingData] = useState(null);
  const [qrData, setQrData] = useState('');
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const [numberOfNights, setNumberOfNights] = useState(0);
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [showAdditionalGuests, setShowAdditionalGuests] = useState(false);
  const [amenitiesData, setAmenitiesData] = useState({
    selectedAmenities: [],
    currentState: {},
    modifications: [],
  });
  const [financialData, setFinancialData] = useState({
    previewData: null,
    refundCalculations: {},
    previewPrices: {},
    isAdjustment: false,
    adjustmentAmount: 0,
    refundAmount: 0,
    amountDueAfterPreview: 0,
    // New fields for combined data
    combined: null,
    projected_total_after_preview: 0,
    amount_due_after_preview: 0,
    current_due_before_preview: 0,
    total_refund: 0,
    total_delta_base: 0,
    total_delta_tax: 0,
    total_service_fee: 0,
    amount_paid: 0,
  });
  const [paymentStatus, setPaymentStatus] = useState({
    isPaid: false,
    amountPaid: 0,
    amountDue: 0,
    unpaidBillingIds: [],
  });

  useEffect(() => {
    const storedBookingData = localStorage.getItem('bookingData');
    if (storedBookingData) {
      try {
        const parsedData = JSON.parse(storedBookingData);
        setBookingData(parsedData);

        const checkInDate = new Date(parsedData.bookingDetails.checkInDate);
        const checkOutDate = new Date(parsedData.bookingDetails.checkOutDate);
        const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        setNumberOfNights(nights);

        const qrContent = JSON.stringify({
          bookingId: parsedData.bookingId,
          orderId: parsedData.orderId,
          guestName: `${parsedData.guestDetails.firstName || ''} ${parsedData.guestDetails.lastName || ''}`,
          checkIn: parsedData.bookingDetails.checkInDate,
          checkOut: parsedData.bookingDetails.checkOutDate,
          roomType: parsedData.bookingDetails.roomType,
          totalDue: parsedData.paymentDetails?.totalDue || 0,
        });
        setQrData(qrContent);

        // Get additional guests from currentState
        if (parsedData.currentState?.additionalGuests) {
          const guests = parsedData.currentState.additionalGuests;
          if (Array.isArray(guests) && guests.length > 0) {
            setAdditionalGuests(guests);
          }
        }

        // Set amenities data from bookingData
        if (parsedData.amenities) {
          setAmenitiesData({
            selectedAmenities: parsedData.amenities.selectedAmenities || [],
            currentState: parsedData.amenities.currentState || {},
            modifications: parsedData.amenities.modifications || [],
          });
        }

        // Extract combined data from apiResponses.previewResponse
        let combinedData = null;
        let projectedTotal = 0;
        let amountDueAfterPreview = 0;
        let currentDueBeforePreview = 0;
        let amountPaid = 0;
        let totalRefund = 0;

        // Check for combined data in apiResponses.previewResponse
        if (parsedData.apiResponses?.previewResponse) {
          const previewResponse = parsedData.apiResponses.previewResponse;
          combinedData = previewResponse.combined;
          projectedTotal = combinedData.projected_total_after_preview || 0;
          amountDueAfterPreview = combinedData.amount_due_after_preview || 0;
          currentDueBeforePreview = previewResponse.current_due_before_preview || 0;
          amountPaid = combinedData.amount_paid || 0;
          totalRefund = combinedData?.total_refund || 0;
        }

        // Also check in financialData
        if (parsedData.financialData) {
          const financial = parsedData.financialData;
          projectedTotal = projectedTotal || financial.projectedTotalAfterPreview || 0;
          amountDueAfterPreview = amountDueAfterPreview || financial.amountDueAfterPreview || 0;
          amountPaid = amountPaid || financial.amountPaid || 0;
          totalRefund = totalRefund || financial.totalRefund || 0;
        }

        // Set payment status using the extracted data
        setPaymentStatus({
          isPaid: parsedData.paymentDetails?.fullyPaid || false,
          amountPaid: amountPaid, // This will be 0
          amountDue: amountDueAfterPreview, // This should be 5933.95
          unpaidBillingIds: parsedData.paymentDetails?.unpaidBillingIds || [],
        });

        // Update financialData with combined data
        setFinancialData((prev) => ({
          ...prev,
          combined: combinedData,
          projected_total_after_preview: projectedTotal,
          amount_due_after_preview: amountDueAfterPreview,
          current_due_before_preview: currentDueBeforePreview,
          amount_paid: amountPaid,
          total_refund: totalRefund,
          total_delta_base: combinedData?.total_delta_base || 0,
          total_delta_tax: combinedData?.total_delta_tax || 0,
          total_service_fee: combinedData?.total_service_fee || 0,
        }));

        // Set existing financial data from bookingData
        if (parsedData.financialData) {
          setFinancialData((prev) => ({
            ...prev,
            previewData: parsedData.financialData.previewData,
            refundCalculations: parsedData.financialData.refundCalculations || {},
            previewPrices: parsedData.financialData.previewPrices || {},
            isAdjustment: parsedData.financialData.isAdjustment || false,
            adjustmentAmount: parsedData.financialData.adjustmentAmount || 0,
            refundAmount: parsedData.financialData.refundAmount || 0,
            amountDueAfterPreview: parsedData.financialData.amountDueAfterPreview || 0,
          }));
        }

        // Also check for preview data in localStorage
        const previewDataFromStorage = localStorage.getItem('previewData');
        if (previewDataFromStorage) {
          const previewData = JSON.parse(previewDataFromStorage);
          if (previewData) {
            setFinancialData((prev) => ({
              ...prev,
              previewData: previewData,
              isAdjustment:
                previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount',
              adjustmentAmount:
                previewData?.room_preview?.financial_preview_type === 'recalculation_via_discount'
                  ? previewData?.combined?.total_refund || 0
                  : 0,
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing bookingData:', error);
      }
    }
  }, []);

  const handleDone = () => {
    localStorage.clear();
    window.location.href = '/viewreservation';
  };

  const toggleAdditionalGuests = () => {
    setShowAdditionalGuests(!showAdditionalGuests);
  };

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        Loading booking details...
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get primary guest info
  const primaryGuest = {
    firstname: bookingData.guestDetails.firstName || '',
    lastname: bookingData.guestDetails.lastName || '',
    emailid: bookingData.guestDetails.email || '',
    phonenumber: bookingData.guestDetails.phoneNumber?.replace('+91', '') || '',
    countrycode: bookingData.guestDetails.phoneNumber?.startsWith('+91') ? '+91' : '',
    clienttype: bookingData.currentState?.clientType || 'Leisure',
  };

  // Get booking details
  const bookingDetails = bookingData.bookingDetails || {};
  const roomType = bookingDetails.roomType || 'N/A';

  // Calculate room charges from financial data
  const getRoomCharges = () => {
    // Use room charges from previewPrices if available
    if (financialData.previewPrices?.roomFinalAmount) {
      return financialData.previewPrices.roomFinalAmount;
    }

    // Calculate from projected total if available
    if (financialData.projected_total_after_preview) {
      const total = financialData.projected_total_after_preview;
      const amenitiesTotal = amenitiesData.currentState.totalAmount || 0;
      const serviceFee =
        financialData.total_service_fee ||
        financialData.previewPrices?.totalServiceFee ||
        financialData.previewPrices?.roomServiceFee ||
        0;
      const taxes = calculateTaxAmounts().totalTax || 0;

      // Calculate room charges: total - amenities - taxes - service fee
      return total - amenitiesTotal - taxes - serviceFee;
    }

    // Fallback calculation
    return paymentStatus.amountDue - (amenitiesData.currentState.totalAmount || 0);
  };

  const roomCharges = getRoomCharges();

  // Calculate tax amounts
  const calculateTaxAmounts = () => {
    const roomTax =
      financialData.previewPrices?.roomTaxAmount ||
      financialData.previewData?.room_preview?.room_details?.new_room_tax_total ||
      0;

    const amenitiesTax = financialData.previewData?.fixed_enhance_services?.tax || 0;

    return {
      roomTax,
      amenitiesTax,
      totalTax: roomTax + amenitiesTax,
    };
  };

  const taxAmounts = calculateTaxAmounts();

  // Check if there's a refund or adjustment
  const hasRefundOrAdjustment =
    financialData.refundAmount > 0 || financialData.adjustmentAmount > 0;
  const isAdjustment = financialData.isAdjustment;
  const refundOrAdjustmentAmount = isAdjustment
    ? financialData.adjustmentAmount
    : financialData.refundAmount;

  // Get modification type
  const modificationType = financialData.previewData?.room_preview?.modification_type || '';
  const isDowngrade = modificationType.includes('downgrade');
  const isUpgrade =
    modificationType.includes('upgrade') || modificationType === 'additional_charge';

  // Calculate service fee
  const serviceFee =
    financialData.total_service_fee ||
    financialData.previewPrices?.totalServiceFee ||
    financialData.previewPrices?.roomServiceFee ||
    financialData.previewData?.room_preview?.service_fee_total_all_modifications ||
    0;

  // Get previous room details for comparison
  const previousRoomTotal = financialData.previewData?.room_preview?.old_total || 0;
  const newRoomTotal = financialData.previewData?.room_preview?.new_total || 0;

  // Calculate grand total
  const grandTotal =
    financialData.projected_total_after_preview ||
    roomCharges + amenitiesData.currentState.totalAmount + taxAmounts.totalTax + serviceFee;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-7 mt-2 relative">
      <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gray-100 p-4 sm:p-6">
          {/* Desktop Layout - Row with QR on right */}
          <div className="hidden md:flex justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-start">
                <LiaCheckCircle size={56} className="mr-3 text-green-400 flex-shrink-0" />
                <div>
                  <h1 className="text-2xl text-black font-bold">Modification Successful</h1>
                  <p className="text-black text-base mt-1">
                    Your reservation has been modified successfully
                  </p>
                  <p className="text-lg text-black font-bold tracking-wider pt-4">
                    Reservation Number: {bookingData.orderId}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="border-2 border-gray-300 rounded-lg p-2 bg-white shadow-md">
                <div className="w-32 h-32">
                  {qrData ? (
                    <QRCodeSVG
                      value={qrData}
                      width="128"
                      height="128"
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-100">
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1 text-gray-600">Scan QR Code</p>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Centered QR code below */}
          <div className="flex flex-col md:hidden">
            <div className="mb-4">
              <div className="flex items-start">
                <LiaCheckCircle size={48} className="mr-3 text-green-400 flex-shrink-0" />
                <div>
                  <h1 className="text-xl text-black font-bold">Modification Successful</h1>
                  <p className="text-black text-sm mt-1">
                    Your reservation has been modified successfully
                  </p>
                  <p className="text-sm text-black font-bold tracking-wider pt-2">
                    Reservation Number: {bookingData.orderId}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Centered on Mobile */}
            <div className="flex justify-center">
              <div className="border-2 border-gray-300 rounded-lg p-2 bg-white shadow-md">
                <div className="w-40 h-40">
                  {qrData ? (
                    <QRCodeSVG
                      value={qrData}
                      width="160"
                      height="160"
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-gray-100">
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-1 text-gray-600">Scan QR Code</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200">
          {/* Column 1: Guest Details */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Guest Details</h2>

            {/* Primary Guest */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Primary Guest
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    First Name
                  </p>
                  <p className="font-semibold text-gray-900">
                    {primaryGuest.firstname?.charAt(0).toUpperCase() +
                      primaryGuest.firstname?.slice(1).toLowerCase() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Last Name
                  </p>
                  <p className="font-semibold text-gray-900">
                    {primaryGuest.lastname?.charAt(0).toUpperCase() +
                      primaryGuest.lastname?.slice(1).toLowerCase() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </p>
                  <p className="font-semibold text-gray-900">
                    {primaryGuest.countrycode && primaryGuest.phonenumber
                      ? `${primaryGuest.countrycode} ${primaryGuest.phonenumber}`
                      : bookingData.guestDetails.phoneNumber || 'N/A'}
                  </p>
                </div>
                <div className="">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Profile Type
                  </p>
                  <p className="font-semibold text-gray-900">
                    {primaryGuest.clienttype || 'Leisure'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <p className="font-semibold text-gray-900">
                    {primaryGuest.emailid || bookingData.guestDetails.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Guests - Dropdown */}
            <div>
              <div
                className="flex items-center cursor-pointer mb-3"
                onClick={toggleAdditionalGuests}
              >
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mr-2">
                  Additional Guests ({additionalGuests.length})
                </h3>
                {additionalGuests.length > 0 &&
                  (showAdditionalGuests ? <FiChevronUp /> : <FiChevronDown />)}
              </div>

              {showAdditionalGuests && additionalGuests.length > 0 && (
                <div className="space-y-4 mt-3">
                  {additionalGuests.map((guest, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          First Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {guest.firstName?.charAt(0).toUpperCase() +
                            guest.firstName?.slice(1).toLowerCase() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Last Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {guest.lastName?.charAt(0).toUpperCase() +
                            guest.lastName?.slice(1).toLowerCase() || 'N/A'}
                        </p>
                      </div>
                      {guest.phoneNumber && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Phone Number
                          </p>
                          <p className="font-semibold text-gray-900">
                            {guest.countryCode ? `${guest.countryCode} ` : ''}
                            {guest.phoneNumber || 'N/A'}
                          </p>
                        </div>
                      )}
                      {guest.country && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Country
                          </p>
                          <p className="font-semibold text-gray-900">
                            {typeof guest.country === 'object'
                              ? guest.country.name
                              : guest.country || 'N/A'}
                          </p>
                        </div>
                      )}
                      {guest.email && guest.email !== 'user@example.com' && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Email
                          </p>
                          <p className="font-semibold text-gray-900">{guest.email || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {additionalGuests.length === 0 && (
                <p className="text-sm text-gray-500 italic">No additional guests</p>
              )}
            </div>
          </div>

          {/* Column 2: Stay Details */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Stay Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check-in
                </p>
                <p className="font-semibold text-gray-900">
                  {bookingDetails.checkInDate
                    ? new Date(bookingDetails.checkInDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}{' '}
                  (1:00 PM)
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Check-out
                </p>
                <p className="font-semibold text-gray-900">
                  {bookingDetails.checkOutDate
                    ? new Date(bookingDetails.checkOutDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}{' '}
                  (1:00 PM)
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Room Type
                </p>
                <p className="font-semibold text-gray-900">{roomType}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Guests
                </p>
                <p className="font-semibold text-gray-900">{bookingDetails.numberOfGuests || 1}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  No of nights
                </p>
                <p className="font-semibold text-gray-900">{numberOfNights}</p>
              </div>
            </div>

            {/* Modification Details */}
            {(isUpgrade || isDowngrade || modificationType) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Modification Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">Modification Type</p>
                    <p className="font-semibold text-gray-900">
                      {isUpgrade
                        ? 'Upgrade'
                        : isDowngrade
                          ? 'Downgrade'
                          : modificationType || 'Modification'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">Service Fee</p>
                    <p className="font-semibold text-gray-900">
                      {serviceFee > 0 ? `₹${formatCurrency(serviceFee)}` : 'No Fee'}
                    </p>
                  </div>
                  {previousRoomTotal > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">Previous Room Total</p>
                      <p className="font-semibold text-gray-900">
                        ₹{formatCurrency(previousRoomTotal)}
                      </p>
                    </div>
                  )}
                  {newRoomTotal > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1">New Room Total</p>
                      <p className="font-semibold text-gray-900">₹{formatCurrency(newRoomTotal)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Payment Summary */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center">Payment Summary</h2>
            <div className="space-y-1">
              {/* Room Charges */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-gray-600">Room Charges - {roomType}</span>
                  <span className="font-semibold text-gray-900">
                    ₹{formatCurrency(roomCharges)}
                  </span>
                </div>
              </div>

              {/* Amenities & Services */}
              {amenitiesData.currentState.totalAmount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">Additional Services</span>
                    <span className="font-semibold text-gray-900">
                      ₹{formatCurrency(amenitiesData.currentState.totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Service Fee */}
              {serviceFee > 0 && (
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-bold text-gray-600">Modification Service Fee</span>
                  <span className="font-semibold text-gray-900">₹{formatCurrency(serviceFee)}</span>
                </div>
              )}

              {/* Taxes & Fees */}
              <div className="flex justify-between relative">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-600 mr-1">Taxes & Fees</span>
                  <div
                    className="relative"
                    onMouseEnter={() => setShowTaxBreakdown(true)}
                    onMouseLeave={() => setShowTaxBreakdown(false)}
                  >
                    <FiInfo className="text-gray-400 cursor-pointer" size={14} />
                    {showTaxBreakdown && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
                        <div className="text-xs text-gray-600">
                          <div className="flex justify-between py-1">
                            <span>Room Tax (12%)</span>
                            <span>₹{formatCurrency(taxAmounts.roomTax)}</span>
                          </div>
                          {taxAmounts.amenitiesTax > 0 && (
                            <div className="flex justify-between py-1">
                              <span>Amenities Tax (12%)</span>
                              <span>₹{formatCurrency(taxAmounts.amenitiesTax)}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-medium">
                            <span>Total Tax</span>
                            <span>₹{formatCurrency(taxAmounts.totalTax)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  ₹{formatCurrency(taxAmounts.totalTax)}
                </span>
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="font-bold text-gray-900">₹{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Refund/Adjustment Amount - Simple styling */}
              {(financialData.total_refund > 0 || hasRefundOrAdjustment) && (
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">
                    {isAdjustment ? 'Adjustment Amount' : 'Refund Amount'}
                  </span>
                  <span className="font-bold text-gray-900">
                    ₹{formatCurrency(financialData.total_refund || refundOrAdjustmentAmount)}
                  </span>
                </div>
              )}

              {/* Payment Status */}
              <div className="">
                {/* Amount Paid */}
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-gray-900">Amount Paid</span>
                  <span className="font-bold text-gray-900">
                    ₹{formatCurrency(paymentStatus.amountPaid)}
                  </span>
                </div>

                {/* Amount Due */}
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Amount Due</span>
                  <span className="font-bold text-gray-900">
                    ₹{formatCurrency(paymentStatus.amountDue)}
                  </span>
                </div>
              </div>

              {/* Important Notes */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Present this confirmation at check-in</li>
                  <li>• Check-in time is 1:00 PM</li>
                  <li>• Check-out time is 1:00 PM</li>
                  <li>• Government approved ID required</li>
                  <li>• Modification service fee may apply for changes</li>
                  {(financialData.total_refund > 0 || refundOrAdjustmentAmount > 0) &&
                    !isAdjustment && <li>• Refunds will be processed within 5-7 business days</li>}
                  {isAdjustment && (
                    <li>• Adjustment amount has been applied to your total balance</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center md:justify-end">
            <button
              onClick={handleDone}
              className="bg-purple-600 text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-purple-700 shadow-md hover:shadow-lg transition-all duration-200 w-full md:w-auto"
            >
              Continue to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModificationSuccessful;

// import React, { useEffect, useState } from "react";
// import { LiaCheckCircle } from "react-icons/lia";
// import { FiInfo, FiChevronDown, FiChevronUp } from "react-icons/fi";
// import { QRCodeSVG } from "qrcode.react";
// import ReservationSteps from "../profileguest/ReservationSteps";

// const ModificationSuccessful = () => {
//   const [bookingData, setBookingData] = useState(null);
//   const [qrData, setQrData] = useState("");
//   const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
//   const [numberOfNights, setNumberOfNights] = useState(0);
//   const [additionalGuests, setAdditionalGuests] = useState([]);
//   const [showAdditionalGuests, setShowAdditionalGuests] = useState(false);
//   const [amenitiesData, setAmenitiesData] = useState({
//     selectedAmenities: [],
//     currentState: {},
//     modifications: [],
//   });
//   const [financialData, setFinancialData] = useState({
//     previewData: null,
//     refundCalculations: {},
//     previewPrices: {},
//     isAdjustment: false,
//     adjustmentAmount: 0,
//     refundAmount: 0,
//     amountDueAfterPreview: 0,
//     // New fields for combined data
//     combined: null,
//     projected_total_after_preview: 0,
//     amount_due_after_preview: 0,
//     current_due_before_preview: 0,
//     total_refund: 0,
//     total_delta_base: 0,
//     total_delta_tax: 0,
//     total_service_fee: 0,
//     amount_paid: 0,
//   });
//   const [paymentStatus, setPaymentStatus] = useState({
//     isPaid: false,
//     amountPaid: 0,
//     amountDue: 0,
//     unpaidBillingIds: [],
//   });

//   useEffect(() => {
//     const storedBookingData = localStorage.getItem("bookingData");
//     if (storedBookingData) {
//       try {
//         const parsedData = JSON.parse(storedBookingData);
//         setBookingData(parsedData);

//         const checkInDate = new Date(parsedData.bookingDetails.checkInDate);
//         const checkOutDate = new Date(parsedData.bookingDetails.checkOutDate);
//         const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
//         const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
//         setNumberOfNights(nights);

//         const qrContent = JSON.stringify({
//           bookingId: parsedData.bookingId,
//           orderId: parsedData.orderId,
//           guestName: `${parsedData.guestDetails.firstName || ""} ${parsedData.guestDetails.lastName || ""}`,
//           checkIn: parsedData.bookingDetails.checkInDate,
//           checkOut: parsedData.bookingDetails.checkOutDate,
//           roomType: parsedData.bookingDetails.roomType,
//           totalDue: parsedData.paymentDetails?.totalDue || 0,
//         });
//         setQrData(qrContent);

//         // Get additional guests from currentState
//         if (parsedData.currentState?.additionalGuests) {
//           const guests = parsedData.currentState.additionalGuests;
//           if (Array.isArray(guests) && guests.length > 0) {
//             setAdditionalGuests(guests);
//           }
//         }

//         // Set amenities data from bookingData
//         if (parsedData.amenities) {
//           setAmenitiesData({
//             selectedAmenities: parsedData.amenities.selectedAmenities || [],
//             currentState: parsedData.amenities.currentState || {},
//             modifications: parsedData.amenities.modifications || [],
//           });
//         }

//         // Extract combined data from apiResponses.previewResponse
//         let combinedData = null;
//         let projectedTotal = 0;
//         let amountDueAfterPreview = 0;
//         let currentDueBeforePreview = 0;
//         let amountPaid = 0;
//         let totalRefund = 0;

//         // Check for combined data in apiResponses.previewResponse
//         if (parsedData.apiResponses?.previewResponse) {
//           const previewResponse = parsedData.apiResponses.previewResponse;
//           combinedData = previewResponse.combined;
//           projectedTotal = combinedData.projected_total_after_preview || 0;
//           amountDueAfterPreview = combinedData.amount_due_after_preview || 0;
//           currentDueBeforePreview =
//             previewResponse.current_due_before_preview || 0;
//           amountPaid = combinedData.amount_paid || 0;
//           totalRefund = combinedData?.total_refund || 0;
//         }

//         // Also check in financialData
//         if (parsedData.financialData) {
//           const financial = parsedData.financialData;
//           projectedTotal =
//             projectedTotal || financial.projectedTotalAfterPreview || 0;
//           amountDueAfterPreview =
//             amountDueAfterPreview || financial.amountDueAfterPreview || 0;
//           amountPaid = amountPaid || financial.amountPaid || 0;
//           totalRefund = totalRefund || financial.totalRefund || 0;
//         }

//         // Set payment status using the extracted data
//         setPaymentStatus({
//           isPaid: parsedData.paymentDetails?.fullyPaid || false,
//           amountPaid: amountPaid, // This will be 0
//           amountDue: amountDueAfterPreview, // This should be 5933.95
//           unpaidBillingIds: parsedData.paymentDetails?.unpaidBillingIds || [],
//         });

//         // Update financialData with combined data
//         setFinancialData((prev) => ({
//           ...prev,
//           combined: combinedData,
//           projected_total_after_preview: projectedTotal,
//           amount_due_after_preview: amountDueAfterPreview,
//           current_due_before_preview: currentDueBeforePreview,
//           amount_paid: amountPaid,
//           total_refund: totalRefund,
//           total_delta_base: combinedData?.total_delta_base || 0,
//           total_delta_tax: combinedData?.total_delta_tax || 0,
//           total_service_fee: combinedData?.total_service_fee || 0,
//         }));

//         // Set existing financial data from bookingData
//         if (parsedData.financialData) {
//           setFinancialData((prev) => ({
//             ...prev,
//             previewData: parsedData.financialData.previewData,
//             refundCalculations:
//               parsedData.financialData.refundCalculations || {},
//             previewPrices: parsedData.financialData.previewPrices || {},
//             isAdjustment: parsedData.financialData.isAdjustment || false,
//             adjustmentAmount: parsedData.financialData.adjustmentAmount || 0,
//             refundAmount: parsedData.financialData.refundAmount || 0,
//             amountDueAfterPreview:
//               parsedData.financialData.amountDueAfterPreview || 0,
//           }));
//         }

//         // Also check for preview data in localStorage
//         const previewDataFromStorage = localStorage.getItem("previewData");
//         if (previewDataFromStorage) {
//           const previewData = JSON.parse(previewDataFromStorage);
//           if (previewData) {
//             setFinancialData((prev) => ({
//               ...prev,
//               previewData: previewData,
//               isAdjustment:
//                 previewData?.room_preview?.financial_preview_type ===
//                 "recalculation_via_discount",
//               adjustmentAmount:
//                 previewData?.room_preview?.financial_preview_type ===
//                 "recalculation_via_discount"
//                   ? previewData?.combined?.total_refund || 0
//                   : 0,
//             }));
//           }
//         }
//       } catch (error) {
//         console.error("Error parsing bookingData:", error);
//       }
//     }
//   }, []);

//   const handleDone = () => {
//     localStorage.clear();
//     window.location.href = "/viewreservation";
//   };

//   const toggleAdditionalGuests = () => {
//     setShowAdditionalGuests(!showAdditionalGuests);
//   };

//   if (!bookingData) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-white text-black">
//         Loading booking details...
//       </div>
//     );
//   }

//   // Format currency
//   const formatCurrency = (amount) => {
//     if (!amount && amount !== 0) return "₹0.00";
//     return new Intl.NumberFormat("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount);
//   };

//   // Get primary guest info
//   const primaryGuest = {
//     firstname: bookingData.guestDetails.firstName || "",
//     lastname: bookingData.guestDetails.lastName || "",
//     emailid: bookingData.guestDetails.email || "",
//     phonenumber: bookingData.guestDetails.phoneNumber?.replace("+91", "") || "",
//     countrycode: bookingData.guestDetails.phoneNumber?.startsWith("+91")
//       ? "+91"
//       : "",
//     clienttype: bookingData.currentState?.clientType || "Leisure",
//   };

//   // Get booking details
//   const bookingDetails = bookingData.bookingDetails || {};
//   const roomType = bookingDetails.roomType || "N/A";

//   // Calculate room charges from financial data
//   const getRoomCharges = () => {
//     // Use room charges from previewPrices if available
//     if (financialData.previewPrices?.roomFinalAmount) {
//       return financialData.previewPrices.roomFinalAmount;
//     }

//     // Calculate from projected total if available
//     if (financialData.projected_total_after_preview) {
//       const total = financialData.projected_total_after_preview;
//       const amenitiesTotal = amenitiesData.currentState.totalAmount || 0;
//       const serviceFee =
//         financialData.total_service_fee ||
//         financialData.previewPrices?.totalServiceFee ||
//         financialData.previewPrices?.roomServiceFee ||
//         0;
//       const taxes = calculateTaxAmounts().totalTax || 0;

//       // Calculate room charges: total - amenities - taxes - service fee
//       return total - amenitiesTotal - taxes - serviceFee;
//     }

//     // Fallback calculation
//     return (
//       paymentStatus.amountDue - (amenitiesData.currentState.totalAmount || 0)
//     );
//   };

//   const roomCharges = getRoomCharges();

//   // Calculate tax amounts
//   const calculateTaxAmounts = () => {
//     const roomTax =
//       financialData.previewPrices?.roomTaxAmount ||
//       financialData.previewData?.room_preview?.room_details
//         ?.new_room_tax_total ||
//       0;

//     const amenitiesTax =
//       financialData.previewData?.fixed_enhance_services?.tax || 0;

//     return {
//       roomTax,
//       amenitiesTax,
//       totalTax: roomTax + amenitiesTax,
//     };
//   };

//   const taxAmounts = calculateTaxAmounts();

//   // Check if there's a refund or adjustment
//   const hasRefundOrAdjustment =
//     financialData.refundAmount > 0 || financialData.adjustmentAmount > 0;
//   const isAdjustment = financialData.isAdjustment;
//   const refundOrAdjustmentAmount = isAdjustment
//     ? financialData.adjustmentAmount
//     : financialData.refundAmount;

//   // Get modification type
//   const modificationType =
//     financialData.previewData?.room_preview?.modification_type || "";
//   const isDowngrade = modificationType.includes("downgrade");
//   const isUpgrade =
//     modificationType.includes("upgrade") ||
//     modificationType === "additional_charge";

//   // Calculate service fee
//   const serviceFee =
//     financialData.total_service_fee ||
//     financialData.previewPrices?.totalServiceFee ||
//     financialData.previewPrices?.roomServiceFee ||
//     financialData.previewData?.room_preview
//       ?.service_fee_total_all_modifications ||
//     0;

//   // Get previous room details for comparison
//   const previousRoomTotal =
//     financialData.previewData?.room_preview?.old_total || 0;
//   const newRoomTotal = financialData.previewData?.room_preview?.new_total || 0;

//   // Calculate grand total
//   const grandTotal =
//     financialData.projected_total_after_preview ||
//     roomCharges +
//       amenitiesData.currentState.totalAmount +
//       taxAmounts.totalTax +
//       serviceFee;

//   return (
//     <div className="min-h-screen bg-white flex items-center justify-center px-4 py-7 mt-2 relative">
//       <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">

//         {/* Header */}
//         <div className="bg-gray-100 text-white p-8 flex justify-between items-start">
//           <div>
//             <div className="flex items-center mt-4">
//               <LiaCheckCircle size={56} className="mr-3 mb-10 text-green-400" />
//               <div>
//                 <h1 className="text-2xl text-black font-bold mt-1">
//                   Modification Successful
//                 </h1>
//                 <p className="text-black mt-1">
//                   Your reservation has been modified successfully
//                 </p>
//                 <p className="text-lg text-black font-bold tracking-wider pt-4">
//                   Reservation Number: {bookingData.orderId}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="ml-auto border border-black p-2 rounded">
//             {qrData ? (
//               <QRCodeSVG
//                 value={qrData}
//                 size={112}
//                 level="H"
//                 includeMargin={true}
//               />
//             ) : (
//               <div className="w-28 h-28 flex items-center justify-center bg-gray-100">
//                 <span className="text-xs">Loading QR code...</span>
//               </div>
//             )}
//             <p className="text-xs text-center mt-1 text-black">
//               Scan for details
//             </p>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-200">
//           {/* Column 1: Guest Details */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-6">Guest Details</h2>

//             {/* Primary Guest */}
//             <div className="mb-6">
//               <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
//                 Primary Guest
//               </h3>
//               <div className="grid grid-cols-2 gap-2">
//                 <div>
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                     First Name
//                   </p>
//                   <p className="font-semibold text-gray-900">
//                     {primaryGuest.firstname?.charAt(0).toUpperCase() +
//                       primaryGuest.firstname?.slice(1).toLowerCase() || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                     Last Name
//                   </p>
//                   <p className="font-semibold text-gray-900">
//                     {primaryGuest.lastname?.charAt(0).toUpperCase() +
//                       primaryGuest.lastname?.slice(1).toLowerCase() || "N/A"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                     Phone Number
//                   </p>
//                   <p className="font-semibold text-gray-900">
//                     {primaryGuest.countrycode && primaryGuest.phonenumber
//                       ? `${primaryGuest.countrycode} ${primaryGuest.phonenumber}`
//                       : bookingData.guestDetails.phoneNumber || "N/A"}
//                   </p>
//                 </div>
//                 <div className="">
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                     Profile Type
//                   </p>
//                   <p className="font-semibold text-gray-900">
//                     {primaryGuest.clienttype || "Leisure"}
//                   </p>
//                 </div>
//                 <div className="col-span-2">
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                     Email
//                   </p>
//                   <p className="font-semibold text-gray-900">
//                     {primaryGuest.emailid ||
//                       bookingData.guestDetails.email ||
//                       "N/A"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Additional Guests - Dropdown */}
//             <div>
//               <div
//                 className="flex items-center cursor-pointer mb-3"
//                 onClick={toggleAdditionalGuests}
//               >
//                 <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mr-2">
//                   Additional Guests ({additionalGuests.length})
//                 </h3>
//                 {additionalGuests.length > 0 &&
//                   (showAdditionalGuests ? <FiChevronUp /> : <FiChevronDown />)}
//               </div>

//               {showAdditionalGuests && additionalGuests.length > 0 && (
//                 <div className="space-y-4 mt-3">
//                   {additionalGuests.map((guest, index) => (
//                     <div
//                       key={index}
//                       className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-md"
//                     >
//                       <div>
//                         <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                           First Name
//                         </p>
//                         <p className="font-semibold text-gray-900">
//                           {guest.firstName?.charAt(0).toUpperCase() +
//                             guest.firstName?.slice(1).toLowerCase() || "N/A"}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                           Last Name
//                         </p>
//                         <p className="font-semibold text-gray-900">
//                           {guest.lastName?.charAt(0).toUpperCase() +
//                             guest.lastName?.slice(1).toLowerCase() || "N/A"}
//                         </p>
//                       </div>
//                       {guest.phoneNumber && (
//                         <div>
//                           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                             Phone Number
//                           </p>
//                           <p className="font-semibold text-gray-900">
//                             {guest.countryCode ? `${guest.countryCode} ` : ""}
//                             {guest.phoneNumber || "N/A"}
//                           </p>
//                         </div>
//                       )}
//                        {guest.country && (
//                         <div>
//                           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                             Country
//                           </p>
//                           <p className="font-semibold text-gray-900">
//                             {typeof guest.country === "object"
//                               ? guest.country.name
//                               : guest.country || "N/A"}
//                           </p>
//                         </div>
//                       )}
//                       {guest.email && guest.email !== "user@example.com" && (
//                         <div>
//                           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                             Email
//                           </p>
//                           <p className="font-semibold text-gray-900">
//                             {guest.email || "N/A"}
//                           </p>
//                         </div>
//                       )}

//                     </div>
//                   ))}
//                 </div>
//               )}

//               {additionalGuests.length === 0 && (
//                 <p className="text-sm text-gray-500 italic">
//                   No additional guests
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Column 2: Stay Details */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-6">Stay Details</h2>
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                   Check-in
//                 </p>
//                 <p className="font-semibold text-gray-900">
//                   {bookingDetails.checkInDate
//                     ? new Date(bookingDetails.checkInDate).toLocaleDateString(
//                         "en-US",
//                         {
//                           month: "short",
//                           day: "numeric",
//                           year: "numeric",
//                         },
//                       )
//                     : "N/A"}{" "}
//                   (1:00 PM)
//                 </p>
//               </div>
//               <div>
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                   Check-out
//                 </p>
//                 <p className="font-semibold text-gray-900">
//                   {bookingDetails.checkOutDate
//                     ? new Date(bookingDetails.checkOutDate).toLocaleDateString(
//                         "en-US",
//                         {
//                           month: "short",
//                           day: "numeric",
//                           year: "numeric",
//                         },
//                       )
//                     : "N/A"}{" "}
//                   (1:00 PM)
//                 </p>
//               </div>
//               <div>
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                   Room Type
//                 </p>
//                 <p className="font-semibold text-gray-900">{roomType}</p>
//               </div>
//               <div>
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                   Guests
//                 </p>
//                 <p className="font-semibold text-gray-900">
//                   {bookingDetails.numberOfGuests || 1}
//                 </p>
//               </div>
//               <div className="col-span-2">
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
//                   No of nights
//                 </p>
//                 <p className="font-semibold text-gray-900">{numberOfNights}</p>
//               </div>
//             </div>

//             {/* Modification Details */}
//             {(isUpgrade || isDowngrade || modificationType) && (
//               <div className="mt-6 pt-6 border-t border-gray-200">
//                 <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
//                   Modification Details
//                 </h3>
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <div>
//                     <p className="text-xs font-bold text-gray-500 mb-1">
//                       Modification Type
//                     </p>
//                     <p className="font-semibold text-gray-900">
//                       {isUpgrade
//                         ? "Upgrade"
//                         : isDowngrade
//                           ? "Downgrade"
//                           : modificationType || "Modification"}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs font-bold text-gray-500 mb-1">
//                       Service Fee
//                     </p>
//                     <p className="font-semibold text-gray-900">
//                       {serviceFee > 0
//                         ? `₹${formatCurrency(serviceFee)}`
//                         : "No Fee"}
//                     </p>
//                   </div>
//                   {previousRoomTotal > 0 && (
//                     <div>
//                       <p className="text-xs font-bold text-gray-500 mb-1">
//                         Previous Room Total
//                       </p>
//                       <p className="font-semibold text-gray-900">
//                         ₹{formatCurrency(previousRoomTotal)}
//                       </p>
//                     </div>
//                   )}
//                   {newRoomTotal > 0 && (
//                     <div>
//                       <p className="text-xs font-bold text-gray-500 mb-1">
//                         New Room Total
//                       </p>
//                       <p className="font-semibold text-gray-900">
//                         ₹{formatCurrency(newRoomTotal)}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Column 3: Payment Summary */}
//           <div className="p-6">
//             <h2 className="text-lg font-semibold mb-2 flex items-center">
//               Payment Summary
//             </h2>
//             <div className="space-y-1">
//               {/* Room Charges */}
//               <div className="space-y-1">
//                 <div className="flex justify-between">
//                   <span className="text-sm font-bold text-gray-600">
//                     Room Charges - {roomType}
//                   </span>
//                   <span className="font-semibold text-gray-900">
//                     ₹{formatCurrency(roomCharges)}
//                   </span>
//                 </div>
//               </div>

//               {/* Amenities & Services */}
//               {amenitiesData.currentState.totalAmount > 0 && (
//                 <div className="space-y-1">
//                   <div className="flex justify-between">
//                     <span className="text-sm font-bold text-gray-600">
//                       Additional Services
//                     </span>
//                     <span className="font-semibold text-gray-900">
//                       ₹{formatCurrency(amenitiesData.currentState.totalAmount)}
//                     </span>
//                   </div>
//                   {/* {amenitiesData.selectedAmenities.length > 0 && (
//                     <div className="pl-4 border-l-2 border-gray-200 text-xs">
//                       {amenitiesData.selectedAmenities.map((amenity, index) => (
//                         <div key={index} className="flex justify-between mb-1">
//                           <span className="text-gray-500">
//                             {amenity.name} × {amenity.quantity}
//                             {amenity.refundable !== undefined && (
//                               <span
//                                 className={`ml-1 ${amenity.refundable ? "text-green-600" : "text-red-600"}`}
//                               >
//                                 (
//                                 {amenity.refundable
//                                   ? "Refundable"
//                                   : "Non-refundable"}
//                                 )
//                               </span>
//                             )}
//                           </span>
//                           <span className="text-gray-700">
//                             ₹{formatCurrency(amenity.totalPrice)}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   )} */}
//                 </div>
//               )}

//               {/* Service Fee */}
//               {serviceFee > 0 && (
//                 <div className="flex justify-between border-t border-gray-200 pt-2">
//                   <span className="text-sm font-bold text-gray-600">
//                     Modification Service Fee
//                   </span>
//                   <span className="font-semibold text-gray-900">
//                     ₹{formatCurrency(serviceFee)}
//                   </span>
//                 </div>
//               )}

//               {/* Taxes & Fees */}
//               <div className="flex justify-between relative">
//                 <div className="flex items-center">
//                   <span className="text-sm font-bold text-gray-600 mr-1">
//                     Taxes & Fees
//                   </span>
//                   <div
//                     className="relative"
//                     onMouseEnter={() => setShowTaxBreakdown(true)}
//                     onMouseLeave={() => setShowTaxBreakdown(false)}
//                   >
//                     <FiInfo
//                       className="text-gray-400 cursor-pointer"
//                       size={14}
//                     />
//                     {showTaxBreakdown && (
//                       <div className="absolute left-0 bottom-full mb-2 w-64 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
//                         <div className="text-xs text-gray-600">
//                           <div className="flex justify-between py-1">
//                             <span>Room Tax (12%)</span>
//                             <span>₹{formatCurrency(taxAmounts.roomTax)}</span>
//                           </div>
//                           {taxAmounts.amenitiesTax > 0 && (
//                             <div className="flex justify-between py-1">
//                               <span>Amenities Tax (12%)</span>
//                               <span>
//                                 ₹{formatCurrency(taxAmounts.amenitiesTax)}
//                               </span>
//                             </div>
//                           )}
//                           <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-medium">
//                             <span>Total Tax</span>
//                             <span>₹{formatCurrency(taxAmounts.totalTax)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <span className="font-semibold text-gray-900">
//                   ₹{formatCurrency(taxAmounts.totalTax)}
//                 </span>
//               </div>

//               {/* Grand Total */}
//               <div className="border-t border-gray-200 pt-2">
//                 <div className="flex justify-between">
//                   <span className="font-bold text-gray-900">Total Amount</span>
//                   <span className="font-bold text-gray-900">
//                     ₹{formatCurrency(grandTotal)}
//                   </span>
//                 </div>
//                 {/* {financialData.current_due_before_preview > 0 && (
//                   <p className="text-xs text-gray-500 text-right mt-1">
//                     Previous Total: ₹
//                     {formatCurrency(financialData.current_due_before_preview)}
//                   </p>
//                 )} */}
//               </div>

//               {/* Refund/Adjustment Amount - Simple styling */}
//               {(financialData.total_refund > 0 || hasRefundOrAdjustment) && (
//                 <div className="flex justify-between">
//                   <span className="font-bold text-gray-900">
//                     {isAdjustment ? "Adjustment Amount" : "Refund Amount"}
//                   </span>
//                   <span className="font-bold text-gray-900">
//                     ₹
//                     {formatCurrency(
//                       financialData.total_refund || refundOrAdjustmentAmount,
//                     )}
//                   </span>
//                 </div>
//               )}

//               {/* Payment Status */}
//               <div className="">
//                 {/* Amount Paid */}
//                 <div className="flex justify-between mb-1">
//                   <span className="font-bold text-gray-900">Amount Paid</span>
//                   <span className="font-bold text-gray-900">
//                     ₹{formatCurrency(paymentStatus.amountPaid)}
//                   </span>
//                 </div>

//                 {/* Amount Due */}
//                 <div className="flex justify-between">
//                   <span className="font-bold text-gray-900">Amount Due</span>
//                   <span className="font-bold text-gray-900">
//                     ₹{formatCurrency(paymentStatus.amountDue)}
//                   </span>
//                 </div>
//               </div>

//               {/* Important Notes */}
//               <div className="mt-4 bg-gray-50 p-4 rounded-lg">
//                 <h3 className="text-sm font-semibold mb-2">Important Notes</h3>
//                 <ul className="text-xs text-gray-600 space-y-1">
//                   <li>• Present this confirmation at check-in</li>
//                   <li>• Check-in time is 1:00 PM</li>
//                   <li>• Check-out time is 1:00 PM</li>
//                   <li>• Government approved ID required</li>
//                   <li>• Modification service fee may apply for changes</li>
//                   {(financialData.total_refund > 0 ||
//                     refundOrAdjustmentAmount > 0) &&
//                     !isAdjustment && (
//                       <li>
//                         • Refunds will be processed within 5-7 business days
//                       </li>
//                     )}
//                   {isAdjustment && (
//                     <li>
//                       • Adjustment amount has been applied to your total balance
//                     </li>
//                   )}
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="fixed bottom-4 right-5 z-50">
//           <button
//             onClick={handleDone}
//             className="bg-purple-500 text-white px-16 py-3 rounded-md text-sm font-medium hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform duration-200"
//           >
//             Continue to Profile
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ModificationSuccessful;
