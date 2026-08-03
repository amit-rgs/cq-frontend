// import React from "react";
// import SearchSection from "./SearchSection";
// import mainBg from "../assets/IMG_4366-scaled.jpg";

// const HeroBannerBg = () => (
//   <div className="relative w-full h-[520px] md:h-[720px] lg:h-[750px] flex flex-col items-center">
//     {/* Background image, with vibrance */}
//     <img
//       src={mainBg}
//       alt="Hotel"
//       className="absolute inset-0 w-full h-full object-cover z-0"
//       style={{
//         minHeight: "100%",
//         filter: "brightness() contrast(1.14) saturate(1.18)",
//       }}
//       draggable={false}
//     />

//     {/* Premium hotel-style gradient (strong dark left, fading right) */}
//     <div
//       className="absolute inset-0 z-10 pointer-events-none"
//       style={{
//         background:
//           "linear-gradient(90deg, rgba(24,24,36,0.96) 0%, rgba(44,44,66,0.62) 35%, rgba(44,44,66,0.10) 100%)",
//       }}
//     />

//     {/* Search Section - positioned at top with sticky behavior */}
//     <div className=" z-50 w-5/6 mt-6 sticky top-0">
//       <SearchSection />
//     </div>

//     {/* Hero content */}
//     <div className="relative z-20 flex flex-col items-start justify-center w-full max-w-8xl mx-auto pl-8 md:pl-24 top-0">
//       {/* Pseudo-brand hook */}
//       <h2 className="text-purple-200 uppercase font-semibold tracking-[.25em] text-sm md:text-base mb-4 mt-28">
//         Hello and Welcome
//       </h2>
//       <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg mb-4 text-left max-w-3xl">
//         Enjoy Comfort and Peace
//         <br className="hidden md:block" />
//         On Every Visit
//       </h1>
//       <p className="text-gray-100 text-lg md:text-2xl font-medium drop-shadow max-w-xl text-left mb-3">
//         Escape. Relax. Indulge.
//         <br className="hidden md:block" />
//         Unlock a world of comfort and unforgettable experiences.
//       </p>
//       {/* <button className="mt-4 bg-purple-700 hover:bg-purple-800 text-white px-8 py-3 rounded-full font-semibold text-base md:text-lg shadow-lg transition-all">
//         View Rooms & Offers
//       </button> */}
//     </div>
//   </div>
// );

// export default HeroBannerBg;

import React from 'react';
import mainBg from '../assets/IMG_4366-scaled.jpg';

const HeroBannerBg = () => (
  <div className="relative w-full   h-[520px] md:h-[720px] lg:h-[750px] flex items-center overflow-hidden">
    {/* Background image, with vibrance */}
    <img
      src={mainBg}
      alt="Hotel"
      className="absolute inset-0 w-full h-full object-cover z-0"
      style={{
        minHeight: '100%',
        filter: 'brightness() contrast(1.14) saturate(1.18)  ',
      }}
      draggable={false}
    />
    {/* Premium hotel-style gradient (strong dark left, fading right) */}
    <div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(24,24,36,0.96) 0%, rgba(44,44,66,0.62) 35%, rgba(44,44,66,0.10) 100%)',
      }}
    />

    <div className="relative z-20 flex flex-col items-start justify-center w-full max-w-8xl mx-auto pl-8 md:pl-24 top-0">
      {/* Pseudo-brand hook */}
      <h2 className="text-purple-200 uppercase font-semibold tracking-[.25em] text-sm md:text-base mb-4 ">
        Hello and Welcome
      </h2>
      <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold md:font-extrabold leading-snug sm:leading-tight drop-shadow-lg mb-3 sm:mb-4 text-left max-w-3xl">
        Enjoy Comfort and Peace
        <br className="hidden sm:block" />
        On Every Visit
      </h1>
      <p className="text-gray-100 text-base sm:text-lg md:text-xl lg:text-2xl font-normal sm:font-medium drop-shadow max-w-xl text-left mb-3 sm:mb-6">
        Escape. Relax. Indulge.
        <br className="hidden sm:block" />
        Unlock a world of comfort and unforgettable experiences.
      </p>
      {/* <button className="mt-4 bg-purple-700 hover:bg-purple-800 text-white px-8 py-3 rounded-full font-semibold text-base md:text-lg shadow-lg transition-all">
        View Rooms & Offers
      </button> */}
    </div>
  </div>
);

export default HeroBannerBg;
