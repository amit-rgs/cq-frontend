import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const BookingConfirmation = ({ onBack }) => {
  return (
    <div className="p-6 w-full max-w-md relative">
      <button className="absolute top-4 left-4 text-gray-600" onClick={onBack}>
        <FaArrowLeft size={24} />
      </button>
      <h1 className="text-2xl font-bold mb-4 text-center">Booking Confirmation</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-semibold">Guest Name</label>
          <input type="text" value="John Doe" disabled className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-semibold">Room Type</label>
          <input type="text" value="Double" disabled className="w-full p-2 border rounded" />
        </div>
      </div>
      <button className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
        Verify Booking
      </button>
    </div>
  );
};

export default BookingConfirmation;
