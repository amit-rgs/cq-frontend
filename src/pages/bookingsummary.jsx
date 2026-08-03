import React from 'react';
import {
  Check,
  Download,
  Calendar,
  Users,
  MapPin,
  Phone,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

const BookingConfirmationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Booking Confirmed!</h1>
              <p className="text-gray-600 mt-1">Your reservation is now complete</p>
            </div>
          </div>
          <div className="inline-block bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <span className="text-gray-700">Booking ID: </span>
            <span className="font-mono font-bold text-gray-900">N4175082408612880</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Booking Details in Column */}
          <div className="lg:w-2/3 space-y-6">
            {/* Property Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="h-48 mt-10 bg-gradient-to-br from-blue-500 to-emerald-400 rounded-xl overflow-hidden">
                    <div className="h-full flex items-center justify-center"></div>
                  </div>
                </div>

                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Adi Yogi Campsite</h2>

                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
                    {/* Header with Booking ID */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Camp</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Booking ID <span className="font-mono font-medium">NH75082408612880</span>
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                        Download Invoice
                      </button>
                    </div>

                    {/* Location and Contact */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>
                          Adi Yogi Campsite, Sari Village, Ukhimath, Near Heaven Hills resort,
                          246469, Chopta
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone size={18} className="text-blue-500 flex-shrink-0" />
                        <span>Contact: 9389708511</span>
                      </div>
                    </div>

                    {/* Check-in/Check-out Details */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="border-r border-gray-200 pr-4">
                        <p className="text-sm text-gray-500 mb-1">CHECK-IN</p>
                        <p className="text-lg font-semibold text-gray-900">17</p>
                        <p className="text-gray-700">
                          Jun 2025 <span className="text-gray-500">•</span> Tue, 12:00 PM
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">CHECK-OUT</p>
                        <p className="text-lg font-semibold text-gray-900">18</p>
                        <p className="text-gray-700">
                          Jun 2025 <span className="text-gray-500">•</span> Wed, 12:00 PM
                        </p>
                      </div>
                    </div>

                    {/* Stay Duration */}
                    <div className="mb-5">
                      <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <span className="font-medium">1 NIGHT STAY</span>
                      </div>
                    </div>

                    {/* Accommodation Details */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 mb-2">Checking-in at a property</p>
                      <ul className="text-gray-600 text-sm space-y-1 mb-4">
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          Caretaker Greets You & Helps You Check-in
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          Host Greets You & Helps You Check-in
                        </li>
                        <li className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                          Guests can collect or deposit keys through the building staff
                        </li>
                      </ul>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-700 font-medium">1 ENTIRE CAMP</p>
                          <p className="text-gray-600 text-sm">• 3 Guests</p>
                        </div>
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                          <MapPin size={16} />
                          VIEW MAP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Check-in/Check-out Cards */}
                </div>
              </div>
            </div>

            {/* Camp Info Card */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users size={24} />
                  <span className="text-xl font-bold">1 ENTIRE CAMP</span>
                </div>
                <div className="text-3xl font-bold">3</div>
              </div>
              <p className="text-blue-100">Guests</p>
            </div>

            {/* Check-in Instructions Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Checking-in at Property
              </h3>
              <ul className="space-y-4">
                {[
                  'Caretaker Greets You & Helps You Check-in',
                  'Host Greets You & Helps You Check-in',
                  'Guests can collect or deposit keys through the building staff',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Important Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Important Information</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Unmarried couples allowed</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">ID proof required at check-in</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">
                    Free cancellation until 24 hours before check-in
                  </span>
                </li>
              </ul>
            </div>

            {/* Download Invoice Button */}
            <div className="text-center pt-4">
              <button className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <Download size={22} />
                Download Invoice
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
              <p className="text-gray-500 text-sm mt-3">PDF will be downloaded instantly</p>
            </div>
          </div>

          {/* Right Column - Minimal Payment Summary */}
          <div className="lg:w-1/3">
            <div className="sticky top-8">
              {/* Price Summary Card - Minimal */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Price Summary</h3>
                  <p className="text-gray-500 text-sm">Complete breakdown of your payment</p>
                </div>

                <div className="p-6">
                  {/* Total Price */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-gray-900">₹ 1,554</span>
                    </div>
                    <div className="text-sm text-gray-500">Inclusive of all taxes</div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-200 my-6"></div>

                  {/* Payment Status */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">Payment Status</span>
                      </div>
                      <span className="font-semibold text-green-600">Paid</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard size={18} className="text-gray-600" />
                        <span className="font-medium text-gray-900">Credit/Debit Card</span>
                      </div>
                      <div className="text-sm text-gray-600">••••ksb</div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    View Detailed Breakup
                  </button>
                </div>
              </div>

              {/* Travel Assistant - Minimal */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle size={24} className="text-blue-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900">Myra - Travel Assistant</div>
                    <div className="text-gray-600 text-sm">24/7 support available</div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 text-sm">
                  Need help with your booking? I'm here to assist you with any questions.
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Need help? Contact our support team at support@adiyogicampsite.com or call +91
            9889708511
          </p>
          <p className="mt-1">© 2025 Adi Yogi Campsite. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;

// import React from 'react';

// const BookingConfirmationPage = () => {
//   return (
//     <div className="min-h-screen bg-white p-4 font-sans">
//       <div className="max-w-8xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
//           <h2 className="text-xl font-semibold text-green-700 mt-1">Adi Yogi Campsite</h2>
//           <div className="w-full h-px bg-gray-300 my-3"></div>
//         </div>

//         {/* Booking Confirmation */}
//         <div className="mb-8">
//           <div className="flex items-center gap-2 mb-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//             <p className="text-green-700 font-medium">Your Booking has been completed.</p>
//           </div>
//           <p className="text-gray-800">
//             Booking © <span className="font-bold">INF/2025/4064/2380</span>
//           </p>
//         </div>

//         {/* Main Content Grid */}
//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Left Column */}
//           <div className="lg:w-2/3 space-y-6">
//             {/* Property Info Card */}
//             <div className="border border-gray-300 rounded-lg p-5">
//               <h3 className="text-xl font-bold text-gray-900 mb-3">Adi Yogi Campsite</h3>
//               <p className="text-gray-700 mb-2">
//                 Adi Yogi Campsite, 3rd Village, Lobanova, Near Heaven Hills report, 2646/64, Creepa
//               </p>
//               <p className="text-gray-700 mb-6">Contact: 1987/90811</p>

//               {/* Check-in/Check-out */}
//               <div className="flex gap-8 mb-6">
//                 <div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
//                     <span className="text-gray-700 font-medium">CHECK-IN</span>
//                   </div>
//                   <div className="text-3xl font-bold text-gray-900">17</div>
//                   <div className="text-gray-700">Jul-2025</div>
//                   <div className="text-gray-600 text-sm">18:12:00 PM</div>
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                     <span className="text-gray-700 font-medium">CHECK-OUT</span>
//                   </div>
//                   <div className="text-3xl font-bold text-gray-900">18</div>
//                   <div className="text-gray-700">Jul-2025</div>
//                   <div className="text-gray-600 text-sm">19:12:00 PM</div>
//                 </div>
//               </div>

//               {/* Instructions */}
//               <div className="space-y-2 text-gray-700 mb-8">
//                 <div className="flex items-center gap-2">
//                   <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
//                   <span>Complete/Create+You & Enjoy You Check-in</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
//                   <span>Host Genesis You & Enjoy You Check-in</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
//                   <span>Genesis can collect or deposit keys through the building staff</span>
//                 </div>
//               </div>

//               {/* Guest Count */}
//               <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
//                 <div className="flex items-center gap-2">
//                   <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
//                   <span className="font-medium">1 ENTIRE CAMP</span>
//                 </div>
//                 <div className="text-lg font-bold">9 Guests</div>
//               </div>
//             </div>

//             {/* Download Invoice Button */}
//             <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
//               Download invoice
//             </button>

//             {/* Important Information */}
//             <div className="border border-gray-300 rounded-lg p-5">
//               <h4 className="font-bold text-gray-900 mb-4">Important Information for Check-in</h4>
//               <ul className="space-y-3 text-gray-700">
//                 <li className="flex items-start gap-2">
//                   <span className="text-gray-500">•</span>
//                   <span>Unmarried couples allowed</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-gray-500">•</span>
//                   <span>Groups with only male guests are not allowed at this property</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-gray-500">•</span>
//                   <span>Local IDs not allowed</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-gray-500">•</span>
//                   <span>Aadhaar and Driving License are accepted as ID proof(s)</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-gray-500">•</span>
//                   <span>In-house meals are available for the guests</span>
//                 </li>
//               </ul>
//               <button className="text-green-700 font-medium mt-4 hover:text-green-800">
//                 View All Rules
//               </button>
//             </div>

//             {/* Property Layout */}
//             <div className="border border-gray-300 rounded-lg p-5">
//               <h4 className="font-bold text-gray-900 mb-3">PROPERTY LAYOUT</h4>
//               <p className="text-gray-700 mb-4">
//                 Adi Yogi Campsite (with 6 Private + Spaces)<br />
//                 Booked For 3 Guests
//               </p>
//               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//                 {[
//                   'Bathroom 1 (shuts)',
//                   'Bathroom 2 (shuts)',
//                   'Bathroom 3 (shuts)',
//                   'Parking 1',
//                   'Chairs',
//                   'Parking 2 available for 4 Cars'
//                 ].map((item, index) => (
//                   <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3 text-center text-sm text-gray-700">
//                     {item}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right Column */}
//           <div className="lg:w-1/3 space-y-6">
//             {/* Booking Details */}
//             <div className="border border-gray-300 rounded-lg p-5">
//               <h4 className="font-bold text-gray-900 mb-4">BOOKING DETAILS</h4>
//               <p className="text-gray-600 text-sm mb-6">Your room, meal plan and guest details</p>

//               {/* Night Count */}
//               <div className="bg-gray-50 p-4 rounded-lg mb-6">
//                 <div className="text-center text-3xl font-bold text-gray-900 mb-2">1 NIGHT</div>
//                 <div className="flex justify-between text-sm">
//                   <div>
//                     <div className="text-gray-500 text-xs">CHECK-IN</div>
//                     <div className="font-medium">Tue, 17 Jun 2025</div>
//                     <div className="text-gray-500 text-xs">15:09 PM channels</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-gray-500 text-xs">CHECK-OUT</div>
//                     <div className="font-medium">Wed, 18 Jun 2025</div>
//                     <div className="text-gray-500 text-xs">11:13:00 PM</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Guest Details */}
//               <div className="space-y-4">
//                 <div>
//                   <div className="text-gray-700 font-medium mb-1">9 GUESTS</div>
//                   <div className="text-gray-500 text-sm">TOTAL GUESTS</div>
//                   <div className="font-medium">3 Adults</div>
//                 </div>

//                 <div>
//                   <div className="text-gray-700 font-medium mb-1">PHONE NO.</div>
//                   <div className="font-mono">9174 278906431</div>
//                 </div>

//                 <div>
//                   <div className="text-gray-700 font-medium mb-1">PRIMARY GUEST</div>
//                   <div className="font-medium">Sagar Dattich</div>
//                   <div className="text-gray-500 text-sm mt-1">EMAIL ID</div>
//                   <div className="text-sm">sagardattich82@gmail.com</div>
//                 </div>

//                 <div>
//                   <div className="font-medium">1 ENTIRE CAMP</div>
//                   <div className="text-gray-500 text-sm">Adi Yogi Campsite</div>
//                   <div className="mt-1">3 adults</div>
//                 </div>
//               </div>
//             </div>

//             {/* Cancellation Policy */}
//             <div className="border border-red-200 bg-red-50 rounded-lg p-5">
//               <h4 className="font-bold text-gray-900 mb-4">CANCELLATION</h4>
//               <p className="text-gray-600 text-sm mb-4">Cancellation charges applicable as per policy.</p>
//               <ul className="space-y-3 text-sm text-gray-700">
//                 <li className="flex items-start gap-2">
//                   <span className="text-red-500">•</span>
//                   <span>This tariff connects cancelled-aids service</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-red-500">•</span>
//                   <span>Any cancellation will be subject to a Notice Fee of Information 2025-06-04 22:29:23</span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-red-500">•</span>
//                   <span>
//                     Best Individuation till 2025-06-12 15:59:58 (please note in line) - 100% of booking annual offer
//                   </span>
//                 </li>
//                 <li className="flex items-start gap-2">
//                   <span className="text-red-500">•</span>
//                   <span>
//                     2025-06-12 12:00 PM (please note in line) - 100% of booking annual € cancellation was only allowed before Checkin.
//                   </span>
//                 </li>
//               </ul>
//             </div>

//             {/* Camp Details */}
//             <div className="border border-gray-300 rounded-lg p-5">
//               <h4 className="font-bold text-gray-900 mb-4">CAMP DETAILS</h4>
//               <p className="text-gray-600 text-sm mb-4">Amenities and photographs of Adi Yogi Campsite</p>
//               <div className="space-y-3 text-gray-700">
//                 {[
//                   'Welcome Drink Start',
//                   'Ginger/Mister Holzer',
//                   'Sharing Mirror',
//                   'Luggage Assistance',
//                   'Dining Area',
//                   'First-aid Services',
//                   'Recreation',
//                   'Room Service',
//                   'Free Parking'
//                 ].map((amenity, index) => (
//                   <div key={index} className="flex items-center gap-2">
//                     <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
//                     <span>{amenity}</span>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-gray-500 text-sm mt-4">*4 Amenities</div>
//             </div>

//             {/* Footer Links */}
//             <div className="text-center text-gray-500 text-sm border-t border-gray-300 pt-4">
//               <span className="hover:text-gray-700 cursor-pointer">View All Amenities</span>
//               <span className="mx-2">|</span>
//               <span className="hover:text-gray-700 cursor-pointer">View Photos</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookingConfirmationPage;
