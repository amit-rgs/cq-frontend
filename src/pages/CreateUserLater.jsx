import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCamera, FaUpload, FaChevronDown, FaChevronUp, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { IoMdArrowRoundBack } from 'react-icons/io';
import Login from './Login';
import LegalDocumentsPermission from './LegalDocumentsPermission';
import LegalDocumentsWebcam from './LegalDocumentsWebcam';
import countries from '../Walk-In/countries';
import Cookies from 'js-cookie';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const InfoTooltip = ({ content, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center ml-2 text-gray-400 hover:text-gray-600 focus:outline-none relative group"
    aria-label="More information"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
      {content}
    </span>
  </button>
);

// Define validation schema
const userSchema = z
  .object({
    firstName: z
      .string()
      .nonempty('First name cannot be empty')
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters and spaces'),
    lastName: z
      .string()
      .nonempty('Last name cannot be empty')
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z]+$/, 'Last name must contain only letters'),
    emailId: z.string().email('Invalid email address').optional().or(z.literal('')),
    countryCode: z.string().regex(/^\+\d{1,3}$/, 'Invalid country code'),
    phoneNumber: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(10, 'Phone number must not exceed 10 digits')
      .regex(/^\d+$/, 'Phone number must contain only numbers')
      .optional()
      .or(z.literal('')),
    clientType: z.enum(['Leisure', 'Corporate']),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one contact method should be provided
      return data.emailId || data.phoneNumber;
    },
    {
      message: 'Either email or phone number is required',
      path: ['emailId'],
    }
  )
  .refine(
    (data) => {
      if (data.clientType === 'Corporate') {
        return data.companyId && data.companyName;
      }
      return true;
    },
    {
      message: 'Company ID and Employee ID are required for corporate clients',
      path: ['companyId'],
    }
  );

const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

