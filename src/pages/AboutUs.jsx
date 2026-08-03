import React from 'react';
import { FaDoorOpen, FaUsers } from 'react-icons/fa';
import img1 from '../assets/resort-08.webp';
import img from '../assets/Img-6-removed.webp';
import pool from '../assets/Screenshot 2025-11-12 at 10.42.17 AM 4.20.32 PM 4.20.32 PM.png';
import details from '../assets/details.jpg';
import Footer from '../components/Footer';

const AboutUsModern = () => {
  const doorOpeners = [
    {
      title: 'Career Opportunities',
      description: 'Join our family of 50+ dedicated staff members across various departments',
    },
    {
      title: 'Community Initiatives',
      description: 'Engaging with local communities through sustainable tourism practices',
    },
    {
      title: 'Guest Experiences',
      description: 'Creating personalized journeys for every guest who walks through our doors',
    },
    {
      title: 'Industry Partnerships',
      description: 'Collaborating with travel agencies and tourism boards for enhanced services',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${img1})` }}
      >
        <div className="absolute inset-0 bg-black opacity-60"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl text-blue-100 font-light mb-4 relative inline-block group">
              Our journey
              <span className="absolute bottom-0 left-0 w-0 h-0.5 mt-4 bg-white transition-all duration-300 group-hover:w-full"></span>
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              A sanctuary of peace on the Mumbai-Goa Highway, blending traditional architecture with
              modern hospitality since 1991
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-9xl mx-auto">
        {/* Two Column Layout - Our Journey */}
        <section className="py-20 bg-gray-100">
          <div className="container mx-auto px-6 lg:px-12 mt-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Overlapping Images with Rotation */}
              <div className="relative h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-50 rounded-2xl -rotate-3"></div>

                <div className="relative z-10 w-4/5 h-4/5 -rotate-2 hover:rotate-0 transition-transform duration-300 -translate-y-14">
                  <img
                    src={pool}
                    alt="Hotel exterior"
                    className="w-full h-full rounded-xl shadow-2xl object-cover"
                  />
                </div>

                <div className="absolute right-0 bottom-0 z-20 w-4/5 h-4/5 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <img
                    src={img}
                    alt="Hotel interior"
                    className="w-full h-full rounded-xl shadow-2xl object-cover border-4 border-white"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div>
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  Hotel Pagoda near Chiplun, Maharashtra
                </h2>

                <p className="text-gray-600 mb-6">
                  Whether you are looking for a short vacation away from the hustle and bustle of
                  daily life or a transit to Goa, our comfortable and cozy Suite and Deluxe rooms
                  are sure to be your favorites.
                </p>

                <p className="text-gray-600 mb-6">
                  Known as one of the best dining destinations on the Konkan stretch, the restaurant
                  at Pagoda serves a gamut of sumptuous and finger-licking cuisines, giving you an
                  ultimate experience right from your tongue to your tummy.
                </p>

                <p className="text-gray-600 mb-6">
                  With state-of-the-art modern amenities like a marvelous lagoon-shaped swimming
                  pool with a sunken bar, a jacuzzi, and many indoor games to choose from, you are
                  sure to make your vacation a memorable and unforgettable one.
                </p>

                <p className="text-gray-600 mb-6">
                  Also known for our flawless services, we cater to and host many corporate
                  meetings, conferences, exhibitions, and marriage functions.
                </p>

                <p className="text-gray-600 mb-8">
                  So come and visit us to get a firsthand experience of what we really are — and we
                  promise you will keep visiting us again and again!
                </p>

                <button className="bg-purple-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105">
                  See How We Care
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <div className="relative w-full h-[700px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${details})` }}
          >
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl px-4 mt-52">
              <div className="text-center text-white">
                <div className="text-6xl md:text-7xl font-bold mb-2">32</div>
                <div className="text-xl md:text-2xl font-medium mb-1">YEARS IN BUSINESS</div>
                <div className="h-1 w-16 bg-white/50 mx-auto mb-3"></div>
                <div className="text-sm md:text-base text-white/90">Decades of excellence</div>
              </div>

              <div className="text-center text-white">
                <div className="text-6xl md:text-7xl font-bold mb-2">30</div>
                <div className="text-xl md:text-2xl font-medium mb-1">ROOMS & SUITES</div>
                <div className="h-1 w-16 bg-white/50 mx-auto mb-3"></div>
                <div className="text-sm md:text-base text-white/90">Luxurious accommodations</div>
              </div>

              <div className="text-center text-white">
                <div className="text-6xl md:text-7xl font-bold mb-2">2</div>
                <div className="text-xl md:text-2xl font-medium mb-1">RESTAURANTS & BARS</div>
                <div className="h-1 w-16 bg-white/50 mx-auto mb-3"></div>
                <div className="text-sm md:text-base text-white/90">Culinary excellence</div>
              </div>

              <div className="text-center text-white">
                <div className="text-6xl md:text-7xl font-bold mb-2">50</div>
                <div className="text-xl md:text-2xl font-medium mb-1">STAFF</div>
                <div className="h-1 w-16 bg-white/50 mx-auto mb-3"></div>
                <div className="text-sm md:text-base text-white/90">Dedicated professionals</div>
              </div>
            </div>
          </div>
        </div>

        {/* We Open Doors Section */}
        <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-12 lg:p-16">
              <div className="inline-block mb-4">
                <span className="text-purple-200 font-semibold text-sm uppercase tracking-wider">
                  Opportunities
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">We Open Doors</h2>
              <p className="text-purple-100 text-lg mb-10 max-w-2xl">
                Creating opportunities for our team members, guests, and local communities through
                meaningful engagement and sustainable tourism practices.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {doorOpeners.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-600/20 p-3 rounded-lg">
                        <FaDoorOpen className="text-purple-300 text-xl" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg mb-2">{item.title}</h4>
                        <p className="text-purple-100/90 text-sm">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Join Our Team
              </button>
            </div>

            <div className="bg-gradient-to-tr from-purple-800 via-purple-700 to-indigo-800 p-12 lg:p-16 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/20 rounded-full translate-y-20 -translate-x-20"></div>

              <div className="relative z-10 text-center">
                <div className="inline-block p-10 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <FaUsers className="text-4xl text-white" />
                  </div>
                  <div className="text-6xl font-bold text-white mb-2">50+</div>
                  <div className="text-purple-200 font-medium text-xl mb-2">
                    Dedicated Team Members
                  </div>
                  <div className="w-16 h-1 bg-purple-400 mx-auto my-4"></div>
                  <div className="mt-4 text-sm text-purple-300/90 max-w-xs">
                    From diverse backgrounds, united in service excellence
                  </div>
                </div>
                <p className="text-purple-200/80 mt-8 max-w-md">
                  Our team is the heart of Hotel Pagoda. We invest in training, development, and
                  creating a supportive work environment where every member can thrive.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AboutUsModern;
