import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SingleBed from '../assets/SingleBed 4.20.32 PM 4.20.32 PM.png';
import DoubleBed from '../assets/DoubleBed 4.20.38 PM.png';
import Deluxe from '../assets/deluxe.webp';
import Suite from '../assets/suites.webp';

const StayCategories = () => {
  const categories = [
    {
      id: 1,
      title: 'Single Bed',
      image: SingleBed,
    },
    {
      id: 2,
      title: 'Double Bed',
      image: DoubleBed,
    },
    {
      id: 3,
      title: 'Deluxe',
      image: Deluxe,
    },
    {
      id: 4,
      title: 'Suite',
      image: Suite,
    },
  ];

  const scrollLeft = () => {
    document.getElementById('stay-scroll').scrollBy({
      left: -400,
      behavior: 'smooth',
    });
  };

  const scrollRight = () => {
    document.getElementById('stay-scroll').scrollBy({
      left: 400,
      behavior: 'smooth',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Discover your stay</h2>

        {/* Navigation Arrows - Desktop */}
        {/* <div className="hidden lg:flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-all"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <button
            onClick={scrollRight}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-all"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </div> */}
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative">
        <div
          id="stay-scroll"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <div key={category.id} className="flex-none w-72 group cursor-pointer">
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
                {/* Image */}
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                {/* Title */}
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-white text-2xl font-bold">{category.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StayCategories;
