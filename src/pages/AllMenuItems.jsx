// src/pages/AllMenuItems.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const AllMenuItems = () => {
  const navigate = useNavigate();
  const [apiItems, setApiItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all'); // all, veg, non-veg
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, price

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${CQ_BASE_URL}/bq/api/items/`);
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          const activeItems = data.items.filter((item) => item.isActive && item.image);
          setApiItems(activeItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  // Filter and sort items
  const getFilteredItems = () => {
    let filtered = [...apiItems];

    // Apply food type filter
    if (filter === 'veg') {
      filtered = filtered.filter((item) => item.foodType === 'Veg');
    } else if (filter === 'non-veg') {
      filtered = filtered.filter((item) => item.foodType === 'Non-Veg');
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => navigate('/restaurant')}
            className="mb-6 inline-flex items-center gap-2 text-amber-200 hover:text-white transition"
          >
            <i className="fas fa-arrow-left"></i> Back to Restaurant
          </button>
          <h1 className="font-serif-display text-4xl md:text-5xl font-bold">Complete Collection</h1>
          <p className="text-amber-100 mt-3 text-lg">
            Browse our complete menu of {apiItems.length} delicious items
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="sticky top-0 bg-white shadow-md z-20 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  filter === 'all'
                    ? 'bg-amber-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setFilter('veg')}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  filter === 'veg'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-leaf mr-1"></i> Veg
              </button>
              <button
                onClick={() => setFilter('non-veg')}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  filter === 'non-veg'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-drumstick-bite mr-1"></i> Non-Veg
              </button>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-amber-500 w-64"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-amber-500"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {filteredItems.length} of {apiItems.length} items
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl  duration-300 cursor-pointer bg-white border border-gray-100 hover:scale-105 transform transition-transform"
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {item.foodType}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-lg truncate">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-amber-700 font-bold text-xl">₹{item.price}</span>
                      <span className="text-xs text-gray-400">
                        {item.price_type || 'Per plate'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.mealTypes.slice(0, 2).map((meal, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                        >
                          {meal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">No items found matching your criteria.</p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchTerm('');
                  }}
                  className="mt-4 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition z-10"
              >
                <i className="fas fa-times"></i>
              </button>
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-80 object-cover rounded-t-2xl"
              />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{selectedItem.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedItem.foodType === 'Veg'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {selectedItem.foodType}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {selectedItem.price_type || 'Per plate'}
                    </span>
                  </div>
                </div>
                <div className="text-amber-700 font-bold text-4xl">₹{selectedItem.price}</div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{selectedItem.description}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Meal Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.mealTypes.map((meal, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {meal}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Details</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>
                      <span className="font-medium">Max Quantity:</span> {selectedItem.maxQuantity}
                    </li>
                    <li>
                      <span className="font-medium">Refundable:</span>{' '}
                      {selectedItem.refundable ? 'Yes' : 'No'}
                    </li>
                    <li>
                      <span className="font-medium">Available:</span>{' '}
                      {selectedItem.availableFrom || '24/7'} -{' '}
                      {selectedItem.availableUntil || '24/7'}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-2 rounded-full font-semibold transition flex-1">
                  Add to Order
                </button>
                <button
                  onClick={closeModal}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-full font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AllMenuItems;
