import React from 'react';

const ReservationSteps = ({ currentStep }) => {
  const steps = [
    { id: 1, title: 'Select Room', width: '12%' },
    { id: 2, title: 'Enhance Your Stay', width: '38%' },
    { id: 3, title: 'Payment', width: '64%' },
    { id: 4, title: 'Modification Successful', width: '100%' },
  ];

  // Get the progress width for the current step
  const progressWidth = steps.find((step) => step.id === currentStep)?.width || '';

  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-sm">
      <div className="relative flex justify-between items-center">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0"></div>

        {/* Filled line with manual width */}
        <div
          className="absolute top-5 left-0 h-1 bg-black z-0 transition-all duration-300"
          style={{ width: progressWidth }}
        ></div>

        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col items-center z-10 relative"
            style={{ width: `${100 / (steps.length - 1)}%` }}
          >
            {/* Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep >= step.id ? 'border-black bg-black' : 'border-gray-300 bg-gray-100'
              }`}
            >
              <span
                className={`text-lg font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-gray-500'
                }`}
              >
                {step.id}
              </span>
            </div>
            <span
              className={`text-sm mt-1 text-center font-medium ${
                currentStep >= step.id ? 'text-black' : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationSteps;
