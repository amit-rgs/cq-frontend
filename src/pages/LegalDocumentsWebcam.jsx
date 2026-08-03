import { useState, useEffect } from 'react';

const LegalDocumentsWebcam = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('terms');

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mt-10">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'terms'
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'privacy'
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'upload'
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upload Guidelines
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close legal documents"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'privacy' ? (
            <PrivacyPolicyContent />
          ) : activeTab === 'upload' ? (
            <UploadGuidelinesContent />
          ) : (
            <TermsAndConditionsContent />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

// Simplified UploadGuidelinesContent - no cards
const UploadGuidelinesContent = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Guidelines & Instructions</h2>

    <div>
      <h3 className="font-semibold text-gray-800 mb-3">For Profile Photo:</h3>
      <ul className="space-y-2 text-gray-700 mb-6">
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Ensure good lighting with no shadows on your face</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Look directly at the camera with a neutral expression</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Remove glasses, hats, or accessories that obscure your face</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Use plain background without patterns or distractions</span>
        </li>
      </ul>

      <h3 className="font-semibold text-gray-800 mb-3">For Aadhaar Card Photo:</h3>
      <ul className="space-y-2 text-gray-700 mb-6">
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Place Aadhaar card on a flat, well-lit surface</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Ensure all four corners are visible in the frame</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Text should be clear, legible, and not blurred</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Avoid glare or reflections on the card surface</span>
        </li>
      </ul>

      <h3 className="font-semibold text-gray-800 mb-3">File Requirements:</h3>
      <ul className="space-y-2 text-gray-700 mb-6">
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Accepted formats: JPG, JPEG, PNG</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Maximum file size: 5MB per image</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Minimum resolution: 800x600 pixels</span>
        </li>
        <li className="flex items-start">
          <svg
            className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Do not edit or filter images - upload original files</span>
        </li>
      </ul>
    </div>

    <div className="bg-red-50 p-4 rounded-lg">
      <p className="text-sm text-gray-700 flex items-start">
        <svg
          className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          By uploading or capturing images, you confirm that they are genuine and belong to you.
          Providing false documents may result in account suspension or legal action.
        </span>
      </p>
    </div>
  </div>
);

// Simplified PrivacyPolicyContent - no cards
const PrivacyPolicyContent = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Webcam Privacy Policy</h2>

    <div>
      <h3 className="font-semibold text-gray-800 mb-2">1. Information We Collect</h3>
      <p className="text-gray-700 text-sm mb-4">
        When using the webcam, we collect images of your Aadhaar card and a live photo of your face.
        The face image is processed into a biometric embedding used for identity verification.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">2. Purpose of Collection</h3>
      <p className="text-gray-700 text-sm mb-4">
        These captures are strictly used for verifying your identity, preventing fraud, and enabling
        seamless hotel reservations.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">3. Data Sharing</h3>
      <p className="text-gray-700 text-sm mb-4">
        We do not share or sell your biometric data. It is only shared with secure, authorized
        verification services when required by law or compliance.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">4. Your Rights</h3>
      <p className="text-gray-700 text-sm">
        You may request access, correction, or deletion of your webcam data at any time. Please
        contact our support team to exercise these rights.
      </p>
    </div>
  </div>
);

// Simplified TermsAndConditionsContent - no cards
const TermsAndConditionsContent = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Webcam Terms & Conditions</h2>

    <div>
      <h3 className="font-semibold text-gray-800 mb-2">1. Consent</h3>
      <p className="text-gray-700 text-sm mb-4">
        By using the webcam, you consent to the capture of your Aadhaar card and facial image for
        the purposes of identity verification.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">2. Use of Biometric Data</h3>
      <p className="text-gray-700 text-sm mb-4">
        Captured images are converted into face embeddings and securely stored only for
        verification. They will not be used for marketing or unrelated purposes.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">3. Data Retention</h3>
      <p className="text-gray-700 text-sm mb-4">
        Your biometric and Aadhaar capture data will be retained only for as long as required to
        provide services and meet legal obligations.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">4. Security</h3>
      <p className="text-gray-700 text-sm mb-4">
        All captured data is encrypted and stored securely. Unauthorized sharing or tampering with
        the webcam capture process is prohibited.
      </p>

      <h3 className="font-semibold text-gray-800 mb-2">5. Termination</h3>
      <p className="text-gray-700 text-sm">
        Failure to comply with these terms or attempts to misuse the webcam verification process may
        result in denial of services.
      </p>
    </div>
  </div>
);

