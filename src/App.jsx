// App.js - Updated with CookieConsentProvider

import React, { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './Walk-In/redux/store';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CookieConsent from 'react-cookie-consent';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tours from './pages/Tours';
import Gallery from './pages/Gallery';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import AddOnPage from './pages/AddOnPage';
import RoomSelection from './pages/RoomSelection';
import PaymentPage from './pages/PaymentPage';
import AmenitiesPage from './pages/AmeniteisPage';
import Login from './pages/Login';
import ReservationSuccessful from './pages/ReservationSuccessful';
import MytripsLogin from './pages/MytripsLogin';
import Bookingdata from './pages/Bookingdata';
import Bookingsummary from './pages/bookingsummary';
import SingleBookingView from './pages/SingleBookingView';
import { AuthProvider, useAuth } from './pages/AuthProvider';
import { CookieConsentProvider, useCookieConsent } from './pages/CookieConsentProvider';
import EnhanceCheckinStay from './Walk-In/EnhanceCheckinStay';
import BookingSummary from './Walk-In/BookingSummary';
import SearchPage from './Walk-In/SearchPage';
import Completedprocess from './Walk-In/CompletedProcess';
import EditRoomDetails from './profileguest/EditRoomDetails';
import EnhanceStayModify from './profileguest/EnhanceStayModify';
import ReservationSteps from './profileguest/ReservationSummary';
import Viewreservation from './profileguest/Viewreservations';
import ModificationSuccessful from './profileguest/ModificationSuccesful';
import ReservationCash from './Walk-In/ReservationCash';
import CreateUser from './pages/CreateUser';
import Profile from './pages/Profile';
import AccountBookingPayments from './pages/AccountBookingPayment';
import PagodaXecutive from './pages/PagodaXecutive';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import CancellationPolicyFooter from './pages/CancellationPolicyFooter';
import Restaurant from './pages/Restaurant';
import AllMenuItems from './pages/AllMenuItems';
import Experience from './pages/Experience';
import CreateUserLater from './pages/CreateUserLater';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    const from = window.location.pathname + window.location.search;
    localStorage.setItem('redirectPath', from);
    toast.info('Please login to continue with your booking');
    return <Navigate to="/Login" replace />;
  }

  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// Cookie Consent Banner Component
const CookieConsentBanner = () => {
  const { saveConsent, showBanner, setShowBanner, loading } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: false,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!showBanner || loading) return null;

  const handleAcceptAll = async () => {
    await saveConsent({
      consent_given: true,
      functional: true,
      analytics: true,
      marketing: true,
      preferences: true,
      consent_version: 1,
      consent_type: 'banner',
    });
  };

  const handleAcceptNecessary = async () => {
    await saveConsent({
      consent_given: true,
      functional: false,
      analytics: false,
      marketing: false,
      preferences: false,
      consent_version: 1,
      consent_type: 'banner',
    });
  };

  const handleSavePreferences = async () => {
    await saveConsent({
      consent_given: true,
      ...preferences,
      consent_version: 1,
      consent_type: 'modal',
    });
    setShowSettings(false);
  };

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm flex-1">
              <p>
                We use cookies and other tracking technologies to enhance your experience,
                personalize content and advertisements, and to improve site functionality.
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-yellow-400 ml-2 hover:underline"
                >
                  Customize
                </button>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition"
              >
                Necessary Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded transition"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Cookie Preferences</h2>
            <p className="text-sm text-gray-600 mb-4">
              Customize your cookie preferences. Necessary cookies are always enabled.
            </p>

            <div className="space-y-3">
              {/* Necessary (always on) */}
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-semibold">Necessary Cookies</div>
                  <div className="text-sm text-gray-500">Required for basic site functionality</div>
                </div>
                <div className="text-green-600 text-sm">Always On</div>
              </div>

              {/* Functional */}
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-semibold">Functional Cookies</div>
                  <div className="text-sm text-gray-500">Enhanced features and personalization</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences({ ...preferences, functional: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Analytics */}
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-semibold">Analytics Cookies</div>
                  <div className="text-sm text-gray-500">Help us improve our site</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Marketing */}
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-semibold">Marketing Cookies</div>
                  <div className="text-sm text-gray-500">Personalized ads and content</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main Layout wrapper with ToastContainer and Cookie Consent Banner
