import React from 'react';
import {
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Sun,
  TreesIcon as Trees,
  Waves,
  Dumbbell,
  Briefcase,
  Hotel,
  Mountain,
  Landmark,
  Castle,
  Church,
  Database,
  BedDouble,
  UtensilsCrossed,
  Sparkles,
  Smartphone,
  Gamepad2,
  Coffee,
} from 'lucide-react';
import Footer from '../components/Footer';
import Vashishti from '../assets/Vashisti-River.jpg';
import Ganputle from '../assets/ganpatipule.jpg';
import Guhagarriver from '../assets/Guhagar-Beach.jpg';
import sawatsada from '../assets/sawatsada.jpg';
import Raigadfort from '../assets/Raigad-fort.jpg';
import parshuram from '../assets/parshuram-temple.jpg';
import Mahad from '../assets/Mahad-Buddhist-Cave.jpg';
import Velneshwar from '../assets/Velneshwar-Temple.jpg';
import Koyna from '../assets/koyna-dam.jpg';
import pool from '../assets/IMG_4360-scaled.jpg';
import chairs from '../assets/IMG_4284-scaled.webp';
import garden from '../assets/MAINT.-005.webp';
import games from '../assets/R.webp';

import main from '../assets/MainTitleimg 4.20.32 PM 4.20.32 PM.png';
import yes from '../assets/yes.webp';

const App = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section with Photo Background */}
      <div
        className="relative h-[100vh] min-h-[650px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${yes})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay instead of plain black */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white h-full px-6">
          <div className="max-w-4xl">
            {/* Location Badge */}
            <div className="inline-block px-5 py-2   text-sm font-medium mb-6">
              📍 Chiplun, Maharashtra
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Escape to Serenity
              <br />
              <span className="text-purple-400">Pagoda Resort</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
              Nestled in the lush Konkan hills, experience peaceful stays, authentic hospitality,
              and unforgettable memories.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-purple-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-semibold text-lg transition shadow-xl">
                Book Now
              </button>

              <button className="border border-white/70 hover:bg-white hover:text-black px-8 py-3 rounded-full font-semibold text-lg transition">
                Explore Rooms
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stay | Relax | Treat Yourself | Dine */}

      {/* Who We Are Section */}

      <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-10 items-start">
          {/* Images Section */}
          <div className="md:col-span-3 grid  gap-4">
            <img src={main} alt="Pagoda Resort View" className="w-full h-[450px] object-cover " />
          </div>

          {/* Content */}
          <div className="md:col-span-2 flex flex-col justify-start">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 leading-tight">
              Who We Are
            </h2>

            <div className="w-20 h-1 bg-purple-500 mb-6"></div>

            <p className="text-gray-600 leading-relaxed mb-4">
              Established in the year <strong>1991</strong> in a sprawling{' '}
              <strong>3 acres of green</strong>, the Pagoda Resort awaits your arrival.
            </p>

            <p className="text-gray-600 leading-relaxed mb-4">
              Situated right on the Mumbai - Goa highway and 17 kilometers from the ancient town of
              Chiplun, you are sure to witness this beauty of a place even before you get there.
            </p>

            <p className="text-gray-600 leading-relaxed">
              Known for our unique architecture of the Pagoda (Meaning - A Hindu/Buddhist Temple),
              we strive day in and day out to keep up to our guests' peace and serenity by providing
              them with the best experience they could ever witness.
            </p>
          </div>
        </div>
      </div>

      {/* A Little FUN Time Section */}
      {/* A Little FUN Time Section - Image Grid Style */}
      <div className="bg-gray-50 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* LEFT CONTENT */}
          <div className="-mt-4 md:mt-0">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">A Little fun Time</h2>

            <p className="text-gray-600 mb-8 max-w-md">
              It is time you pamper yourself and enjoy some great recreational facilities at The
              Pagoda Hotel
            </p>

            <div className="space-y-6">
              {['SWIMMING POOL', 'INDOOR GAMES', 'BANQUETS', 'WORK FROM PAGODA'].map((item, i) => (
                <div key={i} className="flex justify-between items-center group cursor-pointer">
                  <span className="tracking-widest text-sm text-gray-800">{item}</span>

                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500 text-white text-sm group-hover:scale-110 transition">
                    +
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT IMAGE GRID */}
          <div className="grid grid-cols-2 gap-6">
            {' '}
            {/* TOP LEFT */}{' '}
            <div>
              {' '}
              <img src={pool} alt="pool" className="w-full h-full object-cover" />{' '}
            </div>{' '}
            {/* TOP RIGHT */}{' '}
            <div>
              {' '}
              <img src={chairs} alt="hall" className="w-full h-full object-cover" />{' '}
            </div>{' '}
            {/* BOTTOM LEFT */}{' '}
            <div>
              {' '}
              <img src={games} alt="games" className="w-full h-full object-cover" />{' '}
            </div>{' '}
            {/* BOTTOM RIGHT */}{' '}
            <div>
              {' '}
              <img src={garden} alt="garden" className="w-full h-full object-cover" />{' '}
            </div>{' '}
          </div>
        </div>
      </div>

      {/* Sights To See Section */}
      <div className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-14 px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Sights To See
          </h2>

          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Konkan is known for its breathtaking landscapes, serene beaches, and sacred temples.
            Discover hidden gems nearby or add them to your next unforgettable Konkan journey.
          </p>

          <div className="flex items-center justify-center mt-6">
            <div className="w-10 h-[2px] bg-purple-400"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full mx-2"></div>
            <div className="w-10 h-[2px] bg-purple-400"></div>
          </div>
        </div>

        {/* IMAGE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {[
            {
              title: 'Vashishti River',
              img: Vashishti,
            },
            {
              title: 'Ganpatipule',
              img: Ganputle,
            },
            {
              title: 'Guhagar Beach',
              img: Guhagarriver,
            },
            {
              title: 'Sawatsada',
              img: sawatsada,
            },
            {
              title: 'Raigad Fort',
              img: Raigadfort,
            },
            {
              title: 'Parshuram Temple',
              img: parshuram,
            },
            {
              title: 'Mahad Buddhist Cave',
              img: Mahad,
            },
            {
              title: 'Velneshwar Temple',
              img: Velneshwar,
            },
            {
              title: 'Koyna Dam',
              img: Koyna,
            },
          ].map((place, idx) => (
            <div key={idx} className="relative h-52  overflow-hidden group cursor-pointer">
              {/* Image */}
              <img
                src={`${place.img}?auto=format&fit=crop&w=800&q=80`}
                alt={place.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition"></div>

              {/* Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-lg font-semibold text-center px-2">{place.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Contact Info */}
      <Footer />
    </div>
  );
};

export default App;
