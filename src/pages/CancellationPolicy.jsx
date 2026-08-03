import { useState, useEffect } from 'react';

const CancellationPolicy = ({ isOpen, onClose }) => {
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
              Cancellation Policy
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
          {activeTab === 'privacy' ? <PrivacyPolicyContent /> : <CancellationPolicyContent />}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 "
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

const PrivacyPolicyContent = () => (
  <div className="space-y-4">
    <h2 className="text-lg font-bold mb-4">Hotel Services Privacy Policy</h2>

    <section>
      <h3 className="font-semibold text-sm mb-2">1. Amenities Usage Data</h3>
      <p className="text-gray-700 text-[13px]">
        We collect information about your use of hotel amenities (pool, gym, spa) for operational
        purposes and to improve services. This may include timestamps, duration of use, and
        preferences you provide.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. Room Service Privacy</h3>
      <p className="text-gray-700 text-[13px]">
        Your room service orders, including food preferences and special requests, are recorded to
        fulfill your requests. Dietary restrictions are handled confidentially by our kitchen staff.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Mini-Bar and In-Room Consumption</h3>
      <p className="text-gray-700 text-[13px]">
        Consumption of mini-bar items and in-room dining is automatically recorded to your account.
        We do not share specific consumption details except as required for billing purposes.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Housekeeping Services</h3>
      <p className="text-gray-700 text-[13px]">
        Housekeeping staff are trained to respect guest privacy. Personal items encountered during
        service are not recorded or shared unless required for security reasons.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">5. Spa and Wellness Services</h3>
      <p className="text-gray-700 text-[13px]">
        Health information provided for spa services is used solely for treatment purposes and
        stored securely. It is not shared without your explicit consent except as required by law.
      </p>
    </section>
  </div>
);

const CancellationPolicyContent = () => (
  <div className="space-y-4">
    <h2 className="text-lg font-bold mb-4">Hotel Services Cancellation Policy</h2>

    <section>
      <h3 className="font-semibold text-sm mb-2">1. Room Reservations</h3>
      <p className="text-gray-700 text-[13px]">
        Cancellations must be made 48 hours prior to arrival. Late cancellations incur a fee of one
        night's stay plus taxes. Non-refundable rates cannot be cancelled or modified.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. Food & Beverage Services</h3>
      <p className="text-gray-700 text-[13px]">
        Room service orders cannot be cancelled once prepared. Special orders requiring advance
        preparation may have specific cancellation deadlines communicated at time of ordering.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Spa & Wellness Services</h3>
      <p className="text-gray-700 text-[13px]">
        Appointments cancelled less than 24 hours in advance will be charged 50% of service cost.
        No-shows will be charged full price. Package deals may have different cancellation terms.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Special Amenities</h3>
      <p className="text-gray-700 text-[13px]">
        Private cabana rentals, meeting rooms, and other special amenities require 72-hour
        cancellation notice. Late cancellations will result in full charge of reserved time period.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">5. Early Departures</h3>
      <p className="text-gray-700 text-[13px]">
        Early departures after check-in will result in charge for the entire reserved stay unless
        negotiated at front desk due to exceptional circumstances.
      </p>
    </section>
  </div>
);

export default CancellationPolicy;
