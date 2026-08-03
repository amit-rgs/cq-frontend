// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import SelectDates from "./SelectDates";
// import { IoMdArrowRoundBack } from "react-icons/io";
// import { Link } from "react-router-dom";

// const FormDetails = () => {
//   const dispatch = useDispatch();

//   // Safely accessing Redux state
//   const formDetails = useSelector((state) => state.formDetails || {});

//   // State to handle errors
//   const [errors, setErrors] = useState({});

//   // Validate required fields
//   const validateFields = () => {
//     const newErrors = {};
//     if (!formDetails.firstName?.trim())
//       newErrors.firstName = "First Name is required.";
//     if (!formDetails.lastName?.trim())
//       newErrors.lastName = "Last Name is required.";
//     if (!formDetails.phoneNumber)
//       newErrors.phoneNumber = "Phone Number is required.";
//     if (!formDetails.email?.trim()) newErrors.email = "Email is required.";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle input changes
//   const handleInputChange = (type, value) => {
//     console.log(type, value);
//     dispatch({ type, payload: value });
//     setErrors((prev) => ({ ...prev, [type]: "" })); // Clear error on change
//   };

//   // Handle next step
//   const handleNext = () => {
//     if (validateFields()) {
//       dispatch({ type: "TOGGLE_DRAWER" });
//     }
//   };
//   const handleCounterChange = (type, value) => {
//     if (value >= 0) {
//       dispatch({ type, payload: value });
//     }
//   };
//   const handleCountryCodeChange = (event) => {
//     dispatch({ type: "SET_COUNTRY_CODE", payload: event.target.value });
//   };

//   const handleClientTypeChange = (event) => {
//     dispatch({ type: "SET_CLIENT_TYPE", payload: event.target.value });
//   };

//   return (
//     <div className="h-[650px] flex justify-center items-center mt-8">
//       {/* Back Navigation */}
//       <div className="absolute top-20 left-5">
//         <Link to={"/check-in/options"}>
//           <button className="flex items-center text-black hover:text-gray-300 font-semibold text-2xl">
//             <IoMdArrowRoundBack />
//           </button>
//         </Link>
//       </div>

//       <div className="p-5 w-full max-w-6xl rounded-lg shadow-md bg-gray-100 mt-5">
//         <h1 className="text-2xl font-bold text-center">Reservation Details</h1>
//         <p className="text-sm text-gray-500 font-bold mb-4 text-center">
//           Please provide your basic contact details so we can assist with your
//           reservation.
//         </p>

//         <div className="flex flex-wrap -mx-4 p-3">
//           {/* Left Column: Primary Contact Details */}
//           <div className="w-full md:w-1/2 px-4 space-y-4 bg-gray-200 p-5 rounded-md">
//             <h2 className="text-lg font-bold mb-2 text-center">
//               Primary Contact
//             </h2>

//             {/* First Name Input */}
//             <div>
//               <label className="block text-sm font-semibold">First Name</label>
//               <input
//                 type="text"
//                 value={formDetails.firstName || ""}
//                 onChange={(e) =>
//                   handleInputChange("SET_FIRST_NAME", e.target.value)
//                 }
//                 className="w-full border rounded px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                 placeholder="Enter your first name"
//               />
//               {errors.firstName && (
//                 <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
//               )}
//             </div>

//             {/* Last Name Input */}
//             <div>
//               <label className="block text-sm font-semibold">Last Name</label>
//               <input
//                 type="text"
//                 value={formDetails.lastName || ""}
//                 onChange={(e) =>
//                   handleInputChange("SET_LAST_NAME", e.target.value)
//                 }
//                 className="w-full border rounded px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                 placeholder="Enter your last name"
//               />
//               {errors.lastName && (
//                 <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
//               )}
//             </div>

//             {/* Phone Number with Country Code */}
//             <div>
//               <label className="block text-sm font-semibold">
//                 Phone Number
//               </label>
//               <div className="flex">
//                 {/* Country Code Dropdown */}
//                 <select
//                   value={formDetails.countryCode}
//                   onChange={handleCountryCodeChange}
//                   className="border rounded-l px-3 py-2 text-sm outline-none"
//                 >
//                   <option value="+1">+1</option>
//                   <option value="+91">+91</option>
//                   <option value="+44">+44</option>
//                   <option value="+61">+61</option>
//                   <option value="+81">+81</option>
//                 </select>

