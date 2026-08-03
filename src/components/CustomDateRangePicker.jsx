import React, { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { addYears, startOfDay, format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { SlCalender } from 'react-icons/sl';

export default function CustomDateRangePicker({ value, onChange }) {
  const today = startOfDay(new Date());
  const maxDate = addYears(today, 1);
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  const selectionRange = {
    startDate: value?.from || today,
    endDate: value?.to && value.to >= (value?.from || today) ? value.to : value?.from || today,
    key: 'selection',
  };

  const handleSelect = (ranges) => {
    const { selection } = ranges;
    let newFrom = startOfDay(selection.startDate);
    let newTo = startOfDay(selection.endDate);

    if (newFrom < today) newFrom = today;
    if (newTo < newFrom) newTo = newFrom;
    if (newTo > maxDate) newTo = maxDate;

    onChange({ from: newFrom, to: newTo });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'dd MMM ');
  };

  const formatDateShort = (date) => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy');
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  return (
    <div className="relative w-full h-full" ref={pickerRef}>
      {/* Single input field */}
      <div className="flex flex-col">
        <label className="text-black font-bold text-base mb-1">From</label>

        <button
          type="button"
          className="w-full text-left border-2  border-gray-200  p-2  text-md font-semibold transition flex items-center bg-white"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-2">
            <SlCalender size={24} className="text-gray-500" />
            <div className="flex flex-col">
              {value?.from && value?.to ? (
                <>
                  <div className="font-semibold text-md">
                    {value.from.toLocaleString('en', { weekday: 'short' })},{' '}
                    {formatDate(value.from)} - {value.to.toLocaleString('en', { weekday: 'short' })}
                    , {formatDate(value.to)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {Math.ceil((value.to - value.from) / (1000 * 60 * 60 * 24))} night stay
                  </div>
                </>
              ) : (
                <div className="font-semibold text-md text-gray-400">
                  Select check-in and check-out dates
                </div>
              )}
            </div>
          </div>

          {/* {value?.from && value?.to && (
            <div className="text-right text-sm">
              <div className="text-gray-500">Total</div>
              <div className="font-semibold">
                {value.from.toLocaleDateString("en-GB")} - {value.to.toLocaleDateString("en-GB")}
              </div>
            </div>
          )} */}
        </button>
      </div>

      {/* Date Range Picker */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-white border rounded-2xl shadow-xl p-6 min-w-[650px]">
          <DateRange
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            ranges={[selectionRange]}
            months={2}
            direction="horizontal"
            showDateDisplay={false}
            minDate={today}
            maxDate={maxDate}
            rangeColors={['#7c3aed']}
            ariaLabels={{
              dateInput: { selection: 'Date input' },
              monthPicker: 'Month picker',
              yearPicker: 'Year picker',
              prevButton: 'Previous month button',
              nextButton: 'Next month button',
            }}
            showMonthAndYearPickers={true}
            showPreview={true}
            showMonthArrow={true}
            focusedRange={[0, 0]}
          />

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {value?.from && value?.to && (
                <>
                  <span className="font-semibold">
                    {Math.ceil((value.to - value.from) / (1000 * 60 * 60 * 24))} nights
                  </span>
                  : {formatDateShort(value.from)} - {formatDateShort(value.to)}
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="px-6 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                onClick={() => {
                  onChange({ from: today, to: today });
                  setOpen(false);
                }}
              >
                Clear Dates
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-purple-700 text-white hover:bg-purple-800 transition-colors"
              >
                Apply Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// import React, { useState } from "react";
// import { DateRange } from "react-date-range";
// import { addYears, startOfDay } from "date-fns";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";
// import { SlCalender } from "react-icons/sl";

// export default function CustomDateRangePicker({ value, onChange }) {
//   const today = startOfDay(new Date());
//   const maxDate = addYears(today, 1);
//   const [open, setOpen] = useState(false);

//   const selectionRange = {
//     startDate: value?.from || today,
//     endDate: value?.to && value.to >= (value?.from || today) ? value.to : value?.from || today,
//     key: "selection",
//   };

//   const handleSelect = (ranges) => {
//     const { selection } = ranges;
//     let newFrom = startOfDay(selection.startDate);
//     let newTo = startOfDay(selection.endDate);

//     if (newFrom < today) newFrom = today;
//     if (newTo < newFrom) newTo = newFrom;
//     if (newTo > maxDate) newTo = maxDate;

//     onChange({ from: newFrom, to: newTo });
//   };

//   const formatDate = (date) =>
//     date
//       ? `${date.getDate().toString().padStart(2, "0")} ${date.toLocaleString("en", { month: "short" })} ${date.getFullYear().toString()}`
//       : "dd/mm/yyyy";

//   return (
//     <div className="relative w-full h-full flex gap-2">
//     <div className="flex w-full gap-8">

// {/* Check-in */}
// <div className="flex-1 flex flex-col pl-5">
//   <label className="text-black font-bold text-base mb-1">
//     Check-in
//   </label>

//   <button
//     type="button"
//     className="border-2 border-gray-200 bg-white w-full p-2 text-left flex flex-col justify-center relative"
//     onClick={() => setOpen(true)}
//   >
//     <span className="font-semibold text-md flex items-center gap-2">
//       <SlCalender size={24} className="text-gray-500 mr-4" />
//       {value?.from
//         ? value.from.toLocaleString("en", { weekday: "long" })
//         : "Start"}
//       , {value?.from ? formatDate(value.from) : "DD/MM/YYYY"}
//     </span>
//   </button>
// </div>

// {/* Check-out */}
// <div className="flex-1 flex flex-col">
//   <label className="text-black font-bold text-base mb-1">
//     Check-out
//   </label>

//   <button
//     type="button"
//     className="border-2 border-gray-200 bg-white w-full p-2 text-left flex flex-col justify-center"
//     onClick={() => setOpen(true)}
//   >
//     <span className="font-semibold text-md flex items-center gap-2">
//       <SlCalender size={24} className="text-gray-500 mr-4" />
//       {value?.to
//         ? value.to.toLocaleString("en", { weekday: "long" })
//         : "End"}
//       , {value?.to ? formatDate(value.to) : "DD/MM/YYYY"}
//     </span>
//   </button>
// </div>

// </div>

//       {open && (
//         <div className="absolute z-50 top-20 left-0 bg-white border rounded-2xl shadow-xl p-2 min-w-[650px]">
//           <DateRange
//             onChange={handleSelect}
//             moveRangeOnFirstSelection={false}
//             ranges={[selectionRange]}
//             months={2}
//             direction="horizontal"
//             showDateDisplay={false}
//             minDate={today}
//             maxDate={maxDate}
//             rangeColors={["#7c3aed"]}
//             ariaLabels={{
//               dateInput: {
//                 selection: "Date input",
//               },
//               monthPicker: "Month picker",
//               yearPicker: "Year picker",
//               prevButton: "Previous month button",
//               nextButton: "Next month button",
//             }}
//             showMonthAndYearPickers={true}
//             showPreview={false}
//             showMonthArrow={true}
//           />
//           <div className="flex justify-end gap-2 mt-3 pr-4">
//             <button
//               type="button"
//               className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
//               onClick={() => {
//                 onChange({ from: today, to: today });
//                 setOpen(false);
//               }}
//             >
//               Clear
//             </button>
//             <button
//               type="button"
//               onClick={() => setOpen(false)}
//               className={`px-4 py-2 rounded-lg text-sm font-semibold bg-purple-700 text-white`}
//             >
//               Done
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
