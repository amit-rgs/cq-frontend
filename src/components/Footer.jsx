// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, MapPin, Mail, Phone } from 'lucide-react';
import pagodaLogo from '../assets/logomain.png';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white w-full">
      <div className="mx-auto w-full bg-gray-100 px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Content - Flex layout for perfect vertical alignment */}
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
            {/* Left Column: Logo & Contact - Fixed width for alignment */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <img
                  src={pagodaLogo}
                  alt="Pagoda Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">The Pagoda</span>
                  <span className="px-2 py-1 bg-gray-900 text-white rounded text-sm sm:text-base font-medium">
                    Xecutive
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-gray-800">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-purple-700 mt-0.5 flex-shrink-0" />
                  <a
                    href="https://www.google.com/maps/place/The+Pagoda+Hotel/@17.4272085,73.2034077,10z/data=!4m13!1m2!2m1!1sTaluka+Khed+Chiplun+Area,+Lote,+Maharashtra,+415722!3m9!1s0x3bc2062936b1f48b:0xb9d961933da80a82!5m2!4m1!1i2!8m2!3d17.611563!4d73.48019!15sCjNUYWx1a2EgS2hlZCBDaGlwbHVuIEFyZWEsIExvdGUsIE1haGFyYXNodHJhLCA0MTU3MjJaMiIwdGFsdWthIGtoZWQgY2hpcGx1biBhcmVhIGxvdGUgbWFoYXJhc2h0cmEgNDE1NzIykgEFaG90ZWyqAXcQASocIhh0YWx1a2Ega2hlZCBjaGlwbHVuIGFyZWEoADIfEAEiG2srUoQQazfdIiCPJnnxYjBIJJ_ZFosM_jsPfzI0EAIiMHRhbHVrYSBraGVkIGNoaXBsdW4gYXJlYSBsb3RlIG1haGFyYXNodHJhIDQxNTcyMuABAA!16s%2Fg%2F1tdp3hbf?entry=ttu&g_ep=EgoyMDI1MTEwOS4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-purple-700 transition-colors leading-relaxed"
                  >
                    Taluka Khed Chiplun Area,
                    <br />
                    Lote, Maharashtra, 415722
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-purple-700 flex-shrink-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-gray-600">Phone:</span>
                    <a
                      href="tel:08698732336"
                      className="text-purple-700 hover:underline font-semibold"
                    >
                      086987 32336
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-purple-700 flex-shrink-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-gray-600">Email:</span>
                    <a
                      href="mailto:tushar.bhosle@hotelpagoda.com"
                      className="text-purple-700 hover:underline font-semibold break-all"
                    >
                      reception@hotelpagoda.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Links - Perfectly aligned with Location */}
            <div className="lg:w-1/2 flex flex-col">
              {/* This empty div creates the same vertical space as the logo area */}
              <div className="mb-6 ">
                {/* Invisible spacer for alignment */}
                <div className="invisible "></div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-lg md:text-xl text-gray-900">Quick Links</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      <li>
                        <Link
                          to="/about"
                          className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
                        >
                          <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                          About Us
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/rooms"
                          className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
                        >
                          <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                          Our Rooms
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/contact"
                          className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
                        >
                          <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
                          Contact & Directions
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-300 pt-6 mt-8 md:mt-12">
            <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6">
              {/* Legal Links - THESE ARE THE POLICY LINKS */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm text-gray-600">
                <Link
                  to="/privacy"
                  className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
                >
                  Terms & Conditions
                </Link>
                <Link
                  to="/cancellation"
                  className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
                >
                  Cancellation Policy
                </Link>
              </div>

              {/* Scroll to Top Button */}
              <button
                onClick={scrollToTop}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-700 hover:bg-purple-800 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                aria-label="Scroll to top"
              >
                <ChevronUp size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Copyright */}
            <div className="text-center mt-6 md:mt-8 text-sm text-gray-600">
              <p className="mb-2">© {currentYear} the pagoda hotel. All rights reserved.</p>
              <p className="text-xs text-gray-500">
                Powered by Rhombus Quest (Rhombus Global Services Inc. (RGS), USA)
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

// import React from "react";
// import { Link } from "react-router-dom";
// import { ChevronUp, MapPin, Mail, Phone } from "lucide-react";
// import pagodaLogo from "../assets/logomain.png";

// const Footer = () => {
//   const scrollToTop = () => {
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   const currentYear = new Date().getFullYear();

//   return (
//     <footer className="bg-white w-full">
//       <div className="mx-auto w-full bg-gray-100 px-4 sm:px-6 lg:px-8 py-8 md:py-12">
//         <div className="max-w-7xl mx-auto">
//           {/* Main Content - Flex layout for perfect vertical alignment */}
//           <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
//             {/* Left Column: Logo & Contact - Fixed width for alignment */}
//             <div className="lg:w-1/2 flex flex-col">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
//                 <img
//                   src={pagodaLogo}
//                   alt="Pagoda Logo"
//                   className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
//                 />
//                 <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2">
//                   <span className="text-2xl sm:text-3xl font-bold text-gray-900">
//                     The Pagoda
//                   </span>
//                   <span className="px-2 py-1 bg-gray-900 text-white rounded text-sm sm:text-base font-medium">
//                     Xecutive
//                   </span>
//                 </div>
//               </div>

