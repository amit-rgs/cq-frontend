import React, { useEffect, useState } from 'react';
import Navbar from './Navbar/Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import RoomReserve from '../Walk-In/RoomReserve';

const NAVBAR_HEIGHT = 81;
const SEARCH_SECTION_HEIGHT = 1; // Adjust based on your RoomReserve component height

const Layout = () => {
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setScrollY(0);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isNavbarHidden = scrollY >= NAVBAR_HEIGHT;
  const showSearchSection = location.pathname === '/';

  return (
    <div className="min-h-screen">
      {/* Navbar - Always fixed at top */}
      <div className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <Navbar />
      </div>

      {/* Hero Banner Container */}
      <div className="relative">
        {/* Outlet - This will contain your hero image/banner */}
        <div
          className="transition-all duration-300"
          style={{
            marginTop: showSearchSection ? NAVBAR_HEIGHT : NAVBAR_HEIGHT,
          }}
        >
          <Outlet />
        </div>

        {/* Search Section - Overlaid on hero image */}
        {showSearchSection && (
          <div
            className={`w-full transition-all duration-300 ${
              isNavbarHidden ? 'fixed top-0 z-40' : 'absolute'
            }`}
            style={{
              top: isNavbarHidden ? NAVBAR_HEIGHT : `calc(${NAVBAR_HEIGHT}px - 2rem)`, // Position it a bit below navbar when not sticky
              left: 0,
              right: 0,
              zIndex: 40,
            }}
          >
            {/* Container for centering the search section */}
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <RoomReserve />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rest of the page content (if any) */}
      {/* {showSearchSection && (
        <div style={{ paddingTop: SEARCH_SECTION_HEIGHT + 50 }}></div>
      )} */}
    </div>
  );
};

export default Layout;

// import React, { useEffect, useState } from "react";
// import Navbar from "./Navbar/Navbar";
// import SearchSection from "./SearchSection";
// import { Outlet, useLocation } from "react-router-dom";
// import RoomReservePage from '../Walk-In/RoomReserve';
// import RoomReserve from "../Walk-In/RoomReserve";

// const NAVBAR_HEIGHT = 112;

// const Layout = () => {
//   const [scrollY, setScrollY] = useState(0);
//   const location = useLocation();

//   useEffect(() => {
//     const onScroll = () => setScrollY(window.scrollY);
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   useEffect(() => {
//     setScrollY(0);
//     window.scrollTo(0, 0);
//   }, [location.pathname]);

//   const isNavbarHidden = scrollY >= NAVBAR_HEIGHT;
//   const showSearchSection = location.pathname === "/";

//   return (
//     <div>
//       {/* Navbar - Always fixed at top */}
//       <div className="fixed top-0 w-full z-50 bg-white shadow-sm">
//         <Navbar />
//       </div>

//       {/* Search Section - Only shown on homepage */}
//       {showSearchSection && (
//         <div
//           className={`w-full bg-white transition-all duration-300 ${
//             isNavbarHidden ? "fixed top-0 z-40 shadow-md" : "relative"
//           }`}
//           style={{
//             top: isNavbarHidden ? NAVBAR_HEIGHT : "auto",
//           }}
//         >
//           <div
//             style={{
//               marginTop: isNavbarHidden ? 0 : NAVBAR_HEIGHT,
//             }}
//           >
//             <RoomReserve />
//           </div>
//         </div>
//       )}

//       {/* Content Area - Hero Banner goes here */}
//       <div
//         className="transition-all duration-300"
//         style={{
//           marginTop: showSearchSection && !isNavbarHidden ? 0 : NAVBAR_HEIGHT,
//         }}
//       >
//         <Outlet />
//       </div>
//     </div>
//   );
// };

// export default Layout;
