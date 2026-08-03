import { MapPin, Search, ChevronDown } from 'lucide-react';

export default function HotelLocation() {
  return (
    <div className=" bg-blue-50  rounded-2xl   max-w-8xl p-6 mt-8">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <h2 className="font-bold text-2xl text-gray-900">Location of The Pagoda Hotel</h2>
      </div>
      {/* Address */}
      <div className="flex items-center gap-2 text-base text-gray-700 mb-4">
        <MapPin className="w-5 h-5 text-purple-700" />
        Taluka Khed Chiplun Area, Lote, Maharashtra, 415722
      </div>
      {/* Search Bar */}
      {/* <div className="flex mb-6">
        <div className="relative flex-1">
          <input
            className="w-full rounded-lg border border-gray-200 py-2 px-4 pr-10 text-base bg-white outline-none"
            type="text"
            placeholder="Search Area, Landmark or Transit nearby"
          />
          <Search className="absolute top-2.5 right-3 w-5 h-5 text-gray-400" />
        </div>
      </div> */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden h-[350px] shadow bg-white">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125230.43839162497!2d73.2034077!3d17.4272085!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2062936b1f48b%3A0xb9d961933da80a82!2sThe%20Pagoda%20Hotel!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            title="Hotel Location"
            width="100%"
            height="100%"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0 }}
          ></iframe>
        </div>
        {/* Landmarks List */}
        <div className="w-full md:w-72 bg-white rounded-2xl shadow px-6 py-4 flex flex-col gap-3 text-gray-700">
          <div className="font-bold text-base mb-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-700" />
            Key Landmarks
            <ChevronDown className="w-4 h-4 ml-auto text-gray-400" />
          </div>
          {[
            {
              name: 'Hindustan Petroleum Corporation Limited',
              dist: '1.3Km',
              tag: 'Tourist Attraction',
            },
            { name: 'Panvel point', dist: '3.5Km', tag: 'Tourist Attraction' },
            { name: 'Vashisthi viewpoint katalwadi', dist: '4.9Km', tag: 'Tourist Attraction' },
            { name: 'Shinde Green Garden Asagani', dist: '6.3Km', tag: 'Tourist Attraction' },
          ].map((lm) => (
            <div
              key={lm.name}
              className="flex justify-between items-center border-b last:border-b-0 border-dashed border-gray-100 pb-1 mb-1 text-sm"
            >
              <div>
                <div className="font-semibold text-gray-900">{lm.name}</div>
                <div className="text-xs text-gray-500">{lm.tag}</div>
              </div>
              <div className="text-purple-700 font-bold">{lm.dist}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
