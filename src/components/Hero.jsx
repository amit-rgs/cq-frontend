import React from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import breakfast from '../assets/breakfast.webp';
import dinner from '../assets/dinner.webp';
import spa from '../assets/spa.jpg';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const amenities = [
  {
    label: 'IN-ROOM DINING',
    title: 'Breakfast',
    description: 'Hot gourmet breakfast delivered to your room, any time you want.',
    image: breakfast,
    buttonText: 'View Details',
  },
  {
    label: 'DINNER BUFFET',
    title: 'Dinner Delight',
    description: 'Lavish dinner buffet with live cooking stations and desserts.',
    image: dinner,
    buttonText: 'View Details',
  },
  {
    label: 'RELAXATION',
    title: 'Spa',
    description: 'Rejuvenate with massages, therapies and wellness treatments in our spa.',
    image: spa,
    buttonText: 'View Details',
  },
];

const Hero = () => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate('/amenities');
  };

  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-full transition-all shadow-lg active:scale-95 backdrop-blur-sm hover:backdrop-blur-none"
      aria-label="Next slide"
    >
      <ChevronRight
        className="text-gray-800 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
        size={16}
        style={{ width: 'auto', height: 'auto' }}
      />
    </button>
  );

  const PrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 sm:p-2 md:p-2.5 lg:p-3 rounded-full transition-all shadow-lg active:scale-95 backdrop-blur-sm hover:backdrop-blur-none"
      aria-label="Previous slide"
    >
      <ChevronLeft
        className="text-gray-800 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
        size={16}
      />
    </button>
  );

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          arrows: true,
          dots: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          arrows: true,
          dots: true,
          autoplaySpeed: 4000,
        },
      },
      {
        breakpoint: 640,
        settings: {
          arrows: true,
          dots: true,
          autoplaySpeed: 4000,
        },
      },
    ],
    appendDots: (dots) => (
      <div className="bottom-0 md:bottom-4">
        <ul className="flex justify-center gap-1.5 md:gap-2"> {dots} </ul>
      </div>
    ),
    customPaging: (i) => (
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-400 hover:bg-gray-700 transition-all cursor-pointer"></div>
    ),
  };

  return (
    <div className="slider-container bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden pt-16 md:pt-20 pb-16 md:pb-20 w-full">
      <div className="flex-1 relative">
        <Slider {...settings}>
          {amenities.map((slide, index) => (
            <div key={index} className="focus:outline-none">
              <div className="h-full relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                  <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center h-full py-6 md:py-8 lg:py-12">
                    {/* Left Side - Content */}
                    <div className="flex flex-col justify-center space-y-3 md:space-y-4 lg:space-y-6 z-10 order-2 lg:order-1">
                      <div className="inline-block">
                        <span className="text-purple-600 font-bold text-xs md:text-sm tracking-wider uppercase">
                          {slide.label}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-snug md:leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
                        {slide.description}
                      </p>
                      <div className="pt-2 md:pt-4">
                        <button
                          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-semibold inline-flex items-center gap-1.5 md:gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base"
                          onClick={handleViewDetails}
                        >
                          {slide.buttonText}
                          <ArrowRight size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Right Side - Image */}
                    <div className="relative flex justify-center items-center order-1 lg:order-2 mb-4 lg:mb-0">
                      <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-xl sm:rounded-2xl shadow-xl md:shadow-2xl"
                          loading={index === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default Hero;

// import React from "react";
// import { useNavigate } from "react-router-dom";
// import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
// import breakfast from "../assets/breakfast.webp";
// import dinner from "../assets/dinner.webp";
// import spa from "../assets/spa.jpg";
// import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// const amenities = [
//   {
//     label: "IN-ROOM DINING",
//     title: "Breakfast",
//     description:
//       "Hot gourmet breakfast delivered to your room, any time you want.",
//     image: breakfast,
//     buttonText: "View Details",
//   },
//   {
//     label: "DINNER BUFFET",
//     title: "Dinner Delight",
//     description:
//       "Lavish dinner buffet with live cooking stations and desserts.",
//     image: dinner,
//     buttonText: "View Details",
//   },
//   {
//     label: "RELAXATION",
//     title: "Spa",
//     description:
//       "Rejuvenate with massages, therapies and wellness treatments in our spa.",
//     image: spa,
//     buttonText: "View Details",
//   },
// ];

// const Hero = () => {
//   const navigate = useNavigate();

//   const handleViewDetails = () => {
//     navigate("/amenities");
//   };

//   const NextArrow = ({ onClick }) => (
//     <button
//       onClick={onClick}
//       className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 md:p-2 rounded-full transition-all shadow-lg active:scale-95"
//       aria-label="Next slide"
//     >
//       <ChevronRight className="text-gray-800" size={20} md:size={24} />
//     </button>
//   );

//   const PrevArrow = ({ onClick }) => (
//     <button
//       onClick={onClick}
//       className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-1.5 md:p-2 rounded-full transition-all shadow-lg active:scale-95"
//       aria-label="Previous slide"
//     >
//       <ChevronLeft className="text-gray-800" size={20} md:size={24} />
//     </button>
//   );

//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     nextArrow: <NextArrow />,
//     prevArrow: <PrevArrow />,
//     autoplay: true,
//     autoplaySpeed: 5000,
//     responsive: [
//       {
//         breakpoint: 1024,
//         settings: {
//           arrows: true,
//           dots: true,
//         },
//       },
//       {
//         breakpoint: 640,
//         settings: {
//           arrows: true,
//           dots: true,
//           autoplaySpeed: 4000,
//         },
//       },
//     ],
//     appendDots: (dots) => (
//       <div className="bottom-0 md:bottom-4">
//         <ul className="flex justify-center gap-1.5 md:gap-2"> {dots} </ul>
//       </div>
//     ),
//     customPaging: (i) => (
//       <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-400 hover:bg-gray-700 transition-all cursor-pointer"></div>
//     ),
//   };

//   return (
//     <div className="slider-container bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden pt-16 md:pt-20 pb-16 md:pb-20 w-full">
//       <div className="flex-1 relative">
//         <Slider {...settings}>
//           {amenities.map((slide, index) => (
//             <div key={index} className="focus:outline-none">
//               <div className="h-full relative">
//                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
//                   <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center h-full py-6 md:py-8 lg:py-12">
//                     {/* Left Side - Content */}
//                     <div className="flex flex-col justify-center space-y-3 md:space-y-4 lg:space-y-6 z-10 order-2 lg:order-1">
//                       <div className="inline-block">
//                         <span className="text-purple-600 font-bold text-xs md:text-sm tracking-wider uppercase">
//                           {slide.label}
//                         </span>
//                       </div>
//                       <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-snug md:leading-tight">
//                         {slide.title}
//                       </h1>
//                       <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
//                         {slide.description}
//                       </p>
//                       <div className="pt-2 md:pt-4">
//                         <button
//                           className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg font-semibold inline-flex items-center gap-1.5 md:gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base"
//                           onClick={handleViewDetails}
//                         >
//                           {slide.buttonText}
//                           <ArrowRight size={16} md:size={18} />
//                         </button>
//                       </div>
//                     </div>

//                     {/* Right Side - Image */}
//                     <div className="relative flex justify-center items-center order-1 lg:order-2 mb-4 lg:mb-0">
//                       <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl">
//                         <img
//                           src={slide.image}
//                           alt={slide.title}
//                           className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-xl sm:rounded-2xl shadow-xl md:shadow-2xl"
//                           loading={index === 0 ? "eager" : "lazy"}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </Slider>
//       </div>
//     </div>
//   );
// };

// export default Hero;
