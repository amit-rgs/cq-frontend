// src/pages/TermsConditions.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronLeft } from 'lucide-react';

const TermsConditions = () => {
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
            <FileText size={40} className="text-purple-700" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Terms & Conditions
            </h1>
          </div>
        </div>

        {/* Content - No Card */}
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using The Pagoda Hotel's website, making a reservation, or staying at
              our property, you agree to be bound by these Terms & Conditions. If you do not agree
              with any part of these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              2. Reservations and Bookings
            </h2>
            <p className="leading-relaxed">
              All reservations are subject to availability. A valid credit card or advance payment
              may be required to secure your booking. We reserve the right to cancel or modify
              reservations due to unforeseen circumstances or violations of our policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              3. Check-in and Check-out
            </h2>
            <p className="leading-relaxed">
              Check-in time is 2:00 PM and check-out time is 11:00 AM. Early check-in and late
              check-out may be available upon request and subject to additional charges. Valid
              government-issued ID is required at check-in for all guests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              4. Guest Responsibilities
            </h2>
            <p className="leading-relaxed">
              Guests are responsible for their own conduct and the conduct of their visitors. We
              reserve the right to refuse service or evict guests who cause disturbances, damage
              property, or violate any policies. Guests will be held liable for any damages caused
              to the property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              5. Smoking and Pets
            </h2>
            <p className="leading-relaxed">
              The Pagoda Hotel is a non-smoking property. Smoking in rooms will result in a cleaning
              fee. Pets are not allowed unless prior arrangements have been made for service animals
              with proper documentation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              6. Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, The Pagoda Hotel shall not be liable for any
              indirect, incidental, or consequential damages arising from your stay, use of our
              website, or any services provided. Our total liability shall not exceed the amount
              paid for your reservation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              7. Changes to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms & Conditions at any time. Changes will be
              effective immediately upon posting on our website. Your continued use of our services
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              8. Governing Law
            </h2>
            <p className="leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of India.
              Any disputes arising from these terms shall be subject to the exclusive jurisdiction
              of the courts in Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              9. Contact Information
            </h2>
            <p className="leading-relaxed">
              For questions about these Terms & Conditions, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="font-medium">The Pagoda Hotel</p>
              <p>
                Email:{' '}
                <a href="mailto:tushar.bhosle@hotelpagoda.com" className="text-purple-700">
                  tushar.bhosle@hotelpagoda.com
                </a>
              </p>
              <p>
                Phone:{' '}
                <a href="tel:08698732336" className="text-purple-700">
                  086987 32336
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
