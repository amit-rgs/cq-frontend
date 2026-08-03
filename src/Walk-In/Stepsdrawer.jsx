import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAdults, setChildren } from './redux/action';

const StepsDrawer = ({ onClose }) => {
  const dispatch = useDispatch();

  // Access Redux state
  const { rooms, adults, children } = useSelector((state) => state.formDetails);
  const { selectedRoom } = useSelector((state) => state.roomtype);

  // Make sure selectedRoom.baseprice exists, otherwise set it to 0
  const roomPrice = selectedRoom?.baseprice || 0;

  // Log to debug if roomPrice is being correctly set
  console.log('Room Price:', roomPrice);

  // Handle room count changes
  const handleRoomCountChange = (count) => {
    dispatch({ type: 'SET_ROOMS', payload: count });
  };

  // Handle adults count change
  const handleAdultsChange = (count) => {
    dispatch(setAdults(count));
  };

  // Handle children count change
  const handleChildrenChange = (count) => {
    dispatch(setChildren(count));
  };

  return (
    <div className="h-full fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full sm:w-1/3 h-full flex flex-col rounded-l-lg shadow-lg">
        <button
          className="absolute top-4 right-4 text-red-600 text-xl font-semibold hover:text-red-800"
          onClick={onClose}
        >
          X
        </button>
        <div className="flex-1 overflow-y-auto p-4 mt-2">
          <h2 className="text-xl font-semibold text-center">Modify Booking</h2>
          <h2 className="text-sm text-gray-500 text-center mb-10">
            Modify your booking effortlessly by updating in a single step.
          </h2>

          {/* Room Section */}
          <div className="mb-6 ">
            <h3 className="text-lg font-semibold">Add Rooms</h3>
            <div className="flex justify-between items-center">
              <p>No. of Rooms:</p>
              <div className="flex items-center space-x-4 border border-gray-300 px-2 py-1 rounded">
                <button
                  onClick={() => handleRoomCountChange(Math.max(rooms - 1, 0))}
                  disabled={rooms <= 0}
                  className="text-xl text-black disabled:text-gray-400"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms}
                  readOnly
                  className="w-20 text-center outline-none"
                />
                <button
                  onClick={() => handleRoomCountChange(rooms + 1)}
                  className="text-xl text-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Adults Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Adults</h3>
            <div className="flex justify-between items-center">
              <p>No. of Adults:</p>
              <div className="flex items-center space-x-4 border border-gray-300 px-2 py-1 rounded">
                <button
                  onClick={() => handleAdultsChange(Math.max(adults - 1, 0))}
                  disabled={adults <= 0}
                  className="text-xl text-black disabled:text-gray-400"
                >
                  -
                </button>
                <input
                  type="number"
                  value={adults}
                  readOnly
                  className="w-20 text-center outline-none"
                />
                <button
                  onClick={() => handleAdultsChange(adults + 1)}
                  className="text-xl text-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Children Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Children</h3>
            <div className="flex justify-between items-center">
              <p>No. of Children:</p>
              <div className="flex items-center space-x-4 border border-gray-300 px-2 py-1 rounded">
                <button
                  onClick={() => handleChildrenChange(Math.max(children - 1, 0))}
                  disabled={children <= 0}
                  className="text-xl text-black disabled:text-gray-400"
                >
                  -
                </button>
                <input
                  type="number"
                  value={children}
                  readOnly
                  className="w-20 text-center outline-none"
                />
                <button
                  onClick={() => handleChildrenChange(children + 1)}
                  className="text-xl text-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-6">
          <button
            className="w-full bg-black text-white py-2 rounded hover:text-gray-200"
            onClick={onClose}
          >
            Modify
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepsDrawer;
