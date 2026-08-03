import { useState, useEffect } from 'react';

const LegalDocumentsPermission = ({ isOpen, onClose }) => {
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
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col">
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
    <h2 className="text-lg font-bold mb-4">Signup Privacy Policy</h2>
    <section>
      <h3 className="font-semibold text-sm mb-2">1. Information We Collect</h3>
      <p className="text-gray-700 text-[13px]">
        During signup, we collect personal information including your first name, last name,
        password, Aadhaar details captured via camera, and facial embeddings from the front camera
        for identity verification and future recognition of reservations.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. How We Use Your Information</h3>
      <p className="text-gray-700 text-[13px]">
        Your information is used to create and manage your account, recognize you for hotel
        reservations, verify your identity, and ensure secure access. With your consent, we may also
        use your information for communication related to offers or service updates.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Data Sharing</h3>
      <p className="text-gray-700 text-[13px]">
        We do not sell your personal data. Information may be shared only with trusted service
        providers assisting in verification, security, or when legally required.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Your Rights</h3>
      <p className="text-gray-700 text-[13px]">
        You have rights to access, correct, or delete your information, and to withdraw consent
        where applicable. Please contact support to exercise these rights.
      </p>
    </section>
  </div>
);

const TermsAndConditionsContent = () => (
  <div className="space-y-2">
    <h2 className="text-xl font-bold mb-4">Signup Terms & Conditions</h2>

    <section>
      <h3 className="font-semibold text-sm mb-2">1. Eligibility</h3>
      <p className="text-gray-700 text-[13px]">
        You must be at least 18 years old to create an account. Aadhaar and face verification are
        mandatory for signup to ensure authenticity.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">2. Account Security</h3>
      <p className="text-gray-700 text-[13px]">
        You are responsible for maintaining the confidentiality of your password and account
        details. Any misuse resulting from sharing your login credentials will be your
        responsibility.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">3. Use of Biometric Data</h3>
      <p className="text-gray-700 text-[13px]">
        Facial embeddings and Aadhaar data will only be used for secure identification, preventing
        fraud, and facilitating seamless reservations. We will not use this data for any unrelated
        purposes.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">4. Data Retention</h3>
      <p className="text-gray-700 text-[13px]">
        We will retain your data only as long as necessary to provide our services and comply with
        legal obligations. You may request account deletion at any time.
      </p>
    </section>

    <section>
      <h3 className="font-semibold text-sm mb-2">5. Termination</h3>
      <p className="text-gray-700 text-[13px]">
        We reserve the right to suspend or terminate accounts for fraudulent activity, policy
        violations, or misuse of the platform.
      </p>
    </section>
  </div>
);

export default LegalDocumentsPermission;