//               <div className="space-y-4 text-sm sm:text-base text-gray-800">
//                 <div className="flex items-start gap-3">
//                   <MapPin
//                     size={20}
//                     className="text-purple-700 mt-0.5 flex-shrink-0"
//                   />
//                   <a
//                     href="https://www.google.com/maps/place/The+Pagoda+Hotel/@17.4272085,73.2034077,10z/data=!4m13!1m2!2m1!1sTaluka+Khed+Chiplun+Area,+Lote,+Maharashtra,+415722!3m9!1s0x3bc2062936b1f48b:0xb9d961933da80a82!5m2!4m1!1i2!8m2!3d17.611563!4d73.48019!15sCjNUYWx1a2EgS2hlZCBDaGlwbHVuIEFyZWEsIExvdGUsIE1haGFyYXNodHJhLCA0MTU3MjJaMiIwdGFsdWthIGtoZWQgY2hpcGx1biBhcmVhIGxvdGUgbWFoYXJhc2h0cmEgNDE1NzIykgEFaG90ZWyqAXcQASocIhh0YWx1a2Ega2hlZCBjaGlwbHVuIGFyZWEoADIfEAEiG2srUoQQazfdIiCPJnnxYjBIJJ_ZFosM_jsPfzI0EAIiMHRhbHVrYSBraGVkIGNoaXBsdW4gYXJlYSBsb3RlIG1haGFyYXNodHJhIDQxNTcyMuABAA!16s%2Fg%2F1tdp3hbf?entry=ttu&g_ep=EgoyMDI1MTEwOS4wIKXMDSoASAFQAw%3D%3D"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="hover:underline hover:text-purple-700 transition-colors leading-relaxed"
//                   >
//                     Taluka Khed Chiplun Area,
//                     <br />
//                     Lote, Maharashtra, 415722
//                   </a>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <Phone size={20} className="text-purple-700 flex-shrink-0" />
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
//                     <span className="text-gray-600">Phone:</span>
//                     <a
//                       href="tel:08698732336"
//                       className="text-purple-700 hover:underline font-semibold"
//                     >
//                       086987 32336
//                     </a>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <Mail size={20} className="text-purple-700 flex-shrink-0" />
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
//                     <span className="text-gray-600">Email:</span>
//                     <a
//                       href="mailto:tushar.bhosle@hotelpagoda.com"
//                       className="text-purple-700 hover:underline font-semibold break-all"
//                     >
//                       tushar.bhosle@hotelpagoda.com
//                     </a>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Column: Quick Links - Perfectly aligned with Location */}
//             <div className="lg:w-1/2 flex flex-col">
//               {/* This empty div creates the same vertical space as the logo area */}
//               <div className="mb-6 ">
//                 {/* Invisible spacer for alignment */}
//                 <div className="invisible "></div>
//               </div>

//               <div className="space-y-6">
//                 <h3 className="font-bold text-lg md:text-xl text-gray-900">
//                   Quick Links
//                 </h3>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
//                   <div className="space-y-4">
//                     <ul className="space-y-3">
//                       <li>
//                         <Link
//                           to="/about"
//                           className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
//                         >
//                           <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
//                           About Us
//                         </Link>
//                       </li>
//                       <li>
//                         <Link
//                           to="/rooms"
//                           className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
//                         >
//                           <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
//                           Our Rooms
//                         </Link>
//                       </li>
//                       <li>
//                         <Link
//                           to="/contact"
//                           className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
//                         >
//                           <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
//                           Contact & Directions
//                         </Link>
//                       </li>
//                       <li>
//                         <Link
//                           to="/contact"
//                           className="text-gray-600 hover:text-purple-700 transition-colors flex items-center gap-3 group text-sm sm:text-base"
//                         >
//                           <span className="w-1.5 h-1.5 bg-purple-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></span>
//                           About us
//                         </Link>
//                       </li>
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Bottom Section */}
//           <div className="border-t border-gray-300 pt-6 mt-8 md:mt-12">
//             <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6">
//               {/* Legal Links */}
//               <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm text-gray-600">
//                 <Link
//                   to="/privacy"
//                   className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
//                 >
//                   Privacy Policy
//                 </Link>
//                 <Link
//                   to="/terms"
//                   className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
//                 >
//                   Terms & Conditions
//                 </Link>
//                 <Link
//                   to="/cancellation"
//                   className="hover:text-purple-700 transition-colors hover:underline px-2 py-1"
//                 >
//                   Cancellation Policy
//                 </Link>
//               </div>

//               {/* Scroll to Top Button */}
//               <button
//                 onClick={scrollToTop}
//                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-700 hover:bg-purple-800 flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
//                 aria-label="Scroll to top"
//               >
//                 <ChevronUp size={20} className="sm:w-6 sm:h-6" />
//               </button>
//             </div>

//             {/* Copyright */}
//             <div className="text-center mt-6 md:mt-8 text-sm text-gray-600">
//   <p className="mb-2">
//     © 2026 the pagoda hotel. All rights reserved.
//   </p>
//   <p className="text-xs text-gray-500">
//     Powered by Rhombus Quest (Rhombus Global Services Inc. (RGS), USA)
//   </p>

//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;
