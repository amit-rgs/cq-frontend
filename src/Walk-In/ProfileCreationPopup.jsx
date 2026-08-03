import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { GiCarKey } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProfileCreationPopup = ({ isOpen, onClose, onContinueAsGuest }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreateProfile = () => {
    onClose();
    const accessToken = Cookies.get('access_token');

    // If access token exists, user is logged in but profile incomplete
    // Redirect to create-user-later page
    if (accessToken) {
      navigate('/create-user-later');
    } else {
      // No access token, guest user - redirect to create-user page
      navigate('/create-user');
    }
  };

  const handleRegisterLater = () => {
    onClose();
    if (onContinueAsGuest) {
      onContinueAsGuest();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none mb-3"
          aria-label="Close"
        >
          <FaTimes className="h-6 w-6" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-blue-200 mb-4">
              <GiCarKey className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Please complete your profile before check-in. It will make your stay smooth and easy!
            </p>
          </div>

          <div className="flex flex-row space-x-3">
            <button
              onClick={handleCreateProfile}
              className="w-full py-2.5 sm:py-3 px-4 bg-black hover:text-gray-300 text-white font-medium rounded-lg shadow transition-colors"
            >
              Create Profile Now
            </button>

            <button
              onClick={handleRegisterLater}
              className="w-full py-2.5 sm:py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg shadow transition-colors"
            >
              Register Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationPopup;
