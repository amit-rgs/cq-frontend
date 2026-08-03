// src/pages/CancellationPolicy.js
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarX, ChevronLeft } from 'lucide-react';

const CancellationPolicy = () => {
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
            <CalendarX size={40} className="text-purple-700" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Cancellation Policy
            </h1>
          </div>
        </div>

        {/* Important Notice - Highlight Box */}
        <div className="mb-8">
          <p className="font-medium text-gray-900">Important Notice</p>
          <p className="text-gray-600 text-sm mt-1">
            Cancellation policies may vary based on the rate plan selected during booking. Please
            review your specific reservation details.
          </p>
        </div>

        {/* Content - No Card */}
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Standard Cancellation Policy
            </h2>
            <ul className="space-y-3">
              <li className="leading-relaxed">
                <span className="font-medium">Cancellation more than 7 days before check-in:</span>{' '}
                <span className="text-green-600 font-semibold">Full refund</span>
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Cancellation 3-7 days before check-in:</span>{' '}
                <span className="text-amber-600 font-semibold">50% refund</span>
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Cancellation less than 3 days before check-in:</span>{' '}
                <span className="text-red-600 font-semibold">No refund</span>
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">No-show:</span>{' '}
                <span className="text-red-600 font-semibold">Full charge</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              How to Cancel Your Reservation
            </h2>
            <p className="leading-relaxed">
              To cancel your reservation, please contact us directly:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>
                Phone:{' '}
                <a href="tel:08698732336" className="text-purple-700">
                  086987 32336
                </a>
              </li>
              <li>
                Email:{' '}
                <a href="mailto:tushar.bhosle@hotelpagoda.com" className="text-purple-700">
                  tushar.bhosle@hotelpagoda.com
                </a>
              </li>
            </ul>
            <p className="leading-relaxed mt-3">
              Please have your reservation number ready when you call or include it in your email.
              Cancellation requests are processed based on the date and time we receive them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Refund Processing
            </h2>
            <p className="leading-relaxed">
              Approved refunds will be processed within 7-10 business days. The refund will be
              issued to the original payment method used for the booking. Please note that your
              financial institution may take additional time to reflect the refund in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Group Bookings (5+ Rooms)
            </h2>
            <p className="leading-relaxed">
              Group bookings are subject to a separate cancellation policy. Please refer to your
              group contract or contact our group sales team for specific terms. Generally, group
              cancellations require 30 days' notice for a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Special Events and Peak Season
            </h2>
            <p className="leading-relaxed">
              For bookings during holidays, festivals, or special events, non-refundable deposits or
              full prepayment may be required. These bookings have stricter cancellation terms,
              which will be clearly communicated at the time of booking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Early Departure
            </h2>
            <p className="leading-relaxed">
              If you check out earlier than your scheduled departure date, you may be charged for
              the unused nights depending on the rate policy of your booking. Please contact the
              front desk to discuss early departure options.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Exceptional Circumstances
            </h2>
            <p className="leading-relaxed">
              In the event of emergencies, natural disasters, or government-imposed travel
              restrictions, we may offer flexible cancellation options on a case-by-case basis.
              Please contact us directly to discuss your situation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Contact Us
            </h2>
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
              <p className="mt-2 text-sm text-gray-500">
                Cancellation requests must be made during business hours (9:00 AM - 8:00 PM IST) for
                same-day processing.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;
