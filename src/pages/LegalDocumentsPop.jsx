import { useState, useEffect } from 'react';

const LegalDocumentsPopup = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('terms');

  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      // Disable scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Re-enable scrolling when component unmounts
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
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col mt-20">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'terms'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'privacy'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Privacy Policy
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
          {activeTab === 'privacy' ? <PrivacyPolicyContent /> : <TermsAndConditionsContent />}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
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

const PrivacyPolicyContent = () => (
  <div className="space-y-2">
    <h2 className="text-lg font-bold mb-4">Hotel Room Reservation Privacy Policy</h2>
    <section>
      <h3 className="font-semibold text-sm mb-2">1. Information We Collect</h3>
      <p className="text-gray-700 text-[13px]">
        When you make a reservation, we collect personal information including your name, contact
        details, payment information, identification details, and stay preferences. We may also
        collect information about your use of our website through cookies.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. How We Use Your Information</h3>
      <p className="text-gray-700 text-[13px]">
        We use your information to process reservations, provide services, communicate with you,
        improve our services, comply with legal obligations, and for security purposes. With your
        consent, we may also use your information for marketing purposes.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Data Sharing</h3>
      <p className="text-gray-700 text-[13px]">
        We may share your information with third-party service providers who assist with our
        operations, payment processors, and when required by law. We do not sell your personal
        information.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Your Rights</h3>
      <p className="text-gray-700 text-[13px]">
        You may have rights to access, correct, delete, or restrict use of your personal
        information. Contact us using the information provided during reservation to exercise these
        rights.
      </p>
    </section>
  </div>
);

const TermsAndConditionsContent = () => (
  <div className="space-y-2">
    <h2 className="text-xl font-bold mb-4">Hotel Room Reservation Terms & Conditions</h2>

    <section>
      <h3 className="font-semibold text-sm mb-2">1. Reservations</h3>
      <p className="text-gray-700 text-[13px]">
        All reservations are subject to availability. You must be at least 18 years old to book. A
        valid credit card is required to guarantee your reservation.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. Cancellation Policy</h3>
      <p className="text-gray-700 text-[13px]">
        Cancellations must be made at least 48 hours prior to arrival to avoid a penalty of one
        night's room rate plus tax. No-shows will be charged the full reservation amount.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Payment</h3>
      <p className="text-gray-700 text-[13px]">
        All rates are quoted in local currency and subject to applicable taxes. Payment is due at
        check-in unless otherwise specified. We accept major credit cards and may require a security
        deposit.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Check-in/Check-out</h3>
      <p className="text-gray-700 text-[13px]">
        Check-in time is 3:00 PM and check-out time is 11:00 AM. Early check-in and late check-out
        are subject to availability and may incur additional charges.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">5. Guest Responsibilities</h3>
      <p className="text-gray-700 text-[13px]">
        Guests are responsible for any damage to hotel property. The hotel reserves the right to
        refuse service or evict guests for inappropriate behavior or violation of hotel policies.
      </p>
    </section>
  </div>
);

export default LegalDocumentsPopup;
