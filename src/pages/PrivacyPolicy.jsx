// src/pages/PrivacyPolicy.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}

        {/* Header - No Card */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={40} className="text-purple-700" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Privacy Policy
            </h1>
          </div>
        </div>

        {/* Content - No Card, Just Text */}
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              At The Pagoda Hotel, we collect information that you provide directly to us, such as
              when you make a reservation, sign up for our newsletter, or contact us. This may
              include your name, email address, phone number, payment information, and any other
              details you choose to provide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              2. How We Use Your Information
            </h2>
            <p className="leading-relaxed">
              We use the information we collect to process your reservations, communicate with you
              about your stay, improve our services, send promotional materials (with your consent),
              and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              3. Sharing Your Information
            </h2>
            <p className="leading-relaxed">
              We do not sell your personal information. We may share your information with service
              providers who assist with our operations (such as payment processing), when required
              by law, or with your consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              4. Data Security
            </h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              5. Your Rights
            </h2>
            <p className="leading-relaxed">
              You have the right to access, correct, or delete your personal information. You may
              also opt out of marketing communications at any time. To exercise these rights, please
              contact us at{' '}
              <a
                href="mailto:tushar.bhosle@hotelpagoda.com"
                className="text-purple-700 hover:underline"
              >
                tushar.bhosle@hotelpagoda.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              6. Cookies and Tracking
            </h2>
            <p className="leading-relaxed">
              Our website uses cookies to enhance your browsing experience. You can adjust your
              browser settings to refuse cookies, but some features of our site may not function
              properly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              7. Contact Us
            </h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">The Pagoda Hotel</p>
              <p>Taluka Khed Chiplun Area, Lote, Maharashtra, 415722</p>
              <p>
                Phone:{' '}
                <a href="tel:08698732336" className="text-purple-700">
                  086987 32336
                </a>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:tushar.bhosle@hotelpagoda.com" className="text-purple-700">
                  tushar.bhosle@hotelpagoda.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
