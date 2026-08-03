const InfoField = ({ label, value }) => (
  <div>
    <label className="block text-md font-medium text-gray-700">{label}</label>
    <input
      type="text"
      value={value || 'N/A'}
      disabled
      className="w-full bg-gray-50 text-black p-2 rounded border border-gray-400 mt-1 mb-1"
    />
  </div>
);

export default InfoField;
