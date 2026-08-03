import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { IoMdArrowRoundBack } from 'react-icons/io'; // Import the back arrow icon
const BQ_BASE_URL = process.env.REACT_APP_BQ_BASE_URL;

// Action to set the selected room in the Redux store
const setSelectedRoom = (room) => ({
  type: 'SET_SELECTED_ROOM',
  payload: room,
});

const RoomCard = ({ room }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCustomize = () => {
    // Dispatch the selected room to the Redux store
    dispatch(setSelectedRoom(room));

    // Navigate to the booking summary page with the room details
    navigate('/walk-in/booking-summary', { state: { room } });
  };

  return (
    <div className="border border-gray-300 rounded-lg shadow-lg p-6 transition-all duration-300 hover:border-black">
      <h3 className="text-2xl font-bold text-gray-800">{room.roomtypename}</h3>
      <p className="text-base font-semibold text-gray-600 mt-1">{room.description}.</p>

      <div className="mt-4">
        <p className="text-2xl font-semibold text-gray-800">₹{room.baseprice}</p>
        <p className="text-sm text-gray-500">+ Tax</p>
      </div>
      <div className="mt-4">
        <button
          className="w-full bg-[#1d42b0] text-white py-2 px-4 font-semibold text-lg rounded hover:text-black transition duration-200"
          onClick={handleCustomize}
        >
          Select and Customize
        </button>
      </div>
    </div>
  );
};

const SelectRoomType = () => {
  const [rooms, setRooms] = useState([]); // State to store room data
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch room data from the new API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${BQ_BASE_URL}/bq/api/roomtypes`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Set rooms with the new API data
          setRooms(data);
        } else {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch completes
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  return (
    <div className="w-full h-fit flex flex-col p-10 items-center justify-center bg-white relative mt-20">
      {/* Back Navigation Button */}
      <Link to={'/walk-in/form'}>
        <button className="absolute top-1 left-4 p-2  text-black hover:text-gray-700 font-semibold text-2xl">
          <IoMdArrowRoundBack size={32} />
        </button>
      </Link>

      <h1 className="text-4xl font-bold mt-20 text-center">Room Type</h1>
      <p className=" text-gray-600 text-center mb-6  text-xl font-semibold">
        Choose the perfect room for your stay from our wide range of options, each offering unique
        features and amenities.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rooms.length > 0 ? (
          rooms.map((room, index) => <RoomCard key={index} room={room} />)
        ) : (
          <p className="text-xl font-semibold">No rooms available</p>
        )}
      </div>
    </div>
  );
};

export default SelectRoomType;
