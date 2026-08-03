import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MytripsLogin({ open, setOpen }) {
  const [accountType, setAccountType] = useState('personal');
  const [phone, setPhone] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Hardcoded OTP for demonstration
  const CORRECT_OTP = '123456';

  // Close everything when either modal should be closed
  if (!open && !showOtpModal) return null;

  const handleContinue = () => {
    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    // Show OTP modal - login modal will close automatically via the return null condition
    setShowOtpModal(true);
  };

  // Function to close OTP modal and optionally reopen login modal
  const handleCloseOtpModal = () => {
    setShowOtpModal(false);
    // Optionally, you can reopen the login modal here if needed
    // setOpen(true);
  };

  // Function to close both modals
  const handleCloseAllModals = () => {
    setOpen(false);
    setShowOtpModal(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d{6}$/.test(pasteData)) {
      const otpArray = pasteData.split('');
      setOtp(otpArray);
      document.getElementById(`otp-${Math.min(otpArray.length - 1, 5)}`)?.focus();
    }
  };

  // In MytripsLogin component, update the verifyOtp function:

  const verifyOtp = () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      alert('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (enteredOtp === CORRECT_OTP) {
        // Create a mock email from phone number for demonstration
        const mockEmail = `Sagardadhich82@gmail.com`;

        // Save login state to localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', mockEmail);

        // Dispatch a custom event to notify navbar about login
        window.dispatchEvent(
          new CustomEvent('userLoggedIn', {
            detail: { email: mockEmail },
          })
        );

        // Close all modals
        handleCloseAllModals();

        // Navigate to view reservation page
        navigate('/viewreservation');
      } else {
        alert('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    }, 1000);
  };

  const handleResendOtp = () => {
    setOtp(['', '', '', '', '', '']);
    document.getElementById('otp-0')?.focus();
    alert('OTP has been resent to your mobile number!');
  };

  return (
    <>
      {/* Main Login Modal - Only show when showOtpModal is false */}
      {!showOtpModal && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Login or Create an Account</h2>
                <button
                  onClick={handleCloseAllModals}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Phone Input */}
            <label className="mb-2 block text-sm font-medium">Mobile Number</label>
            <div className="mb-6 flex rounded-lg border">
              <span className="flex items-center px-3 text-gray-600">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter mobile number"
                className="w-full rounded-r-lg px-3 py-2 outline-none"
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="mb-4 w-full rounded-full bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              CONTINUE
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-300" />
              <span className="text-sm text-gray-500">Or Login/Signup With</span>
              <div className="h-px flex-1 bg-gray-300" />
            </div>

            {/* Google */}
            <div className="flex justify-center">
              <button className="flex h-12 w-12 items-center justify-center rounded-full border shadow-sm hover:shadow-md transition-shadow">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="h-6 w-6"
                  alt="Google"
                />
              </button>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-gray-500">
              By proceeding, you agree to Pagoda hotel
              <span className="text-blue-500 hover:underline cursor-pointer"> Privacy Policy</span>,
              <span className="text-blue-500 hover:underline cursor-pointer"> User Agreement</span>{' '}
              and
              <span className="text-blue-500 hover:underline cursor-pointer"> T&Cs</span>
            </p>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Enter OTP</h2>
                <button
                  onClick={handleCloseOtpModal}
                  className="text-2xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">We've sent a 6-digit OTP to +91 {phone}</p>
            </div>

            {/* OTP Input */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium">Enter OTP</label>
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="h-12 sm:h-14 w-10 sm:w-14 rounded-lg border-2 border-gray-300 text-center text-xl sm:text-2xl font-semibold focus:border-purple-500 focus:outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOtp}
              disabled={isLoading}
              className="mb-4 w-full rounded-full bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive OTP?{' '}
                <button
                  onClick={handleResendOtp}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// export default function MytripsLogin({ open, setOpen }) {
//   const [accountType, setAccountType] = useState("personal");
//   const [phone, setPhone] = useState("");
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [isLoading, setIsLoading] = useState(false);

//   const navigate = useNavigate();

//   // Hardcoded OTP for demonstration
//   const CORRECT_OTP = "123456";

//   // Close everything when either modal should be closed
//   if (!open && !showOtpModal) return null;

//   const handleContinue = () => {
//     if (phone.length !== 10) {
//       alert("Please enter a valid 10-digit mobile number");
//       return;
//     }
//     // Show OTP modal - login modal will close automatically via the return null condition
//     setShowOtpModal(true);
//   };

//   // Function to close OTP modal and optionally reopen login modal
//   const handleCloseOtpModal = () => {
//     setShowOtpModal(false);
//     // Optionally, you can reopen the login modal here if needed
//     // setOpen(true);
//   };

//   // Function to close both modals
//   const handleCloseAllModals = () => {
//     setOpen(false);
//     setShowOtpModal(false);
//   };

//   const handleOtpChange = (index, value) => {
//     if (value.length > 1) {
//       value = value[value.length - 1];
//     }

//     if (!/^\d*$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (value && index < 5) {
//       document.getElementById(`otp-${index + 1}`)?.focus();
//     }
//   };

//   const handleOtpKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       document.getElementById(`otp-${index - 1}`)?.focus();
//     }
//   };

//   const handlePaste = (e) => {
//     e.preventDefault();
//     const pasteData = e.clipboardData.getData("text").slice(0, 6);
//     if (/^\d{6}$/.test(pasteData)) {
//       const otpArray = pasteData.split("");
//       setOtp(otpArray);
//       document.getElementById(`otp-${Math.min(otpArray.length - 1, 5)}`)?.focus();
//     }
//   };

//  // In MytripsLogin component, update the verifyOtp function:

// const verifyOtp = () => {
//   const enteredOtp = otp.join("");

//   if (enteredOtp.length !== 6) {
//     alert("Please enter complete 6-digit OTP");
//     return;
//   }

//   setIsLoading(true);

//   setTimeout(() => {
//     setIsLoading(false);

//     if (enteredOtp === CORRECT_OTP) {
//       // Create a mock email from phone number for demonstration
//       const mockEmail = `Sagardadhich82@gmail.com`;

//       // Save login state to localStorage
//       localStorage.setItem("isLoggedIn", "true");
//       localStorage.setItem("userEmail", mockEmail);

//       // Dispatch a custom event to notify navbar about login
//       window.dispatchEvent(new CustomEvent('userLoggedIn', {
//         detail: { email: mockEmail }
//       }));

//       // Close all modals
//       handleCloseAllModals();

//       // Navigate to view reservation page
//       navigate("/viewreservation");
//     } else {
//       alert("Invalid OTP. Please try again.");
//       setOtp(["", "", "", "", "", ""]);
//       document.getElementById("otp-0")?.focus();
//     }
//   }, 1000);
// };

//   const handleResendOtp = () => {
//     setOtp(["", "", "", "", "", ""]);
//     document.getElementById("otp-0")?.focus();
//     alert("OTP has been resent to your mobile number!");
//   };

//   return (
//     <>
//       {/* Main Login Modal - Only show when showOtpModal is false */}
//       {!showOtpModal && open && (
//         <div className="fixed inset-96 mt-28 z-50 flex items-center justify-center">
//           <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//             {/* Header */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Login or Create an Account
//                 </h2>
//                 <button
//                   onClick={handleCloseAllModals}
//                   className="text-2xl text-gray-500 hover:text-gray-700"
//                 >
//                   ×
//                 </button>
//               </div>
//             </div>

//             {/* Phone Input */}
//             <label className="mb-2 block text-sm font-medium">Mobile Number</label>
//             <div className="mb-6 flex rounded-lg border">
//               <span className="flex items-center px-3 text-gray-600">+91</span>
//               <input
//                 type="tel"
//                 maxLength={10}
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
//                 placeholder="Enter mobile number"
//                 className="w-full rounded-r-lg px-3 py-2 outline-none"
//               />
//             </div>

//             {/* Continue Button */}
//             <button
//               onClick={handleContinue}
//               className="mb-4 w-full rounded-full bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition-colors"
//             >
//               CONTINUE
//             </button>

//             {/* Divider */}
//             <div className="my-6 flex items-center gap-4">
//               <div className="h-px flex-1 bg-gray-300" />
//               <span className="text-sm text-gray-500">Or Login/Signup With</span>
//               <div className="h-px flex-1 bg-gray-300" />
//             </div>

//             {/* Google */}
//             <div className="flex justify-center">
//               <button className="flex h-12 w-12 items-center justify-center rounded-full border shadow-sm hover:shadow-md transition-shadow">
//                 <img
//                   src="https://www.svgrepo.com/show/475656/google-color.svg"
//                   className="h-6 w-6"
//                   alt="Google"
//                 />
//               </button>
//             </div>

//             {/* Footer */}
//             <p className="mt-6 text-center text-xs text-gray-500">
//               By proceeding, you agree to Pagoda hotel
//               <span className="text-blue-500 hover:underline cursor-pointer">
//                 {" "}
//                 Privacy Policy
//               </span>
//               ,
//               <span className="text-blue-500 hover:underline cursor-pointer">
//                 {" "}
//                 User Agreement
//               </span>{" "}
//               and
//               <span className="text-blue-500 hover:underline cursor-pointer">
//                 {" "}
//                 T&Cs
//               </span>
//             </p>
//           </div>
//         </div>
//       )}

//       {/* OTP Modal */}
//       {showOtpModal && (
//         <div className="fixed inset-96 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//             {/* Header */}
//             <div className="mb-6">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Enter OTP
//                 </h2>
//                 <button
//                   onClick={handleCloseOtpModal}
//                   className="text-2xl text-gray-500 hover:text-gray-700"
//                 >
//                   ×
//                 </button>
//               </div>
//               <p className="mt-2 text-sm text-gray-600">
//                 We've sent a 6-digit OTP to +91 {phone}
//               </p>
//             </div>

//             {/* OTP Input */}
//             <div className="mb-6">
//               <label className="mb-3 block text-sm font-medium">
//                 Enter OTP
//               </label>
//               <div className="flex justify-between gap-2" onPaste={handlePaste}>
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     id={`otp-${index}`}
//                     type="text"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleOtpChange(index, e.target.value)}
//                     onKeyDown={(e) => handleOtpKeyDown(index, e)}
//                     className="h-14 w-14 rounded-lg border-2 border-gray-300 text-center text-2xl font-semibold focus:border-purple-500 focus:outline-none"
//                     autoFocus={index === 0}
//                   />
//                 ))}
//               </div>
//             </div>

//             {/* Verify Button */}
//             <button
//               onClick={verifyOtp}
//               disabled={isLoading}
//               className="mb-4 w-full rounded-full bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
//             >
//               {isLoading ? "VERIFYING..." : "VERIFY OTP"}
//             </button>

//             {/* Resend OTP */}
//             <div className="text-center">
//               <p className="text-sm text-gray-600">
//                 Didn't receive OTP?{" "}
//                 <button
//                   onClick={handleResendOtp}
//                   className="text-purple-600 hover:text-purple-700 font-medium"
//                 >
//                   Resend OTP
//                 </button>
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