//                 {/* Phone Number Input */}
//                 <input
//                   type="tel"
//                   value={formDetails.phoneNumber || ""}
//                   onChange={(e) => {
//                     const phoneNumber = e.target.value.replace(/[^\d]/g, ""); // Remove non-numeric characters
//                     const parsedPhoneNumber = parseInt(phoneNumber, 10); // Convert to integer
//                     handleInputChange(
//                       "SET_PHONE_NUMBER",
//                       isNaN(parsedPhoneNumber) ? null : parsedPhoneNumber // Handle empty input
//                     );
//                   }}
//                   inputMode="numeric" // Ensures a numeric keypad on mobile devices
//                   className="w-full border rounded-r px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                   placeholder="Enter your phone number"
//                 />
//               </div>
//               {errors.phoneNumber && (
//                 <p className="text-red-500 text-xs mt-1">
//                   {errors.phoneNumber}
//                 </p>
//               )}
//             </div>

//             {/* Email Input */}
//             <div>
//               <label className="block text-sm font-semibold">Email</label>
//               <input
//                 type="email"
//                 value={formDetails.email || ""}
//                 onChange={(e) => handleInputChange("SET_EMAIL", e.target.value)}
//                 className="w-full border rounded px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                 placeholder="Enter your email"
//               />
//               {errors.email && (
//                 <p className="text-red-500 text-xs mt-1">{errors.email}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-semibold">Guest Type</label>
//               <select
//                 value={formDetails.clientType}
//                 onChange={handleClientTypeChange}
//                 className="border w-full rounded px-3 py-2 text-sm outline-none"
//               >
//                 <option value="all" disabled>
//                   Select Guest Type
//                 </option>
//                 <option value="leisure">Leisure</option>
//                 <option value="corporate">Corporate</option>
//               </select>
//             </div>

//             {/* Check-in and Check-out Time in the same div */}
//             {/* Check-in and Check-out Time in the same div */}

//             <div className="flex space-x-4">
//               <div className="flex flex-col w-1/2">
//                 <label className="block text-sm font-semibold mb-1">
//                   Check-in Time
//                 </label>
//                 <select
//                   value={formDetails.checkIn || "10:00:00"} // Fallback to default time if not set
//                   onChange={(e) =>
//                     handleInputChange("SET_CHECKIN", e.target.value)
//                   }
//                   className="border rounded px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                 >
//                   <option value="10:00:00">10:00:00</option>
//                   {Array.from({ length: 14 }, (_, i) => {
//                     const hour = String(i + 11).padStart(2, "0"); // Start from 11:00
//                     return (
//                       <option key={i} value={`${hour}:00:00`}>
//                         {`${hour}:00:00`}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>

//               <div className="flex flex-col w-1/2">
//                 <label className="block text-sm font-semibold mb-1">
//                   Check-out Time
//                 </label>
//                 <select
//                   value={formDetails.checkOut || "11:00:00"} // Fallback to default time if not set
//                   onChange={(e) =>
//                     handleInputChange("SET_CHECKOUT", e.target.value)
//                   }
//                   className="border rounded px-4 py-2 text-sm placeholder:text-gray-400 outline-none"
//                 >
//                   <option value="11:00:00">11:00:00</option>
//                   {Array.from({ length: 13 }, (_, i) => {
//                     const hour = String(i + 12).padStart(2, "0"); // Start from 12:00
//                     return (
//                       <option key={i} value={`${hour}:00:00`}>
//                         {`${hour}:00:00`}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Right Column: Room & Guest Details */}
//           <div className="w-full md:w-1/2 px-4 space-y-4 p-3">
//             <h2 className="text-lg font-bold mb-2 text-center">
//               Room & Guest Details
//             </h2>

