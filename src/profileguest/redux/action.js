export const setSelectedRoom = (room) => {
  return {
    type: 'SET_SELECTED_ROOM',
    payload: room,
  };
};

export const setSelectedDates = (dates) => {
  return {
    type: 'SET_SELECTED_DATES',
    payload: dates.map((date) =>
      new Date(date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
    ),
  };
};

export const setSmokingPreference = (preference) => ({
  type: 'SET_SMOKING_PREFERENCE',
  payload: preference,
});

export const setExtraBedCount = (count) => ({
  type: 'SET_EXTRA_BED_COUNT',
  payload: count,
});

export const setAdults = (count) => ({
  type: 'SET_ADULTS',
  payload: count,
});

export const setChildren = (count) => ({
  type: 'SET_CHILDREN',
  payload: count,
});

export const setFirstName = (name) => ({
  type: 'SET_FIRST_NAME',
  payload: name,
});

export const setLastName = (name) => ({
  type: 'SET_LAST_NAME',
  payload: name,
});

export const setPhoneNumber = (code) => ({
  type: 'SET_PHONE_NUMBER',
  payload: code,
});

export const setCountryCode = (number) => ({
  type: 'SET_COUNTRY_CODE',
  payload: number,
});

export const setEmail = (email) => ({
  type: 'SET_EMAIL',
  payload: email,
});

export const setCheckIn = (checkIn) => ({
  type: 'SET_CHECKIN',
  payload: checkIn,
});

export const setCheckOut = (checkOut) => ({
  type: 'SET_CHECKOUT',
  payload: checkOut,
});

export const setClientType = (clientType) => ({
  type: 'SET_CLIENT_TYPE',
  payload: clientType,
});

export const setPaymentMethod = (method) => ({
  type: 'SET_PAYMENT_METHOD',
  payload: method,
});

export const setPaymentStatus = (status) => ({
  type: 'SET_PAYMENT_STATUS',
  payload: status,
});

export const setPaymentDetails = (details) => ({
  type: 'SET_PAYMENT_DETAILS',
  payload: details,
});

export const setChildrenAges = (ages) => ({
  type: 'SET_CHILDREN_AGES',
  payload: ages,
});

// Add to your action.js
export const setSelectedAmenities = (amenities) => ({
  type: 'SET_SELECTED_AMENITIES',
  payload: amenities,
});

// actions.js
export const ADD_ADDITIONAL_GUEST = 'ADD_ADDITIONAL_GUEST';
export const UPDATE_ADDITIONAL_GUEST = 'UPDATE_ADDITIONAL_GUEST';
export const REMOVE_ADDITIONAL_GUEST = 'REMOVE_ADDITIONAL_GUEST';
export const CLEAR_ADDITIONAL_GUESTS = 'CLEAR_ADDITIONAL_GUESTS';

export const addAdditionalGuest = (guest) => ({
  type: ADD_ADDITIONAL_GUEST,
  payload: guest,
});

export const updateAdditionalGuest = (index, guest) => ({
  type: UPDATE_ADDITIONAL_GUEST,
  payload: { index, guest },
});

export const removeAdditionalGuest = (index) => ({
  type: REMOVE_ADDITIONAL_GUEST,
  payload: index,
});

export const clearAdditionalGuests = () => ({
  type: CLEAR_ADDITIONAL_GUESTS,
});

export const SET_SELECTED_BOOKING = 'SET_SELECTED_BOOKING';

export const setSelectedBooking = (booking) => ({
  type: SET_SELECTED_BOOKING,
  payload: booking,
});

// Special Rate Actions
export const SET_SPECIAL_RATE_TYPE = 'SET_SPECIAL_RATE_TYPE';
export const SET_CORPORATE_CODE = 'SET_CORPORATE_CODE';
export const SET_SENIOR_CITIZEN_DISCOUNT = 'SET_SENIOR_CITIZEN_DISCOUNT';
export const SET_PROMO_CODE = 'SET_PROMO_CODE';
export const SET_SPECIAL_RATE_APPLIED = 'SET_SPECIAL_RATE_APPLIED';
export const CLEAR_SPECIAL_RATES = 'CLEAR_SPECIAL_RATES';

export const setSpecialRateType = (rateType) => ({
  type: SET_SPECIAL_RATE_TYPE,
  payload: rateType,
});

export const setCorporateCode = (code) => ({
  type: SET_CORPORATE_CODE,
  payload: code,
});

export const setSeniorCitizenDiscount = (isApplied) => ({
  type: SET_SENIOR_CITIZEN_DISCOUNT,
  payload: isApplied,
});

export const setPromoCode = (code) => ({
  type: SET_PROMO_CODE,
  payload: code,
});

export const setSpecialRateApplied = (isApplied) => ({
  type: SET_SPECIAL_RATE_APPLIED,
  payload: isApplied,
});

export const clearSpecialRates = () => ({
  type: CLEAR_SPECIAL_RATES,
});
