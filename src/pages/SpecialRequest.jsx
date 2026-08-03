import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const SpecialRequest = ({ isOpen, onClose, request, setRequest }) => {
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isTouched, setIsTouched] = useState(false);
  const MIN_CHARS = 10;
  const MAX_CHARS = 200;

  useEffect(() => {
    setCharCount(request.length);
    if (isTouched) {
      validateInput(request);
    }
  }, [request, isTouched]);

  const validateInput = (value) => {
    if (value.trim() === '') {
      setError('Special request cannot be empty');
      return false;
    }
    if (value.length < MIN_CHARS) {
      setError(`Minimum ${MIN_CHARS} characters required`);
      return false;
    }
    if (value.length > MAX_CHARS) {
      setError(`Maximum ${MAX_CHARS} characters allowed`);
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (e) => {
    if (!isTouched) setIsTouched(true);
    setRequest(e.target.value);
  };

  const handleSave = () => {
    setIsTouched(true);
    if (validateInput(request)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <AiOutlineClose size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Special Requests <span className="text-gray-500 text-base">(optional)</span>
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Special requests (e.g. roll-away beds, late check-in and accessible rooms) are not
          guaranteed. If you don't hear back from the property, you may want to contact them
          directly to confirm. The property may charge a fee for certain special requests.
        </p>

        <label className="block font-semibold text-gray-700 mb-2" htmlFor="specialRequest">
          Special requests
        </label>
        <textarea
          id="specialRequest"
          rows={4}
          maxLength={MAX_CHARS}
          className={`w-full border ${
            error
              ? 'border-red-500'
              : charCount >= MIN_CHARS
                ? 'border-green-500'
                : 'border-gray-300'
          } rounded p-3 resize-none`}
          placeholder={`Enter your special request (Minimum ${MIN_CHARS} characters)`}
          value={request}
          onChange={handleChange}
        ></textarea>

        <div className="flex justify-between mt-1">
          <div className="text-sm text-gray-500">
            {error && <span className="text-red-500">{error}</span>}
            {!error && charCount >= MIN_CHARS && (
              <span className="text-green-500">✓ Meets requirements</span>
            )}
          </div>
          <div className={`text-sm ${charCount > MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount}/{MAX_CHARS} characters
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`mt-6 w-full ${
            error ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-800'
          } text-white font-semibold py-3 rounded transition`}
          disabled={!!error}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default SpecialRequest;