//             {/* Rooms */}
//             <div className="flex justify-between items-center">
//               <div className="flex flex-col">
//                 <span className="font-semibold">Rooms</span>
//                 <span className="text-xs text-gray-500">No. of rooms</span>
//               </div>
//               <div className="flex items-center space-x-6 border border-gray-400">
//                 <button
//                   className="px-3 py-1 border-r-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_ROOMS",
//                       (formDetails.rooms || 0) - 1
//                     )
//                   }
//                 >
//                   -
//                 </button>
//                 <span className="text-lg">{formDetails.rooms || 0}</span>
//                 <button
//                   className="px-3 py-1 border-l-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_ROOMS",
//                       (formDetails.rooms || 0) + 1
//                     )
//                   }
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             {/* Adults */}
//             <div className="flex justify-between items-center">
//               <div className="flex flex-col">
//                 <span className="font-semibold">Adults</span>
//                 <span className="text-xs text-gray-500">Age 13 or above</span>
//               </div>
//               <div className="flex items-center space-x-6 border border-gray-400">
//                 <button
//                   className="px-3 py-1 border-r-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_ADULTS",
//                       (formDetails.adults || 0) - 1
//                     )
//                   }
//                 >
//                   -
//                 </button>
//                 <span className="text-lg">{formDetails.adults || 0}</span>
//                 <button
//                   className="px-3 py-1 border-l-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_ADULTS",
//                       (formDetails.adults || 0) + 1
//                     )
//                   }
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             {/* Children */}
//             <div className="flex justify-between items-center">
//               <div className="flex flex-col">
//                 <span className="font-semibold">Children</span>
//                 <span className="text-xs text-gray-500">Ages 2–12</span>
//               </div>
//               <div className="flex items-center space-x-6 border border-gray-400">
//                 <button
//                   className="px-3 py-1 border-r-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_CHILDREN",
//                       (formDetails.children || 0) - 1
//                     )
//                   }
//                 >
//                   -
//                 </button>
//                 <span className="text-lg">{formDetails.children || 0}</span>
//                 <button
//                   className="px-3 py-1 border-l-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_CHILDREN",
//                       (formDetails.children || 0) + 1
//                     )
//                   }
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             {/* Infants */}
//             <div className="flex justify-between items-center">
//               <div className="flex flex-col">
//                 <span className="font-semibold">Infants</span>
//                 <span className="text-xs text-gray-500">Under 2</span>
//               </div>
//               <div className="flex items-center space-x-6 border border-gray-400">
//                 <button
//                   className="px-3 py-1 border-r-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_INFANTS",
//                       (formDetails.infants || 0) - 1
//                     )
//                   }
//                 >
//                   -
//                 </button>
//                 <span className="text-lg">{formDetails.infants || 0}</span>
//                 <button
//                   className="px-3 py-1 border-l-2 border-gray-300"
//                   onClick={() =>
//                     handleCounterChange(
//                       "SET_INFANTS",
//                       (formDetails.infants || 0) + 1
//                     )
//                   }
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             <div className="flex justify-evenly items-center gap-3 mt-6">
//               <div>
//                 <h3 className="font-semibold">Traveling with Pets?</h3>
//                 <p className="text-sm text-gray-500">
//                   Assistance animals aren't considered pets.{" "}
//                   <a href="animals" className="text-blue-500 underline">
//                     Read more about traveling with assistance animals.
//                   </a>
//                 </p>
//               </div>
//               <div>
//                 <label
//                   className="inline-flex items-center cursor-pointer"
//                   onClick={() =>
//                     dispatch({
//                       type: "SET_TRAVEL_WITH_PETS",
//                       payload: !formDetails.travelWithPets,
//                     })
//                   }
//                 >
//                   <div
//                     className={`w-14 h-7 rounded-full flex items-center px-1 ${
//                       formDetails.travelWithPets ? "bg-blue-500" : "bg-gray-300"
//                     }`}
//                   >
//                     <div
//                       className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
//                         formDetails.travelWithPets ? "translate-x-6" : ""
//                       }`}
//                     ></div>
//                   </div>
//                 </label>
//               </div>
//             </div>
//           </div>
//         </div>