export default LegalDocumentsWebcam;

// import { useState, useEffect } from 'react';

// const LegalDocumentsWebcam = ({ isOpen, onClose }) => {
//   const [activeTab, setActiveTab] = useState('terms');

//   useEffect(() => {
//     if (isOpen) {
//       const scrollY = window.scrollY;
//       document.body.style.position = 'fixed';
//       document.body.style.top = `-${scrollY}px`;
//       document.body.style.width = '100%';

//       return () => {
//         document.body.style.position = '';
//         document.body.style.top = '';
//         document.body.style.width = '';
//         window.scrollTo(0, scrollY);
//       };
//     }
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-hidden">
//       <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col mt-20">
//         {/* Header */}
//         <div className="border-b border-gray-200 p-4 flex justify-between items-center">
//           <div className="flex space-x-2">
//             <button
//               onClick={() => setActiveTab('terms')}
//               className={`px-4 py-2 rounded-md ${
//                 activeTab === 'terms'
//                   ? 'bg-gray-100 text-gray-900 font-medium'
//                   : 'text-gray-600 hover:bg-gray-100'
//               }`}
//             >
//               Terms & Conditions
//             </button>
//             <button
//               onClick={() => setActiveTab('privacy')}
//               className={`px-4 py-2 rounded-md ${
//                 activeTab === 'privacy'
//                   ? 'bg-gray-100 text-gray-900 font-medium'
//                   : 'text-gray-600 hover:bg-gray-100'
//               }`}
//             >
//               Privacy Policy
//             </button>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
//             aria-label="Close legal documents"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-6 w-6"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M6 18L18 6M6 6l12 12"
//               />
//             </svg>
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6 overflow-y-auto flex-grow">
//           {activeTab === 'privacy' ? (
//             <PrivacyPolicyContent />
//           ) : (
//             <TermsAndConditionsContent />
//           )}
//         </div>

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-4 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
//           >
//             I Understand
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const PrivacyPolicyContent = () => (
//   <div className="space-y-2">
//     <h2 className="text-lg font-bold mb-4">Webcam Privacy Policy</h2>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">1. Information We Collect</h3>
//       <p className="text-gray-700 text-[13px]">
//         When using the webcam, we collect images of your Aadhaar card and a live photo of your face.
//         The face image is processed into a biometric embedding used for identity verification.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">2. Purpose of Collection</h3>
//       <p className="text-gray-700 text-[13px]">
//         These captures are strictly used for verifying your identity, preventing fraud,
//         and enabling seamless hotel reservations.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">3. Data Sharing</h3>
//       <p className="text-gray-700 text-[13px]">
//         We do not share or sell your biometric data. It is only shared with secure, authorized
//         verification services when required by law or compliance.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">4. Your Rights</h3>
//       <p className="text-gray-700 text-[13px]">
//         You may request access, correction, or deletion of your webcam data at any time.
//         Please contact our support team to exercise these rights.
//       </p>
//     </section>
//   </div>
// );

// const TermsAndConditionsContent = () => (
//   <div className="space-y-2">
//     <h2 className="text-xl font-bold mb-4">Webcam Terms & Conditions</h2>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">1. Consent</h3>
//       <p className="text-gray-700 text-[13px]">
//         By using the webcam, you consent to the capture of your Aadhaar card and facial image
//         for the purposes of identity verification.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">2. Use of Biometric Data</h3>
//       <p className="text-gray-700 text-[13px]">
//         Captured images are converted into face embeddings and securely stored only for verification.
//         They will not be used for marketing or unrelated purposes.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">3. Data Retention</h3>
//       <p className="text-gray-700 text-[13px]">
//         Your biometric and Aadhaar capture data will be retained only for as long as required
//         to provide services and meet legal obligations.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">4. Security</h3>
//       <p className="text-gray-700 text-[13px]">
//         All captured data is encrypted and stored securely. Unauthorized sharing or tampering
//         with the webcam capture process is prohibited.
//       </p>
//     </section>

//     <section>
//       <h3 className="font-semibold text-sm mb-2">5. Termination</h3>
//       <p className="text-gray-700 text-[13px]">
//         Failure to comply with these terms or attempts to misuse the webcam verification process
//         may result in denial of services.
//       </p>
//     </section>
//   </div>
// );

// export default LegalDocumentsWebcam;
