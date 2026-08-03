import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const HelpSupportForm = ({ guestDetails }) => {
  const [issueCategory, setIssueCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const MAX_DESCRIPTION_LENGTH = 500;
  const MIN_DESCRIPTION_LENGTH = 10;

  const validateForm = () => {
    const newErrors = {};
    if (!issueCategory) {
      newErrors.issueCategory = 'Please select an issue type.';
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      newErrors.description = 'Description is required.';
    } else if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`;
    } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const payload = {
      name: `${guestDetails?.firstname} ${guestDetails?.lastname}`,
      email: guestDetails?.emailid,
      query_type: issueCategory,
      message: description.trim(),
    };

    try {
      const res = await axios.post(`${CQ_BASE_URL}/bq/api/need-help/`, payload);
      toast.success(res.data.message || 'Your query has been submitted successfully.');
      setDescription('');
      setIssueCategory('');
      setErrors({});
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail.map((e) => e.msg).join(', ')
          : 'An unexpected error occurred. Please try again.');
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-14 py-4 sm:py-5 max-w-7xl mx-auto">
      <ToastContainer />
      <h3 className="text-gray-700 font-bold text-lg sm:text-xl mb-3 sm:mb-2">HELP & SUPPORT</h3>

      {/* Name and Email Fields - Responsive Grid */}
      <div className="flex flex-col sm:flex-row w-full gap-4">
        {[
          {
            label: 'Name',
            value: `${guestDetails?.firstname} ${guestDetails?.lastname}`,
            id: 'guest-name',
          },
          {
            label: 'Email',
            value: guestDetails?.emailid,
            id: 'guest-email',
          },
        ].map(({ label, value, id }) => (
          <div className="w-full mt-4" key={id}>
            <label className="text-gray-600 font-semibold text-sm sm:text-base">{label}:</label>
            <input
              type="text"
              value={value || ''}
              disabled
              className="border p-2 rounded w-full mt-2 bg-gray-100 cursor-not-allowed text-sm sm:text-base"
            />
          </div>
        ))}
      </div>

      {/* Issue Type Selection */}
      <div className="w-full mt-4">
        <label className="text-gray-600 font-semibold text-sm sm:text-base">
          Select Issue Type:
        </label>
        <select
          value={issueCategory}
          onChange={(e) => setIssueCategory(e.target.value)}
          className={`border p-2 rounded w-full mt-2 text-sm sm:text-base ${
            errors.issueCategory ? 'border-red-500' : ''
          }`}
        >
          <option value="" disabled>
            -- Select an Issue --
          </option>
          <option value="general">General Inquiry</option>
          <option value="booking">Booking Issues</option>
          <option value="payment">Payment Issues</option>
          <option value="amenities">Amenities</option>
          <option value="other">Other</option>
        </select>
        {errors.issueCategory && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.issueCategory}</p>
        )}
      </div>

      {/* Description Textarea */}
      <div className="mt-4">
        <label className="text-gray-600 font-semibold text-sm sm:text-base">
          Describe Your Issue:
        </label>
        <textarea
          id="issue-description"
          placeholder="Describe your issue in detail"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`border p-2 rounded w-full h-28 sm:h-32 mt-1 resize-none text-sm sm:text-base ${
            errors.description ? 'border-red-500' : ''
          }`}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
        <div className="text-xs sm:text-sm text-gray-500 text-right mt-1">
          {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
        </div>

        {errors.description && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 sm:mt-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 sm:px-8 md:px-10 py-2 rounded transition disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
      >
        {loading ? 'Submitting...' : 'Submit Query'}
      </button>
    </div>
  );
};

export default HelpSupportForm;

// import React, { useState } from "react";
// import axios from "axios";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const HelpSupportForm = ({ guestDetails }) => {
//   const [issueCategory, setIssueCategory] = useState("");
//   const [description, setDescription] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   const MAX_DESCRIPTION_LENGTH = 500;
//   const MIN_DESCRIPTION_LENGTH = 10;

//   const validateForm = () => {
//     const newErrors = {};
//     if (!issueCategory) {
//       newErrors.issueCategory = "Please select an issue type.";
//     }

//     const trimmedDescription = description.trim();
//     if (!trimmedDescription) {
//       newErrors.description = "Description is required.";
//     } else if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
//       newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`;
//     } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
//       newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     const payload = {
//       name: `${guestDetails?.firstname} ${guestDetails?.lastname}`,
//       email: guestDetails?.emailid,
//       query_type: issueCategory,
//       message: description.trim(),
//     };

//     try {
//       const res = await axios.post(`${CQ_BASE_URL}/bq/api/need-help/`, payload);
//       toast.success(
//         res.data.message || "Your query has been submitted successfully."
//       );
//       setDescription("");
//       setIssueCategory("");
//       setErrors({});
//     } catch (err) {
//       console.error(err);
//       const errMsg =
//         err.response?.data?.detail ||
//         (Array.isArray(err.response?.data?.detail)
//           ? err.response.data.detail.map((e) => e.msg).join(", ")
//           : "An unexpected error occurred. Please try again.");
//       toast.error(errMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="px-14 py-5 ">
//       <ToastContainer />
//       <h3 className="text-gray-700 font-bold text-xl mb-2">
//         HELP & SUPPORT
//       </h3>

//       <div className="flex w-full gap-4">
//         {[
//           {
//             label: "Name",
//             value: `${guestDetails?.firstname} ${guestDetails?.lastname}`,
//             id: "guest-name",
//           },
//           {
//             label: "Email",
//             value: guestDetails?.emailid,
//             id: "guest-email",
//           },
//         ].map(({ label, value, id }) => (
//           <div className="w-full md:w-3/4 mt-4" key={id}>
//             <label className="text-gray-600 font-semibold">{label}:</label>
//             <input
//               type="text"
//               value={value || ""}
//               disabled
//               className="border p-2 rounded w-full mt-2 bg-gray-100 cursor-not-allowed"
//             />
//           </div>
//         ))}

//         <div className="w-full mt-4">
//           <label className="text-gray-600 font-semibold">
//             Select Issue Type:
//           </label>
//           <select
//             value={issueCategory}
//             onChange={(e) => setIssueCategory(e.target.value)}
//             className={`border p-2 rounded w-full mt-2 ${
//               errors.issueCategory ? "border-red-500" : ""
//             }`}
//           >
//             <option value="" disabled>
//               -- Select an Issue --
//             </option>
//             <option value="general">General Inquiry</option>
//             <option value="booking">Booking Issues</option>
//             <option value="payment">Payment Issues</option>
//             <option value="amenities">Amenities</option>
//             <option value="other">Other</option>
//           </select>
//           {errors.issueCategory && (
//             <p className="text-red-500 text-sm mt-1">{errors.issueCategory}</p>
//           )}
//         </div>
//       </div>

//       <div className="mt-4">
//         <label className="text-gray-600 font-semibold">
//           Describe Your Issue:
//         </label>
//         <textarea
//           id="issue-description"
//           placeholder="Describe your issue in detail"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           className={`border p-2 rounded w-full h-28 mt-1 resize-none ${
//             errors.description ? "border-red-500" : ""
//           }`}
//           maxLength={MAX_DESCRIPTION_LENGTH}
//         />
//         <div className="text-sm text-gray-500 text-right mt-1">
//           {description.trim().length}/{MAX_DESCRIPTION_LENGTH}
//         </div>

//         {errors.description && (
//           <p className="text-red-500 text-sm">{errors.description}</p>
//         )}
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={loading}
//         className="mt-3 bg-black hover:bg-gray-900 text-white font-semibold px-10 py-2 rounded transition disabled:opacity-50"
//       >
//         {loading ? "Submitting..." : "Submit Query"}
//       </button>
//     </div>
//   );
// };

// export default HelpSupportForm;
