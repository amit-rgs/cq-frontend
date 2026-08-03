import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { AiOutlineQrcode } from 'react-icons/ai';
import { FaRegSmile } from 'react-icons/fa';
import { HiOutlineIdentification } from 'react-icons/hi';
import { FaUserAlt } from 'react-icons/fa';

// Import your existing components
import ViewReservation from './ViewReservation';
import EditRoomDetails from './EditRoomDetails';
const BQ_BASE_URL = process.env.REACT_APP_BQ_BASE_URL;

const ProfileGuestOptions = () => {
  const navigate = useNavigate();
  const [activeOption, setActiveOption] = useState('qr-scanning');
  const [propertyData, setPropertyData] = useState({
    phone: '', // Default value
  });

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await fetch(`${BQ_BASE_URL}/bq/api/properties/1`);
        const data = await response.json();
        setPropertyData(data);
      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };

    fetchPropertyData();
  }, []);

  const options = [
    {
      id: 'qr-scanning',
      title: 'View Your Reservation',
      description: 'View or edit your previous reservations.',
      icon: <AiOutlineQrcode size={28} className="text-white" />,
      component: <ViewReservation />,
      fastest: false,
      new: false,
    },
    {
      id: 'reservation-id',
      title: 'New Reservation',
      description: 'Create a new reservation by entering the required details.',
      icon: <HiOutlineIdentification size={32} className="text-white" />,
      fastest: false,
      new: false,
    },
  ];

  const handleOptionClick = (option) => {
    if (option.id === 'reservation-id') {
      // Navigate to new page for new reservation
      navigate('/walk-in/room-reservation');
      window.location.reload();
    } else {
      // Stay on same page for view reservation
      setActiveOption(option.id);
    }
  };

  const getActiveComponent = () => {
    const option = options.find((opt) => opt.id === activeOption);
    return option ? option.component : <ViewReservation />;
  };

  const shouldShowBookingBox = ['qr-scanning', 'facial-recognition'].includes(activeOption);

  return (
    <div className="bg-white min-h-screen overflow-hidden">
      {/* Back Button - Fixed position */}
      <div className="absolute top-24 left-8 z-50">
        <Link
          to="/check-in/options"
          className="text-black hover:text-gray-700 transition font-semibold text-2xl"
        >
          <IoMdArrowRoundBack size={32} />
        </Link>
      </div>

      {/* Main Content */}
      <div className=" mx-auto px-16 pt-20 pb-10">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-black font-poppins mb-1">Reservation</h1>
          <p className="text-lg font-poppins font-semibold text-gray-700">
            View or edit an existing reservation or create a new one.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Options Sidebar */}
          <div className="w-full lg:w-2/5 xl:w-2/6">
            <div className="bg-gray-50 rounded-lg shadow-md p-4">
              {options.map((option) => (
                <div
                  key={option.id}
                  className={`mb-4 last:mb-0 p-4 font-poppins rounded-lg cursor-pointer transition-all ${
                    activeOption === option.id
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        activeOption === option.id ? 'bg-white' : 'bg-black w-[68px] h-13'
                      }`}
                    >
                      {React.cloneElement(option.icon, {
                        className: activeOption === option.id ? 'text-black' : 'text-white ',
                      })}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{option.title}</h3>
                        {option.fastest && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded ml-2 whitespace-nowrap">
                            Fastest
                          </span>
                        )}
                        {option.new && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-4 py-0.5 rounded ml-2 whitespace-nowrap">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Option Content - Only shown for View Reservation */}
          {activeOption === 'qr-scanning' && (
            <div className="w-full lg:w-5/6">
              <div className="flex flex-col gap-4">
                {/* Top Box */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 min-h-[500px] p-6 flex items-center justify-center">
                  <div className="w-full">{getActiveComponent()}</div>
                </div>

                <div className="text-start mt-2 ml-10 ">
                  <span className="text-sm font-semibold uppercase text-black">
                    In case you need any assistance,&nbsp;
                    <span className="block sm:inline">please contact our Front Desk or call:</span>
                    &nbsp;
                    <a href={`tel:${propertyData.phone}`} className="underline hover:text-gray-700">
                      {propertyData.phone}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileGuestOptions;
