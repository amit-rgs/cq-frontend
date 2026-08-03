import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaCamera,
  FaUpload,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { FaCheck } from 'react-icons/fa';
import LegalDocumentsPermission from './LegalDocumentsPermission';
import LegalDocumentsWebcam from './LegalDocumentsPermission';
import countries from './countries';
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

// Define validation schemas
const initialSignupSchema = z.object({
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
  identifier: z.string().nonempty('Email or phone number is required'),
  countryCode: z
    .string()
    .regex(/^\+\d{1,3}$/, 'Invalid country code')
    .optional(),
});

const fullUserSchema = z
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
    emailId: z.string().optional(),
    countryCode: z
      .string()
      .regex(/^\+\d{1,3}$/, 'Invalid country code')
      .optional(),
    phoneNumber: z.string().optional(),
    clientType: z.enum(['Leisure', 'Corporate']),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
  })
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

const CreateUser = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailId: '',
    countryCode: '+91',
    phoneNumber: '',
    clientType: 'Leisure',
    companyId: '',
    companyName: '',
  });

  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [resendTimer, setResendTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [showLegalPopup, setShowLegalPopup] = useState(false);
  const [activeDocument, setActiveDocument] = useState('terms');
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  // Secondary verification states
  const [showSecondaryOtpModal, setShowSecondaryOtpModal] = useState(false);
  const [secondaryOtp, setSecondaryOtp] = useState('');
  const [secondaryOtpError, setSecondaryOtpError] = useState('');
  const [verificationIdentifier, setVerificationIdentifier] = useState('');
  const [verificationType, setVerificationType] = useState('email');
  const [secondaryResendTimer, setSecondaryResendTimer] = useState(300);
  const [canResendSecondary, setCanResendSecondary] = useState(false);

  // Country dropdown state
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.name === 'India') || countries[0]
  );
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Helper function to detect identifier type
  const detectIdentifierType = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    if (emailRegex.test(value)) {
      return 'email';
    } else if (phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return 'phone';
    }
    return null;
  };

  // Function to redirect with page refresh
  const redirectToCheckInOptions = () => {
    window.location.href = '/check-in/options';
  };

  // Validate field based on current step
  const validateField = (name, value, currentStep) => {
    try {
      if (currentStep === 1) {
        if (name === 'identifier') {
          const detectedType = detectIdentifierType(value);

          if (!detectedType) {
            return 'Please enter a valid email or phone number';
          }

          if (detectedType === 'phone') {
            const cleanPhone = value.replace(/[\s-]/g, '');
            if (cleanPhone.length < 10) {
              return 'Phone number must be at least 10 digits';
            }
            if (cleanPhone.length > 15) {
              return 'Phone number must not exceed 15 digits';
            }
            if (!/^\d+$/.test(cleanPhone)) {
              return 'Phone number must contain only numbers';
            }
          }

          return null;
        }

        const result = initialSignupSchema.safeParse({
          firstName: formData.firstName,
          lastName: formData.lastName,
          identifier: identifier,
        });
        if (!result.success) {
          const fieldError = result.error.errors.find((err) => err.path.includes(name));
          return fieldError ? fieldError.message : null;
        }
      } else {
        const result = fullUserSchema.safeParse({
          ...formData,
          [name]: value,
        });
        if (!result.success) {
          const fieldError = result.error.errors.find((err) => err.path.includes(name));
          return fieldError ? fieldError.message : null;
        }
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

  const validateInitialForm = () => {
    try {
      const detectedType = detectIdentifierType(identifier);

      if (!detectedType) {
        setErrors({ identifier: 'Please enter a valid email or phone number' });
        return false;
      }

      if (detectedType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(identifier)) {
          setErrors({ identifier: 'Please enter a valid email address' });
          return false;
        }
      }

      if (detectedType === 'phone') {
        const cleanPhone = identifier.replace(/[\s-]/g, '');
        if (cleanPhone.length < 10) {
          setErrors({ identifier: 'Phone number must be at least 10 digits' });
          return false;
        }
        if (cleanPhone.length > 15) {
          setErrors({ identifier: 'Phone number must not exceed 15 digits' });
          return false;
        }
        if (!/^\d+$/.test(cleanPhone)) {
          setErrors({ identifier: 'Phone number must contain only numbers' });
          return false;
        }
      }

      setIdentifierType(detectedType);

      const validationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        identifier: identifier,
      };

      initialSignupSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);

        const firstErrorField = document.getElementById(
          error.errors[0].path[0] === 'identifier' ? 'identifier' : error.errors[0].path[0]
        );
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

  const validateFullForm = () => {
    try {
      fullUserSchema.parse(formData);
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value, step);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    if (backendError) {
      setBackendError('');
    }
  };

  const handleIdentifierChange = (e) => {
    const value = e.target.value;
    setIdentifier(value);

    const detectedType = detectIdentifierType(value);
    setIdentifierType(detectedType);

    if (detectedType === 'email') {
      setFormData((prev) => ({
        ...prev,
        emailId: value,
        phoneNumber: '',
        countryCode: '+91',
      }));

      setErrors((prev) => ({
        ...prev,
        identifier: null,
      }));
    } else if (detectedType === 'phone') {
      const cleanPhone = value.replace(/[\s-]/g, '');
      setFormData((prev) => ({
        ...prev,
        phoneNumber: cleanPhone,
        emailId: '',
      }));

      if (touched.identifier) {
        if (cleanPhone.length < 10) {
          setErrors((prev) => ({
            ...prev,
            identifier: 'Phone number must be at least 10 digits',
          }));
        } else if (cleanPhone.length > 15) {
          setErrors((prev) => ({
            ...prev,
            identifier: 'Phone number must not exceed 15 digits',
          }));
        } else if (!/^\d+$/.test(cleanPhone)) {
          setErrors((prev) => ({
            ...prev,
            identifier: 'Phone number must contain only numbers',
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            identifier: null,
          }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        emailId: '',
        phoneNumber: '',
        countryCode: '+91',
      }));

      if (touched.identifier) {
        setErrors((prev) => ({
          ...prev,
          identifier: 'Please enter a valid email or phone number',
        }));
      }
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setBackendError('');

    const initialTouched = {
      firstName: true,
      lastName: true,
      identifier: true,
    };
    setTouched(initialTouched);

    if (!validateInitialForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      };

      if (identifierType === 'email') {
        payload.email = identifier.trim().toLowerCase();
      } else {
        payload.phone_number = identifier.replace(/[\s-]/g, '');
        payload.country_code = formData.countryCode;
      }

      console.log('Sending payload:', payload);

      const response = await fetch(`${CQ_BASE_URL}/bq/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Signup failed';
        throw new Error(errorMessage);
      }

      toast.success(data.message || 'OTP sent successfully');
      setShowOtpModal(true);
      setResendTimer(data.expires_in || 300);
    } catch (error) {
      console.error('Signup error:', error);
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
      const identifierValue =
        identifierType === 'email' ? formData.emailId : identifier.replace(/[\s-]/g, '');

      const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifierValue,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Verification failed';
        throw new Error(errorMessage);
      }

      toast.success(data.message || 'Verification successful');

      if (data.user) {
        setTempUserId(data.user.sub);
      }

      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('access_token', data.access_token);
        Cookies.set('access_token', data.access_token, { expires: 7, path: '/' });
      }

      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        Cookies.set('refresh_token', data.refresh_token, { expires: 7, path: '/' });
      }

      setShowOtpModal(false);
      setStep(2);
      setOtp('');
      setOtpError('');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);

      const identifierValue =
        identifierType === 'email' ? formData.emailId : identifier.replace(/[\s-]/g, '');

      const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifierValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to resend OTP';
        throw new Error(errorMessage);
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

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setBackendError('');

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!validateFullForm()) {
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

    const token =
      accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

    if (!token) {
      toast.error('Authentication token missing. Please sign up again.');
      return;
    }

    setIsLoading(true);

    try {
      const form = new FormData();

      form.append('profile_photo', profileImage);
      form.append('first_name', formData.firstName.trim());
      form.append('last_name', formData.lastName.trim());
      form.append('client_type', formData.clientType);
      form.append('country', selectedCountry.name);

      if (formData.emailId && identifierType !== 'email') {
        form.append('email', formData.emailId.trim().toLowerCase());
      }

      if (formData.phoneNumber && identifierType !== 'phone') {
        form.append('country_code', formData.countryCode);
        form.append('phone_number', formData.phoneNumber);
      }

      if (formData.clientType === 'Corporate') {
        form.append('company_id', formData.companyId?.trim() || '');
        form.append('company_name', formData.companyName?.trim() || '');
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/complete-profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        if (data.detail) {
          errorMessage =
            typeof data.detail === 'string'
              ? data.detail
              : data.detail.map((err) => err.msg).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      if (data.verification_required) {
        setVerificationType(data.verification_type);
        setVerificationIdentifier(data.verification_sent_to);
        setShowSecondaryOtpModal(true);
        setSecondaryResendTimer(300);
        setCanResendSecondary(false);
        toast.info(`Verification code sent to your ${data.verification_type}`);
      } else {
        toast.success(data.message || 'Registration successful!');
        setTimeout(() => {
          redirectToCheckInOptions();
        }, 1500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message);
      setBackendError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecondaryOtp = async () => {
    try {
      otpSchema.parse(secondaryOtp);
      setSecondaryOtpError('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setSecondaryOtpError(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const token =
        accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

      const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: verificationIdentifier,
          otp: secondaryOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Verification failed';
        throw new Error(errorMessage);
      }

      toast.success(data.message || 'Verification successful!');

      setShowSecondaryOtpModal(false);
      setSecondaryOtp('');
      setSecondaryOtpError('');

      setTimeout(() => {
        redirectToCheckInOptions();
      }, 1500);
    } catch (error) {
      console.error('Secondary verification error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSecondaryOtp = async () => {
    try {
      setIsLoading(true);
      const token =
        accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

      const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: verificationIdentifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail || data.message || 'Failed to resend OTP';
        throw new Error(errorMessage);
      }

      setSecondaryOtp('');
      toast.success(data.message || 'New OTP sent successfully');
      setSecondaryResendTimer(300);
      setCanResendSecondary(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterLater = () => {
    setProfileImage(null);
    setProfilePreview(null);

    toast.info('You can complete your profile later from your account settings');
    setTimeout(() => {
      redirectToCheckInOptions();
    }, 500);
  };

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

  useEffect(() => {
    if (showSecondaryOtpModal && !canResendSecondary) {
      const timer = setInterval(() => {
        setSecondaryResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResendSecondary(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSecondaryOtpModal, canResendSecondary]);

  const handleCloseOtpModalAndReset = () => {
    setShowOtpModal(false);
    setOtp('');
    setOtpError('');
    setResendTimer(300);
    setCanResend(false);
  };

  const handleCloseSecondaryOtpModal = () => {
    setShowSecondaryOtpModal(false);
    setSecondaryOtp('');
    setSecondaryOtpError('');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 flex flex-col">
      <div className="self-start mb-">
        <Link
          to="/"
          className="fixed top-5 md:top-24 left-8 text-black hover:text-gray-700 transition font-semibold text-2xl z-50"
        >
          <IoMdArrowRoundBack size={32} />
        </Link>
      </div>

      <LegalDocumentsWebcam isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

      <div className="flex-1 overflow-auto">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
          <div className="p-4 sm:p-6 lg:p-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-1 mt-4">
              {step === 1 ? 'Sign Up' : 'Complete Your Profile'}
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
              {step === 1
                ? 'Enter your details to get started'
                : 'Setup your profile and photo for future verification with us'}
            </p>

            {/* Step 1 - Initial Signup Form */}
            {step === 1 && (
              <div className="max-w-md mx-auto">
                <form className="space-y-5" onSubmit={handleInitialSubmit}>
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      placeholder="Enter your first name"
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        handleChange({
                          target: {
                            name: 'firstName',
                            value: value,
                          },
                        });
                      }}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      } rounded-md`}
                    />
                    <div className="h-3">
                      {errors.firstName && touched.firstName && (
                        <p className="text-xs text-red-600">{errors.firstName}</p>
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
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        handleChange({
                          target: {
                            name: 'lastName',
                            value: value,
                          },
                        });
                      }}
                      onBlur={handleBlur}
                      className={`w-full px-3 py-2 border ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      } rounded-md`}
                    />
                    <div className="h-3">
                      {errors.lastName && touched.lastName && (
                        <p className="text-xs text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="identifier"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email or Phone Number*
                    </label>
                    <div className="flex w-full">
                      {identifierType === 'phone' && (
                        <div className="flex-shrink-0">
                          <select
                            id="countryCode"
                            name="countryCode"
                            value={formData.countryCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-white"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+61">+61</option>
                          </select>
                        </div>
                      )}
                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        placeholder="Enter your email or phone number"
                        value={identifier}
                        onChange={handleIdentifierChange}
                        onBlur={handleBlur}
                        className={`flex-1 min-w-0 px-3 py-2 border ${
                          errors.identifier ? 'border-red-500' : 'border-gray-300'
                        } ${identifierType === 'phone' ? 'rounded-r-md' : 'rounded-md'}`}
                      />
                    </div>
                    <div className="h-3">
                      {errors.identifier && touched.identifier && (
                        <p className="text-xs text-red-600">{errors.identifier}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-md shadow-md transition-colors duration-300 disabled:opacity-50 text-base sm:text-lg mt-6"
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
                        Sending OTP...
                      </span>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2 - Full Registration Form */}
            {step === 2 && (
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
                            onChange={(e) =>
                              handleImageUpload(e, setProfileImage, setProfilePreview)
                            }
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
                            onChange={(e) =>
                              handleImageUpload(e, setProfileImage, setProfilePreview)
                            }
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
                  <form className="space-y-4 sm:space-y-5" onSubmit={handleCompleteRegistration}>
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
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheck className="text-green-500" />
                          </div>
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
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaCheck className="text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email field - disabled if already verified, required if not */}
                      <div>
                        <label
                          htmlFor="emailId"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Address{identifierType !== 'email' ? '*' : ''}
                        </label>
                        {identifierType === 'email' ? (
                          <div className="relative">
                            <input
                              type="email"
                              id="emailId"
                              name="emailId"
                              value={formData.emailId}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FaCheck className="text-green-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <FaCheck className="text-xs" /> Verified
                            </p>
                          </div>
                        ) : (
                          <>
                            <input
                              type="email"
                              id="emailId"
                              name="emailId"
                              placeholder="Enter your email"
                              value={formData.emailId}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              className={`w-full px-3 py-2 border ${
                                errors.emailId ? 'border-red-500' : 'border-gray-300'
                              } rounded-md`}
                            />
                            <div className="h-3">
                              {errors.emailId && touched.emailId && (
                                <p className="text-xs text-red-600">{errors.emailId}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Phone field - disabled if already verified, required if not */}
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Mobile Number{identifierType !== 'phone' ? '*' : ''}
                        </label>
                        {identifierType === 'phone' ? (
                          <div className="relative">
                            <div className="flex w-full">
                              <div className="flex-shrink-0">
                                <select
                                  id="countryCode"
                                  name="countryCode"
                                  value={formData.countryCode}
                                  disabled
                                  className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600"
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
                                value={formData.phoneNumber}
                                disabled
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-600"
                              />
                            </div>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <FaCheck className="text-green-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <FaCheck className="text-xs" /> Verified
                            </p>
                          </div>
                        ) : (
                          <div className="flex w-full">
                            <div className="flex-shrink-0">
                              <select
                                id="countryCode"
                                name="countryCode"
                                value={formData.countryCode}
                                onChange={handleChange}
                                onBlur={handleBlur}
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
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`flex-1 min-w-0 px-3 py-2 border ${
                                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                              } rounded-r-md`}
                            />
                          </div>
                        )}
                        {identifierType !== 'phone' && (
                          <div className="h-3">
                            {errors.phoneNumber && touched.phoneNumber && (
                              <p className="text-xs text-red-600">{errors.phoneNumber}</p>
                            )}
                          </div>
                        )}
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
                          {errors.companyId && touched.companyId && (
                            <p className="text-sm text-red-600">{errors.companyId}</p>
                          )}
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
                          {errors.companyName && touched.companyName && (
                            <p className="text-sm text-red-600">{errors.companyName}</p>
                          )}
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
                        <p className="text-gray-500">
                          By creating an account, you agree to our terms and conditions
                        </p>
                      </div>
                    </div>

                    <LegalDocumentsPermission
                      isOpen={showLegalPopup}
                      onClose={() => setShowLegalPopup(false)}
                      activeTab={activeDocument}
                    />

                    <div className="flex gap-4">
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

                      <button
                        type="button"
                        onClick={handleRegisterLater}
                        className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-md transition-colors duration-300 text-base sm:text-lg"
                      >
                        Register Later
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
            <button
              onClick={handleCloseOtpModalAndReset}
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
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-200 mb-4">
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Verify Your {identifierType === 'email' ? 'Email' : 'Phone Number'}
                </h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  We've sent a 6-digit verification code to{' '}
                  <span className="font-semibold text-black">
                    {identifierType === 'email'
                      ? formData.emailId
                      : `${formData.countryCode} ${formData.phoneNumber}`}
                  </span>
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
                    'Verify and Continue'
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

      {/* Secondary OTP Verification Modal */}
      {showSecondaryOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
            <button
              onClick={handleCloseSecondaryOtpModal}
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
                  Verify Your {verificationType === 'email' ? 'Email' : 'Phone Number'}
                </h2>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  We've sent a 6-digit verification code to{' '}
                  <span className="font-semibold text-black">{verificationIdentifier}</span>
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
                      value={secondaryOtp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value === e.target.value) {
                          const newOtp = secondaryOtp.split('');
                          newOtp[index] = value;
                          setSecondaryOtp(newOtp.join(''));

                          if (value && index < 5) {
                            document.getElementById(`secondary-otp-input-${index + 1}`)?.focus();
                          }

                          if (secondaryOtpError) setSecondaryOtpError('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !secondaryOtp[index] && index > 0) {
                          document.getElementById(`secondary-otp-input-${index - 1}`)?.focus();
                        }
                      }}
                      id={`secondary-otp-input-${index}`}
                      className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-center border ${
                        secondaryOtpError ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  ))}
                </div>
                {secondaryOtpError && (
                  <p className="mt-2 text-sm text-red-600 text-center">{secondaryOtpError}</p>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleVerifySecondaryOtp}
                  className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
                  disabled={isLoading || secondaryOtp.length !== 6}
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
                {canResendSecondary ? (
                  <button
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={handleResendSecondaryOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-500">
                    Resend OTP in {secondaryResendTimer} seconds
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

export default CreateUser;

// import React, { useState, useRef, useEffect } from "react";
// import Webcam from "react-webcam";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import {
//   FaEye,
//   FaEyeSlash,
//   FaArrowLeft,
//   FaCamera,
//   FaUpload,
//   FaChevronDown,
//   FaChevronUp,
// } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { z } from "zod";
// import { Link } from "react-router-dom";
// import { IoMdArrowRoundBack } from "react-icons/io";
// import { FaCheck } from "react-icons/fa";
// import LegalDocumentsPermission from "./LegalDocumentsPermission";
// import LegalDocumentsWebcam from "./LegalDocumentsPermission";
// import countries from "./countries";
// import Cookies from "js-cookie";

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

// // Define validation schemas
// const initialSignupSchema = z.object({
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
//   identifier: z.string().nonempty("Email or phone number is required"),
//   countryCode: z.string().regex(/^\+\d{1,3}$/, "Invalid country code").optional(),
// });

// const fullUserSchema = z
//   .object({
//     firstName: z
//       .string()
//       .nonempty("First name cannot be empty")
//       .min(2, "First name must be at least 2 characters")
//       .max(50, "First name must be less than 50 characters")
//       .regex(
//         /^[a-zA-Z\s]+$/,
//         "First name must contain only letters and spaces"
//       ),
//     lastName: z
//       .string()
//       .nonempty("Last name cannot be empty")
//       .min(2, "Last name must be at least 2 characters")
//       .max(50, "Last name must be less than 50 characters")
//       .regex(/^[a-zA-Z]+$/, "Last name must contain only letters"),
//     emailId: z.string().optional(),
//     countryCode: z.string().regex(/^\+\d{1,3}$/, "Invalid country code").optional(),
//     phoneNumber: z.string().optional(),
//     clientType: z.enum(["Leisure", "Corporate"]),
//     companyId: z.string().optional(),
//     companyName: z.string().optional(),
//   })
//   .refine(
//     (data) => {
//       if (data.clientType === "Corporate") {
//         return data.companyId && data.companyName;
//       }
//       return true;
//     },
//     {
//       message: "Company ID and Employee ID are required for corporate clients",
//       path: ["companyId"],
//     }
//   );

// const otpSchema = z
//   .string()
//   .length(6, "OTP must be 6 digits")
//   .regex(/^\d+$/, "OTP must contain only numbers");

// const CreateUser = () => {
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     emailId: "",
//     countryCode: "+91",
//     phoneNumber: "",
//     clientType: "Leisure",
//     companyId: "",
//     companyName: "",
//   });

//   const [identifier, setIdentifier] = useState("");
//   const [identifierType, setIdentifierType] = useState(null);
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
//   const [isLoading, setIsLoading] = useState(false);
//   const [backendError, setBackendError] = useState("");
//   const [consentGiven, setConsentGiven] = useState(false);
//   const [resendTimer, setResendTimer] = useState(300);
//   const [canResend, setCanResend] = useState(false);
//   const [showLegalPopup, setShowLegalPopup] = useState(false);
//   const [activeDocument, setActiveDocument] = useState("terms");
//   const [isLegalOpen, setIsLegalOpen] = useState(false);
//   const [tempUserId, setTempUserId] = useState(null);
//   const [accessToken, setAccessToken] = useState(null);
//   const [refreshToken, setRefreshToken] = useState(null);

//   // Secondary verification states
//   const [showSecondaryOtpModal, setShowSecondaryOtpModal] = useState(false);
//   const [secondaryOtp, setSecondaryOtp] = useState("");
//   const [secondaryOtpError, setSecondaryOtpError] = useState("");
//   const [verificationIdentifier, setVerificationIdentifier] = useState("");
//   const [verificationType, setVerificationType] = useState("email");
//   const [secondaryResendTimer, setSecondaryResendTimer] = useState(300);
//   const [canResendSecondary, setCanResendSecondary] = useState(false);

//   // Country dropdown state
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find((country) => country.name === "India") || countries[0]
//   );
//   const [isCountryOpen, setIsCountryOpen] = useState(false);

//   const webcamRef = useRef(null);
//   const navigate = useNavigate();

//   // Helper function to detect identifier type
//   const detectIdentifierType = (value) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const phoneRegex = /^\+?[\d\s-]{10,}$/;

//     if (emailRegex.test(value)) {
//       return 'email';
//     } else if (phoneRegex.test(value.replace(/[\s-]/g, ''))) {
//       return 'phone';
//     }
//     return null;
//   };

//   // Function to redirect with page refresh
//   const redirectToCheckInOptions = () => {
//     // Force a full page reload to ensure auth state is fresh
//     window.location.href = "/check-in/options";
//   };

//   // Validate field based on current step
//   const validateField = (name, value, currentStep) => {
//     try {
//       if (currentStep === 1) {
//         if (name === 'identifier') {
//           const detectedType = detectIdentifierType(value);

//           if (!detectedType) {
//             return "Please enter a valid email or phone number";
//           }

//           if (detectedType === 'phone') {
//             const cleanPhone = value.replace(/[\s-]/g, '');
//             if (cleanPhone.length < 10) {
//               return "Phone number must be at least 10 digits";
//             }
//             if (cleanPhone.length > 15) {
//               return "Phone number must not exceed 15 digits";
//             }
//             if (!/^\d+$/.test(cleanPhone)) {
//               return "Phone number must contain only numbers";
//             }
//           }

//           return null;
//         }

//         const result = initialSignupSchema.safeParse({
//           firstName: formData.firstName,
//           lastName: formData.lastName,
//           identifier: identifier,
//         });
//         if (!result.success) {
//           const fieldError = result.error.errors.find((err) =>
//             err.path.includes(name)
//           );
//           return fieldError ? fieldError.message : null;
//         }
//       } else {
//         const result = fullUserSchema.safeParse({
//           ...formData,
//           [name]: value,
//         });
//         if (!result.success) {
//           const fieldError = result.error.errors.find((err) =>
//             err.path.includes(name)
//           );
//           return fieldError ? fieldError.message : null;
//         }
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

//   const validateInitialForm = () => {
//     try {
//       const detectedType = detectIdentifierType(identifier);

//       if (!detectedType) {
//         setErrors({ identifier: "Please enter a valid email or phone number" });
//         return false;
//       }

//       if (detectedType === 'email') {
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(identifier)) {
//           setErrors({ identifier: "Please enter a valid email address" });
//           return false;
//         }
//       }

//       if (detectedType === 'phone') {
//         const cleanPhone = identifier.replace(/[\s-]/g, '');
//         if (cleanPhone.length < 10) {
//           setErrors({ identifier: "Phone number must be at least 10 digits" });
//           return false;
//         }
//         if (cleanPhone.length > 15) {
//           setErrors({ identifier: "Phone number must not exceed 15 digits" });
//           return false;
//         }
//         if (!/^\d+$/.test(cleanPhone)) {
//           setErrors({ identifier: "Phone number must contain only numbers" });
//           return false;
//         }
//       }

//       setIdentifierType(detectedType);

//       const validationData = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         identifier: identifier,
//       };

//       initialSignupSchema.parse(validationData);
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
//           error.errors[0].path[0] === 'identifier' ? 'identifier' : error.errors[0].path[0]
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

//   const validateFullForm = () => {
//     try {
//       fullUserSchema.parse(formData);
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

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     if (touched[name]) {
//       const error = validateField(name, value, step);
//       setErrors((prev) => ({
//         ...prev,
//         [name]: error,
//       }));
//     }

//     if (backendError) {
//       setBackendError("");
//     }
//   };

//   const handleIdentifierChange = (e) => {
//     const value = e.target.value;
//     setIdentifier(value);

//     const detectedType = detectIdentifierType(value);
//     setIdentifierType(detectedType);

//     if (detectedType === 'email') {
//       setFormData(prev => ({
//         ...prev,
//         emailId: value,
//         phoneNumber: '',
//         countryCode: '+91'
//       }));

//       setErrors(prev => ({
//         ...prev,
//         identifier: null,
//       }));
//     } else if (detectedType === 'phone') {
//       const cleanPhone = value.replace(/[\s-]/g, '');
//       setFormData(prev => ({
//         ...prev,
//         phoneNumber: cleanPhone,
//         emailId: ''
//       }));

//       if (touched.identifier) {
//         if (cleanPhone.length < 10) {
//           setErrors(prev => ({
//             ...prev,
//             identifier: "Phone number must be at least 10 digits",
//           }));
//         } else if (cleanPhone.length > 15) {
//           setErrors(prev => ({
//             ...prev,
//             identifier: "Phone number must not exceed 15 digits",
//           }));
//         } else if (!/^\d+$/.test(cleanPhone)) {
//           setErrors(prev => ({
//             ...prev,
//             identifier: "Phone number must contain only numbers",
//           }));
//         } else {
//           setErrors(prev => ({
//             ...prev,
//             identifier: null,
//           }));
//         }
//       }
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         emailId: '',
//         phoneNumber: '',
//         countryCode: '+91'
//       }));

//       if (touched.identifier) {
//         setErrors(prev => ({
//           ...prev,
//           identifier: "Please enter a valid email or phone number",
//         }));
//       }
//     }
//   };

//   const handleInitialSubmit = async (e) => {
//     e.preventDefault();
//     setBackendError("");

//     const initialTouched = {
//       firstName: true,
//       lastName: true,
//       identifier: true,
//     };
//     setTouched(initialTouched);

//     if (!validateInitialForm()) {
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const payload = {
//         first_name: formData.firstName.trim(),
//         last_name: formData.lastName.trim(),
//       };

//       if (identifierType === 'email') {
//         payload.email = identifier.trim().toLowerCase();
//       } else {
//         payload.phone_number = identifier.replace(/[\s-]/g, '');
//         payload.country_code = formData.countryCode;
//       }

//       console.log("Sending payload:", payload);

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/signup`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data.detail || data.message || "Signup failed";
//         throw new Error(errorMessage);
//       }

//       toast.success(data.message || "OTP sent successfully");
//       setShowOtpModal(true);
//       setResendTimer(data.expires_in || 300);

//     } catch (error) {
//       console.error("Signup error:", error);
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
//       const identifierValue = identifierType === 'email'
//         ? formData.emailId
//         : identifier.replace(/[\s-]/g, '');

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: identifierValue,
//           otp: otp,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data.detail || data.message || "Verification failed";
//         throw new Error(errorMessage);
//       }

//       toast.success(data.message || "Verification successful");

//       if (data.user) {
//         setTempUserId(data.user.sub);
//       }

//       // Store tokens in cookies and localStorage
//       if (data.access_token) {
//         setAccessToken(data.access_token);
//         localStorage.setItem('access_token', data.access_token);
//         Cookies.set('access_token', data.access_token, { expires: 7, path: '/' });
//       }

//       if (data.refresh_token) {
//         setRefreshToken(data.refresh_token);
//         localStorage.setItem('refresh_token', data.refresh_token);
//         Cookies.set('refresh_token', data.refresh_token, { expires: 7, path: '/' });
//       }

//       setShowOtpModal(false);
//       setStep(2);
//       setOtp("");
//       setOtpError("");

//     } catch (error) {
//       console.error("Verification error:", error);
//       toast.error(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     try {
//       setIsLoading(true);

//       const identifierValue = identifierType === 'email'
//         ? formData.emailId
//         : identifier.replace(/[\s-]/g, '');

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: identifierValue,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data.detail || data.message || "Failed to resend OTP";
//         throw new Error(errorMessage);
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

//   const handleCompleteRegistration = async (e) => {
//     e.preventDefault();
//     setBackendError("");

//     const allTouched = Object.keys(formData).reduce((acc, key) => {
//       acc[key] = true;
//       return acc;
//     }, {});
//     setTouched(allTouched);

//     if (!validateFullForm()) {
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

//     const token = accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

//     if (!token) {
//       toast.error("Authentication token missing. Please sign up again.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const form = new FormData();

//       form.append("profile_photo", profileImage);
//       form.append("aadhar_image", aadharImage);
//       form.append("first_name", formData.firstName.trim());
//       form.append("last_name", formData.lastName.trim());
//       form.append("client_type", formData.clientType);
//       form.append("country", selectedCountry.name);

//       if (formData.emailId && identifierType !== 'email') {
//         form.append("email", formData.emailId.trim().toLowerCase());
//       }

//       if (formData.phoneNumber && identifierType !== 'phone') {
//         form.append("country_code", formData.countryCode);
//         form.append("phone_number", formData.phoneNumber);
//       }

//       if (formData.clientType === "Corporate") {
//         form.append("company_id", formData.companyId?.trim() || "");
//         form.append("company_name", formData.companyName?.trim() || "");
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/complete-profile`, {
//         method: "POST",
//         headers: {
//           'Authorization': `Bearer ${token}`
//         },
//         body: form,
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         let errorMessage = "Registration failed";
//         if (data.detail) {
//           errorMessage = typeof data.detail === "string"
//             ? data.detail
//             : data.detail.map(err => err.msg).join(", ");
//         } else if (data.message) {
//           errorMessage = data.message;
//         }
//         throw new Error(errorMessage);
//       }

//       if (data.verification_required) {
//         setVerificationType(data.verification_type);
//         setVerificationIdentifier(data.verification_sent_to);
//         setShowSecondaryOtpModal(true);
//         setSecondaryResendTimer(300);
//         setCanResendSecondary(false);
//         toast.info(`Verification code sent to your ${data.verification_type}`);
//       } else {
//         toast.success(data.message || "Registration successful!");
//         // Redirect with page refresh
//         setTimeout(() => {
//           redirectToCheckInOptions();
//         }, 1500);
//       }

//     } catch (error) {
//       console.error("Registration error:", error);
//       toast.error(error.message);
//       setBackendError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifySecondaryOtp = async () => {
//     try {
//       otpSchema.parse(secondaryOtp);
//       setSecondaryOtpError("");
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         setSecondaryOtpError(error.errors[0].message);
//       }
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const token = accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           identifier: verificationIdentifier,
//           otp: secondaryOtp,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data.detail || data.message || "Verification failed";
//         throw new Error(errorMessage);
//       }

//       toast.success(data.message || "Verification successful!");

//       setShowSecondaryOtpModal(false);
//       setSecondaryOtp("");
//       setSecondaryOtpError("");

//       // Redirect with page refresh
//       setTimeout(() => {
//         redirectToCheckInOptions();
//       }, 1500);

//     } catch (error) {
//       console.error("Secondary verification error:", error);
//       toast.error(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendSecondaryOtp = async () => {
//     try {
//       setIsLoading(true);
//       const token = accessToken || localStorage.getItem('access_token') || Cookies.get('access_token');

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           identifier: verificationIdentifier,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMessage = data.detail || data.message || "Failed to resend OTP";
//         throw new Error(errorMessage);
//       }

//       setSecondaryOtp("");
//       toast.success(data.message || "New OTP sent successfully");
//       setSecondaryResendTimer(300);
//       setCanResendSecondary(false);
//     } catch (error) {
//       toast.error(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRegisterLater = () => {
//     // Clear any sensitive data
//     setProfileImage(null);
//     setProfilePreview(null);
//     setAadharImage(null);
//     setAadharPreview(null);

//     // Redirect with page refresh
//     toast.info("You can complete your profile later from your account settings");
//     setTimeout(() => {
//       redirectToCheckInOptions();
//     }, 500);
//   };

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

//   useEffect(() => {
//     if (showSecondaryOtpModal && !canResendSecondary) {
//       const timer = setInterval(() => {
//         setSecondaryResendTimer((prev) => {
//           if (prev <= 1) {
//             clearInterval(timer);
//             setCanResendSecondary(true);
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);

//       return () => clearInterval(timer);
//     }
//   }, [showSecondaryOtpModal, canResendSecondary]);

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//   };

//   const tabContentStyle = {
//     transition: "opacity 300ms ease, transform 300ms ease",
//     opacity: 1,
//     transform: "translateY(0)",
//   };

//   const handleCloseOtpModalAndReset = () => {
//     setShowOtpModal(false);
//     setOtp("");
//     setOtpError("");
//     setResendTimer(300);
//     setCanResend(false);
//   };

//   const handleCloseSecondaryOtpModal = () => {
//     setShowSecondaryOtpModal(false);
//     setSecondaryOtp("");
//     setSecondaryOtpError("");
//   };

//   return (
//     <div className="py-6 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 flex flex-col">

//       <LegalDocumentsWebcam
//         isOpen={isLegalOpen}
//         onClose={() => setIsLegalOpen(false)}
//       />

//       <div className="flex-1 overflow-auto">
//         <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
//           <div className="p-4 sm:p-6 lg:p-4">
//             <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-1 mt-4">
//               {step === 1 ? "Sign Up" : "Complete Your Profile"}
//             </h1>
//             <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
//               {step === 1
//                 ? "Enter your details to get started"
//                 : "Setup your profile and photo for future verification with us"}
//             </p>

//             {/* Step 1 - Initial Signup Form */}
//             {step === 1 && (
//               <div className="max-w-md mx-auto">
//                 <form className="space-y-5" onSubmit={handleInitialSubmit}>
//                   <div>
//                     <label
//                       htmlFor="firstName"
//                       className="block text-sm font-medium text-gray-700 mb-1"
//                     >
//                       First Name*
//                     </label>
//                     <input
//                       type="text"
//                       id="firstName"
//                       name="firstName"
//                       value={formData.firstName}
//                       placeholder="Enter your first name"
//                       onChange={(e) => {
//                         const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
//                         handleChange({
//                           target: {
//                             name: "firstName",
//                             value: value,
//                           },
//                         });
//                       }}
//                       onBlur={handleBlur}
//                       className={`w-full px-3 py-2 border ${
//                         errors.firstName ? "border-red-500" : "border-gray-300"
//                       } rounded-md`}
//                     />
//                     <div className="h-3">
//                       {errors.firstName && touched.firstName && (
//                         <p className="text-xs text-red-600">{errors.firstName}</p>
//                       )}
//                     </div>
//                   </div>

//                   <div>
//                     <label
//                       htmlFor="lastName"
//                       className="block text-sm font-medium text-gray-700 mb-1"
//                     >
//                       Last Name*
//                     </label>
//                     <input
//                       type="text"
//                       id="lastName"
//                       name="lastName"
//                       placeholder="Enter your last name"
//                       value={formData.lastName}
//                       onChange={(e) => {
//                         const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
//                         handleChange({
//                           target: {
//                             name: "lastName",
//                             value: value,
//                           },
//                         });
//                       }}
//                       onBlur={handleBlur}
//                       className={`w-full px-3 py-2 border ${
//                         errors.lastName ? "border-red-500" : "border-gray-300"
//                       } rounded-md`}
//                     />
//                     <div className="h-3">
//                       {errors.lastName && touched.lastName && (
//                         <p className="text-xs text-red-600">{errors.lastName}</p>
//                       )}
//                     </div>
//                   </div>

//                   <div>
//                     <label
//                       htmlFor="identifier"
//                       className="block text-sm font-medium text-gray-700 mb-1"
//                     >
//                       Email or Phone Number*
//                     </label>
//                     <div className="flex w-full">
//                       {identifierType === 'phone' && (
//                         <div className="flex-shrink-0">
//                           <select
//                             id="countryCode"
//                             name="countryCode"
//                             value={formData.countryCode}
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-white"
//                           >
//                             <option value="+91">+91</option>
//                             <option value="+1">+1</option>
//                             <option value="+44">+44</option>
//                             <option value="+61">+61</option>
//                           </select>
//                         </div>
//                       )}
//                       <input
//                         id="identifier"
//                         name="identifier"
//                         type="text"
//                         placeholder="Enter you email or phone number"
//                         value={identifier}
//                         onChange={handleIdentifierChange}
//                         onBlur={handleBlur}
//                         className={`flex-1 min-w-0 px-3 py-2 border ${
//                           errors.identifier ? "border-red-500" : "border-gray-300"
//                         } ${identifierType === 'phone' ? 'rounded-r-md' : 'rounded-md'}`}
//                       />
//                     </div>
//                     <div className="h-3">
//                       {errors.identifier && touched.identifier && (
//                         <p className="text-xs text-red-600">{errors.identifier}</p>
//                       )}
//                     </div>
//                     {/* {identifierType && (
//                       <p className="text-xs text-green-600 mt-1">
//                         Detected as: {identifierType === 'email' ? 'Email address' : 'Phone number'}
//                       </p>
//                     )} */}
//                   </div>

//                   <button
//                     type="submit"
//                     className="w-full py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-md shadow-md transition-colors duration-300 disabled:opacity-50 text-base sm:text-lg mt-6"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? (
//                       <span className="flex items-center justify-center">
//                         <svg
//                           className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                           xmlns="http://www.w3.org/2000/svg"
//                           fill="none"
//                           viewBox="0 0 24 24"
//                         >
//                           <circle
//                             className="opacity-25"
//                             cx="12"
//                             cy="12"
//                             r="10"
//                             stroke="currentColor"
//                             strokeWidth="4"
//                           ></circle>
//                           <path
//                             className="opacity-75"
//                             fill="currentColor"
//                             d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                           ></path>
//                         </svg>
//                         Sending OTP...
//                       </span>
//                     ) : (
//                       "Continue"
//                     )}
//                   </button>
//                 </form>
//               </div>
//             )}

//             {/* Step 2 - Full Registration Form */}
//             {step === 2 && (
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
//                 {/* Verification Section */}
//                 <div className="space-y-6">
//                   <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2">
//                     Identity Details
//                   </h2>

//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => handleTabChange("profile")}
//                       className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
//                         activeTab === "profile"
//                           ? "bg-black text-white shadow-md"
//                           : "bg-gray-200 text-gray-700 hover:bg-gray-200"
//                       }`}
//                     >
//                       Profile Photo
//                     </button>
//                     <button
//                       onClick={() => handleTabChange("aadhar")}
//                       className={`px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
//                         activeTab === "aadhar"
//                           ? "bg-black text-white shadow-md"
//                           : "bg-gray-200 text-gray-700 hover:bg-gray-200"
//                       }`}
//                     >
//                       Aadhar Card
//                     </button>
//                   </div>

//                   {/* Profile Tab Content */}
//                   <div
//                     style={{
//                       ...tabContentStyle,
//                       display: activeTab === "profile" ? "block" : "none",
//                     }}
//                   >
//                     <div className="mt-6 sm:mt-8">
//                       <div className="flex flex-col gap-2 mb-1">
//                         <div className="flex items-center">
//                           <label className="block text-sm sm:text-md font-medium text-gray-700">
//                             Please capture your photo using the webcam or upload
//                             an image
//                           </label>
//                           <InfoTooltip
//                             content="View upload guidelines"
//                             onClick={() => setIsLegalOpen(true)}
//                           />
//                         </div>
//                         <p className="text-[12px] mt-2 text-gray-500">
//                           By capturing or uploading your photo, you agree to our{" "}
//                           <button
//                             type="button"
//                             onClick={() => setIsLegalOpen(true)}
//                             className="text-blue-600 hover:underline font-medium"
//                           >
//                             Terms & Conditions
//                           </button>{" "}
//                           for identification.
//                         </p>
//                       </div>

//                       {profilePreview ? (
//                         <div className="relative">
//                           <img
//                             src={profilePreview}
//                             alt="Preview"
//                             className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                           />
//                           <button
//                             onClick={() => {
//                               setProfilePreview(null);
//                               setProfileImage(null);
//                             }}
//                             className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
//                           >
//                             <FaCamera className="text-gray-700" />
//                           </button>
//                           <div className="mt-4 flex justify-center space-x-4">
//                             <button
//                               onClick={() => {
//                                 setProfilePreview(null);
//                                 setProfileImage(null);
//                               }}
//                               className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//                             >
//                               <FaCamera /> Retake Profile Photo
//                             </button>
//                             <input
//                               type="file"
//                               id="profile-upload"
//                               accept="image/*"
//                               onChange={(e) =>
//                                 handleImageUpload(
//                                   e,
//                                   setProfileImage,
//                                   setProfilePreview
//                                 )
//                               }
//                               className="hidden"
//                             />
//                             <label
//                               htmlFor="profile-upload"
//                               className="flex items-center gap-2 px-4 py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
//                             >
//                               <FaUpload /> Upload Different Image
//                             </label>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <Webcam
//                             audio={false}
//                             ref={activeTab === "profile" ? webcamRef : null}
//                             screenshotFormat="image/jpeg"
//                             className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                             videoConstraints={{
//                               facingMode: "user",
//                               width: { ideal: 1280 },
//                               height: { ideal: 720 },
//                             }}
//                             forceScreenshotSourceSize={true}
//                             key="profile-webcam"
//                           />

//                           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                             <button
//                               onClick={() =>
//                                 captureImage(setProfileImage, setProfilePreview)
//                               }
//                               className="flex items-center justify-center gap-2 px-4 py-2 sm:px-8 sm:py-2 bg-black text-white rounded-lg hover:text-gray-300 text-sm sm:text-lg"
//                             >
//                               <FaCamera /> Capture Photo
//                             </button>
//                             <input
//                               type="file"
//                               id="profile-upload"
//                               accept="image/*"
//                               onChange={(e) =>
//                                 handleImageUpload(
//                                   e,
//                                   setProfileImage,
//                                   setProfilePreview
//                                 )
//                               }
//                               className="hidden"
//                             />
//                             <label
//                               htmlFor="profile-upload"
//                               className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm sm:text-lg"
//                             >
//                               <FaUpload /> Upload Profile Photo
//                             </label>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Aadhar Tab Content */}
//                   <div
//                     style={{
//                       ...tabContentStyle,
//                       display: activeTab === "aadhar" ? "block" : "none",
//                     }}
//                   >
//                     <div className="rounded-lg mt-6 sm:mt-8">
//                       <div className="flex items-center mb-2">
//                         <label className="block text-sm sm:text-md font-medium text-gray-700">
//                           {aadharPreview
//                             ? "Aadhar card captured"
//                             : "Please capture or upload a clear photo of your Aadhar card"}
//                         </label>
//                         <InfoTooltip
//                           content="View upload guidelines"
//                           onClick={() => setIsLegalOpen(true)}
//                         />
//                       </div>
//                       {aadharPreview ? (
//                         <div className="relative">
//                           <img
//                             src={aadharPreview}
//                             alt="Aadhar Preview"
//                             className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                           />
//                           <button
//                             onClick={() => {
//                               setAadharPreview(null);
//                               setAadharImage(null);
//                             }}
//                             className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
//                           >
//                             <FaCamera className="text-gray-700" />
//                           </button>
//                           <div className="mt-4 flex justify-center">
//                             <button
//                               onClick={() => {
//                                 setAadharPreview(null);
//                                 setAadharImage(null);
//                               }}
//                               className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//                             >
//                               <FaCamera /> Retake Aadhar Card
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <Webcam
//                             audio={false}
//                             ref={activeTab === "aadhar" ? webcamRef : null}
//                             screenshotFormat="image/jpeg"
//                             className="rounded-md w-full h-64 sm:h-80 object-cover border-2 border-gray-300"
//                             videoConstraints={{
//                               facingMode: "user",
//                               width: { ideal: 1280 },
//                               height: { ideal: 720 },
//                             }}
//                             forceScreenshotSourceSize={true}
//                             key="aadhar-webcam"
//                           />
//                           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                             <button
//                               onClick={() =>
//                                 captureImage(setAadharImage, setAadharPreview)
//                               }
//                               className="flex items-center justify-center gap-2 px-4 py-2 sm:px-8 sm:py-2 bg-black text-white rounded-lg hover:text-gray-300 text-sm sm:text-lg"
//                             >
//                               <FaCamera /> Capture Aadhar Card
//                             </button>
//                             <input
//                               type="file"
//                               id="aadhar-upload"
//                               accept="image/*"
//                               onChange={(e) =>
//                                 handleImageUpload(
//                                   e,
//                                   setAadharImage,
//                                   setAadharPreview
//                                 )
//                               }
//                               className="hidden"
//                             />
//                             <label
//                               htmlFor="aadhar-upload"
//                               className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2 bg-gray-200 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm sm:text-lg"
//                             >
//                               <FaUpload /> Upload Aadhar Card
//                             </label>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* User Details Form */}
//                 <div>
//                   <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 border-b pb-2 mb-12">
//                     Profile Details
//                   </h2>
//                   <form className="space-y-4 sm:space-y-5" onSubmit={handleCompleteRegistration}>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label
//                           htmlFor="firstName"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           First Name*
//                         </label>
//                         <div className="relative">
//                           <input
//                             type="text"
//                             id="firstName"
//                             name="firstName"
//                             value={formData.firstName}
//                             disabled
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
//                           />
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheck className="text-green-500" />
//                           </div>
//                         </div>
//                       </div>
//                       <div>
//                         <label
//                           htmlFor="lastName"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           Last Name*
//                         </label>
//                         <div className="relative">
//                           <input
//                             type="text"
//                             id="lastName"
//                             name="lastName"
//                             value={formData.lastName}
//                             disabled
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
//                           />
//                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                             <FaCheck className="text-green-500" />
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {/* Email field - disabled if already verified, required if not */}
//                       <div>
//                         <label
//                           htmlFor="emailId"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           Email Address{identifierType !== 'email' ? '*' : ''}
//                         </label>
//                         {identifierType === 'email' ? (
//                           <div className="relative">
//                             <input
//                               type="email"
//                               id="emailId"
//                               name="emailId"
//                               value={formData.emailId}
//                               disabled
//                               className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
//                             />
//                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                               <FaCheck className="text-green-500" />
//                             </div>
//                             <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
//                               <FaCheck className="text-xs" /> Verified
//                             </p>
//                           </div>
//                         ) : (
//                           <>
//                             <input
//                               type="email"
//                               id="emailId"
//                               name="emailId"
//                               placeholder="Enter your email"
//                               value={formData.emailId}
//                               onChange={handleChange}
//                               onBlur={handleBlur}
//                               className={`w-full px-3 py-2 border ${
//                                 errors.emailId ? "border-red-500" : "border-gray-300"
//                               } rounded-md`}
//                             />
//                             <div className="h-3">
//                               {errors.emailId && touched.emailId && (
//                                 <p className="text-xs text-red-600">{errors.emailId}</p>
//                               )}
//                             </div>
//                           </>
//                         )}
//                       </div>

//                       {/* Phone field - disabled if already verified, required if not */}
//                       <div>
//                         <label
//                           htmlFor="phoneNumber"
//                           className="block text-sm font-medium text-gray-700 mb-1"
//                         >
//                           Mobile Number{identifierType !== 'phone' ? '*' : ''}
//                         </label>
//                         {identifierType === 'phone' ? (
//                           <div className="relative">
//                             <div className="flex w-full">
//                               <div className="flex-shrink-0">
//                                 <select
//                                   id="countryCode"
//                                   name="countryCode"
//                                   value={formData.countryCode}
//                                   disabled
//                                   className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600"
//                                 >
//                                   <option value="+91">+91</option>
//                                   <option value="+1">+1</option>
//                                   <option value="+44">+44</option>
//                                   <option value="+61">+61</option>
//                                 </select>
//                               </div>
//                               <input
//                                 id="phoneNumber"
//                                 name="phoneNumber"
//                                 type="tel"
//                                 value={formData.phoneNumber}
//                                 disabled
//                                 className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-600"
//                               />
//                             </div>
//                             <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                               <FaCheck className="text-green-500" />
//                             </div>
//                             <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
//                               <FaCheck className="text-xs" /> Verified
//                             </p>
//                           </div>
//                         ) : (
//                           <div className="flex w-full">
//                             <div className="flex-shrink-0">
//                               <select
//                                 id="countryCode"
//                                 name="countryCode"
//                                 value={formData.countryCode}
//                                 onChange={handleChange}
//                                 onBlur={handleBlur}
//                                 className="px-2 sm:px-3 py-2.5 border border-gray-300 rounded-l-md bg-white"
//                               >
//                                 <option value="+91">+91</option>
//                                 <option value="+1">+1</option>
//                                 <option value="+44">+44</option>
//                                 <option value="+61">+61</option>
//                               </select>
//                             </div>
//                             <input
//                               id="phoneNumber"
//                               name="phoneNumber"
//                               type="tel"
//                               placeholder="Enter your phone number"
//                               value={formData.phoneNumber}
//                               onChange={(e) => {
//                                 const value = e.target.value.replace(/\D/g, "");
//                                 handleChange({
//                                   target: {
//                                     name: "phoneNumber",
//                                     value: value,
//                                   },
//                                 });
//                               }}
//                               onBlur={handleBlur}
//                               inputMode="numeric"
//                               pattern="[0-9]*"
//                               className={`flex-1 min-w-0 px-3 py-2 border ${
//                                 errors.phoneNumber ? "border-red-500" : "border-gray-300"
//                               } rounded-r-md`}
//                             />
//                           </div>
//                         )}
//                         {identifierType !== 'phone' && (
//                           <div className="h-3">
//                             {errors.phoneNumber && touched.phoneNumber && (
//                               <p className="text-xs text-red-600">{errors.phoneNumber}</p>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Profile Type*
//                         </label>
//                         <div className="flex gap-4">
//                           <label className="inline-flex items-center">
//                             <input
//                               type="radio"
//                               name="clientType"
//                               value="Leisure"
//                               checked={formData.clientType === "Leisure"}
//                               onChange={handleChange}
//                               onBlur={handleBlur}
//                               className="h-4 w-4 text-blue-600"
//                             />
//                             <span className="ml-2 text-gray-700">Leisure</span>
//                           </label>
//                           <label className="inline-flex items-center">
//                             <input
//                               type="radio"
//                               name="clientType"
//                               value="Corporate"
//                               checked={formData.clientType === "Corporate"}
//                               onChange={handleChange}
//                               onBlur={handleBlur}
//                               className="h-4 w-4 text-blue-600 border-gray-300"
//                             />
//                             <span className="ml-2 text-gray-700">Corporate</span>
//                           </label>
//                         </div>
//                       </div>
//                       <div className="mb-1 relative">
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Country
//                         </label>
//                         <div className="relative">
//                           <button
//                             type="button"
//                             onClick={() => setIsCountryOpen(!isCountryOpen)}
//                             className="w-full flex items-center justify-between p-2 border border-gray-300 rounded-md text-sm bg-white"
//                           >
//                             <span className="flex items-center gap-2">
//                               <img
//                                 src={selectedCountry.flag}
//                                 alt={selectedCountry.name}
//                                 className="w-5 h-4 object-cover rounded-sm"
//                               />
//                               {selectedCountry.name}
//                             </span>
//                             {isCountryOpen ? (
//                               <FaChevronUp className="ml-2 text-black" />
//                             ) : (
//                               <FaChevronDown className="ml-2 text-black" />
//                             )}
//                           </button>

//                           {isCountryOpen && (
//                             <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                               {countries.map((country) => (
//                                 <div
//                                   key={country.code}
//                                   onClick={() => {
//                                     setSelectedCountry(country);
//                                     setIsCountryOpen(false);
//                                   }}
//                                   className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
//                                 >
//                                   <img
//                                     src={country.flag}
//                                     alt={country.name}
//                                     className="w-5 h-4 object-cover rounded-sm"
//                                   />
//                                   {country.name}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {formData.clientType === "Corporate" && (
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <label
//                             htmlFor="companyId"
//                             className="block text-sm font-medium text-gray-700 mb-1"
//                           >
//                             Corporate ID*
//                           </label>
//                           <input
//                             type="text"
//                             id="companyId"
//                             name="companyId"
//                             placeholder="Enter your company id"
//                             value={formData.companyId}
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             className={`w-full px-3 py-2 border ${
//                               errors.companyId ? "border-red-500" : "border-gray-300"
//                             } rounded-md`}
//                           />
//                           {errors.companyId && touched.companyId && (
//                             <p className="text-sm text-red-600">{errors.companyId}</p>
//                           )}
//                         </div>
//                         <div>
//                           <label
//                             htmlFor="companyName"
//                             className="block text-sm font-medium text-gray-700 mb-1"
//                           >
//                             Corporate Name*
//                           </label>
//                           <input
//                             type="text"
//                             id="companyName"
//                             name="companyName"
//                             placeholder="Enter your company name"
//                             value={formData.companyName}
//                             onChange={handleChange}
//                             onBlur={handleBlur}
//                             className={`w-full px-3 py-2 border ${
//                               errors.companyName ? "border-red-500" : "border-gray-300"
//                             } rounded-md`}
//                           />
//                           {errors.companyName && touched.companyName && (
//                             <p className="text-sm text-red-600">{errors.companyName}</p>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                     <div className="flex items-start mt-4">
//                       <div className="flex items-center h-5">
//                         <input
//                           id="consent"
//                           name="consent"
//                           type="checkbox"
//                           checked={consentGiven}
//                           onChange={(e) => setConsentGiven(e.target.checked)}
//                           className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                         />
//                       </div>
//                       <div className="ml-3 text-sm">
//                         <label htmlFor="consent" className="font-medium text-gray-700">
//                           I agree to the{" "}
//                           <a
//                             href="#"
//                             onClick={(e) => handleLinkClick("terms", e)}
//                             className="text-blue-600 hover:underline"
//                           >
//                             Terms of Service
//                           </a>{" "}
//                           and{" "}
//                           <a
//                             href="#"
//                             onClick={(e) => handleLinkClick("privacy", e)}
//                             className="text-blue-600 hover:underline"
//                           >
//                             Privacy Policy
//                           </a>
//                         </label>
//                         <p className="text-gray-500">
//                           By creating an account, you agree to our terms and conditions
//                         </p>
//                       </div>
//                     </div>

//                     <LegalDocumentsPermission
//                       isOpen={showLegalPopup}
//                       onClose={() => setShowLegalPopup(false)}
//                       activeTab={activeDocument}
//                     />

//                     <div className="flex gap-4">
//                       <button
//                         type="submit"
//                         className="flex-1 py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-md shadow-md transition-colors duration-300 disabled:opacity-50 text-base sm:text-lg"
//                         disabled={isLoading}
//                       >
//                         {isLoading ? (
//                           <span className="flex items-center justify-center">
//                             <svg
//                               className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                               ></circle>
//                               <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                               ></path>
//                             </svg>
//                             Processing...
//                           </span>
//                         ) : (
//                           "Complete Registration"
//                         )}
//                       </button>

//                       <button
//                         type="button"
//                         onClick={handleRegisterLater}
//                         className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md shadow-md transition-colors duration-300 text-base sm:text-lg"
//                       >
//                         Register Later
//                       </button>
//                     </div>
//                   </form>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* OTP Verification Modal */}
//       {showOtpModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
//             <button
//               onClick={handleCloseOtpModalAndReset}
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
//                 <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-200 mb-4">
//                   <svg
//                     className="h-8 w-8 sm:h-10 sm:w-10 text-green-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M5 13l4 4L19 7"
//                     />
//                   </svg>
//                 </div>
//                 <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
//                   Verify Your {identifierType === 'email' ? 'Email' : 'Phone Number'}
//                 </h2>
//                 <p className="text-gray-600 mb-6 text-sm sm:text-base">
//                   We've sent a 6-digit verification code to{" "}
//                   <span className="font-semibold text-black">
//                     {identifierType === 'email'
//                       ? formData.emailId
//                       : `${formData.countryCode} ${formData.phoneNumber}`}
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
//                     "Verify and Continue"
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

//       {/* Secondary OTP Verification Modal */}
//       {showSecondaryOtpModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
//             <button
//               onClick={handleCloseSecondaryOtpModal}
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
//                   Verify Your {verificationType === 'email' ? 'Email' : 'Phone Number'}
//                 </h2>
//                 <p className="text-gray-600 mb-6 text-sm sm:text-base">
//                   We've sent a 6-digit verification code to{" "}
//                   <span className="font-semibold text-black">
//                     {verificationIdentifier}
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
//                       value={secondaryOtp[index] || ""}
//                       onChange={(e) => {
//                         const value = e.target.value.replace(/\D/g, "");
//                         if (value === e.target.value) {
//                           const newOtp = secondaryOtp.split("");
//                           newOtp[index] = value;
//                           setSecondaryOtp(newOtp.join(""));

//                           if (value && index < 5) {
//                             document
//                               .getElementById(`secondary-otp-input-${index + 1}`)
//                               ?.focus();
//                           }

//                           if (secondaryOtpError) setSecondaryOtpError("");
//                         }
//                       }}
//                       onKeyDown={(e) => {
//                         if (e.key === "Backspace" && !secondaryOtp[index] && index > 0) {
//                           document
//                             .getElementById(`secondary-otp-input-${index - 1}`)
//                             ?.focus();
//                         }
//                       }}
//                       id={`secondary-otp-input-${index}`}
//                       className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-center border ${
//                         secondaryOtpError ? "border-red-500" : "border-gray-300"
//                       } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
//                       inputMode="numeric"
//                       pattern="[0-9]*"
//                     />
//                   ))}
//                 </div>
//                 {secondaryOtpError && (
//                   <p className="mt-2 text-sm text-red-600 text-center">{secondaryOtpError}</p>
//                 )}
//               </div>

//               <div className="flex flex-col space-y-3">
//                 <button
//                   onClick={handleVerifySecondaryOtp}
//                   className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
//                   disabled={isLoading || secondaryOtp.length !== 6}
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
//                 {canResendSecondary ? (
//                   <button
//                     className="font-medium text-blue-600 hover:text-blue-500"
//                     onClick={handleResendSecondaryOtp}
//                     disabled={isLoading}
//                   >
//                     Resend OTP
//                   </button>
//                 ) : (
//                   <span className="text-gray-500">
//                     Resend OTP in {secondaryResendTimer} seconds
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

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

// export default CreateUser;
