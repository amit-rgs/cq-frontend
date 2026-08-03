import React, { useState } from 'react';
import detailsImage from '../assets/IMG_4366-scaled.jpg';
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimes,
} from 'react-icons/fa';
import Footer from '../components/Footer';

const footerLinks = [
  {
    title: 'Quick Links',
    links: ['Home', 'Rooms & Suites', 'Dining', 'Facilities', 'Gallery', 'Contact'],
  },
  {
    title: 'Services',
    links: ['Conference Hall', 'Wedding Functions', 'Swimming Pool', 'Spa Services', 'Transport'],
  },
  {
    title: 'Information',
    links: ['About Us', 'Careers', 'Privacy Policy', 'Terms & Conditions', 'FAQ'],
  },
];

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// Toast Component
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-50 animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        } min-w-[300px] max-w-md`}
      >
        {type === 'success' ? (
          <FaCheckCircle className="text-green-500 text-xl" />
        ) : (
          <FaExclamationCircle className="text-red-500 text-xl" />
        )}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phonenumber: '',
    dateofstay: '',
    feedback: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullname':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phonenumber':
        if (!value.trim()) return 'Phone number is required';
        const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number (10-15 digits)';
        return '';
      case 'dateofstay':
        if (!value) return 'Date of stay is required';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) return 'Date of stay cannot be in the future';
        return '';
      case 'feedback':
        if (!value.trim()) return 'Feedback is required';
        if (value.trim().length < 10) return 'Please provide more details (minimum 10 characters)';
        return '';
      case 'consent':
        if (!value) return 'You must agree to the Privacy Policy and Terms & Conditions';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }

    if (name === 'feedback') {
      setCharacterCount(value.length);
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched({
      ...touched,
      [name]: true,
    });

    const error = validateField(name, fieldValue);
    if (error) {
      setErrors({
        ...errors,
        [name]: error,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'fullname',
      'email',
      'phonenumber',
      'dateofstay',
      'feedback',
      'consent',
    ];

    fieldsToValidate.forEach((field) => {
      const value = field === 'consent' ? formData[field] : formData[field];
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show first error as toast
      const firstError = Object.values(newErrors)[0];
      showToast(firstError, 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      fullname: true,
      email: true,
      phonenumber: true,
      dateofstay: true,
      feedback: true,
      consent: true,
    };
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullname: formData.fullname,
        email: formData.email,
        phonenumber: formData.phonenumber,
        dateofstay: new Date(formData.dateofstay).toISOString(),
        feedback: formData.feedback,
      };

      const response = await fetch(`${CQ_BASE_URL}/bq/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        showToast('✅ Thank you for your feedback! We appreciate your input.', 'success');

        // Reset form
        setFormData({
          fullname: '',
          email: '',
          phonenumber: '',
          dateofstay: '',
          feedback: '',
          consent: false,
        });
        setCharacterCount(0);
        setErrors({});
        setTouched({});
      } else {
        throw new Error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('❌ Unable to submit feedback. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans">
      {/* Toast Container */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[50vh] w-full overflow-hidden">
        <img
          src={detailsImage}
          alt="TAI Hotel Details"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-7xl font-light mb-4 relative inline-block group">
              Contact Us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 mt-4 bg-white transition-all duration-300 group-hover:w-full"></span>
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 lg:py-20">
        {/* Contact Information & Reservations Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              General Inquiries & Reservations
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
              The best way to reach us and reserve your stay is calling on the numbers below. Also
              feel free to email us! Available 8:00 AM to 11 PM.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="max-w-8xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Phone Section */}
              <div className="relative">
                <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
                <div className="pl-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      <FaPhone className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Phone</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Mobile</p>
                      <p className="text-xl font-light text-gray-800 tracking-tight">
                        +91 86987 32336
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Primary contact</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-3">Landline</p>
                      <div className="space-y-2">
                        <p className="text-gray-700">+91 02356 272436</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email & Address Section */}
              <div className="relative">
                <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
                <div className="pl-6 space-y-8">
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <FaEnvelope className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Email</h3>
                    </div>
                    <p className="text-gray-700 font-light break-words leading-relaxed">
                      tushar.bhosle@hotelpagoda.com
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Address</h3>
                    </div>
                    <div className="text-gray-600 leading-relaxed space-y-1">
                      <p>The Pagoda Hotel</p>
                      <p>Taluka Khed, Chiplun Area</p>
                      <p>Lote, Maharashtra 415722</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours & Actions */}
              <div className="relative">
                <div className="pl-6">
                  <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                      <FaClock className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">Hours</h3>
                  </div>

                  <div className="mb-8">
                    <div className="text-center p-5 border border-gray-100 rounded-lg bg-gray-50">
                      <p className="text-2xl font-light text-gray-800 mb-1 tracking-tight">
                        8 AM – 11 PM
                      </p>
                      <p className="text-sm text-gray-500">Every day</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <a
                      href="tel:+918698732336"
                      className="block w-full text-center py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Call Now
                    </a>
                    <a
                      href="mailto:tushar.bhosle@hotelpagoda.com"
                      className="block w-full text-center py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Send Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="text-center mb-4">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
              Feedback & Suggestions
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Your insights are invaluable in helping us enhance your experience. Please share your
              thoughts, feedback, and suggestions through our intuitive online form. We're committed
              to continuous improvement.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-50 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-50 rounded-full blur-xl"></div>

            <div className="p-8 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/5 to-transparent rounded-bl-full"></div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your name"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition ${
                          errors.fullname && touched.fullname
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.fullname && touched.fullname && (
                        <p className="mt-1 text-xs text-red-500">{errors.fullname}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="email@example.com"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition ${
                          errors.email && touched.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.email && touched.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="+91 00000 00000"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition ${
                          errors.phonenumber && touched.phonenumber
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.phonenumber && touched.phonenumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.phonenumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Stay *
                      </label>
                      <input
                        type="date"
                        name="dateofstay"
                        value={formData.dateofstay}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition ${
                          errors.dateofstay && touched.dateofstay
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {errors.dateofstay && touched.dateofstay && (
                        <p className="mt-1 text-xs text-red-500">{errors.dateofstay}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Feedback *
                  </label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Share your feedback or suggestions..."
                    rows="3"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition resize-none ${
                      errors.feedback && touched.feedback
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  ></textarea>
                  <div className="flex justify-between items-center">
                    <div>
                      {errors.feedback && touched.feedback && (
                        <p className="text-xs text-red-500">{errors.feedback}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {characterCount}/500 characters
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name="consent"
                        id="privacy-policy"
                        checked={formData.consent}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-4 h-4 border rounded focus:ring-blue-500 mt-1 ${
                          errors.consent && touched.consent ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <label htmlFor="privacy-policy" className="text-sm text-gray-600">
                          I agree to the{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-800">
                            Privacy Policy
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-800">
                            Terms & Conditions
                          </a>{' '}
                          *
                        </label>
                        {errors.consent && touched.consent && (
                          <p className="mt-1 text-xs text-red-500">{errors.consent}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`px-8 py-3 bg-purple-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl ${
                        loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-700'
                      }`}
                    >
                      {loading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;

// import React from "react";
// import detailsImage from "../assets/IMG_4366-scaled.jpg";
// import {
//   FaFacebookF,
//   FaInstagram,
//   FaTwitter,
//   FaLinkedinIn,
//   FaPhone,
//   FaEnvelope,
//   FaMapMarkerAlt,
//   FaClock,
// } from "react-icons/fa";

// const footerLinks = [
//   {
//     title: "Quick Links",
//     links: [
//       "Home",
//       "Rooms & Suites",
//       "Dining",
//       "Facilities",
//       "Gallery",
//       "Contact",
//     ],
//   },
//   {
//     title: "Services",
//     links: [
//       "Conference Hall",
//       "Wedding Functions",
//       "Swimming Pool",
//       "Spa Services",
//       "Transport",
//     ],
//   },
//   {
//     title: "Information",
//     links: [
//       "About Us",
//       "Careers",
//       "Privacy Policy",
//       "Terms & Conditions",
//       "FAQ",
//     ],
//   },
// ];

// const ContactUs = () => {
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans">
//       {/* Hero Section */}
//       <div className="relative h-[60vh] md:h-[50vh] w-full overflow-hidden">
//         <img
//           src={detailsImage}
//           alt="TAI Hotel Details"
//           className="w-full h-full object-cover object-center"
//         />
//         <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center justify-center">
//           <div className="text-center text-white">
//             <h1 className="text-5xl md:text-7xl font-light mb-4 relative inline-block group">
//               Contact Us
//               <span className="absolute bottom-0 left-0 w-0 h-0.5 mt-4 bg-white transition-all duration-300 group-hover:w-full"></span>
//             </h1>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <main className="container mx-auto px-4 py-12 lg:py-20">
//         {/* Contact Information & Reservations Section */}
//         <div className="max-w-6xl mx-auto mb-20">
//           <div className="text-center mb-12">
//             <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
//               General Inquiries & Reservations
//             </h2>
//             <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
//               The best way to reach us and reserve your stay is calling on the
//               numbers below. Also feel free to email us! Available 8:00 AM to 11
//               PM.
//             </p>
//           </div>

//           {/* Contact Cards Grid */}
//           <div className="max-w-8xl mx-auto">
//             <div className="">
//               {/* Header */}

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Phone Section */}
//                 <div className="relative">
//                   <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
//                   <div className="pl-6">
//                     <div className="flex items-center gap-3 mb-6">
//                       <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
//                         <FaPhone className="w-4 h-4 text-gray-600" />
//                       </div>
//                       <h3 className="text-lg font-medium text-gray-800">
//                         Phone
//                       </h3>
//                     </div>

//                     <div className="space-y-6">
//                       <div>
//                         <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
//                           Mobile
//                         </p>
//                         <p className="text-xl font-light text-gray-800 tracking-tight">
//                           +91 86987 32336
//                         </p>
//                         <p className="text-xs text-gray-400 mt-1">
//                           Primary contact
//                         </p>
//                       </div>

//                       <div>
//                         <p className="text-sm text-gray-500 uppercase tracking-wide mb-3">
//                           Landline
//                         </p>
//                         <div className="space-y-2">
//                           <p className="text-gray-700">+91 02356 272436</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Email & Address Section */}
//                 <div className="relative">
//                   <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
//                   <div className="pl-6 space-y-8">
//                     {/* Email */}
//                     <div>
//                       <div className="flex items-center gap-3 mb-6">
//                         <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
//                           <FaEnvelope className="w-4 h-4 text-gray-600" />
//                         </div>
//                         <h3 className="text-lg font-medium text-gray-800">
//                           Email
//                         </h3>
//                       </div>
//                       <p className="text-gray-700 font-light break-words leading-relaxed">
//                         tushar.bhosle@hotelpagoda.com
//                       </p>
//                     </div>

//                     {/* Address */}
//                     <div>
//                       <div className="flex items-center gap-3 mb-6">
//                         <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
//                           <FaMapMarkerAlt className="w-4 h-4 text-gray-600" />
//                         </div>
//                         <h3 className="text-lg font-medium text-gray-800">
//                           Address
//                         </h3>
//                       </div>
//                       <div className="text-gray-600 leading-relaxed space-y-1">
//                         <p>The Pagoda Hotel</p>
//                         <p>Taluka Khed, Chiplun Area</p>
//                         <p>Lote, Maharashtra 415722</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Hours & Actions */}
//                 <div className="relative">
//                   <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent lg:hidden"></div>
//                   <div className="pl-6">
//                     <div className="absolute -left-3 top-0 w-0.5 h-full bg-gradient-to-b from-gray-200 to-transparent"></div>
//                     <div className="flex items-center gap-3 mb-6">
//                       <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
//                         <FaClock className="w-4 h-4 text-gray-600" />
//                       </div>
//                       <h3 className="text-lg font-medium text-gray-800">
//                         Hours
//                       </h3>
//                     </div>

//                     <div className="mb-8">
//                       <div className="text-center p-5 border border-gray-100 rounded-lg bg-gray-50">
//                         <p className="text-2xl font-light text-gray-800 mb-1 tracking-tight">
//                           8 AM – 11 PM
//                         </p>
//                         <p className="text-sm text-gray-500">Every day</p>
//                       </div>
//                     </div>

//                     {/* Quick Actions */}
//                     <div className="space-y-3">
//                       <a
//                         href="tel:+918698732336"
//                         className="block w-full text-center py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//                       >
//                         Call Now
//                       </a>
//                       <a
//                         href="mailto:tushar.bhosle@hotelpagoda.com"
//                         className="block w-full text-center py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
//                       >
//                         Send Email
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Footer Note */}

//             </div>
//           </div>
//         </div>

//         {/* Feedback Section */}
//         <div className="max-w-6xl mx-auto mt-20">
//           <div className="text-center mb-4">
//             <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
//               Feedback & Suggestions
//             </h2>
//             <p className="text-gray-600 text-lg max-w-3xl mx-auto">
//               Your insights are invaluable in helping us enhance your
//               experience. Please share your thoughts, feedback, and suggestions
//               through our intuitive online form. We're committed to continuous
//               improvement.
//             </p>
//           </div>

//           <div className="relative">
//             <div className="absolute -top-6 -left-6 w-24 h-24 bg-amber-50 rounded-full blur-xl"></div>
//             <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-50 rounded-full blur-xl"></div>

//             <div className=" p-8 md:p-8  relative overflow-hidden ">
//               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/5 to-transparent rounded-bl-full"></div>

//               <form className="space-y-6">
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   {/* Left Column */}
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Full Name *
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter your name"
//                         className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
//                       />
//                     </div>

//                     <div>
//                       <div className="flex justify-between items-center mb-2">
//                         <label className="block text-sm font-medium text-black">
//                           Email Address *
//                         </label>

//                       </div>
//                       <input
//                         type="email"
//                         placeholder="email@example.com"
//                         className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition "
//                       />

//                     </div>
//                   </div>

//                   {/* Right Column */}
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Phone Number *
//                       </label>
//                       <input
//                         type="tel"
//                         placeholder="+91 00000 00000"
//                         className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Date of Stay *
//                       </label>
//                       <input
//                         type="date"
//                         className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Your Feedback
//                   </label>
//                   <textarea
//                     placeholder="Share your feedback or suggestions..."
//                     rows="3"
//                     className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none"
//                   ></textarea>
//                   <div className="text-right text-xs text-gray-400 mt-1">
//                     0/500 characters
//                   </div>
//                 </div>

//                 <div className="pt-2 border-t border-gray-200">
//                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                     <div className="flex items-start space-x-3">
//                       <input
//                         type="checkbox"
//                         id="privacy-policy"
//                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
//                       />
//                       <label
//                         htmlFor="privacy-policy"
//                         className="text-sm text-gray-600"
//                       >
//                         I agree to the{" "}
//                         <a
//                           href="#"
//                           className="text-blue-600 hover:text-blue-800"
//                         >
//                           Privacy Policy
//                         </a>{" "}
//                         and{" "}
//                         <a
//                           href="#"
//                           className="text-blue-600 hover:text-blue-800"
//                         >
//                           Terms & Conditions
//                         </a>
//                       </label>
//                     </div>

//                     <button
//                       type="submit"
//                       className="px-8 py-3  bg-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300  transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
//                     >
//                       Submit Feedback
//                     </button>
//                   </div>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
//             {/* Hotel Info */}
//             <div className="space-y-6">
//               <h3 className="text-2xl font-bold text-white">
//                 Hotel <span className="text-blue-400">Pagoda</span>
//               </h3>
//               <div className="space-y-3">
//                 <div className="flex items-center gap-3 text-gray-300">
//                   <FaMapMarkerAlt className="text-blue-400" />
//                   <span>
//                     Taluka Khed Chiplun Area, Lote, Maharashtra, 415722
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-3 text-gray-300">
//                   <FaPhone className="text-blue-400" />
//                   <span>+91 86987 32336</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-gray-300">
//                   <FaEnvelope className="text-blue-400" />
//                   <span>tushar.bhosle@hotelpagoda.com</span>
//                 </div>
//               </div>
//             </div>

//             {/* Quick Links */}
//             {footerLinks.map((section, index) => (
//               <div key={index}>
//                 <h4 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-gray-800">
//                   {section.title}
//                 </h4>
//                 <ul className="space-y-3">
//                   {section.links.map((link, linkIndex) => (
//                     <li key={linkIndex}>
//                       <a
//                         href="#"
//                         className="text-gray-400 hover:text-blue-400 transition-colors duration-300 flex items-center gap-2"
//                       >
//                         <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
//                         {link}
//                       </a>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>

//           {/* Social Media & Newsletter */}
//           <div className="mt-16 pt-10 border-t border-gray-800">
//             <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
//               {/* Social Media */}
//               <div>
//                 <h5 className="text-lg font-semibold mb-4">Follow Us</h5>
//                 <div className="flex space-x-4">
//                   {[
//                     {
//                       icon: FaFacebookF,
//                       color: "bg-blue-600 hover:bg-blue-700",
//                     },
//                     {
//                       icon: FaInstagram,
//                       color: "bg-pink-600 hover:bg-pink-700",
//                     },
//                     {
//                       icon: FaTwitter,
//                       color: "bg-blue-400 hover:bg-blue-500",
//                     },
//                     {
//                       icon: FaLinkedinIn,
//                       color: "bg-blue-700 hover:bg-blue-800",
//                     },
//                   ].map((social, index) => (
//                     <a
//                       key={index}
//                       href="#"
//                       className={`${social.color} p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-lg`}
//                     >
//                       <social.icon className="w-5 h-5" />
//                     </a>
//                   ))}
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>

//         {/* Copyright */}
//         <div className="bg-black py-6">
//           <div className="max-w-7xl mx-auto px-6 lg:px-8">
//             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//               <p className="text-gray-500 text-sm">
//                 © 2025 Hotel Pagoda. All rights reserved.
//               </p>
//               <div className="flex space-x-6 text-gray-500 text-sm">
//                 <a href="#" className="hover:text-blue-400 transition-colors">
//                   Privacy Policy
//                 </a>
//                 <a href="#" className="hover:text-blue-400 transition-colors">
//                   Terms of Service
//                 </a>
//                 <a href="#" className="hover:text-blue-400 transition-colors">
//                   Cookie Policy
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default ContactUs;
