import { Utensils, Ban, Martini, BadgeCheck } from 'lucide-react';

export default function PropertyRules() {
  return (
    <div className="">
      {/* Food Section */}
      <div className=" bg-white rounded-xl px-5 py-4 mb-6 mt-12 border">
        <h3 className="text-xl font-extrabold text-gray-800 mb-2">Aquatico (Casual Dining)</h3>
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
          <div className="flex gap-2 items-center text-sm text-gray-700">
            <BadgeCheck className="text-red-600 w-5 h-5" />
            Both Vegetarian &amp; Non-Vegetarian food
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm text-gray-800 mb-2">
          <div className="flex gap-2 items-center">
            <Utensils className="text-yellow-500 w-5 h-5" />
            Breakfast <span className="font-semibold">07:30 AM - 10:30 AM</span>
          </div>
          <span>|</span>
          <div>
            Lunch <span className="font-semibold">12:30 PM - 03:00 AM</span>
          </div>
          <span>|</span>
          <div>
            Dinner <span className="font-semibold">07:00 PM - 11:00 PM</span>
          </div>
          <span>|</span>
          <div>Cuisines: North Indian, South Indian, Continental, Asian</div>
        </div>
      </div>
      {/* Property Rules */}
      <div className="bg-white rounded-xl px-5 py-4 border">
        <h3 className="text-xl font-extrabold text-gray-800 mb-2">
          Property Rules{' '}
          <span className="text-base text-blue-400 font-semibold">For Food &amp; Beverages</span>
        </h3>
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Allowed */}
          <div className="flex-1">
            <div className="font-bold text-black mb-2">Allowed</div>
            <div className="flex items-center gap-2 mb-1 text-sm text-gray-700">
              <BadgeCheck className="text-red-600 w-5 h-5" />
              Non-veg food is allowed
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Martini className="text-blue-500 w-5 h-5" />
              Alcohol is allowed in the premises
            </div>
          </div>
          {/* Not Allowed */}
          <div className="flex-1">
            <div className="font-bold text-black mb-2">Not Allowed</div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Ban className="text-pink-500 w-5 h-5" />
              Food from outside is not allowed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