const MainLayout = () => {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Layout />
      <CookieConsentBanner />
    </>
  );
};

// Create the router with routes
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Provider store={store}>
        <AuthProvider>
          <CookieConsentProvider>
            <Outlet />
          </CookieConsentProvider>
        </AuthProvider>
      </Provider>
    ),
    children: [
      {
        element: <MainLayout />,
        children: [
          // Public routes - anyone can access
          { index: true, element: <Home /> },
          { path: 'tours', element: <Tours /> },
          { path: 'gallery', element: <Gallery /> },
          { path: 'about', element: <AboutUs /> },
          { path: 'restaurant', element: <Restaurant /> },
          { path: 'contact', element: <Contact /> },
          { path: 'create-user', element: <CreateUser /> },
          { path: 'create-user-later', element: <CreateUserLater /> },
          { path: '/privacy', element: <PrivacyPolicy /> },
          { path: '/terms', element: <TermsConditions /> },
          { path: '/cancellation', element: <CancellationPolicyFooter /> },
          { path: '/all-menu-items', element: <AllMenuItems /> },
          { path: '/experience', element: <Experience /> },

          // Login route - redirects to home if already logged in
          {
            path: 'Login',
            element: (
              <PublicRoute>
                <Login />
              </PublicRoute>
            ),
          },

          // Room browsing and selection - PUBLIC
          { path: 'select-room', element: <RoomSelection /> },
          { path: 'amenities', element: <AmenitiesPage /> },
          { path: 'addons', element: <AddOnPage /> },
          { path: 'search-page', element: <SearchPage /> },
          { path: 'enhance-checkin-stay', element: <EnhanceCheckinStay /> },
          { path: 'payment-succesful', element: <Completedprocess /> },
          { path: 'walk-in/booking-summary', element: <BookingSummary /> },
          { path: '/hotel/pagoda-xecutive', element: <PagodaXecutive /> },
          { path: 'reservation-succesful', element: <ReservationCash /> },

          // Payment and checkout - REQUIRES LOGIN
          {
            path: 'payment',
            element: (
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'payment-success',
            element: (
              <ProtectedRoute>
                <ReservationSuccessful />
              </ProtectedRoute>
            ),
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: 'bookings/:bookingId',
            element: (
              <ProtectedRoute>
                <AccountBookingPayments />
              </ProtectedRoute>
            ),
          },
          {
            path: 'booking-data',
            element: (
              <ProtectedRoute>
                <Bookingdata />
              </ProtectedRoute>
            ),
          },
          {
            path: 'booking-summary',
            element: (
              <ProtectedRoute>
                <Bookingsummary />
              </ProtectedRoute>
            ),
          },
          {
            path: 'mytrips',
            element: (
              <ProtectedRoute>
                <MytripsLogin />
              </ProtectedRoute>
            ),
          },
          {
            path: 'booking/:bookingId',
            element: (
              <ProtectedRoute>
                <SingleBookingView />
              </ProtectedRoute>
            ),
          },
          {
            path: 'viewreservation',
            element: (
              <ProtectedRoute>
                <Viewreservation />
              </ProtectedRoute>
            ),
          },
          {
            path: 'edit-reservation/update-roomdetails',
            element: (
              <ProtectedRoute>
                <EditRoomDetails />
              </ProtectedRoute>
            ),
          },
          {
            path: 'edit-reservation/update-enhancements',
            element: (
              <ProtectedRoute>
                <EnhanceStayModify />
              </ProtectedRoute>
            ),
          },
          {
            path: 'edit-reservation/update-reservation-summary',
            element: (
              <ProtectedRoute>
                <ReservationSteps />
              </ProtectedRoute>
            ),
          },
          {
            path: 'modification-succesful',
            element: (
              <ProtectedRoute>
                <ModificationSuccessful />
              </ProtectedRoute>
            ),
          },
          // {
          //   path: "reservation-succesful",
          //   element: (
          //     <ProtectedRoute>
          //       <ReservationCash />
          //     </ProtectedRoute>
          //   )
          // },

          // Catch all - redirect to home
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

// Main App Component
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

// // App.js - Fixed version with proper route protection and cookie consent
// import React, { useEffect, useState } from "react";
// import { createBrowserRouter, RouterProvider, useNavigate, Navigate, Outlet } from "react-router-dom";
// import { Provider } from "react-redux";
// import store from "./Walk-In/redux/store";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import CookieConsent from "react-cookie-consent";
// import Layout from "./components/Layout";
// import Home from "./pages/Home";
// import Tours from "./pages/Tours";
// import Gallery from "./pages/Gallery";
// import AboutUs from "./pages/AboutUs";
// import Contact from "./pages/Contact";
// import AddOnPage from "./pages/AddOnPage";
// import RoomSelection from "./pages/RoomSelection";
// import PaymentPage from "./pages/PaymentPage";
// import AmenitiesPage from "./pages/AmeniteisPage";
// import Login from "./pages/Login";
// import ReservationSuccessful from "./pages/ReservationSuccessful";
// import MytripsLogin from "./pages/MytripsLogin";
// import Bookingdata from "./pages/Bookingdata";
// import Bookingsummary from "./pages/bookingsummary";
// import SingleBookingView from "./pages/SingleBookingView";
// import { AuthProvider, useAuth } from "./pages/AuthProvider";
// import EnhanceCheckinStay from './Walk-In/EnhanceCheckinStay';
// import BookingSummary from "./Walk-In/BookingSummary";
// import SearchPage from "./Walk-In/SearchPage";
// import Completedprocess from "./Walk-In/CompletedProcess";
// import EditRoomDetails from "./profileguest/EditRoomDetails";
// import EnhanceStayModify from "./profileguest/EnhanceStayModify";
// import ReservationSteps from "./profileguest/ReservationSummary";
// import Viewreservation from "./profileguest/Viewreservations";
// import ModificationSuccessful from "./profileguest/ModificationSuccesful";
// import ReservationCash from "./Walk-In/ReservationCash";
// import CreateUser from "./pages/CreateUser";
// import Profile from "./pages/Profile";
// import AccountBookingPayments from "./pages/AccountBookingPayment";
// import PagodaXecutive from "./pages/PagodaXecutive";

// // Loading spinner component
// const LoadingSpinner = () => (
//   <div className="flex justify-center items-center h-screen">
//     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//   </div>
// );

// // Protected Route Component - For routes that REQUIRE authentication
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <LoadingSpinner />;
//   }

//   if (!isAuthenticated) {
//     const from = window.location.pathname + window.location.search;
//     localStorage.setItem("redirectPath", from);
//     toast.info("Please login to continue with your booking");
//     return <Navigate to="/Login" replace />;
//   }

//   return children;
// };

// // Public Route Component - For routes that should NOT be accessible when logged in (like login page)
// const PublicRoute = ({ children }) => {
//   const { isAuthenticated, isLoading } = useAuth();

//   if (isLoading) {
//     return <LoadingSpinner />;
//   }

//   return isAuthenticated ? <Navigate to="/" replace /> : children;
// };

// // Main Layout wrapper with ToastContainer and Cookie Consent
// const MainLayout = () => {
//   return (
//     <>
//       <ToastContainer
//         position="top-center"
//         autoClose={5000}
//         hideProgressBar
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="colored"
//       />
//       <Layout />

//       {/* Cookie Consent Banner - Shows on every page */}
//       <CookieConsent
//         location="bottom"
//         buttonText="Continue"
//         cookieName="userConsent"
//         style={{
//           background: "#1e2a3e",
//           justifyContent: "center",
//           gap: "10px",
//           fontFamily: "system-ui",
//           padding: "6px 84px",
//           zIndex: 9999,

//         }}
//         buttonStyle={{
//           background: "#fdb81e",
//           color: "#000",
//           fontWeight: "bold",
//           padding: "8px 24px",
//           borderRadius: "4px",
//           border: "none",
//           cursor: "pointer"
//         }}
//         expires={365}
//         onAccept={() => {
//           console.log("Cookies accepted by user");
//           // You can load analytics or tracking scripts here
//         }}
//       >
//         We use cookies and other tracking technologies to enhance your experience,
//         personalize content and advertisements, and to improve site functionality.
//         By clicking "Continue", you are consenting to our use of cookies and trackers.
//         <a href="/privacy" style={{ color: "Backgro", marginLeft: "10px" }}>
//           Privacy Statement
//         </a>
//       </CookieConsent>
//     </>
//   );
// };

// // Create the router with routes - FIXED PROTECTION LEVELS
// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: (
//       <Provider store={store}>
//         <AuthProvider>
//           <Outlet />
//         </AuthProvider>
//       </Provider>
//     ),
//     children: [
//       {
//         element: <MainLayout />,
//         children: [
//           // Public routes - anyone can access
//           { index: true, element: <Home /> },
//           { path: "tours", element: <Tours /> },
//           { path: "gallery", element: <Gallery /> },
//           { path: "about", element: <AboutUs /> },
//           { path: "contact", element: <Contact /> },
//           { path: "create-user", element: <CreateUser /> },

//           // Login route - redirects to home if already logged in
//           {
//             path: "Login",
//             element: (
//               <PublicRoute>
//                 <Login />
//               </PublicRoute>
//             )
//           },

//           // Room browsing and selection - PUBLIC (no login required)
//           {
//             path: "select-room",
//             element: <RoomSelection />
//           },

//           // Amenities viewing - PUBLIC (no login required)
//           {
//             path: "amenities",
//             element: <AmenitiesPage />
//           },

//           // Add-ons viewing - PUBLIC initially, but can be accessed without login
//           {
//             path: "addons",
//             element: <AddOnPage />
//           },
//           {
//             path: "search-page",
//             element: <SearchPage />
//           },
//           {
//             path: "enhance-checkin-stay",
//             element: <EnhanceCheckinStay />
//           },
//           {
//             path: "payment-succesful",
//             element: <Completedprocess />
//           },
//           {
//             path: "walk-in/booking-summary",
//             element: <BookingSummary />
//           },
//           {
//             path: "/hotel/pagoda-xecutive",
//             element: <PagodaXecutive />
//           },

//           // Payment and checkout - REQUIRES LOGIN
//           {
//             path: "payment",
//             element: (
//               <ProtectedRoute>
//                 <PaymentPage />
//               </ProtectedRoute>
//             )
//           },

//           // Payment success - REQUIRES LOGIN
//           {
//             path: "payment-success",
//             element: (
//               <ProtectedRoute>
//                 <ReservationSuccessful />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "profile",
//             element: (
//               <ProtectedRoute>
//                 <Profile />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "bookings/:bookingId",
//             element: (
//               <ProtectedRoute>
//                 <AccountBookingPayments />
//               </ProtectedRoute>
//             )
//           },

//           // Booking management - REQUIRES LOGIN
//           {
//             path: "booking-data",
//             element: (
//               <ProtectedRoute>
//                 <Bookingdata />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "booking-summary",
//             element: (
//               <ProtectedRoute>
//                 <Bookingsummary />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "mytrips",
//             element: (
//               <ProtectedRoute>
//                 <MytripsLogin />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "booking/:bookingId",
//             element: (
//               <ProtectedRoute>
//                 <SingleBookingView />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "viewreservation",
//             element: (
//               <ProtectedRoute>
//                 <Viewreservation />
//               </ProtectedRoute>
//             )
//           },

//           // Edit/Modify reservations - REQUIRES LOGIN
//           {
//             path: "edit-reservation/update-roomdetails",
//             element: (
//               <ProtectedRoute>
//                 <EditRoomDetails />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "edit-reservation/update-enhancements",
//             element: (
//               <ProtectedRoute>
//                 <EnhanceStayModify />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "edit-reservation/update-reservation-summary",
//             element: (
//               <ProtectedRoute>
//                 <ReservationSteps />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "modification-succesful",
//             element: (
//               <ProtectedRoute>
//                 <ModificationSuccessful />
//               </ProtectedRoute>
//             )
//           },
//           {
//             path: "reservation-succesful",
//             element: (
//               <ProtectedRoute>
//                 <ReservationCash />
//               </ProtectedRoute>
//             )
//           },

//           // Catch all - redirect to home
//           { path: "*", element: <Navigate to="/" replace /> },
//         ],
//       },
//     ],
//   },
// ]);

// // Main App Component
// const App = () => {
//   return <RouterProvider router={router} />;
// };

// export default App;
