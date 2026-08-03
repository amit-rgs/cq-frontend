import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  Coffee,
  BedDouble,
  UtensilsCrossed,
  Tv,
  CheckCircle,
  Bath,
  Languages,
  Accessibility,
} from 'lucide-react';
import breakfast from '../assets/breakfast.webp';
import dinner from '../assets/dinner.webp';
import spa from '../assets/spa.webp';

// Icon mapping by feature key
const ICONS = {
  wifi: Wifi,
  coffee: Coffee,
  bed: BedDouble,
  breakfast: UtensilsCrossed,
  tv: Tv,
  bath: Bath,
  languages: Languages,
  access: Accessibility,
  default: CheckCircle,
};

const amenities = [
  {
    image: breakfast,
    title: 'Breakfast in Bed',
    description: 'Hot gourmet breakfast delivered to your room, any time you want.',
    details: 'Includes fresh fruits, juices, and a variety of hot dishes.',
    features: [
      { label: 'Free Wi-Fi in all rooms', icon: 'wifi' },
      { label: 'Complimentary coffee and tea', icon: 'coffee' },
      { label: 'International cuisine', icon: 'breakfast' },
    ],
    extras: [
      {
        section: 'Languages spoken',
        items: [
          { label: 'English', icon: 'languages' },
          { label: 'Hindi', icon: 'languages' },
        ],
      },
      {
        section: 'Accessibility',
        items: [{ label: 'On-site accessible restaurants', icon: 'access' }],
      },
    ],
  },
  {
    image: dinner,
    title: 'Dinner Delight',
    description: 'Lavish dinner buffet with live cooking stations and desserts.',
    details: 'Indian, Continental, and Asian cuisines with seasonal specials.',
    features: [
      { label: 'Free Wi-Fi in all rooms', icon: 'wifi' },
      { label: 'Complimentary coffee and tea', icon: 'cofee' },
      { label: 'International cuisine', icon: 'breakfast' },
    ],
    extras: [
      {
        section: 'Cleanliness & safety',
        items: [
          { label: 'Daily housekeeping', icon: 'default' },
          { label: 'Cashless payment', icon: 'default' },
        ],
      },
    ],
  },
  {
    image: spa,
    title: 'Spa',
    description: 'Rejuvenate with massages, therapies and wellness treatments in our spa.',
    details: 'Full range of massage therapies, sauna, and beauty treatments available.',
    features: [
      { label: 'Sauna and steam room', icon: 'bath' },
      { label: 'Wellness specialists', icon: 'default' },
      { label: 'Private lounge', icon: 'bed' },
    ],
    extras: [],
  },
];

const cardVariants = {
  offscreen: {
    opacity: 0,
    x: 80,
    scale: 0.96,
    filter: 'blur(12px)',
  },
  onscreen: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      bounce: 0.19,
      duration: 0.7,
      delay: i * 0.13,
    },
  }),
};

const AmenityGrid = () => (
  <div className="max-w-6xl mx-auto px-4 py-20">
    {/* <h2 className="text-3xl font-bold mb-8 text-purple-700 text-center">
      Amenities & Facilities
    </h2> */}
    <div className="flex flex-col gap-9 " style={{ minHeight: 600 }}>
      <AnimatePresence>
        {amenities.map((a, i) => (
          <motion.div
            key={a.title}
            className="flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[220px] md:min-h-[210px]"
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ once: true, amount: 0.3 }}
            variants={cardVariants}
            custom={i}
          >
            {/* Left: Big Image */}
            <img
              src={a.image}
              alt={a.title}
              className="w-full md:w-60 h-48 md:h-auto object-cover object-center"
              style={{ minWidth: 200, maxWidth: 260 }}
            />
            {/* Right: Content */}
            <div className="flex-1 flex flex-col justify-between px-7 py-5">
              <div>
                <h3 className="text-2xl font-bold mb-1 text-gray-900">{a.title}</h3>
                <p className="text-gray-700 text-base mb-2">{a.description}</p>
                <p className="text-gray-500 text-xs mb-3">{a.details}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-3 mb-2">
                  {a.features.map((f, idx) => {
                    const Icon = ICONS[f.icon] || ICONS.default;
                    return (
                      <span
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-sm"
                      >
                        <Icon size={18} className="text-purple-600" />
                        {f.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              {/* Extras - Sectional Info */}
              {a.extras.map((ex, exidx) => (
                <div
                  key={exidx}
                  className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-3"
                >
                  <span className="font-semibold text-sm text-purple-700">{ex.section}:</span>
                  <span className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                    {ex.items.map((item, j) => {
                      const Icon = ICONS[item.icon] || ICONS.default;
                      return (
                        <span
                          key={j}
                          className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1 text-xs text-gray-600"
                        >
                          <Icon size={14} className="text-gray-700" />
                          {item.label}
                        </span>
                      );
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </div>
);

export default AmenityGrid;