const CreateUserLater = () => {
  const navigate = useNavigate();

  // Helper function to get token from cookies
  const getTokenFromCookies = () => {
    return Cookies.get('access_token');
  };

  // Get user data from localStorage (userDetails key)
  const getUserDataFromCache = () => {
    try {
      // First try to get from userDetails
      const userDetailsStr = localStorage.getItem('userDetails');
      if (userDetailsStr) {
        const userDetails = JSON.parse(userDetailsStr);
        console.log('userDetails from localStorage:', userDetails);

        // Check for different possible field name variations
        let firstName =
          userDetails.first_name || userDetails.firstName || userDetails.firstname || '';
        let lastName = userDetails.last_name || userDetails.lastName || userDetails.lastname || '';
        let email = userDetails.email || userDetails.emailId || '';
        let phoneNumber = userDetails.phone_number || userDetails.phoneNumber || '';

        // If firstname and lastname are empty but name exists and looks like a real name
        if ((!firstName || !lastName) && userDetails.name && userDetails.name !== email) {
          const nameParts = userDetails.name.trim().split(' ');
          // Only split if the name doesn't look like a username (contains only letters and spaces)
          if (nameParts.length >= 2 && /^[a-zA-Z\s]+$/.test(userDetails.name)) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1 && /^[a-zA-Z]+$/.test(nameParts[0])) {
            // If it's a single word and only letters, use as first name
            firstName = nameParts[0];
            lastName = '';
          }
          // If the name contains numbers or looks like username (sagardadhich82), leave empty
        }

        console.log('Extracted values:', {
          firstName,
          lastName,
          email,
          phoneNumber,
        });

        const hasEmail = email && email.toString().trim() !== '';
        const hasPhone = phoneNumber && phoneNumber.toString().trim() !== '';

        return {
          firstName: firstName,
          lastName: lastName,
          emailId: email,
          phoneNumber: hasPhone ? phoneNumber.toString() : '',
          countryCode: userDetails.country_code || userDetails.countryCode || '+91',
          hasVerifiedPhone: hasPhone,
          hasVerifiedEmail: hasEmail,
          isFromCache: {
            firstName: !!firstName,
            lastName: !!lastName,
            email: hasEmail,
            phone: hasPhone,
          },
        };
      }

      // Fallback: Try to get from API response stored in userDataCache
      const userDataCache = localStorage.getItem('userDataCache');
      if (userDataCache) {
        const parsedCache = JSON.parse(userDataCache);
        if (parsedCache.data) {
          const data = parsedCache.data;

          let firstname = data.first_name || data.firstName || data.firstname || '';
          let lastname = data.last_name || data.lastName || data.lastname || '';
          const email = data.email || '';
          const phone_number = data.phone_number || data.phoneNumber || '';

          const hasEmail = email && email.toString().trim() !== '';
          const hasPhone = phone_number && phone_number.toString().trim() !== '';

          return {
            firstName: firstname,
            lastName: lastname,
            emailId: email,
            phoneNumber: hasPhone ? phone_number.toString() : '',
            countryCode: data.country_code || data.countryCode || '+91',
            hasVerifiedPhone: hasPhone,
            hasVerifiedEmail: hasEmail,
            isFromCache: {
              firstName: !!firstname,
              lastName: !!lastname,
              email: hasEmail,
              phone: hasPhone,
            },
          };
        }
      }
    } catch (error) {
      console.error('Error reading user data from cache:', error);
    }

    return {
      firstName: '',
      lastName: '',
      emailId: '',
      phoneNumber: '',
      countryCode: '+91',
      hasVerifiedPhone: false,
      hasVerifiedEmail: false,
      isFromCache: {
        firstName: false,
        lastName: false,
        email: false,
        phone: false,
      },
    };
  };

  const cachedUserData = getUserDataFromCache();

  const [formData, setFormData] = useState({
    firstName: cachedUserData.firstName,
    lastName: cachedUserData.lastName,
    emailId: cachedUserData.emailId,
    countryCode: cachedUserData.countryCode,
    phoneNumber: cachedUserData.phoneNumber,
    clientType: 'Leisure',
    companyId: '',
    companyName: '',
  });

  const [verifiedFields, setVerifiedFields] = useState({
    phone: cachedUserData.hasVerifiedPhone,
    email: cachedUserData.hasVerifiedEmail,
  });

  const [cachedFields, setCachedFields] = useState(cachedUserData.isFromCache);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [resendTimer, setResendTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLegalPopup, setShowLegalPopup] = useState(false);
  const [activeDocument, setActiveDocument] = useState('terms');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  // Country dropdown state
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.name === 'India') || countries[0]
  );
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const webcamRef = useRef(null);

  // Fetch user data from API after component mounts
  useEffect(() => {
    const fetchUserDataFromAPI = async () => {
      const token = getTokenFromCookies();
      if (!token) return;

      try {
        const response = await fetch(`${CQ_BASE_URL}/bq/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data from /me API:', userData);

          // Update form with API data
          setFormData((prev) => ({
            ...prev,
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            emailId: userData.email || '',
            phoneNumber: userData.phone_number ? userData.phone_number.toString() : '',
            countryCode: userData.country_code || '+91',
          }));

          // Update verified fields
          setVerifiedFields({
            email: userData.email_verified || false,
            phone: userData.phone_verified || false,
          });

          // Update cached fields to prevent editing of verified fields
          setCachedFields({
            firstName: !!userData.first_name,
            lastName: !!userData.last_name,
            email: userData.email_verified || false,
            phone: userData.phone_verified || false,
          });

          // Store in localStorage for future use
          localStorage.setItem(
            'userDetails',
            JSON.stringify({
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              phone_number: userData.phone_number,
              country_code: userData.country_code,
              email_verified: userData.email_verified,
              phone_verified: userData.phone_verified,
            })
          );
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserDataFromAPI();
  }, []);

  // Check for token in cookies on component mount
  useEffect(() => {
    const token = getTokenFromCookies();
    if (token) {
      setAccessToken(token);
      console.log('Token found in cookies');
    }
  }, []);

  // Timer for OTP resend
  useEffect(() => {
    if (showOtpModal && !canResend) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showOtpModal, canResend]);

  const validateField = (name, value) => {
    try {
      const result = userSchema.safeParse({
        ...formData,
        [name]: value,
      });
      if (!result.success) {
        const fieldError = result.error.errors.find((err) => err.path.includes(name));
        return fieldError ? fieldError.message : null;
      }
      return null;
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
  };

  const captureImage = (setImage, setPreview) => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error('Failed to capture image');
      return;
    }
    setPreview(imageSrc);
    setImage(dataURLToBlob(imageSrc));
  };

  const dataURLToBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const handleImageUpload = (e, setImage, setPreview) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setImage(file);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkClick = (documentType, e) => {
    e.preventDefault();
    setActiveDocument(documentType);
    setShowLegalPopup(true);
  };

  const validateForm = () => {
    try {
      userSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);

        const firstErrorField = document.getElementById(error.errors[0].path[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          firstErrorField.focus();
        }
      }
      return false;
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Don't allow editing of verified phone number
    if (name === 'phoneNumber' && verifiedFields.phone) {
      return;
    }
    // Don't allow editing of cached/verified email
    if (name === 'emailId' && verifiedFields.email) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    if (backendError) {
      setBackendError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBackendError('');

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validateForm()) {
      return;
    }

    if (!profileImage) {
      toast.error('Please capture profile image');
      return;
    }

    if (!consentGiven) {
      toast.error('Please agree to the terms by checking the consent checkbox');
      return;
    }

    // Get token from cookies
    const token = getTokenFromCookies();

    if (!token) {
      toast.error('Authentication token missing. Please sign in again.');
      return;
    }

    await completeRegistration(token);
  };

  const completeRegistration = async (token) => {
    setIsLoading(true);

    try {
      // Create FormData for file uploads
      const formDataForFiles = new FormData();

      // Append profile photo
      formDataForFiles.append('profile_photo', profileImage);

      // Append user details
      formDataForFiles.append('first_name', formData.firstName.trim());
      formDataForFiles.append('last_name', formData.lastName.trim());
      formDataForFiles.append('client_type', formData.clientType.toLowerCase());
      formDataForFiles.append('country', selectedCountry.name);

      // Add email if not already verified
      if (formData.emailId) {
        formDataForFiles.append('email', formData.emailId.trim().toLowerCase());
      }

      // Add phone if not already verified
      if (formData.phoneNumber) {
        formDataForFiles.append('country_code', formData.countryCode);
        formDataForFiles.append('phone_number', formData.phoneNumber);
      }

      // Add corporate fields if client type is Corporate
      if (formData.clientType === 'Corporate') {
        formDataForFiles.append('company_id', formData.companyId?.trim() || '');
        formDataForFiles.append('company_name', formData.companyName?.trim() || '');
      }

      console.log('Sending complete-profile request');
      for (let pair of formDataForFiles.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }

      // Make the API call
      const response = await fetch(`${CQ_BASE_URL}/bq/api/complete-profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataForFiles,
      });

      const data = await response.json();
      console.log('Complete profile response:', data);

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      // If verification is required, show OTP modal
      if (data.verification_required) {
        setOtpType(data.verification_type);
        setOtpIdentifier(data.verification_sent_to);
        setShowOtpModal(true);
        setResendTimer(300);
        setCanResend(false);
        toast.info(`Verification code sent to your ${data.verification_type}`);
      } else {
        // No verification required, registration complete
        toast.success(data.message || 'Registration successful!');

        // Clear cached user data
        localStorage.removeItem('userDataCache');
        localStorage.removeItem('userDetails');

        // Go back to previous page
        setTimeout(() => {
          window.history.back();
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message);
      setBackendError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      otpSchema.parse(otp);
      setOtpError('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setOtpError(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const token = getTokenFromCookies();

      const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: otpIdentifier,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      toast.success(data.message || 'Verification successful!');

      setShowOtpModal(false);
      setOtp('');
      setOtpError('');

      // Update verified fields
      if (otpType === 'email') {
        setVerifiedFields((prev) => ({ ...prev, email: true }));
      } else {
        setVerifiedFields((prev) => ({ ...prev, phone: true }));
      }

      // Clear cached user data
      localStorage.removeItem('userDataCache');
      localStorage.removeItem('userDetails');

      // Go back to previous page
      setTimeout(() => {
        window.history.back();
      }, 2000);
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const token = getTokenFromCookies();

      const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: otpIdentifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setOtp('');
      toast.success(data.message || 'New OTP sent successfully');
      setResendTimer(300);
      setCanResend(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterLater = () => {
    setProfileImage(null);
    setProfilePreview(null);
    navigate('/reservation/options');
    toast.info('You can complete your profile later from your account settings');
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    navigate('/reservation/options');
  };

  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    setOtp('');
    setOtpError('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 flex flex-col">
      <div className="self-start mb-">
        <button
          onClick={() => window.history.back()}
          className="fixed top-5 md:top-24 left-8 text-black hover:text-gray-700 transition font-semibold text-2xl z-50"
          aria-label="Go back"
        >
          <IoMdArrowRoundBack size={32} />
        </button>
      </div>

      <LegalDocumentsWebcam isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

      <div className="flex-1 overflow-auto">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
          <div className="p-4 sm:p-6 lg:p-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-1 mt-4">
              Complete Your Profile
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              Setup your profile and photo for future verification with us
            </p>

            {/* Full Registration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Verification Section - Profile Photo Only */}
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2">
                  Identity Details
                </h2>

                {/* Profile Photo Section */}
                <div className="mt-1 sm:mt-1">
                  {/* Info Banner */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-blue-800 font-medium">
                          Please capture your photo using the webcam or upload an image
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          For best results, ensure good lighting and a front-facing pose
                        </p>
                        <div className="mt-1 pt-1 border-t border-gray-200">
                          <p className="text-[11px] text-gray-500">
                            I agree to the{' '}
                            <button
                              type="button"
                              onClick={() => setIsLegalOpen(true)}
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              Terms & Conditions
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </button>{' '}
                            for identification and verification purposes.
                          </p>
                        </div>
                      </div>

                      <InfoTooltip
                        content="Image must be clear, front-facing, with good lighting. No sunglasses or hats."
                        onClick={() => setIsLegalOpen(true)}
                      />
                    </div>
                  </div>

                  {profilePreview ? (
                    <div className="relative">
                      <img
                        src={profilePreview}
                        alt="Preview"
                        className="rounded-lg w-full h-64 sm:h-80 object-cover border-2 border-gray-300 shadow-sm"
                      />
                      <button
                        onClick={() => {
                          setProfilePreview(null);
                          setProfileImage(null);
                        }}
                        className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition duration-200"
                      >
                        <FaCamera className="text-gray-700" />
                      </button>
                      <div className="mt-4 flex justify-center space-x-4">
                        <button
                          onClick={() => {
                            setProfilePreview(null);
                            setProfileImage(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 font-medium"
                        >
                          <FaCamera /> Retake Photo
                        </button>
                        <input
                          type="file"
                          id="profile-upload"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setProfileImage, setProfilePreview)}
                          className="hidden"
                        />
                        <label
                          htmlFor="profile-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 cursor-pointer font-medium"
                        >
                          <FaUpload /> Upload Different
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="rounded-lg w-full h-64 sm:h-80 object-cover border-2 border-gray-300 shadow-sm"
                        videoConstraints={{
                          facingMode: 'user',
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                        }}
                        forceScreenshotSourceSize={true}
                        key="profile-webcam"
                      />

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => captureImage(setProfileImage, setProfilePreview)}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition duration-200 font-medium shadow-sm"
                        >
                          <FaCamera /> Capture Photo
                        </button>
                        <input
                          type="file"
                          id="profile-upload"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setProfileImage, setProfilePreview)}
                          className="hidden"
                        />
                        <label
                          htmlFor="profile-upload"
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 cursor-pointer font-medium border border-gray-300"
                        >
                          <FaUpload /> Upload Photo
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Details Form */}
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2 mb-12">
                  Profile Details
                </h2>
                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name*
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={cachedFields.firstName}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                            cachedFields.firstName ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          }`}
                        />
                        {cachedFields.firstName && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheckCircle className="text-green-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name*
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          disabled={cachedFields.lastName}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                            cachedFields.lastName ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          }`}
                        />
                        {cachedFields.lastName && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheckCircle className="text-green-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email field */}
                    <div>
                      <label
                        htmlFor="emailId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address{' '}
                        {verifiedFields.email && (
                          <span className="text-green-600 text-xs">(Verified)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="emailId"
                          name="emailId"
                          value={formData.emailId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={verifiedFields.email}
                          placeholder="Enter your email address"
                          className={`w-full px-3 py-2 border ${
                            errors.emailId ? 'border-red-500' : 'border-gray-300'
                          } rounded-md ${
                            verifiedFields.email ? 'bg-gray-50 text-gray-600' : 'bg-white'
                          }`}
                        />
                        {(cachedFields.email || verifiedFields.email) && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheckCircle className="text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="h-3">
                        {errors.emailId && touched.emailId && (
                          <p className="text-xs text-red-600">{errors.emailId}</p>
                        )}
                      </div>
                    </div>

                    {/* Phone field */}
                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Mobile Number{' '}
                        {verifiedFields.phone && (
                          <span className="text-green-600 text-xs">(Verified)</span>
                        )}
                      </label>
                      <div className="relative">
                        <div className="flex w-full">
                          <div className="flex-shrink-0">
                            <select
                              id="countryCode"
                              name="countryCode"
                              value={formData.countryCode}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              disabled={verifiedFields.phone}
                              className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-white"
                            >
                              <option value="+91">+91</option>
                              <option value="+1">+1</option>
                              <option value="+44">+44</option>
                              <option value="+61">+61</option>
                            </select>
                          </div>
                          <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              handleChange({
                                target: {
                                  name: 'phoneNumber',
                                  value: value,
                                },
                              });
                            }}
                            onBlur={handleBlur}
                            disabled={verifiedFields.phone}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`flex-1 min-w-0 px-3 py-2 border ${
                              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                            } rounded-r-md ${
                              verifiedFields.phone ? 'bg-gray-50 text-gray-600' : 'bg-white'
                            }`}
                          />
                        </div>
                        {(cachedFields.phone || verifiedFields.phone) && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheckCircle className="text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="h-3">
                        {errors.phoneNumber && touched.phoneNumber && (
                          <p className="text-xs text-red-600">{errors.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Type*
                      </label>
                      <div className="flex gap-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="clientType"
                            value="Leisure"
                            checked={formData.clientType === 'Leisure'}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-gray-700">Leisure</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="clientType"
                            value="Corporate"
                            checked={formData.clientType === 'Corporate'}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="h-4 w-4 text-blue-600 border-gray-300"
                          />
                          <span className="ml-2 text-gray-700">Corporate</span>
                        </label>
                      </div>
                    </div>
                    <div className="mb-1 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCountryOpen(!isCountryOpen)}
                          className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          <span className="flex items-center gap-2">
                            <img
                              src={selectedCountry.flag}
                              alt={selectedCountry.name}
                              className="w-5 h-4 object-cover rounded-sm"
                            />
                            {selectedCountry.name}
                          </span>
                          {isCountryOpen ? (
                            <FaChevronUp className="ml-2 text-black" />
                          ) : (
                            <FaChevronDown className="ml-2 text-black" />
                          )}
                        </button>

                        {isCountryOpen && (
                          <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                            {countries.map((country) => (
                              <div
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setIsCountryOpen(false);
                                }}
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                              >
                                <img
                                  src={country.flag}
                                  alt={country.name}
                                  className="w-5 h-4 object-cover rounded-sm"
                                />
                                {country.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.clientType === 'Corporate' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="companyId"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Corporate ID*
                        </label>
                        <input
                          type="text"
                          id="companyId"
                          name="companyId"
                          placeholder="Enter your company id"
                          value={formData.companyId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full px-3 py-2 border ${
                            errors.companyId ? 'border-red-500' : 'border-gray-300'
                          } rounded-md`}
                        />
                        <div className="h-3">
                          {errors.companyId && touched.companyId && (
                            <p className="text-xs text-red-600">{errors.companyId}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="companyName"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Corporate Name*
                        </label>
                        <input
                          type="text"
                          id="companyName"
                          name="companyName"
                          placeholder="Enter your company name"
                          value={formData.companyName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`w-full px-3 py-2 border ${
                            errors.companyName ? 'border-red-500' : 'border-gray-300'
                          } rounded-md`}
                        />
                        <div className="h-3">
                          {errors.companyName && touched.companyName && (
                            <p className="text-xs text-red-600">{errors.companyName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start mt-4">
                    <div className="flex items-center h-5">
                      <input
                        id="consent"
                        name="consent"
                        type="checkbox"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="consent" className="font-medium text-gray-700">
                        I agree to the{' '}
                        <a
                          href="#"
                          onClick={(e) => handleLinkClick('terms', e)}
                          className="text-blue-600 hover:underline"
                        >
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                          href="#"
                          onClick={(e) => handleLinkClick('privacy', e)}
                          className="text-blue-600 hover:underline"
                        >
                          Privacy Policy
                        </a>
                      </label>
                      <p className="text-gray-500 text-xs mt-1">
                        By creating an account, you agree to our terms and conditions
                      </p>
                    </div>
                  </div>

                  {/* Legal Documents Popup */}
                  <LegalDocumentsPermission
                    isOpen={showLegalPopup}
                    onClose={() => setShowLegalPopup(false)}
                    activeTab={activeDocument}
                  />

                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-md shadow-md transition-colors duration-300 disabled:opacity-50 text-base sm:text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>

                    {/* <button
                      type="button"
                      onClick={handleRegisterLater}
                      className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-md transition-colors duration-300 text-base sm:text-lg"
                    >
                      Register Later
                    </button> */}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
            <button
              onClick={handleCloseOtpModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none mb-3"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="p-6 sm:p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-200 mb-4">
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Verify Your {otpType === 'email' ? 'Email' : 'Phone Number'}
                </h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  We've sent a 6-digit verification code to{' '}
                  <span className="font-semibold text-black">{otpIdentifier}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter verification code
                </label>
                <div className="flex justify-center space-x-2 sm:space-x-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value === e.target.value) {
                          const newOtp = otp.split('');
                          newOtp[index] = value;
                          setOtp(newOtp.join(''));

                          if (value && index < 5) {
                            document.getElementById(`otp-input-${index + 1}`)?.focus();
                          }

                          if (otpError) setOtpError('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          document.getElementById(`otp-input-${index - 1}`)?.focus();
                        }
                      }}
                      id={`otp-input-${index}`}
                      className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-center border ${
                        otpError ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  ))}
                </div>
                {otpError && <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>}
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify and Complete'
                  )}
                </button>
              </div>
              <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
                Didn't receive code?{' '}
                {canResend ? (
                  <button
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-500">Resend OTP in {resendTimer} seconds</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && <Login closeModal={closeLoginModal} />}

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default CreateUserLater;

// import React, { useState, useRef, useEffect } from "react";
// import Webcam from "react-webcam";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import {
//   FaCamera,
//   FaUpload,
//   FaChevronDown,
//   FaChevronUp,
//   FaCheckCircle,
// } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { z } from "zod";
// import { Link } from "react-router-dom";
// import { IoMdArrowRoundBack } from "react-icons/io";
// import Login from "./Login";
// import LegalDocumentsPermission from "./LegalDocumentsPermission";
// import LegalDocumentsWebcam from "./LegalDocumentsWebcam";
// import countries from "../Walk-In/countries";
// import Cookies from 'js-cookie';

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const InfoTooltip = ({ content, onClick }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className="inline-flex items-center ml-2 text-gray-400 hover:text-gray-600 focus:outline-none relative group"
//     aria-label="More information"
//   >
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       viewBox="0 0 20 20"
//       fill="currentColor"
//     >
//       <path
//         fillRule="evenodd"
//         d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//         clipRule="evenodd"
//       />
//     </svg>
//     <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
//       {content}
//     </span>
//   </button>
// );

// // Define validation schema
// const userSchema = z.object({
//   firstName: z
//     .string()
//     .nonempty("First name cannot be empty")
//     .min(2, "First name must be at least 2 characters")
//     .max(50, "First name must be less than 50 characters")
//     .regex(
//       /^[a-zA-Z\s]+$/,
//       "First name must contain only letters and spaces"
//     ),
//   lastName: z
//     .string()
//     .nonempty("Last name cannot be empty")
//     .min(2, "Last name must be at least 2 characters")
//     .max(50, "Last name must be less than 50 characters")
//     .regex(/^[a-zA-Z]+$/, "Last name must contain only letters"),
//   emailId: z
//     .string()
//     .email("Invalid email address")
//     .optional()
//     .or(z.literal('')),
//   countryCode: z.string().regex(/^\+\d{1,3}$/, "Invalid country code"),
//   phoneNumber: z
//     .string()
//     .min(10, "Phone number must be at least 10 digits")
//     .max(10, "Phone number must not exceed 10 digits")
//     .regex(/^\d+$/, "Phone number must contain only numbers")
//     .optional()
//     .or(z.literal('')),
//   clientType: z.enum(["Leisure", "Corporate"]),
//   companyId: z.string().optional(),
//   companyName: z.string().optional(),
// }).refine(
//   (data) => {
//     // At least one contact method should be provided
//     return data.emailId || data.phoneNumber;
//   },
//   {
//     message: "Either email or phone number is required",
//     path: ["emailId"],
//   }
// ).refine(
//   (data) => {
//     if (data.clientType === "Corporate") {
//       return data.companyId && data.companyName;
//     }
//     return true;
//   },
//   {
//     message: "Company ID and Employee ID are required for corporate clients",
//     path: ["companyId"],
//   }
// );

// const otpSchema = z
//   .string()
//   .length(6, "OTP must be 6 digits")
//   .regex(/^\d+$/, "OTP must contain only numbers");

// const CreateUserLater = () => {
//   const navigate = useNavigate();

//   // Helper function to get token from cookies
//   const getTokenFromCookies = () => {
//     return Cookies.get('access_token');
//   };

//   // Get user data from localStorage (userDetails key)
//   const getUserDataFromCache = () => {
//     try {
//       // First try to get from userDetails (as you specified)
//       const userDetailsStr = localStorage.getItem('userDetails');
//       if (userDetailsStr) {
//         const userDetails = JSON.parse(userDetailsStr);
//         console.log("userDetails from localStorage:", userDetails);

//         // Check if we have valid data
//         const hasEmail = userDetails.email && userDetails.email.trim() !== '';
//         const hasPhone = userDetails.phoneNumber && userDetails.phoneNumber.toString().trim() !== '';

//         // Extract first name and last name
//         let firstName = userDetails.first_name || "";
//         let lastName = userDetails.last_name || "";

//         // If no first_name/last_name but name exists, split it
//         if ((!firstName || !lastName) && userDetails.name) {
//           const nameParts = userDetails.name.trim().split(' ');
//           firstName = nameParts[0] || "";
//           lastName = nameParts.slice(1).join(' ') || "";
//         }

//         return {
//           firstName: firstName,
//           lastName: lastName,
//           emailId: userDetails.email || "",
//           phoneNumber: hasPhone ? userDetails.phoneNumber.toString() : "",
//           countryCode: "+91", // Default country code
//           hasVerifiedPhone: hasPhone,
//           hasVerifiedEmail: hasEmail,
//           // Track which fields came from cache
//           isFromCache: {
//             firstName: !!firstName,
//             lastName: !!lastName,
//             email: hasEmail,
//             phone: hasPhone
//           }
//         };
//       }

//       // Fallback to previous userDataCache if userDetails doesn't exist
//       const userDataCache = localStorage.getItem('userDataCache');
//       if (userDataCache) {
//         const parsedCache = JSON.parse(userDataCache);
//         if (parsedCache.data) {
//           const { firstname, lastname, email, phone_number, country_code } = parsedCache.data;

//           const hasEmail = email && email.trim() !== '';
//           const hasPhone = phone_number && phone_number.toString().trim() !== '';

//           return {
//             firstName: firstname || "",
//             lastName: lastname || "",
//             emailId: email || "",
//             phoneNumber: hasPhone ? phone_number.toString() : "",
//             countryCode: country_code || "+91",
//             hasVerifiedPhone: hasPhone,
//             hasVerifiedEmail: false,
//             isFromCache: {
//               firstName: !!firstname,
//               lastName: !!lastname,
//               email: hasEmail,
//               phone: hasPhone
//             }
//           };
//         }
//       }
//     } catch (error) {
//       console.error("Error reading user data from cache:", error);
//     }
//     return {
//       firstName: "",
//       lastName: "",
//       emailId: "",
//       phoneNumber: "",
//       countryCode: "+91",
//       hasVerifiedPhone: false,
//       hasVerifiedEmail: false,
//       isFromCache: {
//         firstName: false,
//         lastName: false,
//         email: false,
//         phone: false
//       }
//     };
//   };

//   const cachedUserData = getUserDataFromCache();

//   const [formData, setFormData] = useState({
//     firstName: cachedUserData.firstName,
//     lastName: cachedUserData.lastName,
//     emailId: cachedUserData.emailId,
//     countryCode: cachedUserData.countryCode,
//     phoneNumber: cachedUserData.phoneNumber,
//     clientType: "Leisure",
//     companyId: "",
//     companyName: "",
//   });

//   const [verifiedFields, setVerifiedFields] = useState({
//     phone: cachedUserData.hasVerifiedPhone,
//     email: cachedUserData.hasVerifiedEmail
//   });

//   const [cachedFields, setCachedFields] = useState(cachedUserData.isFromCache);

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});
//   const [profileImage, setProfileImage] = useState(null);
//   const [profilePreview, setProfilePreview] = useState(null);
//   const [aadharImage, setAadharImage] = useState(null);
//   const [aadharPreview, setAadharPreview] = useState(null);
//   const [activeTab, setActiveTab] = useState("profile");
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [otpIdentifier, setOtpIdentifier] = useState("");
//   const [otpType, setOtpType] = useState("email");
//   const [resendTimer, setResendTimer] = useState(300);
//   const [canResend, setCanResend] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [backendError, setBackendError] = useState("");
//   const [consentGiven, setConsentGiven] = useState(false);
//   const [showLoginModal, setShowLoginModal] = useState(false);
//   const [showLegalPopup, setShowLegalPopup] = useState(false);
//   const [activeDocument, setActiveDocument] = useState("terms");
//   const [isLegalOpen, setIsLegalOpen] = useState(false);
//   const [accessToken, setAccessToken] = useState(null);

//   // Country dropdown state
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find((country) => country.name === "India") || countries[0]
//   );
//   const [isCountryOpen, setIsCountryOpen] = useState(false);

//   const webcamRef = useRef(null);

//   // Check for token in cookies on component mount
//   useEffect(() => {
//     const token = getTokenFromCookies();
//     if (token) {
//       setAccessToken(token);
//       console.log("Token found in cookies");
//     }
//   }, []);

//   // Timer for OTP resend
//   useEffect(() => {
//     if (showOtpModal && !canResend) {
//       const timer = setInterval(() => {
//         setResendTimer((prev) => {
//           if (prev <= 1) {
//             clearInterval(timer);
//             setCanResend(true);
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);

//       return () => clearInterval(timer);
//     }
//   }, [showOtpModal, canResend]);

//   const validateField = (name, value) => {
//     try {
//       const result = userSchema.safeParse({
//         ...formData,
//         [name]: value,
//       });
//       if (!result.success) {
//         const fieldError = result.error.errors.find((err) =>
//           err.path.includes(name)
//         );
//         return fieldError ? fieldError.message : null;
//       }
//       return null;
//     } catch (error) {
//       console.error("Validation error:", error);
//       return null;
//     }
//   };

//   const captureImage = (setImage, setPreview) => {
//     const imageSrc = webcamRef.current?.getScreenshot();
//     if (!imageSrc) {
//       toast.error("Failed to capture image");
//       return;
//     }
//     setPreview(imageSrc);
//     setImage(dataURLToBlob(imageSrc));
//   };

//   const dataURLToBlob = (dataURL) => {
//     const byteString = atob(dataURL.split(",")[1]);
//     const mimeString = "image/jpeg";
//     const ab = new ArrayBuffer(byteString.length);
//     const ia = new Uint8Array(ab);
//     for (let i = 0; i < byteString.length; i++) {
//       ia[i] = byteString.charCodeAt(i);
//     }
//     return new Blob([ab], { type: mimeString });
//   };

//   const handleImageUpload = (e, setImage, setPreview) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (!file.type.match("image.*")) {
//       toast.error("Please upload an image file");
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image size should be less than 5MB");
//       return;
//     }

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setPreview(reader.result);
//       setImage(file);
//     };
//     reader.readAsDataURL(file);
//   };

//   const handleLinkClick = (documentType, e) => {
//     e.preventDefault();
//     setActiveDocument(documentType);
//     setShowLegalPopup(true);
//   };

//   const validateForm = () => {
//     try {
//       userSchema.parse(formData);
//       setErrors({});
//       return true;
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         const newErrors = {};
//         error.errors.forEach((err) => {
//           newErrors[err.path[0]] = err.message;
//         });
//         setErrors(newErrors);

//         const firstErrorField = document.getElementById(
//           error.errors[0].path[0]
//         );
//         if (firstErrorField) {
//           firstErrorField.scrollIntoView({
//             behavior: "smooth",
//             block: "center",
//           });
//           firstErrorField.focus();
//         }
//       }
//       return false;
//     }
//   };

//   const handleBlur = (e) => {
//     const { name } = e.target;
//     setTouched((prev) => ({ ...prev, [name]: true }));
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     // Don't allow editing of verified phone number
//     if (name === 'phoneNumber' && verifiedFields.phone) {
//       return;
//     }
//     // Don't allow editing of cached/verified email
//     if (name === 'emailId' && verifiedFields.email) {
//       return;
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     if (touched[name]) {
//       const error = validateField(name, value);
//       setErrors((prev) => ({
//         ...prev,
//         [name]: error,
//       }));
//     }

//     if (backendError) {
//       setBackendError("");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setBackendError("");

//     // Mark all fields as touched
//     const allTouched = Object.keys(formData).reduce((acc, key) => {
//       acc[key] = true;
//       return acc;
//     }, {});
//     setTouched(allTouched);

//     if (!validateForm()) {
//       return;
//     }

//     if (!profileImage) {
//       toast.error("Please capture profile image");
//       return;
//     }

//     if (!aadharImage) {
//       toast.error("Please capture or upload Aadhar card image");
//       return;
//     }

//     if (!consentGiven) {
//       toast.error("Please agree to the terms by checking the consent checkbox");
//       return;
//     }

//     // Get token from cookies
//     const token = getTokenFromCookies();

//     if (!token) {
//       toast.error("Authentication token missing. Please sign in again.");
//       return;
//     }

//     await completeRegistration(token);
//   };

//   const completeRegistration = async (token) => {
//     setIsLoading(true);

//     try {
//       // Create FormData for file uploads - matching the CreateUser component
//       const formDataForFiles = new FormData();

//       // Use the same field names as in CreateUser
//       formDataForFiles.append("profile_photo", profileImage);
//       formDataForFiles.append("aadhar_image", aadharImage);

//       // Append user details with the same field names
//       formDataForFiles.append("first_name", formData.firstName.trim());
//       formDataForFiles.append("last_name", formData.lastName.trim());
//       formDataForFiles.append("client_type", formData.clientType.toLowerCase());
//       formDataForFiles.append("country", selectedCountry.name);

//       // Add email if not already verified
//       if (formData.emailId) {
//         formDataForFiles.append("email", formData.emailId.trim().toLowerCase());
//       }

//       // Add phone if not already verified
//       if (formData.phoneNumber) {
//         formDataForFiles.append("country_code", formData.countryCode);
//         formDataForFiles.append("phone_number", formData.phoneNumber);
//       }

//       // Add corporate fields if client type is Corporate
//       if (formData.clientType === "Corporate") {
//         formDataForFiles.append("company_id", formData.companyId?.trim() || "");
//         formDataForFiles.append("company_name", formData.companyName?.trim() || "");
//       }

//       console.log("Sending complete-profile request");
//       for (let pair of formDataForFiles.entries()) {
//         console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
//       }

//       // Make the API call
//       const response = await fetch(
//         `${CQ_BASE_URL}/bq/api/complete-profile`,
//         {
//           method: "POST",
//           headers: {
//             'Authorization': `Bearer ${token}`
//           },
//           body: formDataForFiles,
//         }
//       );

//       const data = await response.json();
//       console.log("Complete profile response:", data);

//       if (!response.ok) {
//         let errorMessage = "Registration failed";
//         if (data.detail) {
//           errorMessage = data.detail;
//         } else if (data.message) {
//           errorMessage = data.message;
//         }
//         throw new Error(errorMessage);
//       }

//       // If verification is required, show OTP modal
//       if (data.verification_required) {
//         setOtpType(data.verification_type);
//         setOtpIdentifier(data.verification_sent_to);
//         setShowOtpModal(true);
//         setResendTimer(300);
//         setCanResend(false);
//         toast.info(`Verification code sent to your ${data.verification_type}`);
//       } else {
//         // No verification required, registration complete
//         toast.success(data.message || "Registration successful!");

//         // Clear cached user data
//         localStorage.removeItem('userDataCache');
//         localStorage.removeItem('userDetails');

//         // Go back to previous page
//         setTimeout(() => {
//           window.history.back();
//         }, 2000);
//       }

//     } catch (error) {
//       console.error("Registration error:", error);
//       toast.error(error.message);
//       setBackendError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyOtp = async () => {
//     try {
//       otpSchema.parse(otp);
//       setOtpError("");
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         setOtpError(error.errors[0].message);
//       }
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const token = getTokenFromCookies();

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           identifier: otpIdentifier,
//           otp: otp,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Verification failed");
//       }

//       toast.success(data.message || "Verification successful!");

//       setShowOtpModal(false);
//       setOtp("");
//       setOtpError("");

//       // Update verified fields
//       if (otpType === 'email') {
//         setVerifiedFields(prev => ({ ...prev, email: true }));
//       } else {
//         setVerifiedFields(prev => ({ ...prev, phone: true }));
//       }

//       // Clear cached user data
//       localStorage.removeItem('userDataCache');
//       localStorage.removeItem('userDetails');

//       // Go back to previous page
//       setTimeout(() => {
//         window.history.back();
//       }, 2000);

//     } catch (error) {
//       console.error("OTP verification error:", error);
//       toast.error(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     try {
//       setIsLoading(true);
//       const token = getTokenFromCookies();

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           identifier: otpIdentifier,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to resend OTP");
//       }

//       setOtp("");
//       toast.success(data.message || "New OTP sent successfully");
//       setResendTimer(300);
//       setCanResend(false);
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRegisterLater = () => {
//     setProfileImage(null);
//     setProfilePreview(null);
//     setAadharImage(null);
//     setAadharPreview(null);
//     navigate("/reservation/options");
//     toast.info("You can complete your profile later from your account settings");
//   };

//   const closeLoginModal = () => {
//     setShowLoginModal(false);
//     navigate("/reservation/options");
//   };

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//   };

//   const tabContentStyle = {
//     transition: "opacity 300ms ease, transform 300ms ease",
//     opacity: 1,
//     transform: "translateY(0)",
//   };

//   const handleCloseOtpModal = () => {
//     setShowOtpModal(false);
//     setOtp("");
//     setOtpError("");
//   };

//   return (
//     <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 flex flex-col">
//       <div className="self-start mb-">
//         <button
//           onClick={() => window.history.back()}
//           className="fixed top-5 md:top-24 left-8 text-black hover:text-gray-700 transition font-semibold text-2xl z-50"
//           aria-label="Go back"
//         >
//           <IoMdArrowRoundBack size={32} />
//         </button>
//       </div>

//       <LegalDocumentsWebcam
//         isOpen={isLegalOpen}
//         onClose={() => setIsLegalOpen(false)}
//       />

//       <div className="flex-1 overflow-auto">
//         <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
//           <div className="p-4 sm:p-6 lg:p-4">
//             <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-1 mt-4">
//               Complete Your Profile
//             </h1>
//             <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
//               Setup your profile and photo for future verification with us
//             </p>

//             {/* Full Registration Form */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
//               {/* Verification Section */}
//               <div className="space-y-6">
//                 <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2">
//                   Identity Details
//                 </h2>

//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => handleTabChange("profile")}
//                     className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
//                       activeTab === "profile"
//                         ? "bg-black text-white shadow-md"
//                         : "bg-gray-200 text-gray-700 hover:bg-gray-200"
//                     }`}
//                   >
//                     Profile Photo
//                   </button>
//                   <button
//                     onClick={() => handleTabChange("aadhar")}
//                     className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
//                       activeTab === "aadhar"
//                         ? "bg-black text-white shadow-md"
//                         : "bg-gray-200 text-gray-700 hover:bg-gray-200"
//                     }`}
//                   >
//                     Aadhar Card
//                   </button>
//                 </div>

//                 {/* Profile Tab Content */}
//                 <div
//                   style={{
//                     ...tabContentStyle,
//                     display: activeTab === "profile" ? "block" : "none",
//                   }}
//                 >
//                   <div className="mt-6 sm:mt-8">
//                     <div className="flex flex-col gap-2 mb-1">
//                       <div className="flex items-center">
//                         <label className="block text-sm sm:text-md font-medium text-gray-700">
//                           Please capture your photo using the webcam or upload
//                           an image
//                         </label>
//                         <InfoTooltip
//                           content="View upload guidelines"
//                           onClick={() => setIsLegalOpen(true)}
//                         />
//                       </div>
//                       <p className="text-[12px] mt-2 text-gray-500">
//                         By capturing or uploading your photo, you agree to our{" "}
//                         <button
//                           type="button"
//                           onClick={() => setIsLegalOpen(true)}
//                           className="text-blue-600 hover:underline font-medium"
//                         >
//                           Terms & Conditions
//                         </button>{" "}
//                         for identification.
//                       </p>
//                     </div>

//                     {profilePreview ? (
//                       <div className="relative">
//                         <img
//                           src={profilePreview}
//                           alt="Preview"
//                           className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                         />
//                         <button
//                           onClick={() => {
//                             setProfilePreview(null);
//                             setProfileImage(null);
//                           }}
//                           className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
//                         >
//                           <FaCamera className="text-gray-700" />
//                         </button>
//                         <div className="mt-4 flex justify-center space-x-4">
//                           <button
//                             onClick={() => {
//                               setProfilePreview(null);
//                               setProfileImage(null);
//                             }}
//                             className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//                           >
//                             <FaCamera /> Retake Profile Photo
//                           </button>
//                           <input
//                             type="file"
//                             id="profile-upload"
//                             accept="image/*"
//                             onChange={(e) =>
//                               handleImageUpload(
//                                 e,
//                                 setProfileImage,
//                                 setProfilePreview
//                               )
//                             }
//                             className="hidden"
//                           />
//                           <label
//                             htmlFor="profile-upload"
//                             className="flex items-center gap-2 px-4 py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
//                           >
//                             <FaUpload /> Upload Different Image
//                           </label>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         <Webcam
//                           audio={false}
//                           ref={activeTab === "profile" ? webcamRef : null}
//                           screenshotFormat="image/jpeg"
//                           className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                           videoConstraints={{
//                             facingMode: "user",
//                           }}
//                           key="profile-webcam"
//                         />

//                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                           <button
//                             onClick={() =>
//                               captureImage(setProfileImage, setProfilePreview)
//                             }
//                             className="flex items-center justify-center gap-2 px-4 py-2 sm:px-8 sm:py-2 bg-black text-white rounded-lg hover:text-gray-300 text-sm sm:text-lg"
//                           >
//                             <FaCamera /> Capture Photo
//                           </button>
//                           <input
//                             type="file"
//                             id="profile-upload"
//                             accept="image/*"
//                             onChange={(e) =>
//                               handleImageUpload(
//                                 e,
//                                 setProfileImage,
//                                 setProfilePreview
//                               )
//                             }
//                             className="hidden"
//                           />
//                           <label
//                             htmlFor="profile-upload"
//                             className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm sm:text-lg"
//                           >
//                             <FaUpload /> Upload Profile Photo
//                           </label>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Aadhar Tab Content */}
//                 <div
//                   style={{
//                     ...tabContentStyle,
//                     display: activeTab === "aadhar" ? "block" : "none",
//                   }}
//                 >
//                   <div className="rounded-lg mt-6 sm:mt-8">
//                     <div className="flex items-center mb-2">
//                       <label className="block text-sm sm:text-md font-medium text-gray-700">
//                         {aadharPreview
//                           ? "Aadhar card captured"
//                           : "Please capture or upload a clear photo of your Aadhar card"}
//                       </label>
//                       <InfoTooltip
//                         content="View upload guidelines"
//                         onClick={() => setIsLegalOpen(true)}
//                       />
//                     </div>
//                     {aadharPreview ? (
//                       <div className="relative">
//                         <img
//                           src={aadharPreview}
//                           alt="Aadhar Preview"
//                           className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                         />
//                         <button
//                           onClick={() => {
//                             setAadharPreview(null);
//                             setAadharImage(null);
//                           }}
//                           className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
//                         >
//                           <FaCamera className="text-gray-700" />
//                         </button>
//                         <div className="mt-4 flex justify-center">
//                           <button
//                             onClick={() => {
//                               setAadharPreview(null);
//                               setAadharImage(null);
//                             }}
//                             className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//                           >
//                             <FaCamera /> Retake Aadhar Card
//                           </button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         <Webcam
//                           audio={false}
//                           ref={activeTab === "aadhar" ? webcamRef : null}
//                           screenshotFormat="image/jpeg"
//                           className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                           videoConstraints={{
//                             facingMode: "user",
//                           }}
//                           key="aadhar-webcam"
//                         />
//                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                           <button
//                             onClick={() =>
//                               captureImage(setAadharImage, setAadharPreview)
//                             }
//                             className="flex items-center justify-center gap-2 px-4 py-2 sm:px-8 sm:py-2 bg-black text-white rounded-lg hover:text-gray-300 text-sm sm:text-lg"
//                           >
//                             <FaCamera /> Capture Aadhar Card
//                           </button>
//                           <input
//                             type="file"
//                             id="aadhar-upload"
//                             accept="image/*"
//                             onChange={(e) =>
//                               handleImageUpload(
//                                 e,
//                                 setAadharImage,
//                                 setAadharPreview
//                               )
//                             }
//                             className="hidden"
//                           />
//                           <label
//                             htmlFor="aadhar-upload"
//                             className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm sm:text-lg"
//                           >
//                             <FaUpload /> Upload Aadhar Card
//                           </label>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* User Details Form */}
//               <div>
//                 <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2 mb-12">
//                   Profile Details
//                 </h2>
//                 <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label
//                         htmlFor="firstName"
//                         className="block text-sm font-medium text-gray-700 mb-1"
//                       >
//                         First Name*
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="text"
//                           id="firstName"
//                           name="firstName"
//                           value={formData.firstName}
//                           disabled={cachedFields.firstName}
//                           className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
//                             cachedFields.firstName ? 'bg-gray-50 text-gray-600' : 'bg-white'
//                           }`}
//                         />
//                         {cachedFields.firstName && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheckCircle className="text-green-500" />
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                     <div>
//                       <label
//                         htmlFor="lastName"
//                         className="block text-sm font-medium text-gray-700 mb-1"
//                       >
//                         Last Name*
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="text"
//                           id="lastName"
//                           name="lastName"
//                           value={formData.lastName}
//                           disabled={cachedFields.lastName}
//                           className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
//                             cachedFields.lastName ? 'bg-gray-50 text-gray-600' : 'bg-white'
//                           }`}
//                         />
//                         {cachedFields.lastName && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheckCircle className="text-green-500" />
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {/* Email field */}
//                     <div>
//                       <label
//                         htmlFor="emailId"
//                         className="block text-sm font-medium text-gray-700 mb-1"
//                       >
//                         Email Address {verifiedFields.email && <span className="text-green-600 text-xs">(Verified)</span>}
//                       </label>
//                       <div className="relative">
//                         <input
//                           type="email"
//                           id="emailId"
//                           name="emailId"
//                           value={formData.emailId}
//                           onChange={handleChange}
//                           onBlur={handleBlur}
//                           disabled={verifiedFields.email}
//                           placeholder="Enter your email address"
//                           className={`w-full px-3 py-2 border ${
//                             errors.emailId ? "border-red-500" : "border-gray-300"
//                           } rounded-md ${
//                             verifiedFields.email ? 'bg-gray-50 text-gray-600' : 'bg-white'
//                           }`}
//                         />
//                         {(cachedFields.email || verifiedFields.email) && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheckCircle className="text-green-500" />
//                           </div>
//                         )}
//                       </div>
//                       <div className="h-3">
//                         {errors.emailId && touched.emailId && (
//                           <p className="text-xs text-red-600">{errors.emailId}</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Phone field */}
//                     <div>
//                       <label
//                         htmlFor="phoneNumber"
//                         className="block text-sm font-medium text-gray-700 mb-1"
//                       >
//                         Mobile Number {verifiedFields.phone && <span className="text-green-600 text-xs">(Verified)</span>}
//                       </label>
//                       <div className="relative">
//                         <div className="flex w-full">
//                           <div className="flex-shrink-0">
//                             <select
//                               id="countryCode"
//                               name="countryCode"
//                               value={formData.countryCode}
//                               onChange={handleChange}
//                               onBlur={handleBlur}
//                               disabled={verifiedFields.phone}
//                               className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-white"
//                             >
//                               <option value="+91">+91</option>
//                               <option value="+1">+1</option>
//                               <option value="+44">+44</option>
//                               <option value="+61">+61</option>
//                             </select>
//                           </div>
//                           <input
//                             id="phoneNumber"
//                             name="phoneNumber"
//                             type="tel"
//                             placeholder="Enter your phone number"
//                             value={formData.phoneNumber}
//                             onChange={(e) => {
//                               const value = e.target.value.replace(/\D/g, "");
//                               handleChange({
//                                 target: {
//                                   name: "phoneNumber",
//                                   value: value,
//                                 },
//                               });
//                             }}
//                             onBlur={handleBlur}
//                             disabled={verifiedFields.phone}
//                             inputMode="numeric"
//                             pattern="[0-9]*"
//                             className={`flex-1 min-w-0 px-3 py-2 border ${
//                               errors.phoneNumber ? "border-red-500" : "border-gray-300"
//                             } rounded-r-md ${
//                               verifiedFields.phone ? 'bg-gray-50 text-gray-600' : 'bg-white'
//                             }`}
//                           />
//                         </div>
//                         {(cachedFields.phone || verifiedFields.phone) && (
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheckCircle className="text-green-500" />
//                           </div>
//                         )}
//                       </div>
//                       <div className="h-3">
//                         {errors.phoneNumber && touched.phoneNumber && (
//                           <p className="text-xs text-red-600">{errors.phoneNumber}</p>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Profile Type*
//                       </label>
//                       <div className="flex gap-4">
//                         <label className="inline-flex items-center">
//                           <input
//                             type="radio"
//                             name="clientType"
//                             value="Leisure"
//                             checked={formData.clientType === "Leisure"}
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             className="h-4 w-4 text-blue-600"
//                           />
//                           <span className="ml-2 text-gray-700">Leisure</span>
//                         </label>
//                         <label className="inline-flex items-center">
//                           <input
//                             type="radio"
//                             name="clientType"
//                             value="Corporate"
//                             checked={formData.clientType === "Corporate"}
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             className="h-4 w-4 text-blue-600 border-gray-300"
//                           />
//                           <span className="ml-2 text-gray-700">Corporate</span>
//                         </label>
//                       </div>
//                     </div>
//                     <div className="mb-1 relative">
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Country
//                       </label>
//                       <div className="relative">
//                         <button
//                           type="button"
//                           onClick={() => setIsCountryOpen(!isCountryOpen)}
//                           className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
//                         >
//                           <span className="flex items-center gap-2">
//                             <img
//                               src={selectedCountry.flag}
//                               alt={selectedCountry.name}
//                               className="w-5 h-4 object-cover rounded-sm"
//                             />
//                             {selectedCountry.name}
//                           </span>
//                           {isCountryOpen ? (
//                             <FaChevronUp className="ml-2 text-black" />
//                           ) : (
//                             <FaChevronDown className="ml-2 text-black" />
//                           )}
//                         </button>

//                         {isCountryOpen && (
//                           <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                             {countries.map((country) => (
//                               <div
//                                 key={country.code}
//                                 onClick={() => {
//                                   setSelectedCountry(country);
//                                   setIsCountryOpen(false);
//                                 }}
//                                 className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                               >
//                                 <img
//                                   src={country.flag}
//                                   alt={country.name}
//                                   className="w-5 h-4 object-cover rounded-sm"
//                                 />
//                                 {country.name}
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   {formData.clientType === "Corporate" && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label
//                           htmlFor="companyId"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           Corporate ID*
//                         </label>
//                         <input
//                           type="text"
//                           id="companyId"
//                           name="companyId"
//                           placeholder="Enter your company id"
//                           value={formData.companyId}
//                           onChange={handleChange}
//                           onBlur={handleBlur}
//                           className={`w-full px-3 py-2 border ${
//                             errors.companyId ? "border-red-500" : "border-gray-300"
//                           } rounded-md`}
//                         />
//                         <div className="h-3">
//                           {errors.companyId && touched.companyId && (
//                             <p className="text-xs text-red-600">{errors.companyId}</p>
//                           )}
//                         </div>
//                       </div>
//                       <div>
//                         <label
//                           htmlFor="companyName"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           Corporate Name*
//                         </label>
//                         <input
//                           type="text"
//                           id="companyName"
//                           name="companyName"
//                           placeholder="Enter your company name"
//                           value={formData.companyName}
//                           onChange={handleChange}
//                           onBlur={handleBlur}
//                           className={`w-full px-3 py-2 border ${
//                             errors.companyName ? "border-red-500" : "border-gray-300"
//                           } rounded-md`}
//                         />
//                         <div className="h-3">
//                           {errors.companyName && touched.companyName && (
//                             <p className="text-xs text-red-600">{errors.companyName}</p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="flex items-start mt-4">
//                     <div className="flex items-center h-5">
//                       <input
//                         id="consent"
//                         name="consent"
//                         type="checkbox"
//                         checked={consentGiven}
//                         onChange={(e) => setConsentGiven(e.target.checked)}
//                         className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                       />
//                     </div>
//                     <div className="ml-3 text-sm">
//                       <label htmlFor="consent" className="font-medium text-gray-700">
//                         I agree to the{" "}
//                         <a
//                           href="#"
//                           onClick={(e) => handleLinkClick("terms", e)}
//                           className="text-blue-600 hover:underline"
//                         >
//                           Terms of Service
//                         </a>{" "}
//                         and{" "}
//                         <a
//                           href="#"
//                           onClick={(e) => handleLinkClick("privacy", e)}
//                           className="text-blue-600 hover:underline"
//                         >
//                           Privacy Policy
//                         </a>
//                       </label>
//                       <p className="text-gray-500 text-xs mt-1">
//                         By creating an account, you agree to our terms and conditions
//                       </p>
//                     </div>
//                   </div>

//                   {/* Legal Documents Popup */}
//                   <LegalDocumentsPermission
//                     isOpen={showLegalPopup}
//                     onClose={() => setShowLegalPopup(false)}
//                     activeTab={activeDocument}
//                   />

//                   <div className="flex gap-4 mt-6">
//                     <button
//                       type="submit"
//                       className="flex-1 py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-md shadow-md transition-colors duration-300 disabled:opacity-50 text-base sm:text-lg"
//                       disabled={isLoading}
//                     >
//                       {isLoading ? (
//                         <span className="flex items-center justify-center">
//                           <svg
//                             className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                             xmlns="http://www.w3.org/2000/svg"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                           >
//                             <circle
//                               className="opacity-25"
//                               cx="12"
//                               cy="12"
//                               r="10"
//                               stroke="currentColor"
//                               strokeWidth="4"
//                             ></circle>
//                             <path
//                               className="opacity-75"
//                               fill="currentColor"
//                               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                             ></path>
//                           </svg>
//                           Processing...
//                         </span>
//                       ) : (
//                         "Complete Registration"
//                       )}
//                     </button>

//                     {/* <button
//                       type="button"
//                       onClick={handleRegisterLater}
//                       className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-md transition-colors duration-300 text-base sm:text-lg"
//                     >
//                       Register Later
//                     </button> */}
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* OTP Verification Modal */}
//       {showOtpModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
//             <button
//               onClick={handleCloseOtpModal}
//               className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none mb-3"
//               aria-label="Close"
//             >
//               <svg
//                 className="h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               </svg>
//             </button>

//             <div className="p-6 sm:p-8">
//               <div className="text-center">
//                 <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-200 mb-4">
//                   <svg
//                     className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                     />
//                   </svg>
//                 </div>
//                 <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
//                   Verify Your {otpType === 'email' ? 'Email' : 'Phone Number'}
//                 </h2>
//                 <p className="text-gray-600 mb-6 text-sm sm:text-base">
//                   We've sent a 6-digit verification code to{" "}
//                   <span className="font-semibold text-black">
//                     {otpIdentifier}
//                   </span>
//                 </p>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
//                   Enter verification code
//                 </label>
//                 <div className="flex justify-center space-x-2 sm:space-x-3">
//                   {[0, 1, 2, 3, 4, 5].map((index) => (
//                     <input
//                       key={index}
//                       type="text"
//                       maxLength="1"
//                       value={otp[index] || ""}
//                       onChange={(e) => {
//                         const value = e.target.value.replace(/\D/g, "");
//                         if (value === e.target.value) {
//                           const newOtp = otp.split("");
//                           newOtp[index] = value;
//                           setOtp(newOtp.join(""));

//                           if (value && index < 5) {
//                             document
//                               .getElementById(`otp-input-${index + 1}`)
//                               ?.focus();
//                           }

//                           if (otpError) setOtpError("");
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (e.key === "Backspace" && !otp[index] && index > 0) {
//                           document
//                             .getElementById(`otp-input-${index - 1}`)
//                             ?.focus();
//                         }
//                       }}
//                       id={`otp-input-${index}`}
//                       className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-center border ${
//                         otpError ? "border-red-500" : "border-gray-300"
//                       } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
//                       inputMode="numeric"
//                       pattern="[0-9]*"
//                     />
//                   ))}
//                 </div>
//                 {otpError && (
//                   <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>
//                 )}
//               </div>

//               <div className="flex flex-col space-y-3">
//                 <button
//                   onClick={handleVerifyOtp}
//                   className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
//                   disabled={isLoading || otp.length !== 6}
//                 >
//                   {isLoading ? (
//                     <span className="flex items-center justify-center">
//                       <svg
//                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                         xmlns="http://www.w3.org/2000/svg"
//                         fill="none"
//                         viewBox="0 0 24 24"
//                       >
//                         <circle
//                           className="opacity-25"
//                           cx="12"
//                           cy="12"
//                           r="10"
//                           stroke="currentColor"
//                           strokeWidth="4"
//                         ></circle>
//                         <path
//                           className="opacity-75"
//                           fill="currentColor"
//                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                         ></path>
//                       </svg>
//                       Verifying...
//                     </span>
//                   ) : (
//                     "Verify and Complete"
//                   )}
//                 </button>
//               </div>
//               <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
//                 Didn't receive code?{" "}
//                 {canResend ? (
//                   <button
//                     className="font-medium text-blue-600 hover:text-blue-500"
//                     onClick={handleResendOtp}
//                     disabled={isLoading}
//                   >
//                     Resend OTP
//                   </button>
//                 ) : (
//                   <span className="text-gray-500">
//                     Resend OTP in {resendTimer} seconds
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {showLoginModal && <Login closeModal={closeLoginModal} />}

//       <ToastContainer
//         position="top-center"
//         autoClose={5000}
//         hideProgressBar={false}
//         newestOnTop={false}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />
//     </div>
//   );
// };

// export default CreateUserLater;