//         <p className="">
//           <span className="font-bold text-black">Note:-</span>
//           <span className="text-sm ">
//             The standard check-in time is 10:00 AM, and the check-out time is
//             11:00 AM.{" "}
//           </span>
//         </p>

//         {/* Next Button */}
//         <button
//           className="mt-3 w-full bg-cyan-500 text-white py-2 rounded hover:text-black"
//           onClick={handleNext}
//         >
//           Select Dates
//         </button>

//         {/* Drawer Component */}
//         {formDetails.drawerOpen && (
//           <SelectDates onClose={() => dispatch({ type: "TOGGLE_DRAWER" })} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default FormDetails;

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SelectDates from './SelectDates';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { Link } from 'react-router-dom';

const FormDetails = () => {
  const dispatch = useDispatch();
  const formDetails = useSelector((state) => state.formDetails || {});
  const [errors, setErrors] = useState({});

  // Validate required fields
  const validateFields = () => {
    const newErrors = {};
    if (!formDetails.firstName?.trim()) newErrors.firstName = 'First Name is required.';
    if (!formDetails.lastName?.trim()) newErrors.lastName = 'Last Name is required.';
    if (!formDetails.phoneNumber) newErrors.phoneNumber = 'Phone Number is required.';
    if (!formDetails.email?.trim()) newErrors.email = 'Email is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (type, value) => {
    dispatch({ type, payload: value });
    setErrors((prev) => ({ ...prev, [type]: '' })); // Clear error on change
  };

  // Handle next step
  const handleNext = () => {
    if (validateFields()) {
      dispatch({ type: 'TOGGLE_DRAWER' });
    }
  };

  const handleCounterChange = (type, value) => {
    if (value >= 0) {
      dispatch({ type, payload: value });
    }
  };

  const handleCountryCodeChange = (event) => {
    dispatch({ type: 'SET_COUNTRY_CODE', payload: event.target.value });
  };

  const handleClientTypeChange = (event) => {
    dispatch({ type: 'SET_CLIENT_TYPE', payload: event.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-16">
      {/* Back Navigation */}
      <div className="absolute top-24 left-6">
        <Link to={'/check-in/options'}>
          <button className="flex items-center text-gray-700 hover:text-gray-900 font-semibold text-2xl transition-colors duration-200">
            <IoMdArrowRoundBack size={34} />
          </button>
        </Link>
      </div>

      <div className="w-full max-w-7xl bg-white rounded-xl shadow-2xl p-5 mt-16">
        <h1 className="text-3xl font-bold text-center text-gray-800 ">Reservation Details</h1>
        <p className="text-base font-semibold text-gray-600 text-center mb-6">
          Please provide your basic contact details so we can assist with your reservation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Primary Contact Details */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-700">Primary Contact</h2>

            {/* First Name Input */}
            <div className="flex space-x-4">
              {/* First Name Input */}
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formDetails.firstName || ''}
                  onChange={(e) => handleInputChange('SET_FIRST_NAME', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name Input */}
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formDetails.lastName || ''}
                  onChange={(e) => handleInputChange('SET_LAST_NAME', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Phone Number with Country Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <select
                  value={formDetails.countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-1/7 px-3 py-2 border border-gray-300 rounded-lg "
                >
                  <option value="+1">+1</option>
                  <option value="+91">+91</option>
                  <option value="+44">+44</option>
                  <option value="+61">+61</option>
                  <option value="+81">+81</option>
                </select>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  value={formDetails.phoneNumber || ''}
                  onChange={(e) => {
                    const phoneNumber = e.target.value.replace(/[^\d]/g, '');
                    const parsedPhoneNumber = parseInt(phoneNumber, 10);
                    handleInputChange(
                      'SET_PHONE_NUMBER',
                      isNaN(parsedPhoneNumber) ? null : parsedPhoneNumber
                    );
                  }}
                  inputMode="numeric"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formDetails.email || ''}
                onChange={(e) => handleInputChange('SET_EMAIL', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Guest Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Type</label>
              <select
                value={formDetails.clientType}
                onChange={handleClientTypeChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg "
              >
                <option value="all" disabled>
                  Select Guest Type
                </option>
                <option value="leisure">Leisure</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            {/* Check-in and Check-out Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Time
                </label>
                <select
                  value={formDetails.checkIn || '10:00:00'}
                  onChange={(e) => handleInputChange('SET_CHECKIN', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                >
                  <option value="10:00:00">10:00:00</option>
                  {Array.from({ length: 14 }, (_, i) => {
                    const hour = String(i + 11).padStart(2, '0');
                    return (
                      <option key={i} value={`${hour}:00:00`}>
                        {`${hour}:00:00`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Time
                </label>
                <select
                  value={formDetails.checkOut || '11:00:00'}
                  onChange={(e) => handleInputChange('SET_CHECKOUT', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg "
                >
                  <option value="11:00:00">11:00:00</option>
                  {Array.from({ length: 13 }, (_, i) => {
                    const hour = String(i + 12).padStart(2, '0');
                    return (
                      <option key={i} value={`${hour}:00:00`}>
                        {`${hour}:00:00`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Room & Guest Details */}
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-700">Room & Guest Details</h2>

            {/* Rooms */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">Rooms</span>
                <span className="block text-xs text-gray-500">No. of rooms</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_ROOMS', (formDetails.rooms || 0) - 1)}
                >
                  -
                </button>
                <span className="text-lg font-semibold">{formDetails.rooms || 0}</span>
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_ROOMS', (formDetails.rooms || 0) + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Adults */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">Adults</span>
                <span className="block text-xs text-gray-500">Age 13 or above</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_ADULTS', (formDetails.adults || 0) - 1)}
                >
                  -
                </button>
                <span className="text-lg font-semibold">{formDetails.adults || 0}</span>
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_ADULTS', (formDetails.adults || 0) + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">Children</span>
                <span className="block text-xs text-gray-500">Ages 2–12</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() =>
                    handleCounterChange('SET_CHILDREN', (formDetails.children || 0) - 1)
                  }
                >
                  -
                </button>
                <span className="text-lg font-semibold">{formDetails.children || 0}</span>
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() =>
                    handleCounterChange('SET_CHILDREN', (formDetails.children || 0) + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>

            {/* Infants */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-semibold text-gray-700">Infants</span>
                <span className="block text-xs text-gray-500">Under 2</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_INFANTS', (formDetails.infants || 0) - 1)}
                >
                  -
                </button>
                <span className="text-lg font-semibold">{formDetails.infants || 0}</span>
                <button
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  onClick={() => handleCounterChange('SET_INFANTS', (formDetails.infants || 0) + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Traveling with Pets */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-700">Traveling with Pets?</h3>
                <p className="text-sm text-gray-500">
                  Assistance animals aren't considered pets.{' '}
                  <a href="animals" className="text-blue-500 underline">
                    Read more about traveling with assistance animals.
                  </a>
                </p>
              </div>
              <div>
                <label className="inline-flex items-center cursor-pointer">
                  <div
                    className={`w-14 h-7 rounded-full flex items-center px-1 ${
                      formDetails.travelWithPets ? 'bg-[#1d42b0]' : 'bg-gray-300'
                    } transition-colors`}
                    onClick={() =>
                      dispatch({
                        type: 'SET_TRAVEL_WITH_PETS',
                        payload: !formDetails.travelWithPets,
                      })
                    }
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        formDetails.travelWithPets ? 'translate-x-6' : ''
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-bold">Note:</span> The standard check-in time is 1:00 PM, and the
          check-out time is 1:00 PM.
        </p>

        {/* Next Button */}
        <button
          className="mt-4 w-full bg-[#1d42b0] text-white py-3 rounded-lg hover:text-black transition-colors"
          onClick={handleNext}
        >
          Select Dates
        </button>

        {/* Drawer Component */}
        {formDetails.drawerOpen && (
          <SelectDates onClose={() => dispatch({ type: 'TOGGLE_DRAWER' })} />
        )}
      </div>
    </div>
  );
};

export default FormDetails;
