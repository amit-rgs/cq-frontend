import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import 'react-calendar/dist/Calendar.css';

const SelectDates = ({ onClose }) => {
  const [selectedPage, setSelectedPage] = useState('calendar');
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const daysCount = useSelector((state) => state.selectedDates.daysCount);
  const checkInDateFromStore = useSelector((state) => state.selectedDates.checkInDate);
  const checkOutDateFromStore = useSelector((state) => state.selectedDates.checkOutDate);

  useEffect(() => {
    if (checkInDateFromStore && checkOutDateFromStore) {
      setCheckInDate(new Date(checkInDateFromStore));
      setCheckOutDate(new Date(checkOutDateFromStore));
    }
  }, [checkInDateFromStore, checkOutDateFromStore]);

  const handleCalendarChange = (dates) => {
    if (dates.length === 2) {
      const [start, end] = dates;
      setCheckInDate(start);
      setCheckOutDate(end);

      const diff = Math.ceil((end - start) / (1000 * 3600 * 24));

      dispatch({ type: 'SET_SELECTED_DATES', payload: [start, end, diff] });
    }
  };

  const handleSubmit = () => {
    navigate('/walk-in/roomtype');
  };

  const formatDate = (date) => {
    return date instanceof Date ? date.toLocaleDateString() : '';
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-opacity-50 bg-gray-500 z-50">
      <div className="w-1/2 bg-white rounded-2xl p-6 border-t-2 shadow-lg transform transition-transform duration-300 ease-in-out">
        <button className="absolute top-4 right-4 text-2xl text-red-500" onClick={onClose}>
          x
        </button>
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Select Dates</h1>

        <div className="flex border-b border-gray-300 mb-6">
          <button
            className={`w-1/2 py-2 text-center font-semibold ${
              selectedPage === 'calendar'
                ? 'border-b-2 border-gray-500 text-gray-800'
                : 'text-gray-400'
            }`}
            onClick={() => setSelectedPage('calendar')}
          >
            Calendar
          </button>
          <button
            className={`w-1/2 py-2 text-center font-semibold ${
              selectedPage === 'longTrip'
                ? 'border-b-2 border-gray-500 text-gray-800'
                : 'text-gray-400'
            }`}
            onClick={() => setSelectedPage('longTrip')}
          >
            Long Trip
          </button>
        </div>

        {selectedPage === 'calendar' && (
          <div
            style={{
              height: '350px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Calendar
              onChange={handleCalendarChange}
              value={[checkInDate, checkOutDate]}
              selectRange={true}
              defaultActiveStartDate={new Date()} // Ensure current month is displayed
            />
            {checkInDate && checkOutDate && (
              <div className="flex justify-center items-center gap-3">
                <p className="mt-4 text-center text-base gap-4">
                  Check-In Date:
                  <span className="text-blue-700 font-semibold ml-1">
                    {formatDate(checkInDate)}
                  </span>
                </p>
                <p className="mt-4 text-center text-base gap-4">
                  Check-Out Date:
                  <span className="text-blue-700 font-semibold ml-1">
                    {formatDate(checkOutDate)}
                  </span>
                </p>
                <p className="mt-4 text-center text-base gap-4">
                  Trip Duration:
                  <span className="text-blue-700 font-semibold m-1">{daysCount}</span>
                  days
                </p>
              </div>
            )}
          </div>
        )}

        {selectedPage === 'longTrip' && (
          <div className="h-[350px] overflow-auto">
            <h2 className="text-xl font-semibold text-gray-700 text-center mb-1">
              Plan Your Long Trip.
            </h2>
            <p className="text-center text-xs text-gray-600 mb-4">
              Select the start and end dates for your long trip. We'll calculate the duration for
              you.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between">
                <label className="font-semibold text-black">Start Date:</label>
                <input
                  type="date"
                  className="p-2 border rounded-lg w-4/5"
                  value={checkInDate ? checkInDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setCheckInDate(new Date(e.target.value))}
                />
              </div>
              <div className="flex justify-between">
                <label className="font-semibold text-black">End Date:</label>
                <input
                  type="date"
                  className="p-2 border rounded-lg w-4/5"
                  value={checkOutDate ? checkOutDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setCheckOutDate(new Date(e.target.value))}
                />
              </div>

              {checkInDate && checkOutDate && (
                <div className="flex justify-center items-center gap-3">
                  <p className="mt-4 text-center text-base gap-4">
                    Check-In Date:
                    <span className="text-blue-700 font-semibold ml-1">
                      {formatDate(checkInDate)}
                    </span>
                  </p>
                  <p className="mt-4 text-center text-base gap-4">
                    Check-Out Date:
                    <span className="text-blue-700 font-semibold ml-1">
                      {formatDate(checkOutDate)}
                    </span>
                  </p>
                  <p className="mt-4 text-center text-base gap-4">
                    Trip Duration:
                    <span className="text-blue-700 font-semibold m-1">{daysCount}</span>
                    days
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          className="mt-6 w-full bg-[#1d42b0] text-white py-2 rounded-lg hover:text-black "
          onClick={handleSubmit}
        >
          Proceed
        </button>
      </div>
    </div>
  );
};

export default SelectDates;
