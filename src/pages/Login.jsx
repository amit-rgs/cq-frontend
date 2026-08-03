import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RxCross2 } from 'react-icons/rx';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const Login = ({ closeModal, onSuccess, openSignup }) => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && closeModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeModal]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter email or phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${CQ_BASE_URL}/bq/api/login-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP');
      }

      const data = await response.json();
      setIdentifierType(data.identifier_type);
      setShowOtpInput(true);
      toast.success(`OTP sent to your ${data.identifier_type}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter OTP');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'OTP verification failed');
      }

      const data = await response.json();

      // Use the AuthProvider login function
      await login(data);

      // Dispatch a custom event for any other components that might need to know
      const event = new CustomEvent('userLoggedIn', {
        detail: { user: data.user },
      });
      window.dispatchEvent(event);

      toast.success('Login successful!');

      // Close modal and call success callback
      if (closeModal) closeModal();
      if (onSuccess) onSuccess(data.user);

      // Optional: navigate to home page or stay on current page
      // navigate("/"); // Commented out to stay on current page
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${CQ_BASE_URL}/bq/api/login-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend OTP');
      }

      toast.success(`OTP resent to your ${identifierType}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = (e) => {
    e.preventDefault();
    if (closeModal) closeModal();
    if (openSignup) openSignup();
  };

  // Prevent click propagation to close modal when clicking inside
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Full blank white screen during Google Auth */}
      {isGoogleLoading && <div className="fixed inset-0 bg-white z-50"></div>}

      <div className="fixed inset-0 flex justify-center items-center z-50" onClick={closeModal}>
        <ToastContainer position="top-center" autoClose={5000} />
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        <div
          className="w-full max-w-md bg-white p-9 rounded-lg relative z-10 mx-2 shadow-lg transform transition-all duration-300 ease-out"
          onClick={handleModalContentClick}
        >
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 p-1 rounded-full text-lg text-gray-600 hover:text-black hover:ring-2 hover:ring-black transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none"
            disabled={isLoading || isGoogleLoading}
            aria-label="Close modal"
          >
            <RxCross2 size={20} />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 ">Sign in or create an account</h2>
            <p className="text-gray-600 text-sm mt-1">
              Access your account or create a new one to get started.
            </p>
          </div>

          <div className="space-y-4">
            {/* Email/Phone Input */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-medium text-gray-700 mb-1">
                Email or Phone Number
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter your email or phone number"
                required
                disabled={isLoading || isGoogleLoading || showOtpInput}
                autoFocus={!showOtpInput}
              />
            </div>

            {/* Send OTP Button - Always visible when OTP input is not shown */}
            {!showOtpInput && (
              <button
                onClick={handleRequestOtp}
                className={`w-full flex justify-center py-2.5 px-4 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md shadow-sm transition-colors ${
                  isLoading || isGoogleLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  </>
                ) : (
                  'Continue with OTP'
                )}
              </button>
            )}

            {/* OTP Input Section - Appears after Send OTP is clicked */}
            {showOtpInput && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-xs font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                    disabled={isLoading || isGoogleLoading}
                    autoFocus
                  />
                  {/* <div className="flex justify-between items-center mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpInput(false);
                        setOtp("");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      disabled={isLoading || isGoogleLoading}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading || isGoogleLoading}
                      className="text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Resend OTP
                    </button>
                  </div> */}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  className={`w-full flex justify-center py-2.5 px-4 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md shadow-sm transition-colors ${
                    isLoading || isGoogleLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={handleSignupClick}
                className="text-black font-medium hover:underline focus:outline-none"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;

// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./AuthProvider";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { RxCross2 } from "react-icons/rx";
// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const Login = ({ closeModal }) => {
//   const [identifier, setIdentifier] = useState("");
//   const [otp, setOtp] = useState("");
//   const [showOtpInput, setShowOtpInput] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
//   const [identifierType, setIdentifierType] = useState(null);
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleRequestOtp = async (e) => {
//     e.preventDefault();
//     if (!identifier.trim()) {
//       toast.error("Please enter email or phone number");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const response = await fetch(`${CQ_BASE_URL}/bq/api/login-request`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: identifier.trim(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to send OTP");
//       }

//       const data = await response.json();
//       setIdentifierType(data.identifier_type);
//       setShowOtpInput(true);
//       toast.success(`OTP sent to your ${data.identifier_type}`);
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     if (!otp.trim()) {
//       toast.error("Please enter OTP");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const response = await fetch(`${CQ_BASE_URL}/bq/api/verify-login-otp`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: identifier.trim(),
//           otp: otp.trim(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "OTP verification failed");
//       }

//       const data = await response.json();

//       // Use the AuthProvider login function
//       await login(data);

//       if (closeModal) closeModal();

//       // Dispatch a custom event for any other components that might need to know
//       const event = new CustomEvent('userLoggedIn', { detail: { user: data.user } });
//       window.dispatchEvent(event);

//       toast.success("Login successful!");
//       navigate("/");
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch(`${CQ_BASE_URL}/bq/api/login-request`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           identifier: identifier.trim(),
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.detail || "Failed to resend OTP");
//       }

//       toast.success(`OTP resent to your ${identifierType}`);
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <>
//       {/* Full blank white screen during Google Auth */}
//       {isGoogleLoading && <div className="fixed inset-0 bg-white z-50"></div>}

//       <div className="fixed inset-0 flex justify-center items-center z-40">
//         <ToastContainer position="top-center" autoClose={5000} />
//         <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
//         <div className="w-full max-w-md bg-white p-9 rounded-lg relative z-10 mx-2 shadow-lg">
//           <button
//             onClick={closeModal}
//             className="absolute top-3 right-3 p-1 rounded-full text-lg text-gray-600 hover:text-black hover:ring-2 hover:ring-black transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none"
//             disabled={isLoading || isGoogleLoading}
//             aria-label="Close modal"
//           >
//             <RxCross2 size={20} />
//           </button>

//           <div className="text-center mb-6">
//             <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
//             <p className="text-gray-600 text-sm mt-1">
//               Enter your email or phone number to receive OTP
//             </p>
//           </div>

//           <div className="space-y-4">
//             {/* Email/Phone Input */}
//             <div>
//               <label
//                 htmlFor="identifier"
//                 className="block text-xs font-medium text-gray-700 mb-1"
//               >
//                 Email or Phone Number
//               </label>
//               <input
//                 type="text"
//                 id="identifier"
//                 value={identifier}
//                 onChange={(e) => setIdentifier(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
//                 placeholder="Enter your email or phone number"
//                 required
//                 disabled={isLoading || isGoogleLoading || showOtpInput}
//               />
//             </div>

//             {/* Send OTP Button - Always visible when OTP input is not shown */}
//             {!showOtpInput && (
//               <button
//                 onClick={handleRequestOtp}
//                 className={`w-full flex justify-center py-2 px-4 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md shadow-sm ${
//                   isLoading || isGoogleLoading
//                     ? "opacity-70 cursor-not-allowed"
//                     : ""
//                 }`}
//                 disabled={isLoading || isGoogleLoading}
//               >
//                 {isLoading ? (
//                   <>
//                     <svg
//                       className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Sending OTP...
//                   </>
//                 ) : (
//                   "Send OTP"
//                 )}
//               </button>
//             )}

//             {/* OTP Input Section - Appears after Send OTP is clicked */}
//             {showOtpInput && (
//               <>
//                 <div>
//                   <label
//                     htmlFor="otp"
//                     className="block text-xs font-medium text-gray-700 mb-1"
//                   >
//                     Enter OTP
//                   </label>
//                   <input
//                     type="text"
//                     id="otp"
//                     value={otp}
//                     onChange={(e) => setOtp(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
//                     placeholder="Enter 6-digit OTP"
//                     maxLength={6}
//                     required
//                     disabled={isLoading || isGoogleLoading}
//                   />
//                   <div className="flex justify-end items-center mt-1">
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowOtpInput(false);
//                         setOtp("");
//                       }}
//                       className="text-xs text-blue-600 hover:text-blue-500"
//                       disabled={isLoading || isGoogleLoading}
//                     >
//                       Change
//                     </button>
//                   </div>
//                 </div>

//                 {/* Verify Button */}
//                 <button
//                   onClick={handleVerifyOtp}
//                   className={`w-full flex justify-center py-2 px-4 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md shadow-sm ${
//                     isLoading || isGoogleLoading
//                       ? "opacity-70 cursor-not-allowed"
//                       : ""
//                   }`}
//                   disabled={isLoading || isGoogleLoading}
//                 >
//                   {isLoading ? (
//                     <>
//                       <svg
//                         className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
//                     </>
//                   ) : (
//                     "Verify"
//                   )}
//                 </button>

//                 {/* Resend OTP Link */}
//                 <div className="text-center">
//                   <button
//                     type="button"
//                     onClick={handleResendOtp}
//                     disabled={isLoading || isGoogleLoading}
//                     className="text-xs text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                   >
//                     Resend OTP
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>

//           <div className="mt-4 text-center text-xs text-gray-600">
//             Don't have an account?{" "}
//             <a
//               href="/create-user"
//               className="text-blue-600 hover:text-blue-500 font-medium"
//             >
//               Sign up
//             </a>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;
