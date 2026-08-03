import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

const TopDeals = () => {
  const [favorites, setFavorites] = useState([]);

  const deals = [
    {
      id: 1,
      name: 'Hotel ND Manor',
      location: 'Dehradun',
      rating: 10.0,
      ratingText: 'Exceptional',
      reviews: '1 review',
      originalPrice: 4000,
      discountedPrice: 3400,
      discount: '15% off',
      totalPrice: 7140,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500',
      ],
    },
    {
      id: 2,
      name: 'Le Grand Hotel',
      location: 'Haridwar',
      rating: 8.2,
      ratingText: 'Very good',
      reviews: '12 reviews',
      originalPrice: 3000,
      discountedPrice: 2820,
      discount: '6% off',
      totalPrice: 5941,
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500',
      ],
    },
    {
      id: 3,
      name: 'Hotel Rajpur Heights',
      location: 'Dehradun',
      rating: 8.0,
      ratingText: 'Very good',
      reviews: '21 reviews',
      originalPrice: 4000,
      discountedPrice: 3000,
      discount: '25% off',
      totalPrice: 6300,
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=500',
      ],
    },
    {
      id: 4,
      name: 'The Hotel Js Souvenir',
      location: 'Rishikesh',
      rating: 8.0,
      ratingText: 'Very good',
      reviews: '2 reviews',
      originalPrice: 4000,
      discountedPrice: 3600,
      discount: 'Member Price available',
      totalPrice: 7560,
      isMemberPrice: true,
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500',
      ],
    },
  ];

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  };

  const ImageCarousel = ({ images, hotelId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextImage = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <div className="relative h-64 group">
        <img src={images[currentIndex]} alt="Hotel" className="w-full h-full object-cover" />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronLeft size={20} className="text-gray-800" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ChevronRight size={20} className="text-gray-800" />
            </button>
          </>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(hotelId);
          }}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition-all shadow-md"
        >
          <Heart
            size={20}
            className={`${
              favorites.includes(hotelId) ? 'fill-red-500 text-red-500' : 'text-gray-700'
            } transition-colors`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Other Properties</h2>
          <p className="text-sm text-gray-600 mt-1">Showing deals for: 7 Nov – 9 Nov</p>
        </div>
        <button className="hidden lg:block px-4 py-2 border-2 border-purple-700 text-purple-700 font-semibold rounded-full hover:bg-purple-50 transition-all">
          See all deals
        </button>
      </div>

      {/* Deals Grid */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200"
          > */}
      {/* Image Carousel */}
      {/* <ImageCarousel images={deal.images} hotelId={deal.id} /> */}

      {/* Content */}
      {/* <div className="p-4">
             
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {deal.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{deal.location}</p> */}

      {/* Rating */}
      {/* <div className="flex items-center gap-2 mb-4">
                <div
                  className={`px-2 py-1 rounded text-white font-bold text-sm ${
                    deal.rating >= 9
                      ? "bg-green-800"
                      : deal.rating >= 8
                      ? "bg-green-700"
                      : "bg-green-600"
                  }`}
                >
                  {deal.rating.toFixed(1)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {deal.ratingText}
                  </p>
                  <p className="text-xs text-gray-600">({deal.reviews})</p>
                </div>
              </div> */}

      {/* Discount Badge */}
      {/* <div className="mb-3">
                {deal.isMemberPrice ? (
                  <span className="inline-block bg-blue-700 text-white text-xs font-semibold px-2 py-1 rounded">
                    🔑 {deal.discount}
                  </span>
                ) : (
                  <span className="inline-block bg-green-700 text-white text-xs font-semibold px-2 py-1 rounded">
                    {deal.discount}
                  </span>
                )}
              </div> */}

      {/* Price */}
      {/* <div className="border-t pt-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{deal.discountedPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{deal.originalPrice.toLocaleString()}
                  </span>
                  <span className="w-4 h-4 flex items-center justify-center border border-gray-400 rounded-full text-gray-600 text-xs cursor-help">
                    i
                  </span>
                </div>
                <p className="text-xs text-gray-600">per night</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  ₹{deal.totalPrice.toLocaleString()} total
                </p>
                <p className="text-xs text-gray-500">includes taxes & fees</p>
              </div>
            </div>
          </div>
        ))} */}
      {/* </div> */}

      {/* Mobile See All Button */}
      {/* <div className="lg:hidden mt-6 text-center">
        <button className="px-6 py-2 border-2 border-purple-700 text-purple-700 font-semibold rounded-full hover:bg-purple-50 transition-all">
          See all deals
        </button>
      </div> */}
    </div>
  );
};

export default TopDeals;
