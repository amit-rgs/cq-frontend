import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMenuAlt1 } from 'react-icons/hi';
import {
  FaHome,
  FaUser,
  FaPhone,
  FaSearch,
  FaTimes,
  FaSignOutAlt,
  FaCalendarAlt,
} from 'react-icons/fa';
import ResponsiveMenu from './ResponsiveMenu';
import logo from '../../assets/ChatGPT Image Dec 26, 2025, 01_02_54 PM 2.png';
import { useAuth } from '../../pages/AuthProvider';
import Login from '../../pages/Login';
import { FaUsers } from 'react-icons/fa';
import { FaUtensils } from 'react-icons/fa';

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Store user details in localStorage when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const userDetails = {
        name: getUserName(),
        email: getUserEmail(),
        phoneNumber: user?.phone_number || user?.phone || '',
        firstname: user?.first_name || '',
        lastname: user?.last_name || '',
        user_id: user?.id || user?._id || '',
      };
      localStorage.setItem('userDetails', JSON.stringify(userDetails));
    } else if (!isAuthenticated) {
      // Clear user details from localStorage when logged out
      localStorage.removeItem('userDetails');
    }
  }, [isAuthenticated, user]);

  const getUserInitial = () => {
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;
    return '';
  };

  const getUserName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) return user.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserPhoneNumber = () => {
    if (user?.phone_number) return user.phone_number;
    if (user?.phone) return user.phone;
    return '';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Clear user details from localStorage
      localStorage.removeItem('userDetails');
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMyAccountClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthenticated) {
      navigate('/viewreservation');
    } else {
      setShowLoginModal(true);
    }
  };

  // Only these 3 items - Home, My Account, Contact Us
  const navItems = [
    { name: 'Stay', path: '/', icon: FaHome },
    { name: 'Dine', path: '/restaurant', icon: FaUtensils },
    { name: 'Experience', path: '/experience', icon: FaUtensils },
    {
      name: 'My Account',
      isButton: true,
      onClick: handleMyAccountClick,
      icon: FaUser,
    },

    { name: 'About Us', path: '/about', icon: FaUsers },

    { name: 'Contact Us', path: '/contact', icon: FaPhone },
  ];

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const searchableContent = [
      {
        id: 1,
        title: 'Executive Suite',
        path: '/rooms/executive',
        category: 'Rooms',
      },
      { id: 2, title: 'Deluxe Room', path: '/rooms/deluxe', category: 'Rooms' },
      {
        id: 3,
        title: 'Presidential Suite',
        path: '/rooms/presidential',
        category: 'Rooms',
      },
      { id: 4, title: 'Fine Dining', path: '/dining', category: 'Dining' },
      { id: 5, title: 'Wedding Packages', path: '/events', category: 'Events' },
      {
        id: 6,
        title: 'Special Offers',
        path: '/offers',
        category: 'Promotions',
      },
      { id: 7, title: 'Gallery', path: '/gallery', category: 'Media' },
    ];

    const filtered = searchableContent.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleResultClick = (result) => {
    navigate(result.path);
    clearSearch();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        if (searchQuery === '') {
          setShowSearch(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);

  const handleMobileMyAccountClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (isAuthenticated) {
      navigate('/viewreservation');
      setShowMenu(false);
    } else {
      setShowLoginModal(true);
      setShowMenu(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('Login successful, user data:', userData);
    // Store user details in localStorage on successful login
    if (userData) {
      const userDetails = {
        name:
          userData?.first_name && userData?.last_name
            ? `${userData.first_name} ${userData.last_name}`
            : userData?.first_name || userData?.email?.split('@')[0] || 'User',
        email: userData?.email || '',
        phoneNumber: userData?.phone_number || userData?.phone || '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        user_id: userData?.id || userData?._id || '',
      };
      localStorage.setItem('userDetails', JSON.stringify(userDetails));
    }
    setShowLoginModal(false);
  };

  const handleSignupClick = () => {
    setShowLoginModal(false);
    navigate('/create-user');
  };

  return (
    <>
      <header className="sticky top-0 bg-white shadow-sm z-50 w-full">
        {/* Desktop Navigation */}
        <div className="hidden lg:block w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              {/* Logo - Left side */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <img
                    src={logo}
                    alt="The Pagoda Xecutive Logo"
                    className="h-20 will-change-auto object-contain"
                    style={{ maxWidth: 200, maxHeight: 200 }}
                  />
                </Link>
              </div>

              {/* Right side - Navigation, Search, and User Section */}
              <div className="flex items-center space-x-8">
                {/* Navigation Items - Home, My Account, Contact Us */}
                <div className="flex items-center space-x-6">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    if (item.isButton) {
                      return (
                        <button
                          key={index}
                          onClick={item.onClick}
                          className="flex items-center gap-2 text-md text-black hover:text-purple-600 transition-colors font-medium"
                        >
                          <Icon size={18} />
                          {item.name}
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={index}
                        to={item.path}
                        className="flex items-center gap-2 text-md text-black hover:text-purple-600 transition-colors font-medium"
                      >
                        <Icon size={18} />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                {/* Search Button */}
                {/* <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <FaSearch size={18} />
                </button> */}

                {/* User Section - Sign In or User Menu */}
                {isAuthenticated ? (
                  <div ref={userMenuRef} className="relative">
                    <button onClick={toggleUserMenu} className="flex items-center space-x-2">
                      <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {getUserInitial()}
                      </div>
                    </button>

                    {showUserMenu && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
                        <div className="p-4 border-b border-gray-100 bg-purple-50">
                          <div className="font-medium text-gray-800">{getUserName()}</div>
                          <div className="text-sm text-gray-500 truncate">{getUserEmail()}</div>
                          {getUserPhoneNumber() && (
                            <div className="text-sm text-gray-500 mt-1">{getUserPhoneNumber()}</div>
                          )}
                        </div>
                        <ul className="py-2">
                          <li>
                            <Link
                              to="/viewreservation"
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <FaCalendarAlt size={16} />
                              My Reservations
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/profile"
                              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <FaUser size={16} />
                              Profile
                            </Link>
                          </li>
                          <li className="border-t border-gray-100">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
                            >
                              <FaSignOutAlt size={16} />
                              Logout
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-1.5 text-sm font-semibold text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={handleSignupClick}
                      className="px-4 py-1.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar Dropdown */}
          {showSearch && (
            <div className="border-t border-gray-100 bg-white shadow-lg">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div ref={searchRef} className="relative max-w-2xl mx-auto">
                  <FaSearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search for rooms, dining, events..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes size={18} />
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="max-w-2xl mx-auto mt-3 bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="block w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-purple-50"
                      >
                        <div className="font-medium text-gray-800">{result.title}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{result.category}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center">
                <img
                  src={logo}
                  alt="The Pagoda Xecutive Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="text-gray-700 hover:text-purple-700"
                >
                  <FaSearch size={20} />
                </button>

                {isAuthenticated ? (
                  <div className="relative">
                    <button onClick={toggleUserMenu}>
                      <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {getUserInitial()}
                      </div>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="font-medium text-gray-800 text-sm">{getUserName()}</div>
                          <div className="text-xs text-gray-500 truncate">{getUserEmail()}</div>
                          {getUserPhoneNumber() && (
                            <div className="text-xs text-gray-500 mt-1">{getUserPhoneNumber()}</div>
                          )}
                        </div>
                        <Link
                          to="/viewreservation"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaCalendarAlt size={14} />
                          My Reservations
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <FaUser size={14} />
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FaSignOutAlt size={14} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-purple-600 border-2 border-purple-600 rounded-lg"
                  >
                    <FaUser size={14} />
                    Sign In
                  </button>
                )}

                <HiMenuAlt1
                  onClick={toggleMenu}
                  className="cursor-pointer text-gray-800"
                  size={30}
                />
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {showSearch && (
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="relative">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={18} />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="block w-full text-left px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-purple-50"
                    >
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs text-gray-500">{result.category}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <ResponsiveMenu
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          onMyAccountClick={handleMobileMyAccountClick}
        >
          <div className="px-4 py-6 space-y-4">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              if (item.isButton) {
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      handleMobileMyAccountClick(e);
                    }}
                    className="flex items-center gap-3 w-full text-left text-lg font-medium text-gray-800 hover:text-purple-600 py-2 border-b border-gray-100"
                  >
                    <Icon size={22} />
                    {item.name}
                  </button>
                );
              }
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 text-lg font-medium text-gray-800 hover:text-purple-600 py-2 border-b border-gray-100"
                >
                  <Icon size={22} />
                  {item.name}
                </Link>
              );
            })}

            {!isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 text-lg font-medium text-purple-600 hover:text-purple-700 py-2 border-b border-gray-100 w-full text-left"
                >
                  <FaUser size={22} />
                  Sign In
                </button>
                <button
                  onClick={() => {
                    handleSignupClick();
                    setShowMenu(false);
                  }}
                  className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-center"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </ResponsiveMenu>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <Login
          closeModal={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          openSignup={handleSignupClick}
        />
      )}
    </>
  );
};

export default Navbar;

// import React, { useState, useRef, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { HiMenuAlt1 } from "react-icons/hi";
// import {
//   FaHome,
//   FaUser,
//   FaPhone,
//   FaSearch,
//   FaTimes,
//   FaSignOutAlt,
//   FaCalendarAlt,
// } from "react-icons/fa";
// import ResponsiveMenu from "./ResponsiveMenu";
// import logo from "../../assets/ChatGPT Image Dec 26, 2025, 01_02_54 PM 2.png";
// import { useAuth } from "../../pages/AuthProvider";
// import Login from "../../pages/Login";
// import { FaUsers } from "react-icons/fa";
// import { FaUtensils } from "react-icons/fa";

// const Navbar = () => {
//   const [showMenu, setShowMenu] = useState(false);
//   const [showSearch, setShowSearch] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [showLoginModal, setShowLoginModal] = useState(false);

//   const { isAuthenticated, user, logout } = useAuth();

//   const searchRef = useRef(null);
//   const userMenuRef = useRef(null);
//   const navigate = useNavigate();

//   const getUserInitial = () => {
//     if (user?.first_name) {
//       return user.first_name.charAt(0).toUpperCase();
//     }
//     if (user?.email) {
//       return user.email.charAt(0).toUpperCase();
//     }
//     return "U";
//   };

//   const getUserEmail = () => {
//     if (user?.email) return user.email;
//     return "";
//   };

//   const getUserName = () => {
//     if (user?.first_name && user?.last_name) {
//       return `${user.first_name} ${user.last_name}`;
//     }
//     if (user?.first_name) return user.first_name;
//     if (user?.email) return user.email.split("@")[0];
//     return "User";
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
//         setShowUserMenu(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const toggleMenu = () => {
//     setShowMenu(!showMenu);
//   };

//   const toggleUserMenu = () => {
//     setShowUserMenu(!showUserMenu);
//   };

//   const handleLogout = async () => {
//     try {
//       await logout();
//       setShowUserMenu(false);
//       navigate("/");
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };

//   const handleMyAccountClick = (e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (isAuthenticated) {
//       navigate("/viewreservation");
//     } else {
//       setShowLoginModal(true);
//     }
//   };

//   // Only these 3 items - Home, My Account, Contact Us
//   const navItems = [
//     { name: "Stay", path: "/", icon: FaHome },
//     { name: "Dine", path: "/restaurant", icon: FaUtensils },
//     { name: "Experience", path: "/experience", icon: FaUtensils },
//     {
//       name: "My Account",
//       isButton: true,
//       onClick: handleMyAccountClick,
//       icon: FaUser,
//     },

//     { name: "About Us", path: "/about", icon: FaUsers },

//     { name: "Contact Us", path: "/contact", icon: FaPhone },
//   ];

//   const handleSearch = async (query) => {
//     setSearchQuery(query);
//     if (query.trim() === "") {
//       setSearchResults([]);
//       return;
//     }

//     const searchableContent = [
//       {
//         id: 1,
//         title: "Executive Suite",
//         path: "/rooms/executive",
//         category: "Rooms",
//       },
//       { id: 2, title: "Deluxe Room", path: "/rooms/deluxe", category: "Rooms" },
//       {
//         id: 3,
//         title: "Presidential Suite",
//         path: "/rooms/presidential",
//         category: "Rooms",
//       },
//       { id: 4, title: "Fine Dining", path: "/dining", category: "Dining" },
//       { id: 5, title: "Wedding Packages", path: "/events", category: "Events" },
//       {
//         id: 6,
//         title: "Special Offers",
//         path: "/offers",
//         category: "Promotions",
//       },
//       { id: 7, title: "Gallery", path: "/gallery", category: "Media" },
//     ];

//     const filtered = searchableContent.filter(
//       (item) =>
//         item.title.toLowerCase().includes(query.toLowerCase()) ||
//         item.category.toLowerCase().includes(query.toLowerCase())
//     );

//     setSearchResults(filtered);
//   };

//   const clearSearch = () => {
//     setSearchQuery("");
//     setSearchResults([]);
//     setShowSearch(false);
//   };

//   const handleResultClick = (result) => {
//     navigate(result.path);
//     clearSearch();
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (searchRef.current && !searchRef.current.contains(event.target)) {
//         if (searchQuery === "") {
//           setShowSearch(false);
//         }
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [searchQuery]);

//   const handleMobileMyAccountClick = (e) => {
//     e?.preventDefault?.();
//     e?.stopPropagation?.();

//     if (isAuthenticated) {
//       navigate("/viewreservation");
//       setShowMenu(false);
//     } else {
//       setShowLoginModal(true);
//       setShowMenu(false);
//     }
//   };

//   const handleLoginSuccess = (userData) => {
//     console.log("Login successful, user data:", userData);
//     setShowLoginModal(false);
//   };

//   const handleSignupClick = () => {
//     setShowLoginModal(false);
//     navigate("/create-user");
//   };

//   return (
//     <>
//       <header className="sticky top-0 bg-white shadow-sm z-50 w-full">
//         {/* Desktop Navigation */}
//         <div className="hidden lg:block w-full">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between">
//               {/* Logo - Left side */}
//               <div className="flex-shrink-0">
//                 <Link to="/" className="flex items-center">
//                   <img
//                     src={logo}
//                     alt="The Pagoda Xecutive Logo"
//                     className="h-20 will-change-auto object-contain"
//                     style={{ maxWidth: 200, maxHeight: 200 }}
//                   />
//                 </Link>
//               </div>

//               {/* Right side - Navigation, Search, and User Section */}
//               <div className="flex items-center space-x-8">
//                 {/* Navigation Items - Home, My Account, Contact Us */}
//                 <div className="flex items-center space-x-6">
//                   {navItems.map((item, index) => {
//                     const Icon = item.icon;
//                     if (item.isButton) {
//                       return (
//                         <button
//                           key={index}
//                           onClick={item.onClick}
//                           className="flex items-center gap-2 text-md text-black hover:text-purple-600 transition-colors font-medium"
//                         >
//                           <Icon size={18} />
//                           {item.name}
//                         </button>
//                       );
//                     }
//                     return (
//                       <Link
//                         key={index}
//                         to={item.path}
//                         className="flex items-center gap-2 text-md text-black hover:text-purple-600 transition-colors font-medium"
//                       >
//                         <Icon size={18} />
//                         {item.name}
//                       </Link>
//                     );
//                   })}
//                 </div>

//                 {/* Search Button */}
//                 {/* <button
//                   onClick={() => setShowSearch(!showSearch)}
//                   className="text-gray-700 hover:text-purple-600 transition-colors"
//                 >
//                   <FaSearch size={18} />
//                 </button> */}

//                 {/* User Section - Sign In or User Menu */}
//                 {isAuthenticated ? (
//                   <div ref={userMenuRef} className="relative">
//                     <button
//                       onClick={toggleUserMenu}
//                       className="flex items-center space-x-2"
//                     >
//                       <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
//                         {getUserInitial()}
//                       </div>
//                     </button>

//                     {showUserMenu && (
//                       <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
//                         <div className="p-4 border-b border-gray-100 bg-purple-50">
//                           <div className="font-medium text-gray-800">
//                             {getUserName()}
//                           </div>
//                           <div className="text-sm text-gray-500 truncate">
//                             {getUserEmail()}
//                           </div>
//                         </div>
//                         <ul className="py-2">
//                           <li>
//                             <Link
//                               to="/viewreservation"
//                               className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50"
//                               onClick={() => setShowUserMenu(false)}
//                             >
//                               <FaCalendarAlt size={16} />
//                               My Reservations
//                             </Link>
//                           </li>
//                           <li>
//                             <Link
//                               to="/profile"
//                               className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50"
//                               onClick={() => setShowUserMenu(false)}
//                             >
//                               <FaUser size={16} />
//                               Profile
//                             </Link>
//                           </li>
//                           <li className="border-t border-gray-100">
//                             <button
//                               onClick={handleLogout}
//                               className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
//                             >
//                               <FaSignOutAlt size={16} />
//                               Logout
//                             </button>
//                           </li>
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="flex items-center gap-3">
//                     <button
//                       onClick={() => setShowLoginModal(true)}
//                       className="px-4 py-1.5 text-sm font-semibold text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
//                     >
//                       Sign In
//                     </button>
//                     <button
//                       onClick={handleSignupClick}
//                       className="px-4 py-1.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
//                     >
//                       Register
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Search Bar Dropdown */}
//           {showSearch && (
//             <div className="border-t border-gray-100 bg-white shadow-lg">
//               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//                 <div ref={searchRef} className="relative max-w-2xl mx-auto">
//                   <FaSearch
//                     className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                     size={18}
//                   />
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => handleSearch(e.target.value)}
//                     placeholder="Search for rooms, dining, events..."
//                     className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                     autoFocus
//                   />
//                   {searchQuery && (
//                     <button
//                       onClick={clearSearch}
//                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                     >
//                       <FaTimes size={18} />
//                     </button>
//                   )}
//                 </div>

//                 {searchResults.length > 0 && (
//                   <div className="max-w-2xl mx-auto mt-3 bg-white rounded-lg border border-gray-200 shadow-lg max-h-80 overflow-y-auto">
//                     {searchResults.map((result) => (
//                       <button
//                         key={result.id}
//                         onClick={() => handleResultClick(result)}
//                         className="block w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-purple-50"
//                       >
//                         <div className="font-medium text-gray-800">
//                           {result.title}
//                         </div>
//                         <div className="text-sm text-gray-500 mt-0.5">
//                           {result.category}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Mobile Navigation */}
//         <div className="lg:hidden">
//           <div className="px-4 py-3">
//             <div className="flex items-center justify-between">
//               <Link to="/" className="flex items-center">
//                 <img
//                   src={logo}
//                   alt="The Pagoda Xecutive Logo"
//                   className="h-12 w-auto object-contain"
//                 />
//               </Link>

//               <div className="flex items-center space-x-4">
//                 <button
//                   onClick={() => setShowSearch(!showSearch)}
//                   className="text-gray-700 hover:text-purple-700"
//                 >
//                   <FaSearch size={20} />
//                 </button>

//                 {isAuthenticated ? (
//                   <div className="relative">
//                     <button onClick={toggleUserMenu}>
//                       <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
//                         {getUserInitial()}
//                       </div>
//                     </button>

//                     {showUserMenu && (
//                       <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
//                         <div className="px-4 py-2 border-b border-gray-100">
//                           <div className="font-medium text-gray-800 text-sm">
//                             {getUserName()}
//                           </div>
//                           <div className="text-xs text-gray-500 truncate">
//                             {getUserEmail()}
//                           </div>
//                         </div>
//                         <Link
//                           to="/viewreservation"
//                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           <FaCalendarAlt size={14} />
//                           My Reservations
//                         </Link>
//                         <Link
//                           to="/profile"
//                           className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
//                           onClick={() => setShowUserMenu(false)}
//                         >
//                           <FaUser size={14} />
//                           Profile
//                         </Link>
//                         <button
//                           onClick={handleLogout}
//                           className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                         >
//                           <FaSignOutAlt size={14} />
//                           Logout
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <button
//                     onClick={() => setShowLoginModal(true)}
//                     className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-purple-600 border-2 border-purple-600 rounded-lg"
//                   >
//                     <FaUser size={14} />
//                     Sign In
//                   </button>
//                 )}

//                 <HiMenuAlt1
//                   onClick={toggleMenu}
//                   className="cursor-pointer text-gray-800"
//                   size={30}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Mobile Search Bar */}
//           {showSearch && (
//             <div className="px-4 py-3 border-t border-gray-100 bg-white">
//               <div className="relative">
//                 <FaSearch
//                   className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                   size={18}
//                 />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => handleSearch(e.target.value)}
//                   placeholder="Search..."
//                   className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 />
//                 {searchQuery && (
//                   <button
//                     onClick={clearSearch}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                   >
//                     <FaTimes size={18} />
//                   </button>
//                 )}
//               </div>

//               {searchResults.length > 0 && (
//                 <div className="mt-2 bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
//                   {searchResults.map((result) => (
//                     <button
//                       key={result.id}
//                       onClick={() => handleResultClick(result)}
//                       className="block w-full text-left px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-purple-50"
//                     >
//                       <div className="font-medium">{result.title}</div>
//                       <div className="text-xs text-gray-500">
//                         {result.category}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <ResponsiveMenu
//           showMenu={showMenu}
//           setShowMenu={setShowMenu}
//           onMyAccountClick={handleMobileMyAccountClick}
//         >
//           <div className="px-4 py-6 space-y-4">
//             {navItems.map((item, index) => {
//               const Icon = item.icon;
//               if (item.isButton) {
//                 return (
//                   <button
//                     key={index}
//                     onClick={(e) => {
//                       handleMobileMyAccountClick(e);
//                     }}
//                     className="flex items-center gap-3 w-full text-left text-lg font-medium text-gray-800 hover:text-purple-600 py-2 border-b border-gray-100"
//                   >
//                     <Icon size={22} />
//                     {item.name}
//                   </button>
//                 );
//               }
//               return (
//                 <Link
//                   key={index}
//                   to={item.path}
//                   onClick={() => setShowMenu(false)}
//                   className="flex items-center gap-3 text-lg font-medium text-gray-800 hover:text-purple-600 py-2 border-b border-gray-100"
//                 >
//                   <Icon size={22} />
//                   {item.name}
//                 </Link>
//               );
//             })}

//             {!isAuthenticated && (
//               <>
//                 <button
//                   onClick={() => {
//                     setShowLoginModal(true);
//                     setShowMenu(false);
//                   }}
//                   className="flex items-center gap-3 text-lg font-medium text-purple-600 hover:text-purple-700 py-2 border-b border-gray-100 w-full text-left"
//                 >
//                   <FaUser size={22} />
//                   Sign In
//                 </button>
//                 <button
//                   onClick={() => {
//                     handleSignupClick();
//                     setShowMenu(false);
//                   }}
//                   className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-center"
//                 >
//                   Register
//                 </button>
//               </>
//             )}
//           </div>
//         </ResponsiveMenu>
//       </header>

//       {/* Login Modal */}
//       {showLoginModal && (
//         <Login
//           closeModal={() => setShowLoginModal(false)}
//           onSuccess={handleLoginSuccess}
//           openSignup={handleSignupClick}
//         />
//       )}
//     </>
//   );
// };

// export default Navbar;
