// src/pages/CookieConsentProvider.js

import React, { createContext, useContext, useEffect, useState } from 'react';

// Create context
const CookieConsentContext = createContext();

// Custom hook to use cookie consent
export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};

// API base URL from environment variables
const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL || 'http://localhost:8000';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${CQ_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API call failed: ${response.statusText}`);
  }

  return response.json();
};

// Provider component
export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Fetch existing consent on mount
  useEffect(() => {
    fetchConsent();
  }, []);

  const fetchConsent = async () => {
    try {
      // STEP 1: Check localStorage first (fastest, survives cookie clearing)
      const storedConsent = localStorage.getItem('cookie_consent_data');
      const storedTimestamp = localStorage.getItem('cookie_consent_timestamp');

      if (storedConsent && storedTimestamp) {
        const parsedConsent = JSON.parse(storedConsent);
        const consentDate = new Date(storedTimestamp);
        const now = new Date();
        const daysSinceConsent = (now - consentDate) / (1000 * 60 * 60 * 24);

        // Check if consent is still valid (365 days)
        if (daysSinceConsent < 365 && parsedConsent.has_consent) {
          console.log('Using cached consent from localStorage');
          setConsent(parsedConsent);
          setShowBanner(false);
          setLoading(false);

          // Apply cookie preferences from cached consent
          if (parsedConsent.preferences) {
            applyCookiePreferences(parsedConsent.preferences);
          }
          return;
        } else if (daysSinceConsent >= 365) {
          // Consent expired, clear localStorage
          console.log('Consent expired, clearing localStorage');
          localStorage.removeItem('cookie_consent_data');
          localStorage.removeItem('cookie_consent_timestamp');
        }
      }

      // STEP 2: If no valid localStorage, check backend
      console.log('Fetching consent from backend...');
      const response = await apiCall('/bq/api/cookie-consent/', {
        method: 'GET',
      });

      if (response.has_consent) {
        const consentData = {
          has_consent: true,
          preferences: response.preferences,
          consent_id: response.consent_id,
          consent_timestamp: response.consent_timestamp || new Date().toISOString(),
          consent_version: response.consent_version,
          consent_type: response.consent_type,
        };

        setConsent(consentData);
        setShowBanner(false);

        // Backup to localStorage
        localStorage.setItem('cookie_consent_data', JSON.stringify(consentData));
        localStorage.setItem('cookie_consent_timestamp', consentData.consent_timestamp);

        // Apply cookie preferences
        applyCookiePreferences(response.preferences);
      } else {
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Failed to fetch consent:', error);

      // Fallback: Check localStorage even if backend fails
      const fallbackConsent = localStorage.getItem('cookie_consent_data');
      if (fallbackConsent) {
        const parsed = JSON.parse(fallbackConsent);
        setConsent(parsed);
        setShowBanner(false);
        applyCookiePreferences(parsed.preferences);
      } else {
        setShowBanner(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConsent = async (consentData) => {
    try {
      // Save to backend
      const response = await apiCall('/bq/api/cookie-consent/', {
        method: 'POST',
        body: JSON.stringify(consentData),
      });

      // Prepare consent object for storage
      const consentObject = {
        has_consent: true,
        preferences: {
          necessary: true,
          functional: consentData.functional || false,
          analytics: consentData.analytics || false,
          marketing: consentData.marketing || false,
          preferences: consentData.preferences || false,
        },
        consent_id: response.consent_id,
        consent_timestamp: response.timestamp || new Date().toISOString(),
        consent_version: consentData.consent_version || 1,
        consent_type: consentData.consent_type || 'banner',
      };

      // Save to localStorage (survives cookie clearing)
      localStorage.setItem('cookie_consent_data', JSON.stringify(consentObject));
      localStorage.setItem('cookie_consent_timestamp', consentObject.consent_timestamp);

      // Update state
      setConsent(consentObject);
      setShowBanner(false);

      // Apply cookie preferences
      applyCookiePreferences(consentObject.preferences);

      console.log('Consent saved successfully to both backend and localStorage');
      return response;
    } catch (error) {
      console.error('Failed to save consent to backend:', error);

      // Fallback: Save to localStorage only if backend fails
      console.log('Saving consent to localStorage only (offline mode)');
      const offlineConsent = {
        has_consent: true,
        preferences: {
          necessary: true,
          functional: consentData.functional || false,
          analytics: consentData.analytics || false,
          marketing: consentData.marketing || false,
          preferences: consentData.preferences || false,
        },
        consent_id: `offline_${Date.now()}`,
        consent_timestamp: new Date().toISOString(),
        consent_version: consentData.consent_version || 1,
        consent_type: consentData.consent_type || 'banner',
        is_offline: true,
      };

      localStorage.setItem('cookie_consent_data', JSON.stringify(offlineConsent));
      localStorage.setItem('cookie_consent_timestamp', offlineConsent.consent_timestamp);

      setConsent(offlineConsent);
      setShowBanner(false);
      applyCookiePreferences(offlineConsent.preferences);

      throw error;
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      // Try to update backend first
      const response = await apiCall('/bq/api/cookie-consent/preferences', {
        method: 'PATCH',
        body: JSON.stringify(preferences),
      });

      // Update localStorage
      const storedConsent = localStorage.getItem('cookie_consent_data');
      if (storedConsent) {
        const updatedConsent = JSON.parse(storedConsent);
        updatedConsent.preferences = {
          ...updatedConsent.preferences,
          ...preferences,
        };
        updatedConsent.consent_timestamp = new Date().toISOString();

        localStorage.setItem('cookie_consent_data', JSON.stringify(updatedConsent));
        localStorage.setItem('cookie_consent_timestamp', updatedConsent.consent_timestamp);

        setConsent(updatedConsent);
      }

      applyCookiePreferences(preferences);

      return response;
    } catch (error) {
      console.error('Failed to update preferences on backend:', error);

      // Fallback: Update localStorage only
      const storedConsent = localStorage.getItem('cookie_consent_data');
      if (storedConsent) {
        const updatedConsent = JSON.parse(storedConsent);
        updatedConsent.preferences = {
          ...updatedConsent.preferences,
          ...preferences,
        };
        updatedConsent.consent_timestamp = new Date().toISOString();
        updatedConsent.is_offline = true;

        localStorage.setItem('cookie_consent_data', JSON.stringify(updatedConsent));
        localStorage.setItem('cookie_consent_timestamp', updatedConsent.consent_timestamp);

        setConsent(updatedConsent);
        applyCookiePreferences(preferences);
      }

      throw error;
    }
  };

  const withdrawConsent = async () => {
    try {
      // Try to withdraw from backend
      await apiCall('/bq/api/cookie-consent/', {
        method: 'DELETE',
      });

      // Clear from localStorage
      localStorage.removeItem('cookie_consent_data');
      localStorage.removeItem('cookie_consent_timestamp');

      setConsent(null);
      setShowBanner(true);

      // Disable all non-necessary cookies
      disableNonNecessaryCookies();

      console.log('Consent withdrawn successfully');
      return true;
    } catch (error) {
      console.error('Failed to withdraw consent from backend:', error);

      // Fallback: Clear localStorage only
      localStorage.removeItem('cookie_consent_data');
      localStorage.removeItem('cookie_consent_timestamp');

      setConsent(null);
      setShowBanner(true);
      disableNonNecessaryCookies();

      throw error;
    }
  };

  const checkConsentStatus = async () => {
    try {
      // First check localStorage
      const storedConsent = localStorage.getItem('cookie_consent_data');
      if (storedConsent) {
        const parsed = JSON.parse(storedConsent);
        if (parsed.has_consent) {
          return true;
        }
      }

      // Then check backend
      const response = await apiCall('/bq/api/cookie-consent/check', {
        method: 'GET',
      });
      return response.has_consent;
    } catch (error) {
      console.error('Failed to check consent status:', error);

      // Fallback to localStorage
      const storedConsent = localStorage.getItem('cookie_consent_data');
      return storedConsent ? JSON.parse(storedConsent).has_consent : false;
    }
  };

  const getConsentHistory = async (limit = 10) => {
    try {
      const response = await apiCall(`/bq/api/cookie-consent/history?limit=${limit}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      console.error('Failed to get consent history:', error);
      return { has_history: false, consents: [] };
    }
  };

  const applyCookiePreferences = (prefs) => {
    // Enable/disable Google Analytics
    if (prefs.analytics) {
      loadGoogleAnalytics();
    } else {
      removeGoogleAnalytics();
    }

    // Enable/disable Facebook Pixel
    if (prefs.marketing) {
      loadFacebookPixel();
    } else {
      removeFacebookPixel();
    }

    // Enable/disable other marketing scripts
    if (prefs.functional) {
      loadFunctionalScripts();
    } else {
      removeFunctionalScripts();
    }

    // Store preferences in localStorage for client-side use
    localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
  };

  const loadGoogleAnalytics = () => {
    // Check if GA is already loaded
    if (document.querySelector('#google-analytics-script')) {
      return;
    }

    // Your Google Analytics ID - replace with your actual ID
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

    // Only load if GA ID is provided
    if (!GA_MEASUREMENT_ID) {
      console.warn('Google Analytics ID not provided. Skipping GA load.');
      return;
    }

    // Load Google Analytics
    const script = document.createElement('script');
    script.id = 'google-analytics-script';
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);

    console.log('Google Analytics loaded');
  };

  const removeGoogleAnalytics = () => {
    // Remove GA script
    const script = document.querySelector('#google-analytics-script');
    if (script) {
      script.remove();
    }

    // Remove GA cookies
    document.cookie.split(';').forEach((cookie) => {
      const trimmedCookie = cookie.trim();
      if (
        trimmedCookie.startsWith('_ga') ||
        trimmedCookie.startsWith('_gid') ||
        trimmedCookie.startsWith('_gat')
      ) {
        const cookieName = trimmedCookie.split('=')[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    });

    // Clean up gtag
    delete window.gtag;

    console.log('Google Analytics removed');
  };

  const loadFacebookPixel = () => {
    // Check if FB Pixel is already loaded
    if (document.querySelector('#facebook-pixel-script')) {
      return;
    }

    // Your Facebook Pixel ID - replace with your actual ID
    const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

    // Only load if FB Pixel ID is provided
    if (!FB_PIXEL_ID) {
      console.warn('Facebook Pixel ID not provided. Skipping FB Pixel load.');
      return;
    }

    // Load Facebook Pixel
    const script = document.createElement('script');
    script.id = 'facebook-pixel-script';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    console.log('Facebook Pixel loaded');
  };

  const removeFacebookPixel = () => {
    // Remove FB Pixel script
    const script = document.querySelector('#facebook-pixel-script');
    if (script) {
      script.remove();
    }

    // Remove FB Pixel cookies
    document.cookie.split(';').forEach((cookie) => {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('_fbp') || trimmedCookie.startsWith('fbc')) {
        const cookieName = trimmedCookie.split('=')[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    // Clean up fbq
    delete window.fbq;

    console.log('Facebook Pixel removed');
  };

  const loadFunctionalScripts = () => {
    // Load functional scripts like chat widgets, etc.
    const ENABLE_CHAT_WIDGET = import.meta.env.VITE_ENABLE_CHAT_WIDGET === 'true';

    if (ENABLE_CHAT_WIDGET && !document.querySelector('#chat-widget-script')) {
      const CHAT_WIDGET_ID = import.meta.env.VITE_CHAT_WIDGET_ID;
      if (CHAT_WIDGET_ID) {
        const script = document.createElement('script');
        script.id = 'chat-widget-script';
        script.src = `https://your-chat-widget.com/${CHAT_WIDGET_ID}.js`;
        script.async = true;
        document.head.appendChild(script);
        console.log('Chat widget loaded');
      }
    }
  };

  const removeFunctionalScripts = () => {
    // Remove functional scripts
    const script = document.querySelector('#chat-widget-script');
    if (script) {
      script.remove();
    }
    console.log('Functional scripts removed');
  };

  const disableNonNecessaryCookies = () => {
    // Remove all non-necessary cookies
    const cookies = document.cookie.split(';');
    const necessaryCookies = ['session_id', 'userConsent']; // Keep these

    for (let cookie of cookies) {
      const trimmedCookie = cookie.trim();
      const cookieName = trimmedCookie.split('=')[0];

      if (!necessaryCookies.includes(cookieName)) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      }
    }

    // Remove tracking scripts
    removeGoogleAnalytics();
    removeFacebookPixel();
    removeFunctionalScripts();

    // Clear from localStorage
    localStorage.removeItem('cookiePreferences');

    console.log('Non-necessary cookies disabled');
  };

  // Function to sync localStorage with backend (useful after coming back online)
  const syncConsentWithBackend = async () => {
    const storedConsent = localStorage.getItem('cookie_consent_data');
    if (!storedConsent) return;

    const parsedConsent = JSON.parse(storedConsent);
    if (parsedConsent.is_offline) {
      try {
        // Try to sync offline consent to backend
        await apiCall('/bq/api/cookie-consent/', {
          method: 'POST',
          body: JSON.stringify({
            consent_given: true,
            functional: parsedConsent.preferences.functional,
            analytics: parsedConsent.preferences.analytics,
            marketing: parsedConsent.preferences.marketing,
            preferences: parsedConsent.preferences.preferences,
            consent_version: parsedConsent.consent_version,
            consent_type: parsedConsent.consent_type,
          }),
        });

        // Update localStorage to mark as synced
        parsedConsent.is_offline = false;
        localStorage.setItem('cookie_consent_data', JSON.stringify(parsedConsent));
        console.log('Offline consent synced with backend');
      } catch (error) {
        console.error('Failed to sync offline consent:', error);
      }
    }
  };

  const value = {
    consent,
    loading,
    showBanner,
    saveConsent,
    updatePreferences,
    withdrawConsent,
    setShowBanner,
    checkConsentStatus,
    getConsentHistory,
    syncConsentWithBackend, // Expose sync function
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};

// // src/pages/CookieConsentProvider.js
// import React, { createContext, useContext, useEffect, useState } from 'react';

// // Create context
// const CookieConsentContext = createContext();

// // Custom hook to use cookie consent
// export const useCookieConsent = () => {
//   const context = useContext(CookieConsentContext);
//   if (!context) {
//     throw new Error('useCookieConsent must be used within CookieConsentProvider');
//   }
//   return context;
// };

// // API base URL from environment variables
// const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL || 'http://localhost:8000';

// // Helper function for API calls
// const apiCall = async (endpoint, options = {}) => {
//   const url = `${CQ_BASE_URL}${endpoint}`;
//   const defaultOptions = {
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     credentials: 'include', // Important for cookies
//   };

//   const mergedOptions = {
//     ...defaultOptions,
//     ...options,
//     headers: {
//       ...defaultOptions.headers,
//       ...options.headers,
//     },
//   };

//   const response = await fetch(url, mergedOptions);

//   if (!response.ok) {
//     const error = await response.json().catch(() => ({}));
//     throw new Error(error.detail || `API call failed: ${response.statusText}`);
//   }

//   return response.json();
// };

// // Provider component
// export const CookieConsentProvider = ({ children }) => {
//   const [consent, setConsent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showBanner, setShowBanner] = useState(false);

//   // Fetch existing consent on mount
//   useEffect(() => {
//     fetchConsent();
//   }, []);

//   const fetchConsent = async () => {
//     try {
//       const response = await apiCall('/bq/api/cookie-consent/', {
//         method: 'GET',
//       });

//       if (response.has_consent) {
//         setConsent(response);
//         setShowBanner(false);
//       } else {
//         setShowBanner(true);
//       }
//     } catch (error) {
//       console.error('Failed to fetch consent:', error);
//       setShowBanner(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const saveConsent = async (consentData) => {
//     try {
//       const response = await apiCall('/bq/api/cookie-consent/', {
//         method: 'POST',
//         body: JSON.stringify(consentData),
//       });

//       setConsent({
//         has_consent: true,
//         preferences: response.preferences,
//         consent_id: response.consent_id,
//         consent_timestamp: response.timestamp,
//       });
//       setShowBanner(false);

//       // Apply cookie preferences (enable/disable tracking scripts)
//       applyCookiePreferences(consentData);

//       return response;
//     } catch (error) {
//       console.error('Failed to save consent:', error);
//       throw error;
//     }
//   };

//   const updatePreferences = async (preferences) => {
//     try {
//       const response = await apiCall('/bq/api/cookie-consent/preferences', {
//         method: 'PATCH',
//         body: JSON.stringify(preferences),
//       });

//       setConsent(prev => ({
//         ...prev,
//         preferences: response.preferences,
//       }));

//       applyCookiePreferences(response.preferences);

//       return response;
//     } catch (error) {
//       console.error('Failed to update preferences:', error);
//       throw error;
//     }
//   };

//   const withdrawConsent = async () => {
//     try {
//       await apiCall('/bq/api/cookie-consent/', {
//         method: 'DELETE',
//       });

//       setConsent(null);
//       setShowBanner(true);

//       // Disable all non-necessary cookies
//       disableNonNecessaryCookies();

//       return true;
//     } catch (error) {
//       console.error('Failed to withdraw consent:', error);
//       throw error;
//     }
//   };

//   const checkConsentStatus = async () => {
//     try {
//       const response = await apiCall('/bq/api/cookie-consent/check', {
//         method: 'GET',
//       });
//       return response.has_consent;
//     } catch (error) {
//       console.error('Failed to check consent status:', error);
//       return false;
//     }
//   };

//   const getConsentHistory = async (limit = 10) => {
//     try {
//       const response = await apiCall(`/bq/api/cookie-consent/history?limit=${limit}`, {
//         method: 'GET',
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to get consent history:', error);
//       return { has_history: false, consents: [] };
//     }
//   };

//   const applyCookiePreferences = (prefs) => {
//     // Enable/disable Google Analytics
//     if (prefs.analytics) {
//       loadGoogleAnalytics();
//     } else {
//       removeGoogleAnalytics();
//     }

//     // Enable/disable Facebook Pixel
//     if (prefs.marketing) {
//       loadFacebookPixel();
//     } else {
//       removeFacebookPixel();
//     }

//     // Enable/disable other marketing scripts
//     if (prefs.functional) {
//       loadFunctionalScripts();
//     } else {
//       removeFunctionalScripts();
//     }

//     // Store preferences in localStorage for client-side use
//     localStorage.setItem('cookiePreferences', JSON.stringify(prefs));
//   };

//   const loadGoogleAnalytics = () => {
//     // Check if GA is already loaded
//     if (document.querySelector('#google-analytics-script')) {
//       return;
//     }

//     // Your Google Analytics ID - replace with your actual ID
//     const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

//     // Only load if GA ID is provided
//     if (!GA_MEASUREMENT_ID) {
//       console.warn('Google Analytics ID not provided. Skipping GA load.');
//       return;
//     }

//     // Load Google Analytics
//     const script = document.createElement('script');
//     script.id = 'google-analytics-script';
//     script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
//     script.async = true;
//     document.head.appendChild(script);

//     // Initialize gtag
//     window.dataLayer = window.dataLayer || [];
//     window.gtag = function() {
//       window.dataLayer.push(arguments);
//     };
//     window.gtag('js', new Date());
//     window.gtag('config', GA_MEASUREMENT_ID);

//     console.log('Google Analytics loaded');
//   };

//   const removeGoogleAnalytics = () => {
//     // Remove GA script
//     const script = document.querySelector('#google-analytics-script');
//     if (script) {
//       script.remove();
//     }

//     // Remove GA cookies
//     document.cookie.split(";").forEach(cookie => {
//       const trimmedCookie = cookie.trim();
//       if (trimmedCookie.startsWith('_ga') || trimmedCookie.startsWith('_gid') || trimmedCookie.startsWith('_gat')) {
//         const cookieName = trimmedCookie.split('=')[0];
//         document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
//         document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
//       }
//     });

//     // Clean up gtag
//     delete window.gtag;

//     console.log('Google Analytics removed');
//   };

//   const loadFacebookPixel = () => {
//     // Check if FB Pixel is already loaded
//     if (document.querySelector('#facebook-pixel-script')) {
//       return;
//     }

//     // Your Facebook Pixel ID - replace with your actual ID
//     const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

//     // Only load if FB Pixel ID is provided
//     if (!FB_PIXEL_ID) {
//       console.warn('Facebook Pixel ID not provided. Skipping FB Pixel load.');
//       return;
//     }

//     // Load Facebook Pixel
//     const script = document.createElement('script');
//     script.id = 'facebook-pixel-script';
//     script.innerHTML = `
//       !function(f,b,e,v,n,t,s)
//       {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
//       n.callMethod.apply(n,arguments):n.queue.push(arguments)};
//       if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
//       n.queue=[];t=b.createElement(e);t.async=!0;
//       t.src=v;s=b.getElementsByTagName(e)[0];
//       s.parentNode.insertBefore(t,s)}(window, document,'script',
//       'https://connect.facebook.net/en_US/fbevents.js');
//       fbq('init', '${FB_PIXEL_ID}');
//       fbq('track', 'PageView');
//     `;
//     document.head.appendChild(script);

//     console.log('Facebook Pixel loaded');
//   };

//   const removeFacebookPixel = () => {
//     // Remove FB Pixel script
//     const script = document.querySelector('#facebook-pixel-script');
//     if (script) {
//       script.remove();
//     }

//     // Remove FB Pixel cookies
//     document.cookie.split(";").forEach(cookie => {
//       const trimmedCookie = cookie.trim();
//       if (trimmedCookie.startsWith('_fbp') || trimmedCookie.startsWith('fbc')) {
//         const cookieName = trimmedCookie.split('=')[0];
//         document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
//       }
//     });

//     // Clean up fbq
//     delete window.fbq;

//     console.log('Facebook Pixel removed');
//   };

//   const loadFunctionalScripts = () => {
//     // Load functional scripts like chat widgets, etc.
//     // Check if chat widget should be loaded
//     const ENABLE_CHAT_WIDGET = import.meta.env.VITE_ENABLE_CHAT_WIDGET === 'true';

//     if (ENABLE_CHAT_WIDGET && !document.querySelector('#chat-widget-script')) {
//       // Example: Load Intercom or other chat widget
//       const CHAT_WIDGET_ID = import.meta.env.VITE_CHAT_WIDGET_ID;
//       if (CHAT_WIDGET_ID) {
//         const script = document.createElement('script');
//         script.id = 'chat-widget-script';
//         script.src = `https://your-chat-widget.com/${CHAT_WIDGET_ID}.js`;
//         script.async = true;
//         document.head.appendChild(script);
//         console.log('Chat widget loaded');
//       }
//     }
//   };

//   const removeFunctionalScripts = () => {
//     // Remove functional scripts
//     const script = document.querySelector('#chat-widget-script');
//     if (script) {
//       script.remove();
//     }
//     console.log('Functional scripts removed');
//   };

//   const disableNonNecessaryCookies = () => {
//     // Remove all non-necessary cookies
//     const cookies = document.cookie.split(";");
//     const necessaryCookies = ['session_id', 'userConsent']; // Keep these

//     for (let cookie of cookies) {
//       const trimmedCookie = cookie.trim();
//       const cookieName = trimmedCookie.split('=')[0];

//       if (!necessaryCookies.includes(cookieName)) {
//         document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
//         document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
//       }
//     }

//     // Remove tracking scripts
//     removeGoogleAnalytics();
//     removeFacebookPixel();
//     removeFunctionalScripts();

//     console.log('Non-necessary cookies disabled');
//   };

//   const value = {
//     consent,
//     loading,
//     showBanner,
//     saveConsent,
//     updatePreferences,
//     withdrawConsent,
//     setShowBanner,
//     checkConsentStatus,
//     getConsentHistory,
//   };

//   return (
//     <CookieConsentContext.Provider value={value}>
//       {children}
//     </CookieConsentContext.Provider>
//   );
// };
