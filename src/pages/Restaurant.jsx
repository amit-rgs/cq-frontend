import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import restaurant1 from '../assets/unnamed.jpg';
import cuisane from '../assets/Cuisine.jpg';

// Define the base URL from environment variables
const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const Restaurant = () => {
  // State for active menu tab
  const [activeMenuTab, setActiveMenuTab] = useState('food');
  // State for API food items
  const [apiItems, setApiItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Create ref for gallery section
  const galleryRef = useRef(null);

  // Full menu data structure (professional grouping)
  const menuData = {
    food: {
      title: 'Signature Plates',
      items: [
        {
          name: 'Green Urad Phali',
          desc: 'Crispy lentil beans with aromatic spices',
          price: '₹320',
          isVeg: true,
        },
        {
          name: 'Tilki Wali Paneer',
          desc: 'Grilled cottage cheese with sesame crust',
          price: '₹450',
          isVeg: true,
        },
        {
          name: 'Chicken Biryani',
          desc: 'Fragrant basmati rice with tender chicken',
          price: '₹550',
          isVeg: false,
        },
        {
          name: 'Fish N Chips',
          desc: 'Beer-battered catch of the day',
          price: '₹590',
          isVeg: false,
        },
        {
          name: 'Kozhi Ulattiyathu',
          desc: 'Kerala-style roasted chicken',
          price: '₹520',
          isVeg: false,
        },
        {
          name: 'Masala Dosa',
          desc: 'Crispy rice crepe with potato masala',
          price: '₹210',
          isVeg: true,
        },
        {
          name: 'Dal Makhani',
          desc: 'Slow-cooked black lentils',
          price: '₹340',
          isVeg: true,
        },
        {
          name: 'Aloo Gobi',
          desc: 'Cauliflower & potato stir-fry',
          price: '₹280',
          isVeg: true,
        },
      ],
    },
    bar: {
      title: 'Bar & Spirits',
      items: [
        {
          name: 'Single Malt Whisky',
          desc: 'Glenfiddich / Macallan',
          price: '₹750',
          isVeg: false,
        },
        {
          name: 'Premium Gin',
          desc: "Monkey 47 / Hendrick's",
          price: '₹680',
          isVeg: false,
        },
        {
          name: 'Craft Beer',
          desc: 'Witbier / IPA (330ml)',
          price: '₹390',
          isVeg: false,
        },
        {
          name: 'Port Wine',
          desc: "Taylor's 10 year old",
          price: '₹620',
          isVeg: false,
        },
        {
          name: 'Signature Cocktail',
          desc: 'Konkan Breeze with coconut & lime',
          price: '₹550',
          isVeg: false,
        },
        {
          name: 'Mocktail',
          desc: 'Tropical Spice Fizz',
          price: '₹320',
          isVeg: true,
        },
      ],
    },
    tea: {
      title: 'Artisanal Tea Ceremony',
      items: [
        {
          name: 'Matcha',
          desc: 'Japanese ceremonial grade',
          price: '₹390',
          isVeg: true,
        },
        {
          name: 'Hojicha',
          desc: 'Roasted green tea',
          price: '₹310',
          isVeg: true,
        },
        {
          name: 'Darjeeling First Flush',
          desc: 'Muscatel notes',
          price: '₹450',
          isVeg: true,
        },
        { name: 'Oolong', desc: 'Formosa Jade', price: '₹380', isVeg: true },
        {
          name: 'Pu-erh',
          desc: 'Aged earthy blend',
          price: '₹420',
          isVeg: true,
        },
      ],
    },
  };

  // Function to scroll to gallery section
  const scrollToGallery = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Handle view gallery button click
  const handleViewGallery = () => {
    navigate('/all-menu-items');
  };

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${CQ_BASE_URL}/bq/api/items/`);
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          // Filter only active items with valid images
          const activeItems = data.items.filter((item) => item.isActive && item.image);
          setApiItems(activeItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Gallery items - first 6 from API for signature gallery
  const signatureGalleryItems = apiItems.slice(0, 6);
  // All gallery items count for display
  const allGalleryItems = apiItems;

  // Handle item click - does nothing, just prevents any navigation
  const handleItemClick = (item) => {
    // Do nothing - card click has no action
    console.log('Card clicked:', item.title); // Optional: for debugging
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION - elevated design */}
      <section
        id="home"
        className="relative h-[90vh] min-h-[600px] flex items-center justify-center "
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${restaurant1})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center text-white px-4 max-w-4xl animate-fade-in">
          <div className="inline-block px-4 py-1  backdrop-blur-sm rounded-full text-sm font-medium mb-6 tracking-wide">
            EST. 2026 • KONKAN BELT
          </div>
          <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight drop-shadow-2xl">
            Refined Dining & <span className="text-purple-500">Bar</span>
          </h1>
          <p className="text-xl md:text-2xl mt-6 text-gray-100 font-light max-w-2xl mx-auto">
            Where coastal flavours meet global sophistication
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              onClick={scrollToGallery}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold transition shadow-xl"
            >
              Explore Menu
            </button>
            <button
              onClick={handleViewGallery}
              className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-full text-lg font-semibold transition"
            >
              View Gallery
            </button>
          </div>
          <p className="mt-12 text-amber-100/80 flex items-center justify-center gap-2">
            <i className="far fa-clock"></i> Open Daily • 7am – 11pm
          </p>
        </div>
      </section>

      {/* DESCRIPTION - elegant quote style */}
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Quote Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 p-4 rounded-full shadow-sm">
            <i className="fas fa-quote-left text-purple-500 text-2xl"></i>
          </div>
        </div>

        {/* Heading */}
        <h2 className="font-serif-display text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
          Give your taste buds a moment to <span className="text-purple-500">celebrate</span>
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto mb-10">
          Nestled along the scenic Konkan stretch, we bring you an unforgettable gastronomic
          journey. From locally inspired delicacies to an expertly curated bar featuring exotic
          spirits & cocktails, every dish and drink is crafted to elevate your senses.
        </p>

        {/* Features */}
        <div className="mt-10 flex flex-col items-center gap-6">
          {/* Highlight Line */}
          <p className="text-purple-600 text-lg md:text-xl font-medium tracking-wide">
            Crafted cocktails, rare wines, and coastal-inspired flavors — an experience designed to
            linger.
          </p>

          {/* Elegant Divider */}
          <div className="w-24 h-[2px] bg-purple-300"></div>

          {/* Features (No Cards) */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-gray-700 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <i className="fas fa-fish text-purple-500 text-sm"></i>
              <span>Daily Ocean Harvest</span>
            </div>

            <span className="text-purple-300">•</span>

            <div className="flex items-center gap-2">
              <i className="fas fa-wine-glass-alt text-purple-500 text-sm"></i>
              <span>Curated Wine Collection</span>
            </div>

            <span className="text-purple-300">•</span>

            <div className="flex items-center gap-2">
              <i className="fas fa-leaf text-purple-500 text-sm"></i>
              <span>Locally Sourced Ingredients</span>
            </div>
          </div>
        </div>
      </div>

      {/* SIGNATURE GALLERY SECTION - 6 images from API */}
      <section id="gallery" ref={galleryRef} className="bg-gray-50 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-purple-500 uppercase tracking-wider text-sm font-semibold">
              Art of plating
            </span>
            <h2 className="font-serif-display text-4xl md:text-5xl font-bold text-gray-800 mt-2">
              Signature Gallery
            </h2>
            <div className="w-24 h-1 bg-purple-500 mx-auto mt-4 rounded-full"></div>
            <p className="text-gray-500 mt-3">Our most cherished culinary masterpieces</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
            </div>
          ) : (
            <>
              {/* Signature Gallery - First 6 items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {signatureGalleryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  >
                    {/* Image */}
                    <div className="h-72 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>

                    {/* Always visible gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {/* Content on image */}
                    <div className="absolute bottom-0 p-5">
                      <p className="text-amber-300 text-xs font-semibold tracking-wide uppercase">
                        {item.foodType}
                      </p>

                      <h3 className="text-white text-xl font-bold leading-tight">{item.title}</h3>

                      <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>

                      <p className="text-white font-semibold mt-2">₹{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button - Navigates to new page */}
              <div className="text-center mt-12">
                <button
                  onClick={() => navigate('/all-menu-items')}
                  className="bg-purple-500 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition shadow-md inline-flex items-center gap-2"
                >
                  <i className="fas fa-images"></i> View All Items ({allGalleryItems.length})
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* RESERVATION & CTA SECTION - professional call to action */}
      <section id="reserve" className="relative py-24 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${cuisane})` }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Optional Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
          <i className="fas fa-champagne-glasses text-5xl text-yellow-400 mb-6"></i>

          <h2 className="font-serif-display text-4xl md:text-5xl font-bold mb-5">
            Reserve Your Table
          </h2>

          <p className="text-xl text-gray-200 mb-8">
            Experience coastal fine dining with breathtaking views. Walk-ins welcome, but
            reservations recommended.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <button className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl transition flex items-center justify-center gap-2">
              <i className="fas fa-calendar-alt"></i> Book Now
            </button>

            <button className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 px-14 py-3 rounded-full text-lg font-semibold transition">
              <i className="fas fa-phone-alt"></i> Call
            </button>
          </div>

          <p className="mt-8 text-sm text-white">
            Open everyday | 7:00 AM – 11:00 PM | Last order 10:30 PM
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scroll-mt-20 {
          scroll-margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default Restaurant;

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Footer from "../components/Footer";
// import restaurant1 from "../assets/unnamed.jpg";
// import cuisane from "../assets/Cuisine.jpg";

// // Define the base URL from environment variables
// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

// const Restaurant = () => {
//   // State for active menu tab
//   const [activeMenuTab, setActiveMenuTab] = useState("food");
//   // State for API food items
//   const [apiItems, setApiItems] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   // State for selected gallery item (for modal/detail view)
//   const [selectedItem, setSelectedItem] = useState(null);

//   const navigate = useNavigate();

//   // Full menu data structure (professional grouping)
//   const menuData = {
//     food: {
//       title: "Signature Plates",
//       items: [
//         {
//           name: "Green Urad Phali",
//           desc: "Crispy lentil beans with aromatic spices",
//           price: "₹320",
//           isVeg: true,
//         },
//         {
//           name: "Tilki Wali Paneer",
//           desc: "Grilled cottage cheese with sesame crust",
//           price: "₹450",
//           isVeg: true,
//         },
//         {
//           name: "Chicken Biryani",
//           desc: "Fragrant basmati rice with tender chicken",
//           price: "₹550",
//           isVeg: false,
//         },
//         {
//           name: "Fish N Chips",
//           desc: "Beer-battered catch of the day",
//           price: "₹590",
//           isVeg: false,
//         },
//         {
//           name: "Kozhi Ulattiyathu",
//           desc: "Kerala-style roasted chicken",
//           price: "₹520",
//           isVeg: false,
//         },
//         {
//           name: "Masala Dosa",
//           desc: "Crispy rice crepe with potato masala",
//           price: "₹210",
//           isVeg: true,
//         },
//         {
//           name: "Dal Makhani",
//           desc: "Slow-cooked black lentils",
//           price: "₹340",
//           isVeg: true,
//         },
//         {
//           name: "Aloo Gobi",
//           desc: "Cauliflower & potato stir-fry",
//           price: "₹280",
//           isVeg: true,
//         },
//       ],
//     },
//     bar: {
//       title: "Bar & Spirits",
//       items: [
//         {
//           name: "Single Malt Whisky",
//           desc: "Glenfiddich / Macallan",
//           price: "₹750",
//           isVeg: false,
//         },
//         {
//           name: "Premium Gin",
//           desc: "Monkey 47 / Hendrick's",
//           price: "₹680",
//           isVeg: false,
//         },
//         {
//           name: "Craft Beer",
//           desc: "Witbier / IPA (330ml)",
//           price: "₹390",
//           isVeg: false,
//         },
//         {
//           name: "Port Wine",
//           desc: "Taylor's 10 year old",
//           price: "₹620",
//           isVeg: false,
//         },
//         {
//           name: "Signature Cocktail",
//           desc: "Konkan Breeze with coconut & lime",
//           price: "₹550",
//           isVeg: false,
//         },
//         {
//           name: "Mocktail",
//           desc: "Tropical Spice Fizz",
//           price: "₹320",
//           isVeg: true,
//         },
//       ],
//     },
//     tea: {
//       title: "Artisanal Tea Ceremony",
//       items: [
//         {
//           name: "Matcha",
//           desc: "Japanese ceremonial grade",
//           price: "₹390",
//           isVeg: true,
//         },
//         {
//           name: "Hojicha",
//           desc: "Roasted green tea",
//           price: "₹310",
//           isVeg: true,
//         },
//         {
//           name: "Darjeeling First Flush",
//           desc: "Muscatel notes",
//           price: "₹450",
//           isVeg: true,
//         },
//         { name: "Oolong", desc: "Formosa Jade", price: "₹380", isVeg: true },
//         {
//           name: "Pu-erh",
//           desc: "Aged earthy blend",
//           price: "₹420",
//           isVeg: true,
//         },
//       ],
//     },
//   };

//   // Fetch items from API
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setIsLoading(true);
//         const response = await fetch(`${CQ_BASE_URL}/bq/api/items/`);
//         const data = await response.json();
//         if (data.items && Array.isArray(data.items)) {
//           // Filter only active items with valid images
//           const activeItems = data.items.filter(
//             (item) => item.isActive && item.image
//           );
//           setApiItems(activeItems);
//         }
//       } catch (error) {
//         console.error("Error fetching items:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchItems();
//   }, []);

//   // Gallery items - first 6 from API for signature gallery
//   const signatureGalleryItems = apiItems.slice(0, 6);
//   // All gallery items count for display
//   const allGalleryItems = apiItems;

//   // Hero background high-res professional restaurant
//   const heroBg =
//     "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=600&fit=crop";

//   // Handle item click to show detail modal/page
//   const handleItemClick = (item) => {
//     setSelectedItem(item);
//   };

//   const closeModal = () => {
//     setSelectedItem(null);
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* HERO SECTION - elevated design */}
//       <section
//         id="home"
//         className="relative h-[90vh] min-h-[600px] flex items-center justify-center "
//         style={{
//           backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${restaurant1})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//         }}
//       >
//         <div className="text-center text-white px-4 max-w-4xl animate-fade-in">
//           <div className="inline-block px-4 py-1  backdrop-blur-sm rounded-full text-sm font-medium mb-6 tracking-wide">
//             EST. 2026 • KONKAN BELT
//           </div>
//           <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight drop-shadow-2xl">
//             Refined Dining & <span className="text-purple-500">Bar</span>
//           </h1>
//           <p className="text-xl md:text-2xl mt-6 text-gray-100 font-light max-w-2xl mx-auto">
//             Where coastal flavours meet global sophistication
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
//             <button className="bg-purple-500 hover:bg-amber-800 text-white px-8 py-3 rounded-full text-lg font-semibold transition shadow-xl">
//               Explore Menu
//             </button>
//             <button className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-full text-lg font-semibold transition">
//               View Gallery
//             </button>
//           </div>
//           <p className="mt-12 text-amber-100/80 flex items-center justify-center gap-2">
//             <i className="far fa-clock"></i> Open Daily • 7am – 11pm
//           </p>
//         </div>
//       </section>

//       {/* DESCRIPTION - elegant quote style */}
//       <div className="max-w-5xl mx-auto px-6 py-24 text-center">
//         {/* Quote Icon */}
//         <div className="flex justify-center mb-6">
//           <div className="bg-purple-100 p-4 rounded-full shadow-sm">
//             <i className="fas fa-quote-left text-purple-500 text-2xl"></i>
//           </div>
//         </div>

//         {/* Heading */}
//         <h2 className="font-serif-display text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
//           Give your taste buds a moment to{" "}
//           <span className="text-purple-500">celebrate</span>
//         </h2>

//         {/* Description */}
//         <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto mb-10">
//           Nestled along the scenic Konkan stretch, we bring you an unforgettable
//           gastronomic journey. From locally inspired delicacies to an expertly
//           curated bar featuring exotic spirits & cocktails, every dish and drink
//           is crafted to elevate your senses.
//         </p>

//         {/* Features */}
//         <div className="mt-10 flex flex-col items-center gap-6">
//           {/* Highlight Line */}
//           <p className="text-purple-600 text-lg md:text-xl font-medium tracking-wide">
//             Crafted cocktails, rare wines, and coastal-inspired flavors — an
//             experience designed to linger.
//           </p>

//           {/* Elegant Divider */}
//           <div className="w-24 h-[2px] bg-purple-300"></div>

//           {/* Features (No Cards) */}
//           <div className="flex flex-wrap justify-center items-center gap-6 text-gray-700 text-sm md:text-base">
//             <div className="flex items-center gap-2">
//               <i className="fas fa-fish text-purple-500 text-sm"></i>
//               <span>Daily Ocean Harvest</span>
//             </div>

//             <span className="text-purple-300">•</span>

//             <div className="flex items-center gap-2">
//               <i className="fas fa-wine-glass-alt text-purple-500 text-sm"></i>
//               <span>Curated Wine Collection</span>
//             </div>

//             <span className="text-purple-300">•</span>

//             <div className="flex items-center gap-2">
//               <i className="fas fa-leaf text-purple-500 text-sm"></i>
//               <span>Locally Sourced Ingredients</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* SIGNATURE GALLERY SECTION - 6 images from API */}
//       <section id="gallery" className="bg-gray-50 py-20">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="text-center mb-14">
//             <span className="text-purple-500 uppercase tracking-wider text-sm font-semibold">
//               Art of plating
//             </span>
//             <h2 className="font-serif-display text-4xl md:text-5xl font-bold text-gray-800 mt-2">
//               Signature Gallery
//             </h2>
//             <div className="w-24 h-1 bg-purple-500 mx-auto mt-4 rounded-full"></div>
//             <p className="text-gray-500 mt-3">
//               Our most cherished culinary masterpieces
//             </p>
//           </div>

//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
//             </div>
//           ) : (
//             <>
//               {/* Signature Gallery - First 6 items */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
//                 {signatureGalleryItems.map((item) => (
//                   <div
//                     key={item.id}
//                     onClick={() => handleItemClick(item)}
//                     className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
//                   >
//                     {/* Image */}
//                     <div className="h-72 overflow-hidden">
//                       <img
//                         src={item.image}
//                         alt={item.title}
//                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
//                       />
//                     </div>

//                     {/* Always visible gradient overlay */}
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

//                     {/* Content on image */}
//                     <div className="absolute bottom-0 p-5">
//                       <p className="text-amber-300 text-xs font-semibold tracking-wide uppercase">
//                         {item.foodType}
//                       </p>

//                       <h3 className="text-white text-xl font-bold leading-tight">
//                         {item.title}
//                       </h3>

//                       <p className="text-white/80 text-sm line-clamp-2">
//                         {item.description}
//                       </p>

//                       <p className="text-white font-semibold mt-2">
//                         ₹{item.price}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* View All Button - Navigates to new page */}
//               <div className="text-center mt-12">
//                 <button
//                   onClick={() => navigate("/all-menu-items")}
//                   className="bg-purple-500 hover:bg-purple-700 text-white px-8 py-3 rounded-full text-lg font-semibold transition shadow-md inline-flex items-center gap-2"
//                 >
//                   <i className="fas fa-images"></i> View All Items (
//                   {allGalleryItems.length})
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </section>

//       {/* RESERVATION & CTA SECTION - professional call to action */}

// <section id="reserve" className="relative py-24 overflow-hidden">
//   {/* Background Image */}
//   <div
//     className="absolute inset-0 bg-cover bg-center"
//     style={{ backgroundImage: `url(${cuisane})` }}
//   ></div>

//   {/* Dark Overlay */}
//   <div className="absolute inset-0 bg-black/60"></div>

//   {/* Optional Glow Accent */}
//   <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

//   {/* Content */}
//   <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
//     <i className="fas fa-champagne-glasses text-5xl text-yellow-400 mb-6"></i>

//     <h2 className="font-serif-display text-4xl md:text-5xl font-bold mb-5">
//       Reserve Your Table
//     </h2>

//     <p className="text-xl text-gray-200 mb-8">
//       Experience coastal fine dining with breathtaking views. Walk-ins
//       welcome, but reservations recommended.
//     </p>

//     <div className="flex flex-col sm:flex-row gap-5 justify-center">
//       <button className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-xl transition flex items-center justify-center gap-2">
//         <i className="fas fa-calendar-alt"></i> Book Now
//       </button>

//       <button className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 px-14 py-3 rounded-full text-lg font-semibold transition">
//         <i className="fas fa-phone-alt"></i> Call
//       </button>
//     </div>

//     <p className="mt-8 text-sm text-white">
//       Open everyday | 7:00 AM – 11:00 PM | Last order 10:30 PM
//     </p>
//   </div>
// </section>
//       {/* DETAIL MODAL - Popup when clicking on gallery item */}
//       {selectedItem && (
//         <div
//           className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
//           onClick={closeModal}
//         >
//           <div
//             className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="relative">
//               <button
//                 onClick={closeModal}
//                 className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition z-10"
//               >
//                 <i className="fas fa-times"></i>
//               </button>
//               <img
//                 src={selectedItem.image}
//                 alt={selectedItem.title}
//                 className="w-full h-80 object-cover rounded-t-2xl"
//               />
//             </div>
//             <div className="p-6 md:p-8">
//               <div className="flex justify-between items-start flex-wrap gap-4">
//                 <div>
//                   <h2 className="text-3xl font-bold text-gray-800">
//                     {selectedItem.title}
//                   </h2>
//                   <div className="flex items-center gap-2 mt-2">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm font-medium ${
//                         selectedItem.foodType === "Veg"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }`}
//                     >
//                       {selectedItem.foodType}
//                     </span>
//                     <span className="text-gray-500 text-sm">
//                       {selectedItem.price_type || "Per plate"}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="text-amber-700 font-bold text-4xl">
//                   ₹{selectedItem.price}
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                   Description
//                 </h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   {selectedItem.description}
//                 </p>
//               </div>

//               <div className="mt-6 grid grid-cols-2 gap-4">
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                     Meal Types
//                   </h3>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedItem.mealTypes.map((meal, idx) => (
//                       <span
//                         key={idx}
//                         className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
//                       >
//                         {meal}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                     Details
//                   </h3>
//                   <ul className="text-gray-600 space-y-1 text-sm">
//                     <li>
//                       <span className="font-medium">Max Quantity:</span>{" "}
//                       {selectedItem.maxQuantity}
//                     </li>
//                     <li>
//                       <span className="font-medium">Refundable:</span>{" "}
//                       {selectedItem.refundable ? "Yes" : "No"}
//                     </li>
//                     <li>
//                       <span className="font-medium">Available:</span>{" "}
//                       {selectedItem.availableFrom || "24/7"} -{" "}
//                       {selectedItem.availableUntil || "24/7"}
//                     </li>
//                   </ul>
//                 </div>
//               </div>

//               <div className="mt-8 flex gap-4">
//                 <button className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-2 rounded-full font-semibold transition flex-1">
//                   Add to Order
//                 </button>
//                 <button
//                   onClick={closeModal}
//                   className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-full font-semibold transition"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* FOOTER */}
//       <Footer />

//       <style>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in {
//           animation: fade-in 0.8s ease-out forwards;
//         }
//         .line-clamp-2 {
//           display: -webkit-box;
//           -webkit-line-clamp: 2;
//           -webkit-box-orient: vertical;
//           overflow: hidden;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Restaurant;
