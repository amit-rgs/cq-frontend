import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-toastify';

const SignatureModal = ({ isOpen, onClose, onSave, guestName, amount }) => {
  const sigCanvas = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  const clearSignature = () => {
    sigCanvas.current.clear();
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      toast.error('Please provide your signature before proceeding', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    const signatureDataURL = sigCanvas.current.toDataURL();
    toast.success('Signature saved successfully!', {
      position: 'top-center',
      autoClose: 2000,
    });
    onSave(signatureDataURL);
    clearSignature();
  };

  const goBack = () => {
    clearSignature();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header with black gradient */}
        <div className="bg-gradient-to-r from-gray-800 to-black px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 9h6m-6 3h6m-6 3h6M3 9h6m-6 3h6m-6 3h6m-3 3V3m0 0L4.5 6M9 3L6 6"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sign Here</h2>
                <p className="text-gray-300 text-sm">Draw your signature below</p>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={goBack}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Guest</p>
                  <p className="font-semibold text-gray-900">{guestName || 'Guest'}</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                  <p className="font-semibold text-gray-900">{amount || '₹0.00'}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Please sign in the box below to authorize this transaction:
            </p>
          </div>

          {/* Signature Canvas */}
          <div className="border-2 border-gray-300 rounded-lg mb-4 bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'signature-canvas w-full',
                style: { height: '200px', border: 'none', borderRadius: '0.5rem' },
              }}
              backgroundColor="rgb(255, 255, 255)"
              penColor="rgb(0, 0, 0)"
              velocityFilterWeight={0.7}
              minWidth={0.5}
              maxWidth={2.5}
              onEnd={() => setHasSignature(!sigCanvas.current.isEmpty())}
            />
          </div>

          {/* Instructions */}
          {!hasSignature && (
            <p className="text-xs text-gray-400 text-center mb-3">
              Click and drag to draw your signature
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              onClick={saveSignature}
              className="flex-1 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold shadow-md"
            >
              Confirm Signature
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            By signing, you agree to the terms and conditions of this transaction
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
