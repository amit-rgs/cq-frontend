// src/store.js
import { createStore, combineReducers } from 'redux';
import { ADD_ADDITIONAL_GUEST, INIT_ADDITIONAL_GUESTS } from './action';
import { UPDATE_ADDITIONAL_GUEST } from './action';
import { REMOVE_ADDITIONAL_GUEST } from './action';
import { CLEAR_ADDITIONAL_GUESTS } from './action';

// Initial state for the form, including selectedDates
const initialFormState = {
  rooms: 1,
  adults: 2,
  children: 0,
  infants: 0,
  childrenAges: [], // Add this line
  selectedDates: {},
  travelWithPets: false,
  drawerOpen: false,

  firstName: '', // Add new fields
  lastName: '',
  phoneNumber: null,
  countryCode: '+91',
  email: '',
  clientType: 'all',
  checkinTime: '',
  checkoutTime: '',
  additionalGuests: [], // Add this line for storing multiple guests
  savedGuests: false, // Track if guests have been saved
};

const initialRoomState = {
  selectedRoom: null,
};

const initialState = {
  reservationMadeOn: '2024-02-10',
  checkInDate: new Date().toISOString().split('T')[0], // Current date in "YYYY-MM-DD" format
  checkOutDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Tomorrow's date
  daysCount: '0',
};

const initialExtraBedState = {
  extraBedCount: 0,
};

const initialPaymentState = {
  paymentMethod: 'cash', // Default payment method
  paymentStatus: false, // Default payment status (not paid)
  paymentDetails: {},
};

const initialAmenityState = {
  selectedAmenities: [],
};

const initialSpecialRatesState = {
  specialRateType: '', // 'senior', 'corporate', 'promo', ''
  corporateCode: '',
  seniorCitizenDiscount: false,
  promoCode: '',
  isSpecialRateApplied: false,
  discountPercentage: 0,
};

// Reducer function to manage form state
const formDetailsReducer = (state = initialFormState, action) => {
  switch (action.type) {
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };
    case 'SET_ADULTS':
      return { ...state, adults: action.payload };
    case 'SET_CHILDREN':
      return { ...state, children: action.payload };
    case 'SET_INFANTS':
      return { ...state, infants: action.payload };
    case 'SET_CHILDREN_AGES':
      return { ...state, childrenAges: action.payload };
    case 'SET_TRAVEL_WITH_PETS':
      return { ...state, travelWithPets: action.payload };
    case 'TOGGLE_DRAWER':
      return { ...state, drawerOpen: !state.drawerOpen };

    case 'SET_SMOKING_PREFERENCE':
      return { ...state, smokingPreference: action.payload };
    case 'SET_EXTRA_BED_COUNT':
      return { ...state, extraBedCount: action.payload };
    case 'SET_FIRST_NAME':
      return { ...state, firstName: action.payload };
    case 'SET_LAST_NAME':
      return { ...state, lastName: action.payload };
    case 'SET_PHONE_NUMBER':
      return { ...state, phoneNumber: action.payload };
    case 'SET_COUNTRY_CODE':
      return { ...state, countryCode: action.payload };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_CHECKIN':
      return { ...state, checkIn: action.payload };
    case 'SET_CHECKOUT':
      return { ...state, checkOut: action.payload };
    case 'SET_CLIENT_TYPE':
      return { ...state, clientType: action.payload };
    // In your formDetailsReducer (store.js)
    case 'SET_ADDITIONAL_GUESTS':
      return {
        ...state,
        additionalGuests: action.payload,
        savedGuests: true,
      };
    case ADD_ADDITIONAL_GUEST:
      return {
        ...state,
        additionalGuests: [...state.additionalGuests, action.payload],
      };

    case UPDATE_ADDITIONAL_GUEST:
      console.log('Reducer processing UPDATE_ADDITIONAL_GUEST', action.payload);
      return {
        ...state,
        additionalGuests: state.additionalGuests.map((guest, i) =>
          i === action.payload.index ? action.payload.guest : guest
        ),
      };

    case REMOVE_ADDITIONAL_GUEST:
      return {
        ...state,
        additionalGuests: state.additionalGuests.filter((_, i) => i !== action.payload),
      };

    case CLEAR_ADDITIONAL_GUESTS:
      return {
        ...state,
        additionalGuests: [],
      };
    case INIT_ADDITIONAL_GUESTS:
      return {
        ...state,
        additionalGuests: action.payload,
        savedGuests: true,
      };
    default:
      return state;
  }
};

