import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMdArrowRoundBack } from 'react-icons/io';
import {
  FiEdit2,
  FiX,
  FiCheck,
  FiUpload,
  FiUser,
  FiFileText,
  FiCamera,
  FiMail,
  FiPhone,
} from 'react-icons/fi';
import Webcam from 'react-webcam';
import BookingHistory from './BookingHistory';
import Cookies from 'js-cookie';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HelpSupportForm from './HelpSupportForm';
import countries from './countries';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const Profile = () => {
  const [activeTab, setActiveTab] = useState('guestDetails');
  const [guestDetails, setGuestDetails] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    emailid: '',
    phonenumber: '',
    client_type: 'Leisure',
    companyname: '',
    employeeid: '',
    companyid: '',
    country: '',
    countrycode: '+91',
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [aadharFile, setAadharFile] = useState(null);
  const [showWebcam, setShowWebcam] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    firstname: null,
    lastname: null,
  });

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpType, setOtpType] = useState('email');
  const [resendTimer, setResendTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState(null);

  // Country dropdown state
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((country) => country.name === 'India') || countries[0]
  );
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
  };

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

  const decryptUserData = async (encryptedData) => {
    try {
      const decryptedData = { ...encryptedData };
      const fieldsToDecrypt = {};

      if (encryptedData.email && encryptedData.email.length > 50) {
        fieldsToDecrypt.email = encryptedData.email;
      } else if (encryptedData.email) {
        decryptedData.email = encryptedData.email;
      }

      const phoneStr = String(encryptedData.phone_number || '');
      if (phoneStr && !/^[\d\+\-\s\(\)]+$/.test(phoneStr)) {
        fieldsToDecrypt.phone_number = encryptedData.phone_number;
      } else if (phoneStr) {
        decryptedData.phone_number = encryptedData.phone_number;
      }

      if (encryptedData.country_code && encryptedData.country_code.length > 10) {
        fieldsToDecrypt.country_code = encryptedData.country_code;
      } else if (encryptedData.country_code) {
        decryptedData.country_code = encryptedData.country_code;
      }

      if (Object.keys(fieldsToDecrypt).length === 0) {
        return decryptedData;
      }

      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/decrypt-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          encrypted_fields: fieldsToDecrypt,
        }),
      });

      if (response.status === 401) {
        return decryptedData;
      }

      if (!response.ok) {
        throw new Error(`Decryption failed: ${response.statusText}`);
      }

      const decryptedResult = await response.json();
      return {
        ...decryptedData,
        ...decryptedResult,
      };
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData;
    }
  };

  const fetchGuestData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const guestId = Cookies.get('guest_id') || getGuestIdFromToken(accessToken);
      if (!guestId) {
        throw new Error('No guest ID found');
      }

      const profileResponse = await fetch(`${CQ_BASE_URL}/bq/api/guests/${guestId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Profile API Error: ${profileResponse.statusText}`);
      }

      const profileData = await profileResponse.json();
      const guest = profileData.guest;

      const isDecrypted = guest.emailid && guest.emailid.length < 50;

      let guestData;
      if (isDecrypted) {
        guestData = {
          guest_id: guestId,
          firstname: guest.firstname || '',
          lastname: guest.lastname || '',
          emailid: guest.emailid || '',
          phonenumber: guest.phonenumber || '',
          countrycode: guest.countrycode || '+91',
          client_type: guest.clienttype || 'Leisure',
          profilephoto: guest.profile_photo || null,
          aadhar_file: guest.aadhar_image_url || null,
          companyname: guest.companyname || '',
          employeeid: guest.employeeid || '',
          companyid: guest.companyid || '',
          country: guest.country || 'India',
        };
      } else {
        const decryptedFields = await decryptUserData({
          email: guest.emailid,
          phone_number: guest.phonenumber,
          country_code: guest.countrycode,
        });

        guestData = {
          guest_id: guestId,
          firstname: guest.firstname || '',
          lastname: guest.lastname || '',
          emailid: decryptedFields.email || guest.emailid || '',
          phonenumber: decryptedFields.phone_number || guest.phonenumber || '',
          countrycode: decryptedFields.country_code || guest.countrycode || '+91',
          client_type: guest.clienttype || 'Leisure',
          profilephoto: guest.profile_photo || null,
          aadhar_file: guest.aadhar_image_url || null,
          companyname: guest.companyname || '',
          employeeid: guest.employeeid || '',
          companyid: guest.companyid || '',
          country: guest.country || 'India',
        };
      }

      setGuestDetails(guestData);
      setFormData({
        firstname: guestData.firstname,
        lastname: guestData.lastname,
        emailid: guestData.emailid,
        phonenumber: guestData.phonenumber,
        client_type: guestData.client_type,
        companyname: guestData.companyname,
        employeeid: guestData.employeeid,
        companyid: guestData.companyid,
        country: guestData.country,
        countrycode: guestData.countrycode,
      });

      // Set selected country based on both country name and code
      let guestCountry = countries.find(
        (country) =>
          country.name === guestData.country || country.code === (guestData.countrycode || '+91')
      );
      if (!guestCountry) {
        guestCountry = countries.find((country) => country.code === '+91') || countries[0];
      }
      setSelectedCountry(guestCountry);

      // Fetch bookings
      const bookingsResponse = await fetch(
        `${CQ_BASE_URL}/bq/api/profile/bookings/?guestid=${guestId}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (err) {
      console.error('Error in fetchGuestData:', err);
      setError(err.message);
      toast.error(`Failed to load profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getGuestIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  useEffect(() => {
    fetchGuestData();
  }, []);

  const validateName = (name) => {
    if (!name.trim()) {
      return 'This field is required';
    }
    if (name.trim().length < 2) {
      return 'Must be at least 2 characters long';
    }
    if (/\d/.test(name)) {
      return 'Should not contain numbers';
    }
    return null;
  };

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = dataURLtoBlob(imageSrc);
    const file = new File([blob], `${showWebcam}-capture-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    if (showWebcam === 'profile') {
      setProfilePhotoFile(file);
    } else {
      setAadharFile(file);
    }
    setShowWebcam(null);
  };

  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const openEditModal = () => {
    if (guestDetails) {
      setFormData({
        firstname: guestDetails.firstname || '',
        lastname: guestDetails.lastname || '',
        emailid: guestDetails.emailid || '',
        phonenumber: guestDetails.phonenumber || '',
        client_type: guestDetails.client_type || 'Leisure',
        companyname: guestDetails.companyname || '',
        employeeid: guestDetails.employeeid || '',
        companyid: guestDetails.companyid || '',
        country: guestDetails.country || 'India',
        countrycode: guestDetails.countrycode || '+91',
      });

      // Set selected country based on both country name and code
      let guestCountry = countries.find(
        (country) =>
          country.name === guestDetails.country ||
          country.code === (guestDetails.countrycode || '+91')
      );
      if (!guestCountry) {
        guestCountry = countries.find((country) => country.code === '+91') || countries[0];
      }
      setSelectedCountry(guestCountry);
    }
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setShowWebcam(null);
    setProfilePhotoFile(null);
    setAadharFile(null);
    setOtpError('');
    setPendingUpdateData(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'firstname' || name === 'lastname') {
      const error = validateName(value);
      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhotoFile(e.target.files[0]);
    }
  };

  const handleAadharChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAadharFile(e.target.files[0]);
    }
  };

  const sendOtpForField = async (field, value) => {
    try {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // For phone numbers, include the country code
      let identifier = value;
      if (field === 'phone') {
        // Format: +919876543210
        identifier = `${selectedCountry.code}${value}`;
        console.log('Sending OTP to phone with country code:', identifier);
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          identifier: identifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      const data = await response.json();
      console.log('OTP sent response:', data);

      setOtpIdentifier(identifier);
      setOtpType(field);
      setShowOtpModal(true);
      setResendTimer(300);
      setCanResend(false);
      toast.info(`Verification code sent to your ${field === 'email' ? 'email' : 'phone number'}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter 6-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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

      toast.success(`${otpType === 'email' ? 'Email' : 'Phone number'} verified successfully!`);

      setShowOtpModal(false);
      setOtp('');
      setOtpError('');

      // After successful verification, submit the profile update
      await submitProfileUpdate();
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message);
      setOtpError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
    }
  };

  const submitProfileUpdate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = Cookies.get('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('guest_id', guestDetails.guest_id);
      formDataToSend.append('firstname', formData.firstname);
      formDataToSend.append('lastname', formData.lastname);
      formDataToSend.append('emailid', formData.emailid);
      formDataToSend.append('phonenumber', formData.phonenumber.toString());
      formDataToSend.append('country', selectedCountry.name);
      formDataToSend.append('countrycode', selectedCountry.code);
      formDataToSend.append('clienttype', formData.client_type);

      if (formData.client_type === 'Corporate') {
        if (!formData.companyname?.trim() || !formData.companyid?.trim()) {
          throw new Error('Company Name and Company ID are required for Corporate guests');
        }
        formDataToSend.append('companyname', formData.companyname);
        formDataToSend.append('companyid', formData.companyid);
      } else {
        formDataToSend.append('companyname', '');
        formDataToSend.append('companyid', '');
      }

      formDataToSend.append('employeeid', '');

      if (profilePhotoFile) {
        formDataToSend.append('file', profilePhotoFile);
      }
      if (aadharFile) {
        formDataToSend.append('aadhar_file', aadharFile);
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/update_profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Failed to update profile');
      }

      if (result.message === 'No changes detected') {
        toast.info('No changes were made');
        setIsEditModalOpen(false);
        return;
      }

      await fetchGuestData();
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
      setPendingUpdateData(null);
    } catch (err) {
      console.error('Error in submitProfileUpdate:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate names
    const firstnameError = validateName(formData.firstname);
    const lastnameError = validateName(formData.lastname);

    setValidationErrors({
      firstname: firstnameError,
      lastname: lastnameError,
    });

    if (firstnameError || lastnameError) {
      return;
    }

    // Check what changed
    const originalEmail = guestDetails?.emailid;
    const originalPhone = guestDetails?.phonenumber;
    const emailChanged = formData.emailid !== originalEmail;
    const phoneChanged = formData.phonenumber !== originalPhone;

    // Store the updated data for later use
    setPendingUpdateData({
      emailChanged,
      phoneChanged,
      newEmail: formData.emailid,
      newPhone: formData.phonenumber,
      countryCode: selectedCountry.code,
    });

    // If email changed and has value, send OTP first
    if (emailChanged && formData.emailid && formData.emailid.trim() !== '') {
      await sendOtpForField('email', formData.emailid);
      return;
    }

    // If phone changed and has value, send OTP first
    if (phoneChanged && formData.phonenumber && formData.phonenumber.toString().trim() !== '') {
      await sendOtpForField('phone', formData.phonenumber);
      return;
    }

    // If no verification needed, submit directly
    await submitProfileUpdate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-sm sm:text-base">Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md w-full">
          <strong className="font-bold">Error loading profile!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={fetchGuestData}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!guestDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md w-full">
          <strong className="font-bold">No profile data found!</strong>
          <span className="block sm:inline"> Please check your authentication.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white mt-16 sm:mt-20 md:mt-24 p-4 sm:p-6 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-20 left-3 sm:top-24 sm:left-5 text-black hover:text-gray-700 transition font-semibold text-xl sm:text-2xl z-10"
      >
        <IoMdArrowRoundBack size={28} className="sm:w-8 sm:h-8" />
      </button>

      {/* Responsive Tabs */}
      <div className="flex justify-start px-2 sm:px-4 md:px-6 lg:px-10 overflow-x-auto pb-2">
        {[
          { id: 'guestDetails', label: 'Guest Details' },
          { id: 'bookingHistory', label: 'Reservation History' },
          { id: 'helpSupport', label: 'Help & Support' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-3 sm:px-4 font-semibold text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-purple-500 text-purple-500'
                : 'text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'guestDetails' && guestDetails && (
        <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 w-full mx-auto">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Guest Profile
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto mt-2 px-4">
              Review and manage guest information. All personal details are securely stored and
              protected
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
            {/* Profile Card - Responsive */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-r from-blue-50 to-gray-50 flex items-center justify-center">
                  {guestDetails.profilephoto ? (
                    <img
                      src={guestDetails.profilephoto}
                      alt="Profile"
                      className="object-cover w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.src =
                          'https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                      <FiUser className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6 text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {guestDetails.firstname} {guestDetails.lastname}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">
                    {guestDetails.client_type} Guest
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Aadhar Card
                </h3>
                {guestDetails.aadhar_file ? (
                  <div className="flex justify-center">
                    <img
                      src={guestDetails.aadhar_file}
                      alt="Aadhar Card"
                      className="max-w-full h-auto rounded border border-gray-200"
                      onError={(e) => {
                        e.target.src = '';
                        e.target.parentElement.innerHTML = (
                          <div className="text-center p-4 bg-gray-100 rounded-lg">
                            <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="mt-2 text-gray-500 text-sm">
                              Aadhar image could not be loaded
                            </p>
                          </div>
                        );
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500 text-sm">No Aadhar card uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Information Card - Responsive */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <button
                    onClick={openEditModal}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition-colors shadow-sm flex items-center justify-center"
                  >
                    <FiEdit2 className="mr-2 text-sm sm:text-base" /> Update Information
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    {
                      label: 'Full Name',
                      value: `${
                        guestDetails.firstname.charAt(0).toUpperCase() +
                        guestDetails.firstname.slice(1)
                      } ${
                        guestDetails.lastname.charAt(0).toUpperCase() +
                        guestDetails.lastname.slice(1)
                      }`,
                      icon: <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                    },
                    {
                      label: 'Email Address',
                      value: guestDetails.emailid,
                      icon: <FiMail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                    },
                    {
                      label: 'Phone Number',
                      value: guestDetails.phonenumber,
                      icon: <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                    },
                    {
                      label: 'Profile Type',
                      value: guestDetails.client_type,
                      icon: <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                    },
                    ...(guestDetails.client_type === 'Corporate'
                      ? [
                          {
                            label: 'Company Name',
                            value: guestDetails.companyname || 'Not provided',
                            icon: <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                          },
                          {
                            label: 'Company ID',
                            value: guestDetails.companyid || 'Not provided',
                            icon: <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />,
                          },
                        ]
                      : []),
                  ].map(({ label, value, icon }, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-500">{label}</p>
                          <p
                            className="text-sm sm:text-base font-medium text-gray-900 mt-1 truncate"
                            title={value}
                          >
                            {value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Modal - Fully Responsive */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-3 sm:p-4 sticky top-0 bg-white z-10">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Profile</h3>
                  <button
                    onClick={closeEditModal}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <FiX size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        className={`w-full p-2 sm:p-3 border text-sm sm:text-base ${
                          validationErrors.firstname ? 'border-red-500' : 'border-gray-300'
                        } rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                      {validationErrors.firstname && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.firstname}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        className={`w-full p-2 sm:p-3 border text-sm sm:text-base ${
                          validationErrors.lastname ? 'border-red-500' : 'border-gray-300'
                        } rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        required
                      />
                      {validationErrors.lastname && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.lastname}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="emailid"
                        value={formData.emailid}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border text-sm sm:text-base border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {formData.emailid !== guestDetails?.emailid && formData.emailid && (
                        <p className="text-xs text-blue-600 mt-1">
                          Verification OTP will be sent to this email
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phonenumber"
                        value={formData.phonenumber}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border text-sm sm:text-base border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {formData.phonenumber !== guestDetails?.phonenumber &&
                        formData.phonenumber && (
                          <p className="text-xs text-blue-600 mt-1">
                            Verification OTP will be sent to this number
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCountryOpen(!isCountryOpen)}
                          className="w-full flex items-center justify-between p-2 sm:p-3 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          <span className="flex items-center gap-2">
                            <img
                              src={selectedCountry.flag}
                              alt={selectedCountry.name}
                              className="w-4 h-3 sm:w-5 sm:h-4 object-cover rounded-sm"
                            />
                            <span className="text-sm sm:text-base truncate">
                              {selectedCountry.name}
                            </span>
                          </span>
                          <span className="ml-2 font-semibold">▼</span>
                        </button>

                        {isCountryOpen && (
                          <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                            {countries.map((country) => (
                              <div
                                key={country.code}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setIsCountryOpen(false);
                                  setFormData((prev) => ({
                                    ...prev,
                                    countrycode: country.code,
                                    country: country.name,
                                  }));
                                }}
                                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                              >
                                <img
                                  src={country.flag}
                                  alt={country.name}
                                  className="w-4 h-3 sm:w-5 sm:h-4 object-cover rounded-sm"
                                />
                                <span className="text-sm truncate">{country.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Type
                      </label>
                      <select
                        name="client_type"
                        value={formData.client_type}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border text-sm sm:text-base border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="Leisure">Leisure</option>
                        <option value="Corporate">Corporate</option>
                      </select>
                    </div>

                    {formData.client_type === 'Corporate' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Corporate Name *
                          </label>
                          <input
                            type="text"
                            name="companyname"
                            value={formData.companyname}
                            onChange={handleInputChange}
                            className="w-full p-2 sm:p-3 border text-sm sm:text-base border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter company name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Corporate ID *
                          </label>
                          <input
                            type="text"
                            name="companyid"
                            value={formData.companyid}
                            onChange={handleInputChange}
                            className="w-full p-2 sm:p-3 border text-sm sm:text-base border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter company ID"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* File Uploads - Responsive */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Photo
                      </label>
                      {showWebcam === 'profile' ? (
                        <div className="space-y-4">
                          <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-200 rounded-lg overflow-hidden">
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              videoConstraints={videoConstraints}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              type="button"
                              onClick={captureImage}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center text-sm"
                            >
                              <FiCamera className="mr-2" /> Capture Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowWebcam(null)}
                              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <label className="flex flex-col items-center justify-center w-full p-3 sm:p-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                <FiUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-500" />
                                <p className="text-xs sm:text-sm text-gray-500 text-center">
                                  {profilePhotoFile ? profilePhotoFile.name : 'Click to upload'}
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleProfilePhotoChange}
                                accept="image/*"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowWebcam('profile')}
                            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center text-sm"
                          >
                            <FiCamera className="mr-2" /> Take Photo with Camera
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Card
                      </label>
                      {showWebcam === 'aadhar' ? (
                        <div className="space-y-4">
                          <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-200 rounded-lg overflow-hidden">
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              videoConstraints={videoConstraints}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <button
                              type="button"
                              onClick={captureImage}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center text-sm"
                            >
                              <FiCamera className="mr-2" /> Capture Aadhar
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowWebcam(null)}
                              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <label className="flex flex-col items-center justify-center w-full p-3 sm:p-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                <FiUpload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-500" />
                                <p className="text-xs sm:text-sm text-gray-500 text-center">
                                  {aadharFile ? aadharFile.name : 'Click to upload'}
                                </p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleAadharChange}
                                accept="image/*,.pdf"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowWebcam('aadhar')}
                            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center text-sm"
                          >
                            <FiCamera className="mr-2" /> Capture Aadhar with Camera
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 flex items-center justify-center text-sm sm:text-base"
                      disabled={
                        isLoading || validationErrors.firstname || validationErrors.lastname
                      }
                    >
                      {isLoading ? (
                        'Saving...'
                      ) : (
                        <>
                          <FiCheck className="mr-2" /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OTP Verification Modal - Responsive */}
          {showOtpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative mx-2">
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtp('');
                    setOtpError('');
                  }}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                  aria-label="Close"
                >
                  <svg
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="p-4 sm:p-6 md:p-8">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-blue-200 mb-3 sm:mb-4">
                      {otpType === 'email' ? (
                        <FiMail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                      ) : (
                        <FiPhone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
                      Verify Your {otpType === 'email' ? 'Email' : 'Phone Number'}
                    </h2>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base break-words">
                      We've sent a 6-digit verification code to{' '}
                      <span className="font-semibold text-black block sm:inline mt-1 sm:mt-0">
                        {otpIdentifier}
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
                          className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-lg sm:text-xl md:text-2xl text-center border ${
                            otpError ? 'border-red-500' : 'border-gray-300'
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      ))}
                    </div>
                    {otpError && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600 text-center">{otpError}</p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleVerifyOtp}
                      className="w-full py-2 sm:py-2.5 md:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50 text-sm sm:text-base"
                      disabled={isVerifying || otp.length !== 6}
                    >
                      {isVerifying ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                        'Verify and Update'
                      )}
                    </button>
                  </div>
                  <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                    Didn't receive code?{' '}
                    {canResend ? (
                      <button
                        className="font-medium text-blue-600 hover:text-blue-500"
                        onClick={handleResendOtp}
                        disabled={isVerifying}
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
        </div>
      )}

      {activeTab === 'bookingHistory' && <BookingHistory bookings={bookings} />}
      {activeTab === 'helpSupport' && <HelpSupportForm guestDetails={guestDetails} />}

      <ToastContainer position="top-right" />
    </div>
  );
};

export default Profile;

// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { IoMdArrowRoundBack } from "react-icons/io";
// import {
//   FiEdit2,
//   FiX,
//   FiCheck,
//   FiUpload,
//   FiUser,
//   FiFileText,
//   FiCamera,
//   FiMail,
//   FiPhone,
// } from "react-icons/fi";
// import Webcam from "react-webcam";
// import BookingHistory from "./BookingHistory";
// import Cookies from "js-cookie";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import HelpSupportForm from "./HelpSupportForm";
// import countries from "./countries";

// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const Profile = () => {
//   const [activeTab, setActiveTab] = useState("guestDetails");
//   const [guestDetails, setGuestDetails] = useState(null);
//   const [bookings, setBookings] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     emailid: "",
//     phonenumber: "",
//     client_type: "Leisure",
//     companyname: "",
//     employeeid: "",
//     companyid: "",
//     country: "",
//     countrycode: "+91",
//   });
//   const [profilePhotoFile, setProfilePhotoFile] = useState(null);
//   const [aadharFile, setAadharFile] = useState(null);
//   const [showWebcam, setShowWebcam] = useState(null);
//   const [validationErrors, setValidationErrors] = useState({
//     firstname: null,
//     lastname: null,
//   });

//   // OTP Verification States
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [otpIdentifier, setOtpIdentifier] = useState("");
//   const [otpType, setOtpType] = useState("email");
//   const [resendTimer, setResendTimer] = useState(300);
//   const [canResend, setCanResend] = useState(false);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [pendingUpdateData, setPendingUpdateData] = useState(null);

//   // Country dropdown state
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find(country => country.name === "India") || countries[0]
//   );
//   const [isCountryOpen, setIsCountryOpen] = useState(false);

//   const webcamRef = useRef(null);
//   const navigate = useNavigate();

//   const videoConstraints = {
//     width: 1280,
//     height: 720,
//     facingMode: "user",
//   };

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

//   const decryptUserData = async (encryptedData) => {
//     try {
//       const decryptedData = { ...encryptedData };
//       const fieldsToDecrypt = {};

//       if (encryptedData.email && encryptedData.email.length > 50) {
//         fieldsToDecrypt.email = encryptedData.email;
//       } else if (encryptedData.email) {
//         decryptedData.email = encryptedData.email;
//       }

//       const phoneStr = String(encryptedData.phone_number || "");
//       if (phoneStr && !/^[\d\+\-\s\(\)]+$/.test(phoneStr)) {
//         fieldsToDecrypt.phone_number = encryptedData.phone_number;
//       } else if (phoneStr) {
//         decryptedData.phone_number = encryptedData.phone_number;
//       }

//       if (encryptedData.country_code && encryptedData.country_code.length > 10) {
//         fieldsToDecrypt.country_code = encryptedData.country_code;
//       } else if (encryptedData.country_code) {
//         decryptedData.country_code = encryptedData.country_code;
//       }

//       if (Object.keys(fieldsToDecrypt).length === 0) {
//         return decryptedData;
//       }

//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/decrypt-fields`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           encrypted_fields: fieldsToDecrypt,
//         }),
//       });

//       if (response.status === 401) {
//         return decryptedData;
//       }

//       if (!response.ok) {
//         throw new Error(`Decryption failed: ${response.statusText}`);
//       }

//       const decryptedResult = await response.json();
//       return {
//         ...decryptedData,
//         ...decryptedResult,
//       };
//     } catch (error) {
//       console.error("Decryption error:", error);
//       return encryptedData;
//     }
//   };

//   const fetchGuestData = async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const guestId = Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
//       if (!guestId) {
//         throw new Error("No guest ID found");
//       }

//       const profileResponse = await fetch(
//         `${CQ_BASE_URL}/bq/api/guests/${guestId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (!profileResponse.ok) {
//         throw new Error(`Profile API Error: ${profileResponse.statusText}`);
//       }

//       const profileData = await profileResponse.json();
//       const guest = profileData.guest;

//       const isDecrypted = guest.emailid && guest.emailid.length < 50;

//       let guestData;
//       if (isDecrypted) {
//         guestData = {
//           guest_id: guestId,
//           firstname: guest.firstname || "",
//           lastname: guest.lastname || "",
//           emailid: guest.emailid || "",
//           phonenumber: guest.phonenumber || "",
//           countrycode: guest.countrycode || "+91",
//           client_type: guest.clienttype || "Leisure",
//           profilephoto: guest.profile_photo || null,
//           aadhar_file: guest.aadhar_image_url || null,
//           companyname: guest.companyname || "",
//           employeeid: guest.employeeid || "",
//           companyid: guest.companyid || "",
//           country: guest.country || "India",
//         };
//       } else {
//         const decryptedFields = await decryptUserData({
//           email: guest.emailid,
//           phone_number: guest.phonenumber,
//           country_code: guest.countrycode,
//         });

//         guestData = {
//           guest_id: guestId,
//           firstname: guest.firstname || "",
//           lastname: guest.lastname || "",
//           emailid: decryptedFields.email || guest.emailid || "",
//           phonenumber: decryptedFields.phone_number || guest.phonenumber || "",
//           countrycode: decryptedFields.country_code || guest.countrycode || "+91",
//           client_type: guest.clienttype || "Leisure",
//           profilephoto: guest.profile_photo || null,
//           aadhar_file: guest.aadhar_image_url || null,
//           companyname: guest.companyname || "",
//           employeeid: guest.employeeid || "",
//           companyid: guest.companyid || "",
//           country: guest.country || "India",
//         };
//       }

//       setGuestDetails(guestData);
//       setFormData({
//         firstname: guestData.firstname,
//         lastname: guestData.lastname,
//         emailid: guestData.emailid,
//         phonenumber: guestData.phonenumber,
//         client_type: guestData.client_type,
//         companyname: guestData.companyname,
//         employeeid: guestData.employeeid,
//         companyid: guestData.companyid,
//         country: guestData.country,
//         countrycode: guestData.countrycode,
//       });

//       // Set selected country based on both country name and code
//       let guestCountry = countries.find(country =>
//         country.name === guestData.country ||
//         country.code === (guestData.countrycode || "+91")
//       );
//       if (!guestCountry) {
//         guestCountry = countries.find(country => country.code === "+91") || countries[0];
//       }
//       setSelectedCountry(guestCountry);

//       // Fetch bookings
//       const bookingsResponse = await fetch(
//         `${CQ_BASE_URL}/bq/api/profile/bookings/?guestid=${guestId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (bookingsResponse.ok) {
//         const bookingsData = await bookingsResponse.json();
//         setBookings(bookingsData.bookings || []);
//       }
//     } catch (err) {
//       console.error("Error in fetchGuestData:", err);
//       setError(err.message);
//       toast.error(`Failed to load profile: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getGuestIdFromToken = (token) => {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       return payload.sub;
//     } catch (e) {
//       console.error("Error parsing token:", e);
//       return null;
//     }
//   };

//   useEffect(() => {
//     fetchGuestData();
//   }, []);

//   const validateName = (name) => {
//     if (!name.trim()) {
//       return "This field is required";
//     }
//     if (name.trim().length < 2) {
//       return "Must be at least 2 characters long";
//     }
//     if (/\d/.test(name)) {
//       return "Should not contain numbers";
//     }
//     return null;
//   };

//   const captureImage = () => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     const blob = dataURLtoBlob(imageSrc);
//     const file = new File([blob], `${showWebcam}-capture-${Date.now()}.jpg`, {
//       type: "image/jpeg",
//     });

//     if (showWebcam === "profile") {
//       setProfilePhotoFile(file);
//     } else {
//       setAadharFile(file);
//     }
//     setShowWebcam(null);
//   };

//   function dataURLtoBlob(dataurl) {
//     const arr = dataurl.split(",");
//     const mime = arr[0].match(/:(.*?);/)[1];
//     const bstr = atob(arr[1]);
//     let n = bstr.length;
//     const u8arr = new Uint8Array(n);
//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new Blob([u8arr], { type: mime });
//   }

//   const openEditModal = () => {
//     if (guestDetails) {
//       setFormData({
//         firstname: guestDetails.firstname || "",
//         lastname: guestDetails.lastname || "",
//         emailid: guestDetails.emailid || "",
//         phonenumber: guestDetails.phonenumber || "",
//         client_type: guestDetails.client_type || "Leisure",
//         companyname: guestDetails.companyname || "",
//         employeeid: guestDetails.employeeid || "",
//         companyid: guestDetails.companyid || "",
//         country: guestDetails.country || "India",
//         countrycode: guestDetails.countrycode || "+91",
//       });

//       // Set selected country based on both country name and code
//       let guestCountry = countries.find(country =>
//         country.name === guestDetails.country ||
//         country.code === (guestDetails.countrycode || "+91")
//       );
//       if (!guestCountry) {
//         guestCountry = countries.find(country => country.code === "+91") || countries[0];
//       }
//       setSelectedCountry(guestCountry);
//     }
//     setIsEditModalOpen(true);
//   };

//   const closeEditModal = () => {
//     setIsEditModalOpen(false);
//     setShowWebcam(null);
//     setProfilePhotoFile(null);
//     setAadharFile(null);
//     setOtpError("");
//     setPendingUpdateData(null);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "firstname" || name === "lastname") {
//       const error = validateName(value);
//       setValidationErrors((prev) => ({
//         ...prev,
//         [name]: error,
//       }));
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleProfilePhotoChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setProfilePhotoFile(e.target.files[0]);
//     }
//   };

//   const handleAadharChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setAadharFile(e.target.files[0]);
//     }
//   };

//   const sendOtpForField = async (field, value) => {
//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       // For phone numbers, include the country code
//       let identifier = value;
//       if (field === "phone") {
//         // Format: +919876543210
//         identifier = `${selectedCountry.code}${value}`;
//         console.log("Sending OTP to phone with country code:", identifier);
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/send-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           identifier: identifier
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to send OTP");
//       }

//       const data = await response.json();
//       console.log("OTP sent response:", data);

//       setOtpIdentifier(identifier);
//       setOtpType(field);
//       setShowOtpModal(true);
//       setResendTimer(300);
//       setCanResend(false);
//       toast.info(`Verification code sent to your ${field === 'email' ? 'email' : 'phone number'}`);
//     } catch (error) {
//       console.error("Error sending OTP:", error);
//       toast.error(error.message);
//     }
//   };

//   const handleVerifyOtp = async () => {
//     if (otp.length !== 6) {
//       setOtpError("Please enter 6-digit OTP");
//       return;
//     }

//     setIsVerifying(true);

//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${accessToken}`,
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

//       toast.success(`${otpType === 'email' ? 'Email' : 'Phone number'} verified successfully!`);

//       setShowOtpModal(false);
//       setOtp("");
//       setOtpError("");

//       // After successful verification, submit the profile update
//       await submitProfileUpdate();

//     } catch (error) {
//       console.error("OTP verification error:", error);
//       toast.error(error.message);
//       setOtpError(error.message);
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/resend-secondary-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${accessToken}`,
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
//     }
//   };

//   const submitProfileUpdate = async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const formDataToSend = new FormData();
//       formDataToSend.append("guest_id", guestDetails.guest_id);
//       formDataToSend.append("firstname", formData.firstname);
//       formDataToSend.append("lastname", formData.lastname);
//       formDataToSend.append("emailid", formData.emailid);
//       formDataToSend.append("phonenumber", formData.phonenumber.toString());
//       formDataToSend.append("country", selectedCountry.name);
//       formDataToSend.append("countrycode", selectedCountry.code);
//       formDataToSend.append("clienttype", formData.client_type);

//       if (formData.client_type === "Corporate") {
//         if (!formData.companyname?.trim() || !formData.companyid?.trim()) {
//           throw new Error("Company Name and Company ID are required for Corporate guests");
//         }
//         formDataToSend.append("companyname", formData.companyname);
//         formDataToSend.append("companyid", formData.companyid);
//       } else {
//         formDataToSend.append("companyname", "");
//         formDataToSend.append("companyid", "");
//       }

//       formDataToSend.append("employeeid", "");

//       if (profilePhotoFile) {
//         formDataToSend.append("file", profilePhotoFile);
//       }
//       if (aadharFile) {
//         formDataToSend.append("aadhar_file", aadharFile);
//       }

//       const response = await fetch(`${CQ_BASE_URL}/bq/api/update_profile`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: formDataToSend,
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.detail || result.message || "Failed to update profile");
//       }

//       if (result.message === "No changes detected") {
//         toast.info("No changes were made");
//         setIsEditModalOpen(false);
//         return;
//       }

//       await fetchGuestData();
//       toast.success("Profile updated successfully!");
//       setIsEditModalOpen(false);
//       setPendingUpdateData(null);

//     } catch (err) {
//       console.error("Error in submitProfileUpdate:", err);
//       setError(err.message);
//       toast.error(err.message || "Failed to update profile");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);

//     // Validate names
//     const firstnameError = validateName(formData.firstname);
//     const lastnameError = validateName(formData.lastname);

//     setValidationErrors({
//       firstname: firstnameError,
//       lastname: lastnameError,
//     });

//     if (firstnameError || lastnameError) {
//       return;
//     }

//     // Check what changed
//     const originalEmail = guestDetails?.emailid;
//     const originalPhone = guestDetails?.phonenumber;
//     const emailChanged = formData.emailid !== originalEmail;
//     const phoneChanged = formData.phonenumber !== originalPhone;

//     // Store the updated data for later use
//     setPendingUpdateData({
//       emailChanged,
//       phoneChanged,
//       newEmail: formData.emailid,
//       newPhone: formData.phonenumber,
//       countryCode: selectedCountry.code
//     });

//     // If email changed and has value, send OTP first
//     if (emailChanged && formData.emailid && formData.emailid.trim() !== "") {
//       await sendOtpForField("email", formData.emailid);
//       return;
//     }

//     // If phone changed and has value, send OTP first
//     if (phoneChanged && formData.phonenumber && formData.phonenumber.toString().trim() !== "") {
//       await sendOtpForField("phone", formData.phonenumber);
//       return;
//     }

//     // If no verification needed, submit directly
//     await submitProfileUpdate();
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
//         <p className="ml-4">Loading profile data...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen p-4">
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
//           <strong className="font-bold">Error loading profile!</strong>
//           <span className="block sm:inline"> {error}</span>
//           <button
//             onClick={fetchGuestData}
//             className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!guestDetails) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen p-4">
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md">
//           <strong className="font-bold">No profile data found!</strong>
//           <span className="block sm:inline"> Please check your authentication.</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white mt-16 p-6">
//       <button
//         onClick={() => navigate(-1)}
//         className="absolute top-24 left-5 text-black hover:text-gray-700 transition font-semibold text-2xl"
//       >
//         <IoMdArrowRoundBack size={32} />
//       </button>

//       <div className="flex justify-start px-10">
//         {[
//           { id: "guestDetails", label: "Guest Details" },
//           { id: "bookingHistory", label: "Reservation History" },
//           { id: "helpSupport", label: "Help & Support" },
//         ].map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             className={`py-2 px-4 font-semibold ${activeTab === tab.id
//               ? "border-b-2 border-gray-500 text-black"
//               : "text-gray-400"
//               }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {activeTab === "guestDetails" && guestDetails && (
//         <div className="px-4 sm:px-6 lg:px-8 py-3 w-full mx-auto">
//           <div className="text-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">Guest Profile</h2>
//             <p className="text-gray-500 max-w-2xl mx-auto">
//               Review and manage guest information. All personal details are
//               securely stored and protected
//             </p>
//           </div>

//           <div className="flex flex-col lg:flex-row gap-8">
//             {/* Profile Card */}
//             <div className="w-full lg:w-1/3">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="h-48 bg-gradient-to-r from-blue-50 to-gray-50 flex items-center justify-center">
//                   {guestDetails.profilephoto ? (
//                     <img
//                       src={guestDetails.profilephoto}
//                       alt="Profile"
//                       className="object-cover w-40 h-40 rounded-full border-4 border-white shadow-md"
//                       onError={(e) => {
//                         e.target.src =
//                           "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png";
//                       }}
//                     />
//                   ) : (
//                     <div className="w-40 h-40 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
//                       <FiUser className="w-20 h-20 text-gray-400" />
//                     </div>
//                   )}
//                 </div>
//                 <div className="p-6 text-center">
//                   <h3 className="text-xl font-semibold text-gray-900">
//                     {guestDetails.firstname} {guestDetails.lastname}
//                   </h3>
//                   <p className="text-gray-500 mt-1">
//                     {guestDetails.client_type} Guest
//                   </p>
//                 </div>
//               </div>

//               <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   Aadhar Card
//                 </h3>
//                 {guestDetails.aadhar_file ? (
//                   <div className="flex justify-center">
//                     <img
//                       src={guestDetails.aadhar_file}
//                       alt="Aadhar Card"
//                       className="max-w-full h-auto rounded border border-gray-200"
//                       onError={(e) => {
//                         e.target.src = "";
//                         e.target.parentElement.innerHTML = (
//                           <div className="text-center p-4 bg-gray-100 rounded-lg">
//                             <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
//                             <p className="mt-2 text-gray-500">
//                               Aadhar image could not be loaded
//                             </p>
//                           </div>
//                         );
//                       }}
//                     />
//                   </div>
//                 ) : (
//                   <div className="text-center p-4 bg-gray-100 rounded-lg">
//                     <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
//                     <p className="mt-2 text-gray-500">
//                       No Aadhar card uploaded
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Information Card */}
//             <div className="w-full lg:w-2/3">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Personal Information
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                   {[
//                     {
//                       label: "Full Name",
//                       value: `${guestDetails.firstname.charAt(0).toUpperCase() +
//                         guestDetails.firstname.slice(1)
//                         } ${guestDetails.lastname.charAt(0).toUpperCase() +
//                         guestDetails.lastname.slice(1)
//                         }`,
//                       icon: <FiUser className="w-5 h-5 text-gray-400" />,
//                     },
//                     {
//                       label: "Email Address",
//                       value: guestDetails.emailid,
//                       icon: <FiMail className="w-5 h-5 text-gray-400" />,
//                     },
//                     {
//                       label: "Phone Number",
//                       value: guestDetails.phonenumber,
//                       icon: <FiPhone className="w-5 h-5 text-gray-400" />,
//                     },
//                     {
//                       label: "Profile Type",
//                       value: guestDetails.client_type,
//                       icon: <FiUser className="w-5 h-5 text-gray-400" />,
//                     },
//                     ...(guestDetails.client_type === "Corporate"
//                       ? [
//                         {
//                           label: "Company Name",
//                           value: guestDetails.companyname || "Not provided",
//                           icon: <FiFileText className="w-5 h-5 text-gray-400" />,
//                         },
//                         {
//                           label: "Company ID",
//                           value: guestDetails.companyid || "Not provided",
//                           icon: <FiFileText className="w-5 h-5 text-gray-400" />,
//                         },
//                       ]
//                       : []),
//                   ].map(({ label, value, icon }, index) => (
//                     <div key={index} className="bg-gray-50 rounded-lg p-2">
//                       <div className="flex items-center space-x-3">
//                         <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">
//                           {icon}
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-500">
//                             {label}
//                           </p>
//                           <p
//                             className="text-sm font-medium text-gray-900 mt-1"
//                             style={{
//                               maxWidth: '180px',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap'
//                             }}
//                             title={value}
//                           >
//                             {value}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
//                   <button
//                     onClick={openEditModal}
//                     className="px-2 py-2.5 bg-black text-sm text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center"
//                   >
//                     <FiEdit2 className="mr-2" /> Update Information
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Edit Modal */}
//           {isEditModalOpen && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//               <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
//                 <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
//                   <h3 className="text-xl font-semibold text-gray-900">
//                     Edit Profile
//                   </h3>
//                   <button
//                     onClick={closeEditModal}
//                     className="text-gray-500 hover:text-gray-700"
//                   >
//                     <FiX size={24} />
//                   </button>
//                 </div>
//                 <form onSubmit={handleSubmit} className="p-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         First Name *
//                       </label>
//                       <input
//                         type="text"
//                         name="firstname"
//                         value={formData.firstname}
//                         onChange={handleInputChange}
//                         className={`w-full text-transform: capitalize p-2 border ${validationErrors.firstname
//                           ? "border-red-500"
//                           : "border-gray-300"
//                           } rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                         required
//                       />
//                       {validationErrors.firstname && (
//                         <p className="text-red-500 text-xs mt-1">
//                           {validationErrors.firstname}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Last Name *
//                       </label>
//                       <input
//                         type="text"
//                         name="lastname"
//                         value={formData.lastname}
//                         onChange={handleInputChange}
//                         className={`w-full p-2 text-transform: capitalize border ${validationErrors.lastname
//                           ? "border-red-500"
//                           : "border-gray-300"
//                           } rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
//                         required
//                       />
//                       {validationErrors.lastname && (
//                         <p className="text-red-500 text-xs mt-1">
//                           {validationErrors.lastname}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Email *
//                       </label>
//                       <input
//                         type="email"
//                         name="emailid"
//                         value={formData.emailid}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         required
//                       />
//                       {formData.emailid !== guestDetails?.emailid && formData.emailid && (
//                         <p className="text-xs text-blue-600 mt-1">
//                           Verification OTP will be sent to this email
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Phone Number *
//                       </label>
//                       <input
//                         type="tel"
//                         name="phonenumber"
//                         value={formData.phonenumber}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         required
//                       />
//                       {formData.phonenumber !== guestDetails?.phonenumber && formData.phonenumber && (
//                         <p className="text-xs text-blue-600 mt-1">
//                           Verification OTP will be sent to this number
//                         </p>
//                       )}
//                     </div>

//                     <div>
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
//                           <span className="ml-2 font-semibold">v</span>
//                         </button>

//                         {isCountryOpen && (
//                           <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
//                             {countries.map((country) => (
//                               <div
//                                 key={country.code}
//                                 onClick={() => {
//                                   setSelectedCountry(country);
//                                   setIsCountryOpen(false);
//                                   // Update the country code in form data
//                                   setFormData(prev => ({
//                                     ...prev,
//                                     countrycode: country.code,
//                                     country: country.name
//                                   }));
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

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Profile Type
//                       </label>
//                       <select
//                         name="client_type"
//                         value={formData.client_type}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         required
//                       >
//                         <option value="Leisure">Leisure</option>
//                         <option value="Corporate">Corporate</option>
//                       </select>
//                     </div>

//                     {formData.client_type === "Corporate" && (
//                       <>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Corporate Name *
//                           </label>
//                           <input
//                             type="text"
//                             name="companyname"
//                             value={formData.companyname}
//                             onChange={handleInputChange}
//                             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                             placeholder="Enter company name"
//                             required
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Corporate ID *
//                           </label>
//                           <input
//                             type="text"
//                             name="companyid"
//                             value={formData.companyid}
//                             onChange={handleInputChange}
//                             className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                             placeholder="Enter company ID"
//                             required
//                           />
//                         </div>
//                       </>
//                     )}
//                   </div>

//                   {/* File Uploads */}
//                   <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Profile Photo
//                       </label>
//                       {showWebcam === "profile" ? (
//                         <div className="space-y-4">
//                           <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
//                             <Webcam
//                               audio={false}
//                               ref={webcamRef}
//                               screenshotFormat="image/jpeg"
//                               videoConstraints={videoConstraints}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               type="button"
//                               onClick={captureImage}
//                               className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
//                             >
//                               <FiCamera className="mr-2" /> Capture Photo
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => setShowWebcam(null)}
//                               className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <div className="flex items-center">
//                             <label className="flex flex-col items-center justify-center w-full p-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
//                               <div className="flex flex-col items-center justify-center pt-2 pb-3">
//                                 <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
//                                 <p className="text-sm text-gray-500">
//                                   {profilePhotoFile
//                                     ? profilePhotoFile.name
//                                     : "Click to upload"}
//                                 </p>
//                               </div>
//                               <input
//                                 type="file"
//                                 className="hidden"
//                                 onChange={handleProfilePhotoChange}
//                                 accept="image/*"
//                               />
//                             </label>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => setShowWebcam("profile")}
//                             className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center"
//                           >
//                             <FiCamera className="mr-2" /> Take Photo with Camera
//                           </button>
//                         </div>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Aadhar Card
//                       </label>
//                       {showWebcam === "aadhar" ? (
//                         <div className="space-y-4">
//                           <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
//                             <Webcam
//                               audio={false}
//                               ref={webcamRef}
//                               screenshotFormat="image/jpeg"
//                               videoConstraints={videoConstraints}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               type="button"
//                               onClick={captureImage}
//                               className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
//                             >
//                               <FiCamera className="mr-2" /> Capture Aadhar
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => setShowWebcam(null)}
//                               className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <div className="flex items-center">
//                             <label className="flex flex-col items-center justify-center w-full p-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
//                               <div className="flex flex-col items-center justify-center pt-2 pb-3">
//                                 <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
//                                 <p className="text-sm text-gray-500">
//                                   {aadharFile
//                                     ? aadharFile.name
//                                     : "Click to upload"}
//                                 </p>
//                               </div>
//                               <input
//                                 type="file"
//                                 className="hidden"
//                                 onChange={handleAadharChange}
//                                 accept="image/*,.pdf"
//                               />
//                             </label>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => setShowWebcam("aadhar")}
//                             className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center"
//                           >
//                             <FiCamera className="mr-2" /> Capture Aadhar with
//                             Camera
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {error && (
//                     <div className="mb-4 mt-4 p-2 bg-red-100 text-red-700 rounded">
//                       {error}
//                     </div>
//                   )}

//                   <div className="mt-6 flex justify-end space-x-3">
//                     <button
//                       type="button"
//                       onClick={closeEditModal}
//                       className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 flex items-center"
//                       disabled={
//                         isLoading ||
//                         validationErrors.firstname ||
//                         validationErrors.lastname
//                       }
//                     >
//                       {isLoading ? (
//                         "Saving..."
//                       ) : (
//                         <>
//                           <FiCheck className="mr-2" /> Save Changes
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           )}

//           {/* OTP Verification Modal */}
//           {showOtpModal && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
//                 <button
//                   onClick={() => {
//                     setShowOtpModal(false);
//                     setOtp("");
//                     setOtpError("");
//                   }}
//                   className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
//                   aria-label="Close"
//                 >
//                   <svg
//                     className="h-6 w-6"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>

//                 <div className="p-6 sm:p-8">
//                   <div className="text-center">
//                     <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-200 mb-4">
//                       {otpType === 'email' ? (
//                         <FiMail className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
//                       ) : (
//                         <FiPhone className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
//                       )}
//                     </div>
//                     <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
//                       Verify Your {otpType === 'email' ? 'Email' : 'Phone Number'}
//                     </h2>
//                     <p className="text-gray-600 mb-6 text-sm sm:text-base">
//                       We've sent a 6-digit verification code to{" "}
//                       <span className="font-semibold text-black">
//                         {otpIdentifier}
//                       </span>
//                     </p>
//                   </div>

//                   <div className="mb-6">
//                     <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
//                       Enter verification code
//                     </label>
//                     <div className="flex justify-center space-x-2 sm:space-x-3">
//                       {[0, 1, 2, 3, 4, 5].map((index) => (
//                         <input
//                           key={index}
//                           type="text"
//                           maxLength="1"
//                           value={otp[index] || ""}
//                           onChange={(e) => {
//                             const value = e.target.value.replace(/\D/g, "");
//                             if (value === e.target.value) {
//                               const newOtp = otp.split("");
//                               newOtp[index] = value;
//                               setOtp(newOtp.join(""));

//                               if (value && index < 5) {
//                                 document
//                                   .getElementById(`otp-input-${index + 1}`)
//                                   ?.focus();
//                               }

//                               if (otpError) setOtpError("");
//                             }
//                           }}
//                           onKeyDown={(e) => {
//                             if (e.key === "Backspace" && !otp[index] && index > 0) {
//                               document
//                                 .getElementById(`otp-input-${index - 1}`)
//                                 ?.focus();
//                             }
//                           }}
//                           id={`otp-input-${index}`}
//                           className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl text-center border ${
//                             otpError ? "border-red-500" : "border-gray-300"
//                           } rounded-md focus:outline-none focus:ring-2 focus:ring-black`}
//                           inputMode="numeric"
//                           pattern="[0-9]*"
//                         />
//                       ))}
//                     </div>
//                     {otpError && (
//                       <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>
//                     )}
//                   </div>

//                   <div className="flex flex-col space-y-3">
//                     <button
//                       onClick={handleVerifyOtp}
//                       className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors disabled:opacity-50"
//                       disabled={isVerifying || otp.length !== 6}
//                     >
//                       {isVerifying ? (
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
//                           Verifying...
//                         </span>
//                       ) : (
//                         "Verify and Update"
//                       )}
//                     </button>
//                   </div>
//                   <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
//                     Didn't receive code?{" "}
//                     {canResend ? (
//                       <button
//                         className="font-medium text-blue-600 hover:text-blue-500"
//                         onClick={handleResendOtp}
//                         disabled={isVerifying}
//                       >
//                         Resend OTP
//                       </button>
//                     ) : (
//                       <span className="text-gray-500">
//                         Resend OTP in {resendTimer} seconds
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {activeTab === "bookingHistory" && <BookingHistory bookings={bookings} />}
//       {activeTab === "helpSupport" && <HelpSupportForm guestDetails={guestDetails} />}

//       <ToastContainer />
//     </div>
//   );
// };

// export default Profile;

// import React, { useState, useEffect, useRef } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { IoMdArrowRoundBack } from "react-icons/io";
// import {
//   FiEdit2,
//   FiX,
//   FiCheck,
//   FiUpload,
//   FiUser,
//   FiFileText,
//   FiCamera,
// } from "react-icons/fi";
// import Webcam from "react-webcam";
// import BookingHistory from "./BookingHistory";
// import Cookies from "js-cookie";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import HelpSupportForm from "./HelpSupportForm";
// import countries from "../CHECK-IN/Walk-In/countries"; // Import countries data

// const BQ_BASE_URL = process.env.REACT_APP_BQ_BASE_URL;

// const Profile = () => {
//   const [activeTab, setActiveTab] = useState("guestDetails");
//   const [guestDetails, setGuestDetails] = useState(null);
//   const [bookings, setBookings] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [issueCategory, setIssueCategory] = useState("");
//   const [error, setError] = useState(null);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     firstname: "",
//     lastname: "",
//     emailid: "",
//     phonenumber: "",
//     client_type: "Leisure",
//     companyname: "",
//     employeeid: "",
//     companyid: "",
//     country: "", // Added country field
//   });
//   const [profilePhotoFile, setProfilePhotoFile] = useState(null);
//   const [aadharFile, setAadharFile] = useState(null);
//   const [showWebcam, setShowWebcam] = useState(null);
//   const [validationErrors, setValidationErrors] = useState({
//     firstname: null,
//     lastname: null,
//   });

//   // Country dropdown state
//   const [selectedCountry, setSelectedCountry] = useState(
//     countries.find(country => country.name === "India") || countries[0]
//   );
//   const [isCountryOpen, setIsCountryOpen] = useState(false);

//   const webcamRef = useRef(null);
//   const navigate = useNavigate();

//   console.log("Current guestDetails:", guestDetails); // Debug log

//   const videoConstraints = {
//     width: 1280,
//     height: 720,
//     facingMode: "user",
//   };

//   // Fetch guest data from API
//   const fetchGuestData = async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const guestId =
//         Cookies.get("guest_id") || getGuestIdFromToken(accessToken);
//       if (!guestId) {
//         throw new Error("No guest ID found");
//       }

//       // Fetch profile data
//       const profileResponse = await fetch(
//         `${BQ_BASE_URL}/bq/api/profile?guest_id=${guestId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (!profileResponse.ok) {
//         throw new Error(`Profile API Error: ${profileResponse.statusText}`);
//       }

//       const profileData = await profileResponse.json();

//       // Check if data is already decrypted
//       const isDecrypted =
//         profileData.emailid && profileData.emailid.length < 50;

//       let guestData;
//       if (isDecrypted) {
//         console.log("Data appears already decrypted");
//         guestData = {
//           guest_id: guestId,
//           firstname: profileData.firstname || "",
//           lastname: profileData.lastname || "",
//           emailid: profileData.emailid || "",
//           phonenumber: profileData.phonenumber || "",
//           countrycode: profileData.countrycode || "+91",
//           client_type: profileData.clienttype || "Leisure",
//           profilephoto: profileData.profilephoto || null,
//           aadhar_file: profileData.aadhar_image_url || null,
//           companyname: profileData.companyname || "",
//           employeeid: profileData.employeeid || "",
//           companyid: profileData.companyid || "",
//           country: profileData.country || "India", // Added country
//         };
//       } else {
//         console.log("Attempting to decrypt data");
//         const decryptedFields = await decryptUserData({
//           email: profileData.emailid,
//           phone_number: profileData.phonenumber,
//           country_code: profileData.countrycode,
//         });

//         guestData = {
//           guest_id: guestId,
//           firstname: profileData.firstname || "",
//           lastname: profileData.lastname || "",
//           emailid: decryptedFields.email || profileData.emailid || "",
//           phonenumber:
//             decryptedFields.phone_number || profileData.phonenumber || "",
//           countrycode:
//             decryptedFields.country_code || profileData.countrycode || "+91",
//           client_type: profileData.clienttype || "Leisure",
//           profilephoto: profileData.profilephoto || null,
//           aadhar_file: profileData.aadhar_image_url || null,
//           companyname: profileData.companyname || "",
//           employeeid: profileData.employeeid || "",
//           companyid: profileData.companyid || "",
//           country: profileData.country || "India", // Added country
//         };
//       }

//       setGuestDetails(guestData);
//       setFormData({
//         firstname: guestData.firstname,
//         lastname: guestData.lastname,
//         emailid: guestData.emailid,
//         phonenumber: guestData.phonenumber,
//         client_type: guestData.client_type,
//         companyname: guestData.companyname,
//         employeeid: guestData.employeeid,
//         companyid: guestData.companyid,
//         country: guestData.country, // Set country in form data
//       });

//       // Set selected country based on guest data
//       const guestCountry = countries.find(country => country.name === guestData.country) || countries[0];
//       setSelectedCountry(guestCountry);

//       // Fetch bookings
//       const bookingsResponse = await fetch(
//         `${BQ_BASE_URL}/bq/api/profile/bookings/?guestid=${guestId}`,
//         {
//           method: "GET",
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );

//       if (bookingsResponse.ok) {
//         const bookingsData = await bookingsResponse.json();
//         setBookings(bookingsData.bookings || []);
//       }
//     } catch (err) {
//       console.error("Error in fetchGuestData:", err);
//       setError(err.message);
//       toast.error(`Failed to load profile: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Helper function to extract guest ID from JWT token
//   const getGuestIdFromToken = (token) => {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       return payload.sub;
//     } catch (e) {
//       console.error("Error parsing token:", e);
//       return null;
//     }
//   };

//   useEffect(() => {
//     fetchGuestData();
//   }, []);

//   const validateName = (name) => {
//     if (!name.trim()) {
//       return "This field is required";
//     }
//     if (name.trim().length < 2) {
//       return "Must be at least 2 characters long";
//     }
//     if (/\d/.test(name)) {
//       return "Should not contain numbers";
//     }
//     return null;
//   };

//   const captureImage = () => {
//     const imageSrc = webcamRef.current.getScreenshot();
//     const blob = dataURLtoBlob(imageSrc);
//     const file = new File([blob], `${showWebcam}-capture-${Date.now()}.jpg`, {
//       type: "image/jpeg",
//     });

//     if (showWebcam === "profile") {
//       setProfilePhotoFile(file);
//     } else {
//       setAadharFile(file);
//     }
//     setShowWebcam(null);
//   };

//   function dataURLtoBlob(dataurl) {
//     const arr = dataurl.split(",");
//     const mime = arr[0].match(/:(.*?);/)[1];
//     const bstr = atob(arr[1]);
//     let n = bstr.length;
//     const u8arr = new Uint8Array(n);
//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n);
//     }
//     return new Blob([u8arr], { type: mime });
//   }

//   const openEditModal = () => {
//     // Ensure we have the latest guestDetails before opening modal
//     if (guestDetails) {
//       setFormData({
//         firstname: guestDetails.firstname || "",
//         lastname: guestDetails.lastname || "",
//         emailid: guestDetails.emailid || "",
//         phonenumber: guestDetails.phonenumber || "",
//         client_type: guestDetails.client_type || "Leisure",
//         companyname: guestDetails.companyname || "",
//         employeeid: guestDetails.employeeid || "",
//         companyid: guestDetails.companyid || "",
//         country: guestDetails.country || "India",
//       });

//       // Set selected country based on guest data
//       const guestCountry = countries.find(country => country.name === guestDetails.country) || countries[0];
//       setSelectedCountry(guestCountry);
//     }
//     setIsEditModalOpen(true);
//   };
//   const closeEditModal = () => {
//     setIsEditModalOpen(false);
//     setShowWebcam(null);
//     // if (guestDetails) {
//     //   setFormData({
//     //     firstname: guestDetails.firstname,
//     //     lastname: guestDetails.lastname,
//     //     emailid: guestDetails.emailid,
//     //     phonenumber: guestDetails.phonenumber,
//     //     client_type: guestDetails.client_type,
//     //     companyname: guestDetails.companyname,
//     //     employeeid: guestDetails.employeeid,
//     //     companyid: guestDetails.companyid,
//     //     country: guestDetails.country,
//     //   });
//     //   // Reset selected country
//     //   const guestCountry = countries.find(country => country.name === guestDetails.country) || countries[0];
//     //   setSelectedCountry(guestCountry);
//     // }
//     setProfilePhotoFile(null);
//     setAadharFile(null);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     // Special validation for name fields
//     if (name === "firstname" || name === "lastname") {
//       const error = validateName(value);
//       setValidationErrors((prev) => ({
//         ...prev,
//         [name]: error,
//       }));
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleProfilePhotoChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setProfilePhotoFile(e.target.files[0]);
//     }
//   };

//   const handleAadharChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setAadharFile(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);

//     // Validation checks
//     const firstnameError = validateName(formData.firstname);
//     const lastnameError = validateName(formData.lastname);

//     setValidationErrors({
//       firstname: firstnameError,
//       lastname: lastnameError,
//     });

//     if (firstnameError || lastnameError) {
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const formDataToSend = new FormData();

//       // Required field - make sure the field name matches backend exactly
//       formDataToSend.append("guest_id", guestDetails.guest_id);

//       // Basic info
//       formDataToSend.append("firstname", formData.firstname);
//       formDataToSend.append("lastname", formData.lastname);
//       formDataToSend.append("emailid", formData.emailid);
//       formDataToSend.append("phonenumber", formData.phonenumber.toString());
//       formDataToSend.append("country", selectedCountry.name);
//       formDataToSend.append("clienttype", formData.client_type); // Make sure this matches backend parameter name

//       // Corporate fields - send them ALWAYS but with proper values
//       if (formData.client_type === "Corporate") {
//         // Validate corporate fields are not empty
//         if (!formData.companyname?.trim() || !formData.companyid?.trim()) {
//           throw new Error("Company Name and Company ID are required for Corporate guests");
//         }
//         formDataToSend.append("companyname", formData.companyname);
//         formDataToSend.append("companyid", formData.companyid);
//       } else {
//         // For Leisure, send empty strings explicitly
//         formDataToSend.append("companyname", "");
//         formDataToSend.append("companyid", "");
//       }

//       // Always send employeeid as empty string
//       formDataToSend.append("employeeid", "");

//       // File uploads
//       if (profilePhotoFile) {
//         formDataToSend.append("file", profilePhotoFile);
//       }
//       if (aadharFile) {
//         formDataToSend.append("aadhar_file", aadharFile);
//       }

//       // Debug: Log all form data entries
//       console.log("=== FINAL FORM DATA BEING SENT ===");
//       const formDataEntries = [];
//       for (let [key, value] of formDataToSend.entries()) {
//         if (key === 'file' || key === 'aadhar_file') {
//           formDataEntries.push(`${key}: ${value.name} (${value.type}, ${value.size} bytes)`);
//         } else {
//           formDataEntries.push(`${key}: "${value}"`);
//         }
//       }
//       console.log("Form Data Entries:", formDataEntries);
//       console.log("Total fields:", formDataEntries.length);
//       console.log("=== END FORM DATA ===");

//       // Test with a simpler approach - send the exact same data as your working cURL
//       console.log("=== COMPARING WITH CURL ===");
//       console.log("CURL sent: companyname=Deloitte, companyid=DELOITTE_COMP");
//       console.log("We are sending: companyname=" + formData.companyname + ", companyid=" + formData.companyid);

//       const response = await fetch(`${BQ_BASE_URL}/bq/api/update_profile`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: formDataToSend,
//       });

//       console.log("Update response status:", response.status);
//       console.log("Response OK:", response.ok);

//       if (!response.ok) {
//         let errorMessage = "Failed to update profile";
//         let errorDetail = "";
//         try {
//           const errorData = await response.json();
//           errorMessage = errorData.detail || errorData.message || errorMessage;
//           errorDetail = errorData.detail || "";
//           console.log("Full error response:", errorData);
//           console.log("Error detail:", errorDetail);
//         } catch (parseError) {
//           console.log("Could not parse error response as JSON");
//           // Try to get text response
//           const textResponse = await response.text();
//           console.log("Text response:", textResponse);
//         }
//         throw new Error(errorMessage);
//       }

//       const result = await response.json();
//       console.log("Update API response:", result);

//       if (result.message === "No changes detected") {
//         toast.info("No changes were made");
//         setIsEditModalOpen(false);
//         return;
//       }

//       // Refresh data after successful update
//       await fetchGuestData();
//       toast.success("Profile updated successfully!");
//       setIsEditModalOpen(false);
//     } catch (err) {
//       console.error("Error in handleSubmit:", err);
//       setError(err.message);
//       toast.error(err.message || "Failed to update profile");
//     } finally {
//       setIsLoading(false);
//     }
//   };
//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
//         <p className="ml-4">Loading profile data...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen p-4">
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md">
//           <strong className="font-bold">Error loading profile!</strong>
//           <span className="block sm:inline"> {error}</span>
//           <button
//             onClick={fetchGuestData}
//             className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!guestDetails) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen p-4">
//         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md">
//           <strong className="font-bold">No profile data found!</strong>
//           <span className="block sm:inline">
//             {" "}
//             Please check your authentication.
//           </span>
//         </div>
//       </div>
//     );
//   }

//   // Updated decryptUserData function
//   const decryptUserData = async (encryptedData) => {
//     try {
//       // First check if fields are already decrypted (short strings)
//       if (encryptedData.email && encryptedData.email.length < 50) {
//         console.log("Email appears already decrypted");
//         return encryptedData; // Assume already decrypted
//       }

//       const accessToken = Cookies.get("access_token");
//       if (!accessToken) {
//         throw new Error("No access token found");
//       }

//       const response = await fetch(`${BQ_BASE_URL}/bq/api/decrypt-fields`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({
//           encrypted_fields: {
//             email: encryptedData.email,
//             phone_number: encryptedData.phonenumber,
//             country_code: encryptedData.countrycode,
//           },
//         }),
//       });

//       console.log("Decrypt response status:", response.status);

//       if (response.status === 401) {
//         console.warn("Decryption unauthorized - using encrypted data");
//         return encryptedData; // Fallback to encrypted data
//       }

//       if (!response.ok) {
//         throw new Error(`Decryption failed: ${response.statusText}`);
//       }

//       return await response.json();
//     } catch (error) {
//       console.error("Decryption error:", error);
//       return encryptedData; // Fallback to encrypted data
//     }
//   };

//   return (
//     <div className="bg-white mt-16 p-6">
//       {/* Back Button */}
//       <button
//         onClick={() => navigate(-1)}
//         className="absolute top-24 left-5 text-black hover:text-gray-700 transition font-semibold text-2xl"
//       >
//         <IoMdArrowRoundBack size={32} />
//       </button>

//       {/* Tabs */}
//       <div className="flex justify-start   px-10">
//         {[
//           { id: "guestDetails", label: "Guest Details" },
//           { id: "bookingHistory", label: "Reservation History" },
//           { id: "helpSupport", label: "Help & Support" },
//         ].map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id)}
//             className={`py-2 px-4 font-semibold ${activeTab === tab.id
//               ? "border-b-2 border-gray-500 text-black"
//               : "text-gray-400"
//               }`}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {activeTab === "guestDetails" && guestDetails && (
//         <div className="px-4 sm:px-6 lg:px-8 py-3 w-full mx-auto">
//           {/* Section Heading */}
//           <div className="text-center mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">Guest Profile</h2>
//             <p className="text-gray-500 max-w-2xl mx-auto ">
//               Review and manage guest information. All personal details are
//               securely stored and protected
//             </p>
//           </div>

//           {/* Main Content */}
//           <div className="flex flex-col lg:flex-row gap-8">
//             {/* Profile Card */}
//             <div className="w-full lg:w-1/3">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <div className="h-48 bg-gradient-to-r from-blue-50 to-gray-50 flex items-center justify-center">
//                   {guestDetails.profilephoto ? (
//                     <img
//                       src={guestDetails.profilephoto}
//                       alt="Profile"
//                       className="object-cover w-40 h-40 rounded-full border-4 border-white shadow-md"
//                       onError={(e) => {
//                         e.target.src =
//                           "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_640.png";
//                       }}
//                     />
//                   ) : (
//                     <div className="w-40 h-40 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
//                       <FiUser className="w-20 h-20 text-gray-400" />
//                     </div>
//                   )}
//                 </div>
//                 <div className="p-6 text-center">
//                   <h3 className="text-xl  font-semibold text-gray-900">
//                     {guestDetails.firstname} {guestDetails.lastname}
//                   </h3>
//                   <p className="text-gray-500 mt-1">
//                     {guestDetails.client_type} Guest
//                   </p>
//                   <div className="mt-4 flex justify-center space-x-4">
//                     <a
//                       href={`mailto:${guestDetails.emailid}`}
//                       className="text-blue-600 hover:text-blue-800 transition-colors"
//                     >
//                       <svg
//                         className="w-5 h-5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                         />
//                       </svg>
//                     </a>
//                     <a
//                       href={`tel:${guestDetails.phonenumber}`}
//                       className="text-blue-600 hover:text-blue-800 transition-colors"
//                     >
//                       <svg
//                         className="w-5 h-5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
//                         />
//                       </svg>
//                     </a>
//                   </div>
//                 </div>
//               </div>

//               {/* Aadhar Card Section */}
//               <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   Aadhar Card
//                 </h3>
//                 {guestDetails.aadhar_file ? (
//                   <div className="flex justify-center">
//                     <img
//                       src={guestDetails.aadhar_file}
//                       alt="Aadhar Card"
//                       className="max-w-full h-auto rounded border border-gray-200"
//                       onError={(e) => {
//                         e.target.src = "";
//                         e.target.parentElement.innerHTML = (
//                           <div className="text-center p-4 bg-gray-100 rounded-lg">
//                             <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
//                             <p className="mt-2 text-gray-500">
//                               Aadhar image could not be loaded
//                             </p>
//                           </div>
//                         );
//                       }}
//                     />
//                   </div>
//                 ) : (
//                   <div className="text-center p-4 bg-gray-100 rounded-lg">
//                     <FiFileText className="w-12 h-12 mx-auto text-gray-400" />
//                     <p className="mt-2 text-gray-500">
//                       No Aadhar card uploaded
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Information Card */}
//             <div className="w-full lg:w-2/3">
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Personal Information
//                   </h3>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                   {[
//                     {
//                       label: "Full Name",
//                       value: `${guestDetails.firstname.charAt(0).toUpperCase() +
//                         guestDetails.firstname.slice(1)
//                         } ${guestDetails.lastname.charAt(0).toUpperCase() +
//                         guestDetails.lastname.slice(1)
//                         }`,
//                       icon: (
//                         <svg
//                           className="w-5 h-5 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                           />
//                         </svg>
//                       ),
//                     },
//                     {
//                       label: "Email Address",
//                       value: guestDetails.emailid,
//                       icon: (
//                         <svg
//                           className="w-5 h-5 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                           />
//                         </svg>
//                       ),
//                     },
//                     {
//                       label: "Phone Number",
//                       value: guestDetails.phonenumber,
//                       icon: (
//                         <svg
//                           className="w-5 h-5 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
//                           />
//                         </svg>
//                       ),
//                     },
//                     // {
//                     //   label: "Country",
//                     //   value: guestDetails.country || "Not specified",
//                     //   icon: (
//                     //     <svg
//                     //       className="w-5 h-5 text-gray-400"
//                     //       fill="none"
//                     //       stroke="currentColor"
//                     //       viewBox="0 0 24 24"
//                     //     >
//                     //       <path
//                     //         strokeLinecap="round"
//                     //         strokeLinejoin="round"
//                     //         strokeWidth={2}
//                     //         d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                     //       />
//                     //     </svg>
//                     //   ),
//                     // },
//                     {
//                       label: "Profile Type",
//                       value: guestDetails.client_type,
//                       icon: (
//                         <svg
//                           className="w-5 h-5 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//                           />
//                         </svg>
//                       ),
//                     },
//                     ...(guestDetails.client_type === "Corporate"
//                       ? [
//                         {
//                           label: "Company Name",
//                           value: guestDetails.companyname || "Not provided",
//                           icon: (
//                             <svg
//                               className="w-5 h-5 text-gray-400"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//                               />
//                             </svg>
//                           ),
//                         },
//                         {
//                           label: "Company ID",
//                           value: guestDetails.companyid || "Not provided",
//                           icon: (
//                             <svg
//                               className="w-5 h-5 text-gray-400"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
//                               />
//                             </svg>
//                           ),
//                         },
//                       ]
//                       : []),
//                   ].map(({ label, value, icon }, index) => (
//                     <div key={index} className="bg-gray-50 rounded-lg p-2">
//                       <div className="flex items-center space-x-3">
//                         <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">
//                           {icon}
//                         </div>
//                         <div>
//                           <p className="text-sm font-medium text-gray-500">
//                             {label}
//                           </p>
//                           <p
//                             className="text-sm font-medium text-gray-900 mt-1"
//                             style={{
//                               maxWidth: '180px',
//                               overflow: 'hidden',
//                               textOverflow: 'ellipsis',
//                               whiteSpace: 'nowrap'
//                             }}
//                             title={value}
//                           >
//                             {value}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
//                   <button
//                     onClick={openEditModal}
//                     className="px-2 py-2.5 bg-black text-sm text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center"
//                   >
//                     <FiEdit2 className="mr-2" /> Update Information
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Edit Modal */}
//           {isEditModalOpen && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//               <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
//                 <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
//                   <h3 className="text-xl font-semibold text-gray-900">
//                     Edit Profile
//                   </h3>
//                   <button
//                     onClick={closeEditModal}
//                     className="text-gray-500 hover:text-gray-700"
//                   >
//                     <FiX size={24} />
//                   </button>
//                 </div>
//                 <form onSubmit={handleSubmit} className="p-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         First Name *
//                       </label>
//                       <input
//                         type="text"
//                         name="firstname"
//                         value={formData.firstname}
//                         onChange={handleInputChange}
//                         className={`w-full text-transform: capitalize p-2 border ${validationErrors.firstname
//                           ? "border-red-500"
//                           : "border-gray-300"
//                           } rounded`}
//                         required
//                       />
//                       {validationErrors.firstname && (
//                         <p className="text-red-500 text-xs mt-1">
//                           {validationErrors.firstname}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Last Name *
//                       </label>
//                       <input
//                         type="text"
//                         name="lastname"
//                         value={formData.lastname}
//                         onChange={handleInputChange}
//                         className={`w-full p-2 text-transform: capitalize border ${validationErrors.lastname
//                           ? "border-red-500"
//                           : "border-gray-300"
//                           } rounded`}
//                         required
//                       />
//                       {validationErrors.lastname && (
//                         <p className="text-red-500 text-xs mt-1">
//                           {validationErrors.lastname}
//                         </p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Email
//                       </label>
//                       <input
//                         type="email"
//                         name="emailid"
//                         value={formData.emailid}
//                         readOnly
//                         className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
//                       />
//                       <p className="text-gray-500 text-xs mt-1">
//                         Email address cannot be edited
//                       </p>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Phone Number
//                       </label>
//                       <input
//                         type="tel"
//                         name="phonenumber"
//                         value={formData.phonenumber}
//                         readOnly
//                         className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
//                       />
//                       <p className="text-gray-500 text-xs mt-1">
//                         Phone number cannot be edited
//                       </p>
//                     </div>

//                     <div>
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
//                           <span className="ml-2 font-semibold">v</span>
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

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Profile Type
//                       </label>
//                       <select
//                         name="client_type"
//                         value={formData.client_type}
//                         onChange={handleInputChange}
//                         className="w-full p-2 border border-gray-300 rounded"
//                         required
//                       >
//                         <option value="Leisure">Leisure</option>
//                         <option value="Corporate">Corporate</option>
//                       </select>
//                     </div>

//                     {/* Corporate Fields - Now editable in profile edit */}
//                     {formData.client_type === "Corporate" && (
//                       <>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Corporate Name *
//                           </label>
//                           <input
//                             type="text"
//                             name="companyname"
//                             value={formData.companyname}
//                             onChange={handleInputChange}
//                             className="w-full p-2 border border-gray-300 rounded"
//                             placeholder="Enter company name"
//                             required
//                           />
//                           {formData.client_type === "Corporate" && !formData.companyname?.trim() && (
//                             <p className="text-red-500 text-xs mt-1">Company Name is required for Corporate guests</p>
//                           )}
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                           Corporate ID *
//                           </label>
//                           <input
//                             type="text"
//                             name="companyid"
//                             value={formData.companyid}
//                             onChange={handleInputChange}
//                             className="w-full p-2 border border-gray-300 rounded"
//                             placeholder="Enter company ID"
//                             required
//                           />
//                           {formData.client_type === "Corporate" && !formData.companyid?.trim() && (
//                             <p className="text-red-500 text-xs mt-1">Company ID is required for Corporate guests</p>
//                           )}
//                         </div>

//                         {/* REMOVED Employee ID field entirely */}
//                       </>
//                     )}
//                   </div>

//                   {/* File Uploads */}
//                   <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {/* Profile Photo Upload */}
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Profile Photo
//                       </label>
//                       {showWebcam === "profile" ? (
//                         <div className="space-y-4">
//                           <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
//                             <Webcam
//                               audio={false}
//                               ref={webcamRef}
//                               screenshotFormat="image/jpeg"
//                               videoConstraints={videoConstraints}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               type="button"
//                               onClick={captureImage}
//                               className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
//                             >
//                               <FiCamera className="mr-2" /> Capture Photo
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => setShowWebcam(null)}
//                               className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <div className="flex items-center">
//                             <label className="flex flex-col items-center justify-center w-full p-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
//                               <div className="flex flex-col items-center justify-center pt-2 pb-3">
//                                 <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
//                                 <p className="text-sm text-gray-500">
//                                   {profilePhotoFile
//                                     ? profilePhotoFile.name
//                                     : "Click to upload"}
//                                 </p>
//                               </div>
//                               <input
//                                 type="file"
//                                 className="hidden"
//                                 onChange={handleProfilePhotoChange}
//                                 accept="image/*"
//                               />
//                             </label>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => setShowWebcam("profile")}
//                             className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center"
//                           >
//                             <FiCamera className="mr-2" /> Take Photo with Camera
//                           </button>
//                         </div>
//                       )}
//                     </div>

//                     {/* Aadhar Upload */}
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">
//                         Aadhar Card
//                       </label>
//                       {showWebcam === "aadhar" ? (
//                         <div className="space-y-4">
//                           <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
//                             <Webcam
//                               audio={false}
//                               ref={webcamRef}
//                               screenshotFormat="image/jpeg"
//                               videoConstraints={videoConstraints}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                           <div className="flex space-x-2">
//                             <button
//                               type="button"
//                               onClick={captureImage}
//                               className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
//                             >
//                               <FiCamera className="mr-2" /> Capture Aadhar
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => setShowWebcam(null)}
//                               className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
//                             >
//                               Cancel
//                             </button>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="space-y-2">
//                           <div className="flex items-center">
//                             <label className="flex flex-col items-center justify-center w-full p-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
//                               <div className="flex flex-col items-center justify-center pt-2 pb-3">
//                                 <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
//                                 <p className="text-sm text-gray-500">
//                                   {aadharFile
//                                     ? aadharFile.name
//                                     : "Click to upload"}
//                                 </p>
//                               </div>
//                               <input
//                                 type="file"
//                                 className="hidden"
//                                 onChange={handleAadharChange}
//                                 accept="image/*,.pdf"
//                               />
//                             </label>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => setShowWebcam("aadhar")}
//                             className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 flex items-center justify-center"
//                           >
//                             <FiCamera className="mr-2" /> Capture Aadhar with
//                             Camera
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {error && (
//                     <div className="mb-4 mt-4 p-2 bg-red-100 text-red-700 rounded">
//                       {error}
//                     </div>
//                   )}

//                   <div className="mt-6 flex justify-end space-x-3">
//                     <button
//                       type="button"
//                       onClick={closeEditModal}
//                       className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-4 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 flex items-center"
//                       disabled={
//                         isLoading ||
//                         validationErrors.firstname ||
//                         validationErrors.lastname
//                       }
//                     >
//                       {isLoading ? (
//                         "Saving..."
//                       ) : (
//                         <>
//                           <FiCheck className="mr-2" /> Save Changes
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {activeTab === "bookingHistory" && <BookingHistory bookings={bookings} />}

//       {activeTab === "helpSupport" && (
//         <HelpSupportForm guestDetails={guestDetails} />
//       )}

//       <ToastContainer />
//     </div>
//   );
// };

// export default Profile;
