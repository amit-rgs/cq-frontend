import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaUser,
  FaBuilding,
  FaPercent,
  FaAngleDown,
  FaAngleUp,
  FaSearch,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { MdElderly } from 'react-icons/md';
import { MdBedroomParent } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector, useDispatch } from 'react-redux';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg shadow-lg p-4 flex items-start justify-between animate-slide-in ${
            toast.type === 'success'
              ? 'bg-green-50 border-l-4 border-green-500'
              : toast.type === 'error'
                ? 'bg-red-50 border-l-4 border-red-500'
                : 'bg-blue-50 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex items-start space-x-3">
            {toast.type === 'success' && <FaCheck className="text-green-500 mt-0.5" />}
            {toast.type === 'error' && <FaExclamationTriangle className="text-red-500 mt-0.5" />}
            {toast.type === 'info' && <FaCheck className="text-blue-500 mt-0.5" />}
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  toast.type === 'success'
                    ? 'text-green-800'
                    : toast.type === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                }`}
              >
                {toast.message}
              </p>
              {toast.description && (
                <p className="text-xs mt-1 text-gray-600">{toast.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const RoomReserve = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Get values from Redux store
  const { checkInDate, checkOutDate } = useSelector((state) => state.selectedDates);
  const { adults, children, rooms, childrenAges } = useSelector((state) => state.formDetails);

  // Get special rates from Redux
  const { specialRateType, corporateCode, seniorCitizenDiscount, promoCode, isSpecialRateApplied } =
    useSelector((state) => state.specialRates || {});

  const [showCalendar, setShowCalendar] = useState(false);
  const [showTravellersDropdown, setShowTravellersDropdown] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
  const [showSpecialRateDropdown, setShowSpecialRateDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [localCorporateCode, setLocalCorporateCode] = useState(corporateCode || '');
  const [localPromoCode, setLocalPromoCode] = useState(promoCode || '');
  const [localSeniorDiscount, setLocalSeniorDiscount] = useState(seniorCitizenDiscount || false);

  // Contract validation states
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [contractValidation, setContractValidation] = useState({
    isValid: null,
    message: '',
    data: null,
  });

  const calendarRef = useRef(null);
  const travellersRef = useRef(null);
  const roomsRef = useRef(null);
  const specialRateRef = useRef(null);
  const calendarModalRef = useRef(null);
  const travellersModalRef = useRef(null);
  const roomsModalRef = useRef(null);
  const specialRateModalRef = useRef(null);

  // Toast functions
  const addToast = (message, type = 'info', description = '') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, description }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Sync Redux values with local state
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      setStartDate(start);
      setEndDate(end);
    }
    setLocalCorporateCode(corporateCode || '');
    setLocalPromoCode(promoCode || '');
    setLocalSeniorDiscount(seniorCitizenDiscount || false);
  }, [checkInDate, checkOutDate, corporateCode, promoCode, seniorCitizenDiscount]);

  // Reset validation when corporate code changes
  useEffect(() => {
    if (contractValidation.isValid === true && !corporateCode) {
      setContractValidation({
        isValid: null,
        message: '',
        data: null,
      });
    }
  }, [corporateCode]);

  // Check if any special rate is applied
  const isAnyRateApplied =
    isSpecialRateApplied && (seniorCitizenDiscount || corporateCode || promoCode);

  // Check if corporate code is applied
  const isCorporateCodeApplied = corporateCode && corporateCode.trim() !== '';

  // Check if senior citizen discount is applied
  const isSeniorCitizenApplied = seniorCitizenDiscount;

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const checkinDate = new Date(
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
      );
      const checkoutDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

      if (checkinDate.getTime() === checkoutDate.getTime()) {
        const nextDay = new Date(checkinDate);
        nextDay.setDate(nextDay.getDate() + 1);
        dispatch({
          type: 'SET_SELECTED_DATES',
          payload: [checkinDate, nextDay],
        });
      } else {
        dispatch({
          type: 'SET_SELECTED_DATES',
          payload: [checkinDate, checkoutDate],
        });
      }
    }
  };

  const handleCounterChange = (e, type, value) => {
    e.stopPropagation();
    if (value >= 0) {
      if (type === 'children') {
        dispatch({ type: 'SET_CHILDREN', payload: value });
        const newChildrenAges = [...childrenAges];
        if (value > childrenAges.length) {
          while (newChildrenAges.length < value) {
            newChildrenAges.push(3); // Default to 3 years old
          }
        } else {
          newChildrenAges.length = value;
        }
        dispatch({ type: 'SET_CHILDREN_AGES', payload: newChildrenAges });
      } else {
        dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
      }
    }
  };

  const handleAgeChange = (index, value) => {
    const updatedAges = [...childrenAges];
    updatedAges[index] = parseInt(value);
    dispatch({ type: 'SET_CHILDREN_AGES', payload: updatedAges });
  };

  // Validate contract API call - WITH TOAST NOTIFICATIONS
  const validateContract = async (contractId) => {
    if (!contractId || contractId.trim() === '') {
      addToast('Please enter a contract ID', 'error');
      setContractValidation({
        isValid: false,
        message: 'Please enter a contract ID',
        data: null,
      });
      return false;
    }

    setIsValidatingContract(true);
    setContractValidation({
      isValid: null,
      message: 'Validating contract...',
      data: null,
    });

    try {
      console.log(`Validating contract: ${contractId}`);
      const response = await fetch(
        `${CQ_BASE_URL}/bq/api/guest/contracts/${encodeURIComponent(contractId)}/validate`
      );

      const validationResult = await response.json();
      console.log('Contract validation result:', validationResult);

      if (validationResult.status === 'valid') {
        // Show success toast
        addToast(validationResult.message || 'Contract code validated successfully!', 'success');

        setContractValidation({
          isValid: true,
          message: validationResult.message,
          data: validationResult,
        });
        return true;
      } else {
        // Show error toast
        addToast(validationResult.message || 'Invalid contract code', 'error');

        setContractValidation({
          isValid: false,
          message: validationResult.message,
          data: validationResult,
        });
        return false;
      }
    } catch (error) {
      console.error('Contract validation error:', error);
      // Show error toast
      addToast('Failed to validate contract. Please try again.', 'error');

      setContractValidation({
        isValid: false,
        message: 'Failed to validate contract. Please try again.',
        data: null,
      });
      return false;
    } finally {
      setIsValidatingContract(false);
    }
  };

  // Handle special rate selection
  const handleSpecialRateSelect = (rateType) => {
    dispatch({ type: 'SET_SPECIAL_RATE_TYPE', payload: rateType });
    setShowDetails(true);
  };

  const handleApplyCorporateCode = async () => {
    if (!localCorporateCode.trim()) {
      addToast('Please enter a contract ID', 'error');
      setContractValidation({
        isValid: false,
        message: 'Please enter a contract ID',
        data: null,
      });
      return;
    }

    // If senior citizen discount is already applied, clear it first
    if (localSeniorDiscount) {
      setLocalSeniorDiscount(false);
      dispatch({ type: 'SET_SENIOR_CITIZEN_DISCOUNT', payload: false });
      addToast('Senior discount cleared. Applying corporate code...', 'info');
    }

    // Validate contract before applying
    const isValid = await validateContract(localCorporateCode.trim());

    if (isValid) {
      dispatch({
        type: 'SET_CORPORATE_CODE',
        payload: localCorporateCode.trim(),
      });
      dispatch({ type: 'SET_SPECIAL_RATE_APPLIED', payload: true });
      setShowSpecialRateDropdown(false);
      setShowDetails(true);
      // Success toast already shown in validateContract
    }
  };

  const handleSeniorCitizenToggle = () => {
    const newValue = !localSeniorDiscount;

    // If corporate code is already applied, clear it first
    if (newValue && localCorporateCode.trim()) {
      // Clear corporate code
      setLocalCorporateCode('');
      dispatch({ type: 'SET_CORPORATE_CODE', payload: '' });
      // Clear contract validation
      setContractValidation({
        isValid: null,
        message: '',
        data: null,
      });
      addToast('Corporate code cleared. Applying senior discount...', 'info');
    }

    setLocalSeniorDiscount(newValue);
    dispatch({ type: 'SET_SENIOR_CITIZEN_DISCOUNT', payload: newValue });
    dispatch({ type: 'SET_SPECIAL_RATE_APPLIED', payload: newValue || corporateCode || promoCode });

    if (newValue) {
      addToast('Senior citizen discount applied!', 'success');
      setShowDetails(true);
    } else {
      addToast('Senior citizen discount removed', 'info');
    }
  };

  const handleClearSpecialRates = () => {
    dispatch({ type: 'CLEAR_SPECIAL_RATES' });
    setLocalCorporateCode('');
    setLocalPromoCode('');
    setLocalSeniorDiscount(false);
    setShowDetails(false);
    setShowSpecialRateDropdown(false);
    setContractValidation({
      isValid: null,
      message: '',
      data: null,
    });
    addToast('All special rates cleared', 'success');
  };

  // Get special rate display text
  const getSpecialRateDisplayText = () => {
    if (isSpecialRateApplied) {
      // Check for senior discount
      const hasSenior = seniorCitizenDiscount;
      // Check for corporate discount
      const hasCorporate = corporateCode && corporateCode.trim() !== '';

      // If senior discount is applied
      if (hasSenior) {
        return 'Senior Discount';
      }

      // If corporate discount is applied
      if (hasCorporate) {
        return `Corporate: ${corporateCode}`;
      }

      // If promo code (though typically not combined with others)
      if (promoCode && promoCode.trim() !== '') {
        return `Promo: ${promoCode}`;
      }
    }
    return 'Select Special Rate';
  };

  const calculateNights = (startDate, endDate) => {
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      const nights = Math.floor(timeDiff / (1000 * 3600 * 24));
      return nights > 0 ? nights : 1;
    }
    return 0;
  };

  const handleSearch = () => {
    navigate('/search-page');
  };

  // Click outside handler for desktop ONLY
  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event) => {
      if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (
        showTravellersDropdown &&
        travellersRef.current &&
        !travellersRef.current.contains(event.target)
      ) {
        setShowTravellersDropdown(false);
      }
      if (showRoomsDropdown && roomsRef.current && !roomsRef.current.contains(event.target)) {
        setShowRoomsDropdown(false);
      }
      if (
        showSpecialRateDropdown &&
        specialRateRef.current &&
        !specialRateRef.current.contains(event.target)
      ) {
        setShowSpecialRateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, showTravellersDropdown, showRoomsDropdown, showSpecialRateDropdown, isMobile]);

  // Click outside handler for mobile modals
  useEffect(() => {
    if (!isMobile) return;

    const handleClickOutside = (event) => {
      if (
        showCalendar &&
        calendarModalRef.current &&
        !calendarModalRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
      if (
        showTravellersDropdown &&
        travellersModalRef.current &&
        !travellersModalRef.current.contains(event.target)
      ) {
        setShowTravellersDropdown(false);
      }
      if (
        showRoomsDropdown &&
        roomsModalRef.current &&
        !roomsModalRef.current.contains(event.target)
      ) {
        setShowRoomsDropdown(false);
      }
      if (
        showSpecialRateDropdown &&
        specialRateModalRef.current &&
        !specialRateModalRef.current.contains(event.target)
      ) {
        setShowSpecialRateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, showTravellersDropdown, showRoomsDropdown, showSpecialRateDropdown, isMobile]);

  // Desktop dropdown toggle handlers
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    setShowTravellersDropdown(false);
    setShowRoomsDropdown(false);
    setShowSpecialRateDropdown(false);
  };

  const toggleTravellersDropdown = () => {
    setShowTravellersDropdown(!showTravellersDropdown);
    setShowCalendar(false);
    setShowRoomsDropdown(false);
    setShowSpecialRateDropdown(false);
  };

  const toggleRoomsDropdown = () => {
    setShowRoomsDropdown(!showRoomsDropdown);
    setShowCalendar(false);
    setShowTravellersDropdown(false);
    setShowSpecialRateDropdown(false);
  };

  const toggleSpecialRateDropdown = () => {
    setShowSpecialRateDropdown(!showSpecialRateDropdown);
    setShowCalendar(false);
    setShowTravellersDropdown(false);
    setShowRoomsDropdown(false);
  };

  // Close all mobile modals
  const closeAllMobileModals = () => {
    setShowCalendar(false);
    setShowTravellersDropdown(false);
    setShowRoomsDropdown(false);
    setShowSpecialRateDropdown(false);
  };

  // Handle mobile modal interactions without closing
  const handleMobileDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const checkinDate = new Date(
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
      );
      const checkoutDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

      if (checkinDate.getTime() === checkoutDate.getTime()) {
        const nextDay = new Date(checkinDate);
        nextDay.setDate(nextDay.getDate() + 1);
        dispatch({
          type: 'SET_SELECTED_DATES',
          payload: [checkinDate, nextDay],
        });
      } else {
        dispatch({
          type: 'SET_SELECTED_DATES',
          payload: [checkinDate, checkoutDate],
        });
      }
    }
  };

  const handleMobileCounterChange = (e, type, value) => {
    e.stopPropagation();
    e.preventDefault();
    if (value >= 0) {
      if (type === 'children') {
        dispatch({ type: 'SET_CHILDREN', payload: value });
        const newChildrenAges = [...childrenAges];
        if (value > childrenAges.length) {
          while (newChildrenAges.length < value) {
            newChildrenAges.push(3); // Default to 3 years old
          }
        } else {
          newChildrenAges.length = value;
        }
        dispatch({ type: 'SET_CHILDREN_AGES', payload: newChildrenAges });
      } else {
        dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
      }
    }
  };

  return (
    <>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-center px-2 sm:px-4 md:px-6">
        <div className="w-full max-w-8xl">
          {/* Search Form Box */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center gap-3">
              {/* Date Selection - Desktop */}
              <div
                className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[280px] bg-gradient-to-br from-white to-purple-50/30"
                onClick={toggleCalendar}
              >
                {startDate && endDate && (
                  <div className="absolute top-3 right-3 py-1 px-2 rounded-md text-xs text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-700 whitespace-nowrap">
                    {calculateNights(startDate, endDate)} Night
                    {calculateNights(startDate, endDate) !== 1 ? 's' : ''}
                  </div>
                )}

                <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
                  Dates
                </label>
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt size={16} className="text-purple-500" />
                  <span className="text-gray-800 text-sm font-medium">
                    {startDate && endDate
                      ? `${startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })} - ${endDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}`
                      : 'Select Dates'}
                  </span>
                </div>

                {showCalendar && (
                  <div
                    ref={calendarRef}
                    className="absolute top-full mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 border border-purple-100"
                    style={{
                      minWidth: '650px',
                      left: isTablet ? '50%' : '0',
                      transform: isTablet ? 'translateX(-50%)' : 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DatePicker
                      selected={startDate}
                      onChange={handleDateChange}
                      startDate={startDate}
                      endDate={endDate}
                      selectsRange
                      inline
                      minDate={new Date()}
                      maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                      monthsShown={isTablet ? 1 : 2}
                      dateFormat="MMM d, yyyy"
                      className="react-datepicker"
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:opacity-90 transition"
                      >
                        Apply Dates
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Travellers Selection - DESKTOP */}
              <div
                ref={travellersRef}
                className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[180px] bg-gradient-to-br from-white to-purple-50/30"
                onClick={toggleTravellersDropdown}
              >
                <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
                  Guests
                </label>
                <div className="flex items-center space-x-2">
                  <FaUser className="text-purple-500" size={14} />
                  <span className="text-gray-800 text-sm font-medium">
                    {adults} Adult{adults !== 1 ? 's' : ''}
                    {children > 0 ? `, ${children} Child` : ''}
                  </span>
                  {showTravellersDropdown ? (
                    <FaAngleUp className="ml-auto text-purple-500" size={14} />
                  ) : (
                    <FaAngleDown className="ml-auto text-purple-500" size={14} />
                  )}
                </div>
                {showTravellersDropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-80 border border-purple-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: isTablet ? '50%' : '0',
                      transform: isTablet ? 'translateX(-50%)' : 'none',
                    }}
                  >
                    <h3 className="text-base font-semibold text-gray-800 mb-3">Guest Selection</h3>

                    {['adults', 'children'].map((type) => {
                      const value = { adults, children }[type];
                      const minValue = type === 'adults' ? 1 : 0;

                      return (
                        <div key={type} className="flex justify-between items-center py-2">
                          <div>
                            <span className="text-gray-700 capitalize font-medium text-sm">
                              {type}
                            </span>
                            {type === 'children' && (
                              <p className="text-xs text-gray-500">Ages 0-5</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                value <= minValue
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}
                              onClick={(e) =>
                                value > minValue && handleCounterChange(e, type, value - 1)
                              }
                              disabled={value <= minValue}
                            >
                              <span className="text-sm">-</span>
                            </button>
                            <span className="text-base font-bold min-w-5 text-center">{value}</span>
                            <button
                              className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
                              onClick={(e) => handleCounterChange(e, type, value + 1)}
                            >
                              <span className="text-sm">+</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {children > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Children's Ages</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {childrenAges.map((age, index) => (
                            <div key={index} className="flex flex-col">
                              <label className="text-xs text-gray-600 mb-1">
                                Child {index + 1}
                              </label>
                              <select
                                value={age}
                                onChange={(e) => handleAgeChange(index, e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                              >
                                {Array.from({ length: 5 }, (_, i) => (
                                  <option key={i} value={i + 1}>
                                    {i + 1} {i + 1 === 1 ? 'year' : 'years'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 mt-3 rounded-lg font-medium hover:opacity-90 transition text-sm"
                      onClick={() => setShowTravellersDropdown(false)}
                    >
                      Confirm Guests
                    </button>
                  </div>
                )}
              </div>

              {/* Special Rate Section - DESKTOP */}
              <div
                ref={specialRateRef}
                className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[200px] bg-gradient-to-br from-white to-purple-50/30"
                onClick={toggleSpecialRateDropdown}
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <div className="flex flex-col">
                    <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
                      Special Rate
                    </label>
                    <div className="flex items-center space-x-1">
                      <FaPercent className="text-purple-500" size={12} />
                      <span className="text-gray-800 text-xs font-medium">
                        {getSpecialRateDisplayText()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {showDetails ? <FaAngleUp /> : <FaAngleDown />}
                  </div>
                </div>

                {showSpecialRateDropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-80 border border-purple-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: isTablet ? '50%' : '0',
                      transform: isTablet ? 'translateX(-50%)' : 'none',
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Select Special Rate</h3>

                      {/* Senior Citizen Discount - Commented out */}
                      {/* <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isCorporateCodeApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <MdElderly className={`text-xl ${isCorporateCodeApplied ? 'text-gray-400' : 'text-purple-600'}`} />
                            <div>
                              <label className={`font-semibold text-sm cursor-pointer ${isCorporateCodeApplied ? 'text-gray-500' : 'text-gray-700'}`}>
                                Senior Citizen Discount
                              </label>
                              <p className="text-xs text-gray-500">
                                Apply senior citizen discount
                                {isCorporateCodeApplied && (
                                  <span className="text-red-500 ml-1">(Clear corporate code first)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={localSeniorDiscount}
                              onChange={handleSeniorCitizenToggle}
                              disabled={isCorporateCodeApplied}
                              className={`h-5 w-5 rounded cursor-pointer ${isCorporateCodeApplied ? 'bg-gray-200 cursor-not-allowed' : 'text-purple-600'}`}
                            />
                          </div>
                        </div>
                      </div> */}

                      {/* Corporate Code */}
                      <div
                        className={`mb-4 p-3 border border-gray-200 rounded-md ${isSeniorCitizenApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <FaBuilding
                            className={`mt-1 text-xl ${isSeniorCitizenApplied ? 'text-gray-400' : 'text-purple-600'}`}
                          />
                          <div className="flex-1">
                            <label
                              className={`font-semibold text-gray-700 mb-1 block text-sm ${isSeniorCitizenApplied ? 'text-gray-500' : 'text-gray-700'}`}
                            >
                              Special code
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={localCorporateCode}
                                onChange={(e) => {
                                  setLocalCorporateCode(e.target.value);
                                  if (contractValidation.isValid !== null) {
                                    setContractValidation({
                                      isValid: null,
                                      message: '',
                                      data: null,
                                    });
                                  }
                                }}
                                placeholder="Enter special code"
                                className={`flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm ${isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={
                                  isSeniorCitizenApplied ||
                                  isValidatingContract ||
                                  isCorporateCodeApplied
                                }
                              />
                              <button
                                onClick={handleApplyCorporateCode}
                                disabled={
                                  !localCorporateCode.trim() ||
                                  isValidatingContract ||
                                  isSeniorCitizenApplied ||
                                  isCorporateCodeApplied
                                }
                                className={`px-4 py-2 rounded-md text-sm transition ${
                                  localCorporateCode.trim() &&
                                  !isValidatingContract &&
                                  !isSeniorCitizenApplied &&
                                  !isCorporateCodeApplied
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {isValidatingContract ? 'Validating...' : 'Apply'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Enter your hotel code for corporate rates
                              {isSeniorCitizenApplied && (
                                <span className="text-red-500 ml-1">
                                  (Clear senior discount first)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Clear Rate Button */}
                      {isAnyRateApplied && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={handleClearSpecialRates}
                            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition"
                          >
                            Clear Special Rate
                          </button>
                        </div>
                      )}

                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 mt-2 rounded-md text-sm font-poppins hover:opacity-90 transition"
                        onClick={() => setShowSpecialRateDropdown(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Room Selection - DESKTOP */}
              <div
                ref={roomsRef}
                className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[160px] bg-gradient-to-br from-white to-purple-50/30"
                onClick={toggleRoomsDropdown}
              >
                <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
                  Rooms
                </label>
                <div className="flex items-center space-x-2">
                  <MdBedroomParent size={16} className="text-purple-500" />
                  <span className="text-gray-800 text-sm font-medium">
                    {rooms} Room{rooms !== 1 ? 's' : ''}
                  </span>
                  {showRoomsDropdown ? (
                    <FaAngleUp className="ml-auto text-purple-500" size={14} />
                  ) : (
                    <FaAngleDown className="ml-auto text-purple-500" size={14} />
                  )}
                </div>
                {showRoomsDropdown && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-64 border border-purple-100"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: isTablet ? '50%' : '0',
                      transform: isTablet ? 'translateX(-50%)' : 'none',
                    }}
                  >
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-800 font-medium text-sm">Select Rooms</span>
                      <div className="flex items-center space-x-3">
                        <button
                          className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
                          onClick={(e) => handleCounterChange(e, 'rooms', Math.max(1, rooms - 1))}
                        >
                          <span className="text-sm">-</span>
                        </button>
                        <span className="text-base font-bold min-w-5 text-center">{rooms}</span>
                        <button
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            rooms >= 4
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                          onClick={(e) => {
                            if (rooms < 4) {
                              handleCounterChange(e, 'rooms', rooms + 1);
                            }
                          }}
                          disabled={rooms >= 4}
                        >
                          <span className="text-sm">+</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 p-2 bg-purple-50 border border-purple-100 rounded-lg">
                      <p className="text-xs text-purple-700">
                        <span className="font-semibold">Note:</span> Maximum 4 rooms per reservation
                      </p>
                    </div>

                    <button
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 mt-3 rounded-lg font-medium hover:opacity-90 transition text-sm"
                      onClick={() => setShowRoomsDropdown(false)}
                    >
                      Confirm Rooms
                    </button>
                  </div>
                )}
              </div>

              {/* Search Button - DESKTOP */}
              <button
                onClick={handleSearch}
                disabled={!startDate || !endDate}
                className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
                  startDate && endDate
                    ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white hover:shadow-xl hover:shadow-purple-200 hover:scale-[1.02]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FaSearch size={16} />
                Search Rooms
              </button>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              {/* Top Row - Dates and Search */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 bg-gradient-to-br from-white to-purple-50/30"
                  onClick={() => {
                    closeAllMobileModals();
                    setShowCalendar(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt size={14} className="text-purple-500" />
                      <span className="text-gray-800 text-xs font-medium">
                        {startDate && endDate
                          ? `${startDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })} - ${endDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}`
                          : 'Select Dates'}
                      </span>
                    </div>
                    {startDate && endDate && (
                      <div className="py-1 px-2 rounded-md text-xs text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-700">
                        {calculateNights(startDate, endDate)}N
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={!startDate || !endDate}
                  className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl transition-all duration-300 ${
                    startDate && endDate
                      ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaSearch size={14} />
                  Search
                </button>
              </div>

              {/* Bottom Row - Guests, Rooms, Rate */}
              <div className="grid grid-cols-3 gap-2">
                {/* Guests */}
                <div
                  className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
                  onClick={() => {
                    closeAllMobileModals();
                    setShowTravellersDropdown(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <FaUser className="text-purple-500" size={12} />
                      <span className="text-gray-800 text-xs font-medium">
                        {adults}A {children > 0 ? `, ${children}C` : ''}
                      </span>
                    </div>
                    <FaAngleDown className="text-purple-500" size={12} />
                  </div>
                </div>

                {/* Rooms */}
                <div
                  className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
                  onClick={() => {
                    closeAllMobileModals();
                    setShowRoomsDropdown(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <MdBedroomParent size={12} className="text-purple-500" />
                      <span className="text-gray-800 text-xs font-medium">{rooms}R</span>
                    </div>
                    <FaAngleDown className="text-purple-500" size={12} />
                  </div>
                </div>

                {/* Special Rate - Mobile */}
                <div
                  className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
                  onClick={() => {
                    closeAllMobileModals();
                    setShowSpecialRateDropdown(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <FaPercent className="text-purple-500" size={12} />
                      <span className="text-gray-800 text-xs font-medium truncate">
                        {getSpecialRateDisplayText() === 'Select Special Rate'
                          ? 'Rate'
                          : getSpecialRateDisplayText().substring(0, 10)}
                      </span>
                    </div>
                    <FaAngleDown className="text-purple-500" size={12} />
                  </div>
                </div>
              </div>

              {/* Mobile Modals */}
              {/* Calendar Modal */}
              {showCalendar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div
                    ref={calendarModalRef}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Select Dates</h3>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <FaTimes className="text-gray-500" />
                      </button>
                    </div>
                    <div className="p-4" onClick={(e) => e.stopPropagation()}>
                      <DatePicker
                        selected={startDate}
                        onChange={handleMobileDateChange}
                        startDate={startDate}
                        endDate={endDate}
                        selectsRange
                        inline
                        minDate={new Date()}
                        maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                        monthsShown={1}
                        dateFormat="MMM d, yyyy"
                        className="react-datepicker"
                      />
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => setShowCalendar(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setShowCalendar(false)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:opacity-90 transition"
                        >
                          Apply Dates
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Travellers Modal */}
              {showTravellersDropdown && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div
                    ref={travellersModalRef}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Guests Selection</h3>
                      <button
                        onClick={() => setShowTravellersDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <FaTimes className="text-gray-500" />
                      </button>
                    </div>
                    <div className="p-4" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-base font-semibold text-gray-800 mb-4">
                        Guest Selection
                      </h3>

                      {['adults', 'children'].map((type) => {
                        const value = { adults, children }[type];
                        const minValue = type === 'adults' ? 1 : 0;

                        return (
                          <div key={type} className="flex justify-between items-center py-3">
                            <div>
                              <span className="text-gray-700 capitalize font-medium">{type}</span>
                              {type === 'children' && (
                                <p className="text-sm text-gray-500">Ages 0-5</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  value <= minValue
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (value > minValue) {
                                    handleMobileCounterChange(e, type, value - 1);
                                  }
                                }}
                                disabled={value <= minValue}
                              >
                                <span className="text-base">-</span>
                              </button>
                              <span className="text-lg font-bold min-w-8 text-center">{value}</span>
                              <button
                                className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleMobileCounterChange(e, type, value + 1);
                                }}
                              >
                                <span className="text-base">+</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {children > 0 && (
                        <div
                          className="mt-4 pt-4 border-t border-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Children's Ages
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {childrenAges.map((age, index) => (
                              <div key={index} className="flex flex-col">
                                <label className="text-sm text-gray-600 mb-1">
                                  Child {index + 1}
                                </label>
                                <select
                                  value={age}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleAgeChange(index, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                >
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <option key={i} value={i + 1}>
                                      {i + 1} {i + 1 === 1 ? 'year' : 'years'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 mt-4 rounded-lg font-medium hover:opacity-90 transition text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTravellersDropdown(false);
                        }}
                      >
                        Confirm Guests
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rooms Modal */}
              {showRoomsDropdown && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div
                    ref={roomsModalRef}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Room Selection</h3>
                      <button
                        onClick={() => setShowRoomsDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <FaTimes className="text-gray-500" />
                      </button>
                    </div>
                    <div className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-800 font-medium">Select Rooms</span>
                        <div className="flex items-center space-x-4">
                          <button
                            className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleMobileCounterChange(e, 'rooms', Math.max(1, rooms - 1));
                            }}
                          >
                            <span className="text-base">-</span>
                          </button>
                          <span className="text-lg font-bold min-w-8 text-center">{rooms}</span>
                          <button
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              rooms >= 4
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (rooms < 4) {
                                handleMobileCounterChange(e, 'rooms', rooms + 1);
                              }
                            }}
                            disabled={rooms >= 4}
                          >
                            <span className="text-base">+</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                        <p className="text-sm text-purple-700">
                          <span className="font-semibold">Note:</span> Maximum 4 rooms per
                          reservation
                        </p>
                      </div>

                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 mt-4 rounded-lg font-medium hover:opacity-90 transition text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoomsDropdown(false);
                        }}
                      >
                        Confirm Rooms
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Rate Modal - Mobile */}
              {showSpecialRateDropdown && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div
                    ref={specialRateModalRef}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">Special Rates</h3>
                      <button
                        onClick={() => setShowSpecialRateDropdown(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <FaTimes className="text-gray-500" />
                      </button>
                    </div>
                    <div className="p-4" onClick={(e) => e.stopPropagation()}>
                      <h3 className="text-sm font-bold text-gray-800 mb-3">Select Special Rate</h3>

                      {/* Senior Citizen Discount - Commented out */}
                      {/* <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isCorporateCodeApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <MdElderly className={`text-xl ${isCorporateCodeApplied ? 'text-gray-400' : 'text-purple-600'}`} />
                            <div>
                              <label className={`font-semibold text-sm cursor-pointer ${isCorporateCodeApplied ? 'text-gray-500' : 'text-gray-700'}`}>
                                Senior Citizen Discount
                              </label>
                              <p className="text-xs text-gray-500">
                                Apply senior citizen discount
                                {isCorporateCodeApplied && (
                                  <span className="text-red-500 ml-1">(Clear corporate code first)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={localSeniorDiscount}
                              onChange={handleSeniorCitizenToggle}
                              disabled={isCorporateCodeApplied}
                              className={`h-5 w-5 rounded cursor-pointer ${isCorporateCodeApplied ? 'bg-gray-200 cursor-not-allowed' : 'text-purple-600'}`}
                            />
                          </div>
                        </div>
                      </div> */}

                      {/* Corporate Code */}
                      <div
                        className={`mb-4 p-3 border border-gray-200 rounded-md ${isSeniorCitizenApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start space-x-3">
                          <FaBuilding
                            className={`mt-1 text-xl ${isSeniorCitizenApplied ? 'text-gray-400' : 'text-purple-600'}`}
                          />
                          <div className="flex-1">
                            <label
                              className={`font-semibold text-gray-700 mb-1 block text-sm ${isSeniorCitizenApplied ? 'text-gray-500' : 'text-gray-700'}`}
                            >
                              Special code
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={localCorporateCode}
                                onChange={(e) => {
                                  setLocalCorporateCode(e.target.value);
                                  if (contractValidation.isValid !== null) {
                                    setContractValidation({
                                      isValid: null,
                                      message: '',
                                      data: null,
                                    });
                                  }
                                }}
                                placeholder="Enter special code"
                                className={`flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm ${isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={
                                  isSeniorCitizenApplied ||
                                  isValidatingContract ||
                                  isCorporateCodeApplied
                                }
                              />
                              <button
                                onClick={handleApplyCorporateCode}
                                disabled={
                                  !localCorporateCode.trim() ||
                                  isValidatingContract ||
                                  isSeniorCitizenApplied ||
                                  isCorporateCodeApplied
                                }
                                className={`px-4 py-2 rounded-md text-sm transition ${
                                  localCorporateCode.trim() &&
                                  !isValidatingContract &&
                                  !isSeniorCitizenApplied &&
                                  !isCorporateCodeApplied
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {isValidatingContract ? 'Validating...' : 'Apply'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Enter your hotel code for corporate rates
                              {isSeniorCitizenApplied && (
                                <span className="text-red-500 ml-1">
                                  (Clear senior discount first)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Clear Rate Button */}
                      {isAnyRateApplied && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={handleClearSpecialRates}
                            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition"
                          >
                            Clear Special Rate
                          </button>
                        </div>
                      )}

                      <button
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 mt-2 rounded-md text-sm font-poppins hover:opacity-90 transition"
                        onClick={() => setShowSpecialRateDropdown(false)}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomReserve;

// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   FaCalendarAlt,
//   FaUser,
//   FaBuilding,
//   FaPercent,
//   FaAngleDown,
//   FaAngleUp,
//   FaSearch,
//   FaTimes,
//   FaCheck,
//   FaExclamationTriangle,
// } from "react-icons/fa";
// import { MdElderly } from "react-icons/md";
// import { MdBedroomParent } from "react-icons/md";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { useSelector, useDispatch } from "react-redux";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// // Toast Container Component
// const ToastContainer = ({ toasts, removeToast }) => {
//   if (toasts.length === 0) return null;

//   return (
//     <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
//       {toasts.map((toast) => (
//         <div
//           key={toast.id}
//           className={`rounded-lg shadow-lg p-4 flex items-start justify-between animate-slide-in ${
//             toast.type === 'success'
//               ? 'bg-green-50 border-l-4 border-green-500'
//               : toast.type === 'error'
//               ? 'bg-red-50 border-l-4 border-red-500'
//               : 'bg-blue-50 border-l-4 border-blue-500'
//           }`}
//         >
//           <div className="flex items-start space-x-3">
//             {toast.type === 'success' && (
//               <FaCheck className="text-green-500 mt-0.5" />
//             )}
//             {toast.type === 'error' && (
//               <FaExclamationTriangle className="text-red-500 mt-0.5" />
//             )}
//             {toast.type === 'info' && (
//               <FaCheck className="text-blue-500 mt-0.5" />
//             )}
//             <div className="flex-1">
//               <p className={`text-sm font-medium ${
//                 toast.type === 'success'
//                   ? 'text-green-800'
//                   : toast.type === 'error'
//                   ? 'text-red-800'
//                   : 'text-blue-800'
//               }`}>
//                 {toast.message}
//               </p>
//               {toast.description && (
//                 <p className="text-xs mt-1 text-gray-600">{toast.description}</p>
//               )}
//             </div>
//           </div>
//           <button
//             onClick={() => removeToast(toast.id)}
//             className="ml-4 text-gray-400 hover:text-gray-600"
//           >
//             <FaTimes size={14} />
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// };

// const RoomReserve = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Toast state
//   const [toasts, setToasts] = useState([]);

//   // Get values from Redux store
//   const { checkInDate, checkOutDate } = useSelector(
//     (state) => state.selectedDates
//   );
//   const { adults, children, rooms, childrenAges } = useSelector(
//     (state) => state.formDetails
//   );

//   // Get special rates from Redux
//   const {
//     specialRateType,
//     corporateCode,
//     seniorCitizenDiscount,
//     promoCode,
//     isSpecialRateApplied,
//   } = useSelector((state) => state.specialRates || {});

//   const [showCalendar, setShowCalendar] = useState(false);
//   const [showTravellersDropdown, setShowTravellersDropdown] = useState(false);
//   const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
//   const [showSpecialRateDropdown, setShowSpecialRateDropdown] = useState(false);
//   const [showDetails, setShowDetails] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [isTablet, setIsTablet] = useState(false);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [localCorporateCode, setLocalCorporateCode] = useState(
//     corporateCode || ""
//   );
//   const [localPromoCode, setLocalPromoCode] = useState(promoCode || "");
//   const [localSeniorDiscount, setLocalSeniorDiscount] = useState(
//     seniorCitizenDiscount || false
//   );

//   // Contract validation states
//   const [isValidatingContract, setIsValidatingContract] = useState(false);
//   const [contractValidation, setContractValidation] = useState({
//     isValid: null,
//     message: "",
//     data: null,
//   });

//   const calendarRef = useRef(null);
//   const travellersRef = useRef(null);
//   const roomsRef = useRef(null);
//   const specialRateRef = useRef(null);
//   const calendarModalRef = useRef(null);
//   const travellersModalRef = useRef(null);
//   const roomsModalRef = useRef(null);
//   const specialRateModalRef = useRef(null);

//   // Toast functions
//   const addToast = (message, type = 'info', description = '') => {
//     const id = Date.now();
//     setToasts((prev) => [...prev, { id, message, type, description }]);

//     // Auto remove after 5 seconds
//     setTimeout(() => {
//       removeToast(id);
//     }, 6000);
//   };

//   const removeToast = (id) => {
//     setToasts((prev) => prev.filter((toast) => toast.id !== id));
//   };

//   // Check screen size on mount and resize
//   useEffect(() => {
//     const checkScreenSize = () => {
//       setIsMobile(window.innerWidth < 768);
//       setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
//     };

//     checkScreenSize();
//     window.addEventListener("resize", checkScreenSize);
//     return () => window.removeEventListener("resize", checkScreenSize);
//   }, []);

//   // Sync Redux values with local state
//   useEffect(() => {
//     if (checkInDate && checkOutDate) {
//       const start = new Date(checkInDate);
//       const end = new Date(checkOutDate);
//       setStartDate(start);
//       setEndDate(end);
//     }
//     setLocalCorporateCode(corporateCode || "");
//     setLocalPromoCode(promoCode || "");
//     setLocalSeniorDiscount(seniorCitizenDiscount || false);
//   }, [
//     checkInDate,
//     checkOutDate,
//     corporateCode,
//     promoCode,
//     seniorCitizenDiscount,
//   ]);

//   // Reset validation when corporate code changes
//   useEffect(() => {
//     if (contractValidation.isValid === true && !corporateCode) {
//       setContractValidation({
//         isValid: null,
//         message: "",
//         data: null,
//       });
//     }
//   }, [corporateCode]);

//   // Check if any special rate is applied
//   const isAnyRateApplied =
//     isSpecialRateApplied &&
//     (seniorCitizenDiscount || corporateCode || promoCode);

//   // Check if corporate code is applied
//   const isCorporateCodeApplied = corporateCode && corporateCode.trim() !== "";

//   // Check if senior citizen discount is applied
//   const isSeniorCitizenApplied = seniorCitizenDiscount;

//   const handleDateChange = (dates) => {
//     const [start, end] = dates;
//     setStartDate(start);
//     setEndDate(end);

//     if (start && end) {
//       const checkinDate = new Date(
//         Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
//       );
//       const checkoutDate = new Date(
//         Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
//       );

//       if (checkinDate.getTime() === checkoutDate.getTime()) {
//         const nextDay = new Date(checkinDate);
//         nextDay.setDate(nextDay.getDate() + 1);
//         dispatch({
//           type: "SET_SELECTED_DATES",
//           payload: [checkinDate, nextDay],
//         });
//       } else {
//         dispatch({
//           type: "SET_SELECTED_DATES",
//           payload: [checkinDate, checkoutDate],
//         });
//       }
//     }
//   };

//   const handleCounterChange = (e, type, value) => {
//     e.stopPropagation();
//     if (value >= 0) {
//       if (type === "children") {
//         dispatch({ type: "SET_CHILDREN", payload: value });
//         const newChildrenAges = [...childrenAges];
//         if (value > childrenAges.length) {
//           while (newChildrenAges.length < value) {
//             newChildrenAges.push(5);
//           }
//         } else {
//           newChildrenAges.length = value;
//         }
//         dispatch({ type: "SET_CHILDREN_AGES", payload: newChildrenAges });
//       } else {
//         dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
//       }
//     }
//   };

//   const handleAgeChange = (index, value) => {
//     const updatedAges = [...childrenAges];
//     updatedAges[index] = parseInt(value);
//     dispatch({ type: "SET_CHILDREN_AGES", payload: updatedAges });
//   };

//   // Validate contract API call - WITH TOAST NOTIFICATIONS
//   const validateContract = async (contractId) => {
//     if (!contractId || contractId.trim() === "") {
//       addToast("Please enter a contract ID", "error");
//       setContractValidation({
//         isValid: false,
//         message: "Please enter a contract ID",
//         data: null,
//       });
//       return false;
//     }

//     setIsValidatingContract(true);
//     setContractValidation({
//       isValid: null,
//       message: "Validating contract...",
//       data: null,
//     });

//     try {
//       console.log(`Validating contract: ${contractId}`);
//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/guest/contracts/${encodeURIComponent(
//           contractId
//         )}/validate`
//       );

//       const validationResult = await response.json();
//       console.log("Contract validation result:", validationResult);

//       if (validationResult.status === "valid") {
//         // Show success toast
//         addToast(validationResult.message || "Contract code validated successfully!", "success");

//         setContractValidation({
//           isValid: true,
//           message: validationResult.message,
//           data: validationResult,
//         });
//         return true;
//       } else {
//         // Show error toast
//         addToast(validationResult.message || "Invalid contract code", "error");

//         setContractValidation({
//           isValid: false,
//           message: validationResult.message,
//           data: validationResult,
//         });
//         return false;
//       }
//     } catch (error) {
//       console.error("Contract validation error:", error);
//       // Show error toast
//       addToast("Failed to validate contract. Please try again.", "error");

//       setContractValidation({
//         isValid: false,
//         message: "Failed to validate contract. Please try again.",
//         data: null,
//       });
//       return false;
//     } finally {
//       setIsValidatingContract(false);
//     }
//   };

//   // Handle special rate selection
//   const handleSpecialRateSelect = (rateType) => {
//     dispatch({ type: "SET_SPECIAL_RATE_TYPE", payload: rateType });
//     setShowDetails(true);
//   };

//   const handleApplyCorporateCode = async () => {
//     if (!localCorporateCode.trim()) {
//       addToast("Please enter a contract ID", "error");
//       setContractValidation({
//         isValid: false,
//         message: "Please enter a contract ID",
//         data: null,
//       });
//       return;
//     }

//     // If senior citizen discount is already applied, clear it first
//     if (localSeniorDiscount) {
//       setLocalSeniorDiscount(false);
//       dispatch({ type: "SET_SENIOR_CITIZEN_DISCOUNT", payload: false });
//       addToast("Senior discount cleared. Applying corporate code...", "info");
//     }

//     // Validate contract before applying
//     const isValid = await validateContract(localCorporateCode.trim());

//     if (isValid) {
//       dispatch({
//         type: "SET_CORPORATE_CODE",
//         payload: localCorporateCode.trim(),
//       });
//       dispatch({ type: "SET_SPECIAL_RATE_APPLIED", payload: true });
//       setShowSpecialRateDropdown(false);
//       setShowDetails(true);
//       // Success toast already shown in validateContract
//     }
//   };

//   const handleSeniorCitizenToggle = () => {
//     const newValue = !localSeniorDiscount;

//     // If corporate code is already applied, clear it first
//     if (newValue && localCorporateCode.trim()) {
//       // Clear corporate code
//       setLocalCorporateCode("");
//       dispatch({ type: "SET_CORPORATE_CODE", payload: "" });
//       // Clear contract validation
//       setContractValidation({
//         isValid: null,
//         message: "",
//         data: null,
//       });
//       addToast("Corporate code cleared. Applying senior discount...", "info");
//     }

//     setLocalSeniorDiscount(newValue);
//     dispatch({ type: "SET_SENIOR_CITIZEN_DISCOUNT", payload: newValue });
//     dispatch({ type: "SET_SPECIAL_RATE_APPLIED", payload: newValue || corporateCode || promoCode });

//     if (newValue) {
//       addToast("Senior citizen discount applied!", "success");
//       setShowDetails(true);
//     } else {
//       addToast("Senior citizen discount removed", "info");
//     }
//   };

//   const handleClearSpecialRates = () => {
//     dispatch({ type: "CLEAR_SPECIAL_RATES" });
//     setLocalCorporateCode("");
//     setLocalPromoCode("");
//     setLocalSeniorDiscount(false);
//     setShowDetails(false);
//     setShowSpecialRateDropdown(false);
//     setContractValidation({
//       isValid: null,
//       message: "",
//       data: null,
//     });
//     addToast("All special rates cleared", "success");
//   };

//   // Get special rate display text
//   const getSpecialRateDisplayText = () => {
//     if (isSpecialRateApplied) {
//       // Check for senior discount
//       const hasSenior = seniorCitizenDiscount;
//       // Check for corporate discount
//       const hasCorporate = corporateCode && corporateCode.trim() !== "";

//       // If senior discount is applied
//       if (hasSenior) {
//         return "Senior Discount";
//       }

//       // If corporate discount is applied
//       if (hasCorporate) {
//         return `Corporate: ${corporateCode}`;
//       }

//       // If promo code (though typically not combined with others)
//       if (promoCode && promoCode.trim() !== "") {
//         return `Promo: ${promoCode}`;
//       }
//     }
//     return "Select Special Rate";
//   };

//   const calculateNights = (startDate, endDate) => {
//     if (startDate && endDate) {
//       const timeDiff = endDate.getTime() - startDate.getTime();
//       const nights = Math.floor(timeDiff / (1000 * 3600 * 24));
//       return nights > 0 ? nights : 1;
//     }
//     return 0;
//   };

//   const handleSearch = () => {
//     navigate("/search-page");
//   };

//   // Click outside handler for desktop ONLY
//   useEffect(() => {
//     if (isMobile) return;

//     const handleClickOutside = (event) => {
//       if (
//         showCalendar &&
//         calendarRef.current &&
//         !calendarRef.current.contains(event.target)
//       ) {
//         setShowCalendar(false);
//       }
//       if (
//         showTravellersDropdown &&
//         travellersRef.current &&
//         !travellersRef.current.contains(event.target)
//       ) {
//         setShowTravellersDropdown(false);
//       }
//       if (
//         showRoomsDropdown &&
//         roomsRef.current &&
//         !roomsRef.current.contains(event.target)
//       ) {
//         setShowRoomsDropdown(false);
//       }
//       if (
//         showSpecialRateDropdown &&
//         specialRateRef.current &&
//         !specialRateRef.current.contains(event.target)
//       ) {
//         setShowSpecialRateDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [
//     showCalendar,
//     showTravellersDropdown,
//     showRoomsDropdown,
//     showSpecialRateDropdown,
//     isMobile,
//   ]);

//   // Click outside handler for mobile modals
//   useEffect(() => {
//     if (!isMobile) return;

//     const handleClickOutside = (event) => {
//       if (
//         showCalendar &&
//         calendarModalRef.current &&
//         !calendarModalRef.current.contains(event.target)
//       ) {
//         setShowCalendar(false);
//       }
//       if (
//         showTravellersDropdown &&
//         travellersModalRef.current &&
//         !travellersModalRef.current.contains(event.target)
//       ) {
//         setShowTravellersDropdown(false);
//       }
//       if (
//         showRoomsDropdown &&
//         roomsModalRef.current &&
//         !roomsModalRef.current.contains(event.target)
//       ) {
//         setShowRoomsDropdown(false);
//       }
//       if (
//         showSpecialRateDropdown &&
//         specialRateModalRef.current &&
//         !specialRateModalRef.current.contains(event.target)
//       ) {
//         setShowSpecialRateDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [
//     showCalendar,
//     showTravellersDropdown,
//     showRoomsDropdown,
//     showSpecialRateDropdown,
//     isMobile,
//   ]);

//   // Desktop dropdown toggle handlers
//   const toggleCalendar = () => {
//     setShowCalendar(!showCalendar);
//     setShowTravellersDropdown(false);
//     setShowRoomsDropdown(false);
//     setShowSpecialRateDropdown(false);
//   };

//   const toggleTravellersDropdown = () => {
//     setShowTravellersDropdown(!showTravellersDropdown);
//     setShowCalendar(false);
//     setShowRoomsDropdown(false);
//     setShowSpecialRateDropdown(false);
//   };

//   const toggleRoomsDropdown = () => {
//     setShowRoomsDropdown(!showRoomsDropdown);
//     setShowCalendar(false);
//     setShowTravellersDropdown(false);
//     setShowSpecialRateDropdown(false);
//   };

//   const toggleSpecialRateDropdown = () => {
//     setShowSpecialRateDropdown(!showSpecialRateDropdown);
//     setShowCalendar(false);
//     setShowTravellersDropdown(false);
//     setShowRoomsDropdown(false);
//   };

//   // Close all mobile modals
//   const closeAllMobileModals = () => {
//     setShowCalendar(false);
//     setShowTravellersDropdown(false);
//     setShowRoomsDropdown(false);
//     setShowSpecialRateDropdown(false);
//   };

//   // Handle mobile modal interactions without closing
//   const handleMobileDateChange = (dates) => {
//     const [start, end] = dates;
//     setStartDate(start);
//     setEndDate(end);

//     if (start && end) {
//       const checkinDate = new Date(
//         Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
//       );
//       const checkoutDate = new Date(
//         Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
//       );

//       if (checkinDate.getTime() === checkoutDate.getTime()) {
//         const nextDay = new Date(checkinDate);
//         nextDay.setDate(nextDay.getDate() + 1);
//         dispatch({
//           type: "SET_SELECTED_DATES",
//           payload: [checkinDate, nextDay],
//         });
//       } else {
//         dispatch({
//           type: "SET_SELECTED_DATES",
//           payload: [checkinDate, checkoutDate],
//         });
//       }
//     }
//   };

//   const handleMobileCounterChange = (e, type, value) => {
//     e.stopPropagation();
//     e.preventDefault();
//     if (value >= 0) {
//       if (type === "children") {
//         dispatch({ type: "SET_CHILDREN", payload: value });
//         const newChildrenAges = [...childrenAges];
//         if (value > childrenAges.length) {
//           while (newChildrenAges.length < value) {
//             newChildrenAges.push(5);
//           }
//         } else {
//           newChildrenAges.length = value;
//         }
//         dispatch({ type: "SET_CHILDREN_AGES", payload: newChildrenAges });
//       } else {
//         dispatch({ type: `SET_${type.toUpperCase()}`, payload: value });
//       }
//     }
//   };

//   return (
//     <>
//       {/* Toast Container */}
//       <ToastContainer toasts={toasts} removeToast={removeToast} />

//       <div className="flex items-center justify-center px-2 sm:px-4 md:px-6">
//         <div className="w-full max-w-8xl">
//           {/* Search Form Box */}
//           <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100">
//             {/* Desktop Layout */}
//             <div className="hidden md:flex items-center gap-3">
//               {/* Date Selection - Desktop */}
//               <div
//                 className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[280px] bg-gradient-to-br from-white to-purple-50/30"
//                 onClick={toggleCalendar}
//               >
//                 {startDate && endDate && (
//                   <div className="absolute top-3 right-3 py-1 px-2 rounded-md text-xs text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-700 whitespace-nowrap">
//                     {calculateNights(startDate, endDate)} Night
//                     {calculateNights(startDate, endDate) !== 1 ? "s" : ""}
//                   </div>
//                 )}

//                 <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
//                   Dates
//                 </label>
//                 <div className="flex items-center space-x-2">
//                   <FaCalendarAlt size={16} className="text-purple-500" />
//                   <span className="text-gray-800 text-sm font-medium">
//                     {startDate && endDate
//                       ? `${startDate.toLocaleDateString("en-US", {
//                           month: "short",
//                           day: "numeric",
//                         })} - ${endDate.toLocaleDateString("en-US", {
//                           month: "short",
//                           day: "numeric",
//                         })}`
//                       : "Select Dates"}
//                   </span>
//                 </div>

//                 {showCalendar && (
//                   <div
//                     ref={calendarRef}
//                     className="absolute top-full mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 border border-purple-100"
//                     style={{
//                       minWidth: "650px",
//                       left: isTablet ? "50%" : "0",
//                       transform: isTablet ? "translateX(-50%)" : "none",
//                     }}
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <DatePicker
//                       selected={startDate}
//                       onChange={handleDateChange}
//                       startDate={startDate}
//                       endDate={endDate}
//                       selectsRange
//                       inline
//                       minDate={new Date()}
//                       maxDate={
//                         new Date(
//                           new Date().setFullYear(new Date().getFullYear() + 1)
//                         )
//                       }
//                       monthsShown={isTablet ? 1 : 2}
//                       dateFormat="MMM d, yyyy"
//                       className="react-datepicker"
//                     />
//                     <div className="mt-4 flex justify-end space-x-2">
//                       <button
//                         onClick={() => setShowCalendar(false)}
//                         className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
//                       >
//                         Cancel
//                       </button>
//                       <button
//                         onClick={() => setShowCalendar(false)}
//                         className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:opacity-90 transition"
//                       >
//                         Apply Dates
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Travellers Selection - DESKTOP */}
//               <div
//                 ref={travellersRef}
//                 className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[180px] bg-gradient-to-br from-white to-purple-50/30"
//                 onClick={toggleTravellersDropdown}
//               >
//                 <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
//                   Guests
//                 </label>
//                 <div className="flex items-center space-x-2">
//                   <FaUser className="text-purple-500" size={14} />
//                   <span className="text-gray-800 text-sm font-medium">
//                     {adults} Adult{adults !== 1 ? "s" : ""}
//                     {children > 0 ? `, ${children} Child` : ""}
//                   </span>
//                   {showTravellersDropdown ? (
//                     <FaAngleUp className="ml-auto text-purple-500" size={14} />
//                   ) : (
//                     <FaAngleDown className="ml-auto text-purple-500" size={14} />
//                   )}
//                 </div>
//                 {showTravellersDropdown && (
//                   <div
//                     className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-80 border border-purple-100"
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                       left: isTablet ? "50%" : "0",
//                       transform: isTablet ? "translateX(-50%)" : "none",
//                     }}
//                   >
//                     <h3 className="text-base font-semibold text-gray-800 mb-3">
//                       Guest Selection
//                     </h3>

//                     {["adults", "children"].map((type) => {
//                       const value = { adults, children }[type];
//                       const minValue = type === "adults" ? 1 : 0;

//                       return (
//                         <div
//                           key={type}
//                           className="flex justify-between items-center py-2"
//                         >
//                           <div>
//                             <span className="text-gray-700 capitalize font-medium text-sm">
//                               {type}
//                             </span>
//                             {type === "children" && (
//                               <p className="text-xs text-gray-500">Ages 0-5</p>
//                             )}
//                           </div>
//                           <div className="flex items-center space-x-3">
//                             <button
//                               className={`w-7 h-7 rounded-full flex items-center justify-center ${
//                                 value <= minValue
//                                   ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                                   : "bg-purple-100 text-purple-700 hover:bg-purple-200"
//                               }`}
//                               onClick={(e) =>
//                                 value > minValue &&
//                                 handleCounterChange(e, type, value - 1)
//                               }
//                               disabled={value <= minValue}
//                             >
//                               <span className="text-sm">-</span>
//                             </button>
//                             <span className="text-base font-bold min-w-5 text-center">
//                               {value}
//                             </span>
//                             <button
//                               className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
//                               onClick={(e) =>
//                                 handleCounterChange(e, type, value + 1)
//                               }
//                             >
//                               <span className="text-sm">+</span>
//                             </button>
//                           </div>
//                         </div>
//                       );
//                     })}

//                     {children > 0 && (
//                       <div className="mt-3 pt-3 border-t border-gray-100">
//                         <h4 className="text-sm font-medium text-gray-700 mb-2">
//                           Children's Ages
//                         </h4>
//                         <div className="grid grid-cols-2 gap-2">
//                           {childrenAges.map((age, index) => (
//                             <div key={index} className="flex flex-col">
//                               <label className="text-xs text-gray-600 mb-1">
//                                 Child {index + 1}
//                               </label>
//                               <select
//                                 value={age}
//                                 onChange={(e) =>
//                                   handleAgeChange(index, e.target.value)
//                                 }
//                                 className="border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
//                               >
//                                 {Array.from({ length: 5 }, (_, i) => (
//                                   <option key={i} value={i}>
//                                     {i} {i === 1 ? "year" : "years"}
//                                   </option>
//                                 ))}
//                               </select>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <button
//                       className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 mt-3 rounded-lg font-medium hover:opacity-90 transition text-sm"
//                       onClick={() => setShowTravellersDropdown(false)}
//                     >
//                       Confirm Guests
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Special Rate Section - DESKTOP */}
//               <div
//                 ref={specialRateRef}
//                 className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[200px] bg-gradient-to-br from-white to-purple-50/30"
//                 onClick={toggleSpecialRateDropdown}
//               >
//                 <div
//                   className="flex justify-between items-center cursor-pointer"
//                   onClick={() => setShowDetails(!showDetails)}
//                 >
//                   <div className="flex flex-col">
//                     <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
//                       Special Rate
//                     </label>
//                     <div className="flex items-center space-x-1">
//                       <FaPercent className="text-purple-500" size={12} />
//                       <span className="text-gray-800 text-xs font-medium">
//                         {getSpecialRateDisplayText()}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="flex items-center">
//                     {showDetails ? <FaAngleUp /> : <FaAngleDown />}
//                   </div>
//                 </div>

//                 {showSpecialRateDropdown && (
//                   <div
//                     className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-80 border border-purple-100"
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                       left: isTablet ? "50%" : "0",
//                       transform: isTablet ? "translateX(-50%)" : "none",
//                     }}
//                   >
//                     <div className="mb-4">
//                       <h3 className="text-sm font-bold text-gray-800 mb-3">Select Special Rate</h3>

//                       {/* Senior Citizen Discount */}
//                       {/* <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isCorporateCodeApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-3 flex-1">
//                             <MdElderly className={`text-xl ${isCorporateCodeApplied ? 'text-gray-400' : 'text-purple-600'}`} />
//                             <div>
//                               <label className={`font-semibold text-sm cursor-pointer ${isCorporateCodeApplied ? 'text-gray-500' : 'text-gray-700'}`}>
//                                 Senior Citizen Discount
//                               </label>
//                               <p className="text-xs text-gray-500">
//                                 Apply senior citizen discount
//                                 {isCorporateCodeApplied && (
//                                   <span className="text-red-500 ml-1">(Clear corporate code first)</span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <input
//                               type="checkbox"
//                               checked={localSeniorDiscount}
//                               onChange={handleSeniorCitizenToggle}
//                               disabled={isCorporateCodeApplied}
//                               className={`h-5 w-5 rounded cursor-pointer ${isCorporateCodeApplied ? 'bg-gray-200 cursor-not-allowed' : 'text-purple-600'}`}
//                             />
//                           </div>
//                         </div>
//                       </div> */}

//                       {/* Corporate Code */}
//                       <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isSeniorCitizenApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
//                         <div className="flex items-start space-x-3">
//                           <FaBuilding className={`mt-1 text-xl ${isSeniorCitizenApplied ? 'text-gray-400' : 'text-purple-600'}`} />
//                           <div className="flex-1">
//                             <label className={`font-semibold text-gray-700 mb-1 block text-sm ${isSeniorCitizenApplied ? 'text-gray-500' : 'text-gray-700'}`}>
//                               Special code
//                             </label>
//                             <div className="flex space-x-2">
//                               <input
//                                 type="text"
//                                 value={localCorporateCode}
//                                 onChange={(e) => {
//                                   setLocalCorporateCode(e.target.value);
//                                   if (contractValidation.isValid !== null) {
//                                     setContractValidation({
//                                       isValid: null,
//                                       message: "",
//                                       data: null
//                                     });
//                                   }
//                                 }}
//                                 placeholder="Enter special code"
//                                 className={`flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm ${isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied ? 'bg-gray-100 cursor-not-allowed' : ''}`}
//                                 disabled={isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied}
//                               />
//                               <button
//                                 onClick={handleApplyCorporateCode}
//                                 disabled={!localCorporateCode.trim() || isValidatingContract || isSeniorCitizenApplied || isCorporateCodeApplied}
//                                 className={`px-4 py-2 rounded-md text-sm transition ${localCorporateCode.trim() && !isValidatingContract && !isSeniorCitizenApplied && !isCorporateCodeApplied
//                                   ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90"
//                                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                                 }`}
//                               >
//                                 {isValidatingContract ? "Validating..." : "Apply"}
//                               </button>
//                             </div>
//                             <p className="text-xs text-gray-500 mt-1">
//                               Enter your hotel code for corporate rates
//                               {isSeniorCitizenApplied && (
//                                 <span className="text-red-500 ml-1">(Clear senior discount first)</span>
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Clear Rate Button */}
//                       {isAnyRateApplied && (
//                         <div className="mt-4 pt-3 border-t border-gray-200">
//                           <button
//                             onClick={handleClearSpecialRates}
//                             className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition"
//                           >
//                             Clear Special Rate
//                           </button>
//                         </div>
//                       )}

//                       <button
//                         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 mt-2 rounded-md text-sm font-poppins hover:opacity-90 transition"
//                         onClick={() => setShowSpecialRateDropdown(false)}
//                       >
//                         Done
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Room Selection - DESKTOP */}
//               <div
//                 ref={roomsRef}
//                 className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 min-w-[160px] bg-gradient-to-br from-white to-purple-50/30"
//                 onClick={toggleRoomsDropdown}
//               >
//                 <label className="text-purple-700 text-xs font-semibold mb-1 uppercase tracking-wide">
//                   Rooms
//                 </label>
//                 <div className="flex items-center space-x-2">
//                   <MdBedroomParent size={16} className="text-purple-500" />
//                   <span className="text-gray-800 text-sm font-medium">
//                     {rooms} Room{rooms !== 1 ? "s" : ""}
//                   </span>
//                   {showRoomsDropdown ? (
//                     <FaAngleUp className="ml-auto text-purple-500" size={14} />
//                   ) : (
//                     <FaAngleDown className="ml-auto text-purple-500" size={14} />
//                   )}
//                 </div>
//                 {showRoomsDropdown && (
//                   <div
//                     className="absolute top-full left-0 mt-2 bg-white shadow-2xl rounded-xl p-4 z-50 w-64 border border-purple-100"
//                     onClick={(e) => e.stopPropagation()}
//                     style={{
//                       left: isTablet ? "50%" : "0",
//                       transform: isTablet ? "translateX(-50%)" : "none",
//                     }}
//                   >
//                     <div className="flex justify-between items-center py-2">
//                       <span className="text-gray-800 font-medium text-sm">
//                         Select Rooms
//                       </span>
//                       <div className="flex items-center space-x-3">
//                         <button
//                           className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
//                           onClick={(e) =>
//                             handleCounterChange(
//                               e,
//                               "rooms",
//                               Math.max(1, rooms - 1)
//                             )
//                           }
//                         >
//                           <span className="text-sm">-</span>
//                         </button>
//                         <span className="text-base font-bold min-w-5 text-center">
//                           {rooms}
//                         </span>
//                         <button
//                           className={`w-7 h-7 rounded-full flex items-center justify-center ${
//                             rooms >= 4
//                               ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                               : "bg-purple-100 text-purple-700 hover:bg-purple-200"
//                           }`}
//                           onClick={(e) => {
//                             if (rooms < 4) {
//                               handleCounterChange(e, "rooms", rooms + 1);
//                             }
//                           }}
//                           disabled={rooms >= 4}
//                         >
//                           <span className="text-sm">+</span>
//                         </button>
//                       </div>
//                     </div>

//                     <div className="mt-2 p-2 bg-purple-50 border border-purple-100 rounded-lg">
//                       <p className="text-xs text-purple-700">
//                         <span className="font-semibold">Note:</span> Maximum 4
//                         rooms per reservation
//                       </p>
//                     </div>

//                     <button
//                       className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 mt-3 rounded-lg font-medium hover:opacity-90 transition text-sm"
//                       onClick={() => setShowRoomsDropdown(false)}
//                     >
//                       Confirm Rooms
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Search Button - DESKTOP */}
//               <button
//                 onClick={handleSearch}
//                 disabled={!startDate || !endDate}
//                 className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap ${
//                   startDate && endDate
//                     ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white hover:shadow-xl hover:shadow-purple-200 hover:scale-[1.02]"
//                     : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                 }`}
//               >
//                 <FaSearch size={16} />
//                 Search Rooms
//               </button>
//             </div>

//             {/* Mobile Layout */}
//             <div className="md:hidden">
//               {/* Top Row - Dates and Search */}
//               <div className="flex items-center gap-2 mb-3">
//                 <div
//                   className="flex flex-col border border-purple-200 p-3 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 flex-1 bg-gradient-to-br from-white to-purple-50/30"
//                   onClick={() => {
//                     closeAllMobileModals();
//                     setShowCalendar(true);
//                   }}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-2">
//                       <FaCalendarAlt size={14} className="text-purple-500" />
//                       <span className="text-gray-800 text-xs font-medium">
//                         {startDate && endDate
//                           ? `${startDate.toLocaleDateString("en-US", {
//                               month: "short",
//                               day: "numeric",
//                             })} - ${endDate.toLocaleDateString("en-US", {
//                               month: "short",
//                               day: "numeric",
//                             })}`
//                           : "Select Dates"}
//                       </span>
//                     </div>
//                     {startDate && endDate && (
//                       <div className="py-1 px-2 rounded-md text-xs text-white font-semibold bg-gradient-to-r from-purple-600 to-purple-700">
//                         {calculateNights(startDate, endDate)}N
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <button
//                   onClick={handleSearch}
//                   disabled={!startDate || !endDate}
//                   className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl transition-all duration-300 ${
//                     startDate && endDate
//                       ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white"
//                       : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                   }`}
//                 >
//                   <FaSearch size={14} />
//                   Search
//                 </button>
//               </div>

//               {/* Bottom Row - Guests, Rooms, Rate */}
//               <div className="grid grid-cols-3 gap-2">
//                 {/* Guests */}
//                 <div
//                   className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
//                   onClick={() => {
//                     closeAllMobileModals();
//                     setShowTravellersDropdown(true);
//                   }}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-1">
//                       <FaUser className="text-purple-500" size={12} />
//                       <span className="text-gray-800 text-xs font-medium">
//                         {adults}A {children > 0 ? `, ${children}C` : ""}
//                       </span>
//                     </div>
//                     <FaAngleDown className="text-purple-500" size={12} />
//                   </div>
//                 </div>

//                 {/* Rooms */}
//                 <div
//                   className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
//                   onClick={() => {
//                     closeAllMobileModals();
//                     setShowRoomsDropdown(true);
//                   }}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-1">
//                       <MdBedroomParent size={12} className="text-purple-500" />
//                       <span className="text-gray-800 text-xs font-medium">
//                         {rooms}R
//                       </span>
//                     </div>
//                     <FaAngleDown className="text-purple-500" size={12} />
//                   </div>
//                 </div>

//                 {/* Special Rate - Mobile */}
//                 <div
//                   className="flex flex-col border border-purple-200 p-2 rounded-xl relative cursor-pointer hover:border-purple-400 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30"
//                   onClick={() => {
//                     closeAllMobileModals();
//                     setShowSpecialRateDropdown(true);
//                   }}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-1">
//                       <FaPercent className="text-purple-500" size={12} />
//                       <span className="text-gray-800 text-xs font-medium truncate">
//                         {getSpecialRateDisplayText() === "Select Special Rate"
//                           ? "Rate"
//                           : getSpecialRateDisplayText().substring(0, 10)}
//                       </span>
//                     </div>
//                     <FaAngleDown className="text-purple-500" size={12} />
//                   </div>
//                 </div>
//               </div>

//               {/* Mobile Modals */}
//               {/* Calendar Modal */}
//               {showCalendar && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                   <div
//                     ref={calendarModalRef}
//                     className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
//                       <h3 className="text-lg font-semibold text-gray-800">
//                         Select Dates
//                       </h3>
//                       <button
//                         onClick={() => setShowCalendar(false)}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                       >
//                         <FaTimes className="text-gray-500" />
//                       </button>
//                     </div>
//                     <div className="p-4" onClick={(e) => e.stopPropagation()}>
//                       <DatePicker
//                         selected={startDate}
//                         onChange={handleMobileDateChange}
//                         startDate={startDate}
//                         endDate={endDate}
//                         selectsRange
//                         inline
//                         minDate={new Date()}
//                         maxDate={
//                           new Date(
//                             new Date().setFullYear(new Date().getFullYear() + 1)
//                           )
//                         }
//                         monthsShown={1}
//                         dateFormat="MMM d, yyyy"
//                         className="react-datepicker"
//                       />
//                       <div className="mt-4 flex justify-end space-x-2">
//                         <button
//                           onClick={() => setShowCalendar(false)}
//                           className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
//                         >
//                           Cancel
//                         </button>
//                         <button
//                           onClick={() => setShowCalendar(false)}
//                           className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:opacity-90 transition"
//                         >
//                           Apply Dates
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Travellers Modal */}
//               {showTravellersDropdown && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                   <div
//                     ref={travellersModalRef}
//                     className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
//                       <h3 className="text-lg font-semibold text-gray-800">
//                         Guests Selection
//                       </h3>
//                       <button
//                         onClick={() => setShowTravellersDropdown(false)}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                       >
//                         <FaTimes className="text-gray-500" />
//                       </button>
//                     </div>
//                     <div className="p-4" onClick={(e) => e.stopPropagation()}>
//                       <h3 className="text-base font-semibold text-gray-800 mb-4">
//                         Guest Selection
//                       </h3>

//                       {["adults", "children"].map((type) => {
//                         const value = { adults, children }[type];
//                         const minValue = type === "adults" ? 1 : 0;

//                         return (
//                           <div
//                             key={type}
//                             className="flex justify-between items-center py-3"
//                           >
//                             <div>
//                               <span className="text-gray-700 capitalize font-medium">
//                                 {type}
//                               </span>
//                               {type === "children" && (
//                                 <p className="text-sm text-gray-500">Ages 0-5</p>
//                               )}
//                             </div>
//                             <div className="flex items-center space-x-4">
//                               <button
//                                 className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                   value <= minValue
//                                     ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                                     : "bg-purple-100 text-purple-700 hover:bg-purple-200"
//                                 }`}
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   e.preventDefault();
//                                   if (value > minValue) {
//                                     handleMobileCounterChange(e, type, value - 1);
//                                   }
//                                 }}
//                                 disabled={value <= minValue}
//                               >
//                                 <span className="text-base">-</span>
//                               </button>
//                               <span className="text-lg font-bold min-w-8 text-center">
//                                 {value}
//                               </span>
//                               <button
//                                 className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   e.preventDefault();
//                                   handleMobileCounterChange(e, type, value + 1);
//                                 }}
//                               >
//                                 <span className="text-base">+</span>
//                               </button>
//                             </div>
//                           </div>
//                         );
//                       })}

//                       {children > 0 && (
//                         <div
//                           className="mt-4 pt-4 border-t border-gray-100"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <h4 className="text-sm font-medium text-gray-700 mb-3">
//                             Children's Ages
//                           </h4>
//                           <div className="grid grid-cols-2 gap-3">
//                             {childrenAges.map((age, index) => (
//                               <div key={index} className="flex flex-col">
//                                 <label className="text-sm text-gray-600 mb-1">
//                                   Child {index + 1}
//                                 </label>
//                                 <select
//                                   value={age}
//                                   onChange={(e) => {
//                                     e.stopPropagation();
//                                     handleAgeChange(index, e.target.value);
//                                   }}
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
//                                 >
//                                   {Array.from({ length: 5 }, (_, i) => (
//                                     <option key={i} value={i}>
//                                       {i} {i === 1 ? "year" : "years"}
//                                     </option>
//                                   ))}
//                                 </select>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       <button
//                         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 mt-4 rounded-lg font-medium hover:opacity-90 transition text-sm"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setShowTravellersDropdown(false);
//                         }}
//                       >
//                         Confirm Guests
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Rooms Modal */}
//               {showRoomsDropdown && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                   <div
//                     ref={roomsModalRef}
//                     className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
//                       <h3 className="text-lg font-semibold text-gray-800">
//                         Room Selection
//                       </h3>
//                       <button
//                         onClick={() => setShowRoomsDropdown(false)}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                       >
//                         <FaTimes className="text-gray-500" />
//                       </button>
//                     </div>
//                     <div className="p-4" onClick={(e) => e.stopPropagation()}>
//                       <div className="flex justify-between items-center py-3">
//                         <span className="text-gray-800 font-medium">
//                           Select Rooms
//                         </span>
//                         <div className="flex items-center space-x-4">
//                           <button
//                             className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center hover:bg-purple-200"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               e.preventDefault();
//                               handleMobileCounterChange(
//                                 e,
//                                 "rooms",
//                                 Math.max(1, rooms - 1)
//                               );
//                             }}
//                           >
//                             <span className="text-base">-</span>
//                           </button>
//                           <span className="text-lg font-bold min-w-8 text-center">
//                             {rooms}
//                           </span>
//                           <button
//                             className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                               rooms >= 4
//                                 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                                 : "bg-purple-100 text-purple-700 hover:bg-purple-200"
//                             }`}
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               e.preventDefault();
//                               if (rooms < 4) {
//                                 handleMobileCounterChange(e, "rooms", rooms + 1);
//                               }
//                             }}
//                             disabled={rooms >= 4}
//                           >
//                             <span className="text-base">+</span>
//                           </button>
//                         </div>
//                       </div>

//                       <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
//                         <p className="text-sm text-purple-700">
//                           <span className="font-semibold">Note:</span> Maximum 4
//                           rooms per reservation
//                         </p>
//                       </div>

//                       <button
//                         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 mt-4 rounded-lg font-medium hover:opacity-90 transition text-sm"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           setShowRoomsDropdown(false);
//                         }}
//                       >
//                         Confirm Rooms
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Special Rate Modal - Mobile */}
//               {showSpecialRateDropdown && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
//                   <div
//                     ref={specialRateModalRef}
//                     className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
//                       <h3 className="text-lg font-semibold text-gray-800">
//                         Special Rates
//                       </h3>
//                       <button
//                         onClick={() => setShowSpecialRateDropdown(false)}
//                         className="p-2 hover:bg-gray-100 rounded-full"
//                       >
//                         <FaTimes className="text-gray-500" />
//                       </button>
//                     </div>
//                     <div className="p-4" onClick={(e) => e.stopPropagation()}>
//                       <h3 className="text-sm font-bold text-gray-800 mb-3">Select Special Rate</h3>

//                       {/* Senior Citizen Discount */}
//                       {/* <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isCorporateCodeApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-3 flex-1">
//                             <MdElderly className={`text-xl ${isCorporateCodeApplied ? 'text-gray-400' : 'text-purple-600'}`} />
//                             <div>
//                               <label className={`font-semibold text-sm cursor-pointer ${isCorporateCodeApplied ? 'text-gray-500' : 'text-gray-700'}`}>
//                                 Senior Citizen Discount
//                               </label>
//                               <p className="text-xs text-gray-500">
//                                 Apply senior citizen discount
//                                 {isCorporateCodeApplied && (
//                                   <span className="text-red-500 ml-1">(Clear corporate code first)</span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <input
//                               type="checkbox"
//                               checked={localSeniorDiscount}
//                               onChange={handleSeniorCitizenToggle}
//                               disabled={isCorporateCodeApplied}
//                               className={`h-5 w-5 rounded cursor-pointer ${isCorporateCodeApplied ? 'bg-gray-200 cursor-not-allowed' : 'text-purple-600'}`}
//                             />
//                           </div>
//                         </div>
//                       </div> */}

//                       {/* Corporate Code */}
//                       <div className={`mb-4 p-3 border border-gray-200 rounded-md ${isSeniorCitizenApplied ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
//                         <div className="flex items-start space-x-3">
//                           <FaBuilding className={`mt-1 text-xl ${isSeniorCitizenApplied ? 'text-gray-400' : 'text-purple-600'}`} />
//                           <div className="flex-1">
//                             <label className={`font-semibold text-gray-700 mb-1 block text-sm ${isSeniorCitizenApplied ? 'text-gray-500' : 'text-gray-700'}`}>
//                               Special code
//                             </label>
//                             <div className="flex space-x-2">
//                               <input
//                                 type="text"
//                                 value={localCorporateCode}
//                                 onChange={(e) => {
//                                   setLocalCorporateCode(e.target.value);
//                                   if (contractValidation.isValid !== null) {
//                                     setContractValidation({
//                                       isValid: null,
//                                       message: "",
//                                       data: null
//                                     });
//                                   }
//                                 }}
//                                 placeholder="Enter special code"
//                                 className={`flex-1 border border-gray-300 rounded-md py-1 px-2 text-sm ${isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied ? 'bg-gray-100 cursor-not-allowed' : ''}`}
//                                 disabled={isSeniorCitizenApplied || isValidatingContract || isCorporateCodeApplied}
//                               />
//                               <button
//                                 onClick={handleApplyCorporateCode}
//                                 disabled={!localCorporateCode.trim() || isValidatingContract || isSeniorCitizenApplied || isCorporateCodeApplied}
//                                 className={`px-4 py-2 rounded-md text-sm transition ${localCorporateCode.trim() && !isValidatingContract && !isSeniorCitizenApplied && !isCorporateCodeApplied
//                                   ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:opacity-90"
//                                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                                 }`}
//                               >
//                                 {isValidatingContract ? "Validating..." : "Apply"}
//                               </button>
//                             </div>
//                             <p className="text-xs text-gray-500 mt-1">
//                               Enter your hotel code for corporate rates
//                               {isSeniorCitizenApplied && (
//                                 <span className="text-red-500 ml-1">(Clear senior discount first)</span>
//                               )}
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Clear Rate Button */}
//                       {isAnyRateApplied && (
//                         <div className="mt-4 pt-3 border-t border-gray-200">
//                           <button
//                             onClick={handleClearSpecialRates}
//                             className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-300 transition"
//                           >
//                             Clear Special Rate
//                           </button>
//                         </div>
//                       )}

//                       <button
//                         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 mt-2 rounded-md text-sm font-poppins hover:opacity-90 transition"
//                         onClick={() => setShowSpecialRateDropdown(false)}
//                       >
//                         Done
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default RoomReserve;