// Reducer to handle selected dates and trip duration (daysCount)
const selectedModifyDatesReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_MODIFY_DATES':
      return {
        ...state,
        checkInDate: action.payload.checkInDate,
        checkOutDate: action.payload.checkOutDate,
        daysCount: action.payload.daysCount,
      };
    default:
      return state;
  }
};

const selectedDatesReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SELECTED_DATES':
      const [checkInDate, checkOutDate] = action.payload;
      const diff = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24)); // Calculate the trip duration
      return {
        ...state,
        reservationMadeOn: checkInDate,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        daysCount: diff,
      };
    default:
      return state;
  }
};

const extraBedReducer = (state = initialExtraBedState, action) => {
  switch (action.type) {
    case 'SET_EXTRA_BED_COUNT':
      return { ...state, extraBedCount: action.payload };
    default:
      return state;
  }
};

const selectRoomType = (state = initialRoomState, action) => {
  switch (action.type) {
    case 'SET_SELECTED_ROOM': // Handle the selected room
      return { ...state, selectedRoom: action.payload };
    default:
      return state;
  }
};

const paymentMethodReducer = (state = initialPaymentState, action) => {
  switch (action.type) {
    // ... existing cases
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_PAYMENT_STATUS':
      return { ...state, paymentStatus: action.payload };
    case 'SET_PAYMENT_DETAILS':
      return { ...state, paymentDetails: action.payload };
    default:
      return state;
  }
};

const amenitiesReducer = (state = initialAmenityState, action) => {
  switch (action.type) {
    case 'SET_SELECTED_AMENITIES':
      return {
        ...state,
        selectedAmenities: action.payload,
      };
    default:
      return state;
  }
};

const selectedBookingReducer = (state = { selectedBooking: null }, action) => {
  switch (action.type) {
    case 'SET_SELECTED_BOOKING':
      console.log('Processing booking data:', action.payload);
      return {
        ...state,
        selectedBooking: action.payload,
      };
    default:
      return state;
  }
};

const specialRatesReducer = (state = initialSpecialRatesState, action) => {
  switch (action.type) {
    case 'SET_SPECIAL_RATE_TYPE':
      return {
        ...state,
        specialRateType: action.payload,
        isSpecialRateApplied: action.payload !== '',
      };
    case 'SET_CORPORATE_CODE':
      return {
        ...state,
        corporateCode: action.payload,
        specialRateType: action.payload ? 'corporate' : '',
        isSpecialRateApplied: !!action.payload,
      };
    case 'SET_SENIOR_CITIZEN_DISCOUNT':
      return {
        ...state,
        seniorCitizenDiscount: action.payload,
        specialRateType: action.payload ? 'senior' : '',
        isSpecialRateApplied: action.payload,
      };
    case 'SET_PROMO_CODE':
      return {
        ...state,
        promoCode: action.payload,
        specialRateType: action.payload ? 'promo' : '',
        isSpecialRateApplied: !!action.payload,
      };
    case 'SET_SPECIAL_RATE_APPLIED':
      return {
        ...state,
        isSpecialRateApplied: action.payload,
      };
    case 'CLEAR_SPECIAL_RATES':
      return initialSpecialRatesState;
    default:
      return state;
  }
};

// Combine reducers (for future expansion)
const rootReducer = combineReducers({
  formDetails: formDetailsReducer,
  selectedDates: selectedDatesReducer,
  selectedModifyDates: selectedModifyDatesReducer,
  extraBed: extraBedReducer,
  roomtype: selectRoomType,
  paymentDetails: paymentMethodReducer,
  amenities: amenitiesReducer, // Add this new reducer
  booking: selectedBookingReducer,
  specialRates: specialRatesReducer,
});

// Create Redux store
const store = createStore(rootReducer);

export default store;
