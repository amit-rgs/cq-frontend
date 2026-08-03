import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const CQ_BASE_URL = import.meta.env.VITE_CQ_BASE_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);
  const [logoutTimeout, setLogoutTimeout] = useState(null);
  const navigate = useNavigate();

  // Helper function to get refresh token expiration
  const getRefreshTokenExpiry = useCallback(() => {
    const refreshToken = Cookies.get('refresh_token');
    if (!refreshToken) return null;

    try {
      const decoded = jwtDecode(refreshToken);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }, []);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      const accessToken = Cookies.get('access_token');
      const refreshToken = Cookies.get('refresh_token');

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      // Check if tokens are valid
      if (isTokenExpired(accessToken)) {
        // Access token expired, try to refresh
        await handleTokenRefresh();
      } else {
        // Tokens are valid, set user state
        const userData = decodeToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
        startTokenRefreshTimer(accessToken);
        scheduleLogout();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Decode JWT token
  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return {
        ...decoded,
        first_name: decoded.firstname || decoded.given_name || '',
        last_name: decoded.lastname || decoded.family_name || '',
        email: decoded.email || decoded.emailid || '',
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  };

  // Check if token is expired or about to expire
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      // Consider token expired if it expires within the next 2 minutes
      return decoded.exp * 1000 < Date.now() + 120000;
    } catch {
      return true;
    }
  };

  // Start token refresh timer
  const startTokenRefreshTimer = useCallback(
    (token) => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }

      try {
        const decoded = jwtDecode(token);
        const expiresIn = decoded.exp * 1000 - Date.now();
        const refreshTime = Math.max(expiresIn - 120000, 30000); // Refresh 2 min before expiry, minimum 30 sec

        const interval = setInterval(() => {
          handleTokenRefresh();
        }, refreshTime);

        setTokenRefreshInterval(interval);
      } catch (error) {
        console.error('Error setting token refresh timer:', error);
      }
    },
    [tokenRefreshInterval]
  );

  // Schedule logout when refresh token expires
  const scheduleLogout = useCallback(() => {
    if (logoutTimeout) {
      clearTimeout(logoutTimeout);
    }

    const refreshExpiry = getRefreshTokenExpiry();
    const now = Date.now();

    // If refresh token is already expired, logout immediately
    if (refreshExpiry && refreshExpiry <= now) {
      logout();
      return;
    }

    // Set timeout to check when refresh token will expire
    if (refreshExpiry) {
      const timeout = setTimeout(() => {
        logout();
      }, refreshExpiry - now);

      setLogoutTimeout(timeout);
    }
  }, [getRefreshTokenExpiry]);

  // Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      if (isTokenExpired(refreshToken)) {
        throw new Error('Refresh token expired');
      }

      const response = await fetch(`${CQ_BASE_URL}/bq/api/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Token refresh failed');
      }

      const { access_token, refresh_token: newRefreshToken } = await response.json();

      if (!access_token || !newRefreshToken) {
        throw new Error('Invalid token response');
      }

      // Decode tokens to get expiration
      const accessTokenDecoded = jwtDecode(access_token);
      const refreshTokenDecoded = jwtDecode(newRefreshToken);

      // Set cookies with proper expiration
      Cookies.set('access_token', access_token, {
        secure: true,
        sameSite: 'Strict',
        expires: new Date(accessTokenDecoded.exp * 1000),
        path: '/',
      });

      Cookies.set('refresh_token', newRefreshToken, {
        secure: true,
        sameSite: 'Strict',
        expires: new Date(refreshTokenDecoded.exp * 1000),
        path: '/',
      });

      // Update state
      const userData = decodeToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);

      // Reset timers
      startTokenRefreshTimer(access_token);
      scheduleLogout();

      return { access_token, refresh_token: newRefreshToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return null;
    }
  }, [startTokenRefreshTimer, scheduleLogout]);

  // Authenticated fetch wrapper
  const authFetch = useCallback(
    async (url, options = {}) => {
      let accessToken = Cookies.get('access_token');
      let response;

      try {
        // First attempt with current token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // If token expired, try to refresh
        if (response.status === 401) {
          const newTokens = await handleTokenRefresh();

          if (newTokens) {
            // Retry with new token
            response = await fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newTokens.access_token}`,
              },
            });
          } else {
            // Refresh failed - force logout
            await logout();
            throw new Error('Session expired');
          }
        }

        return response;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    [handleTokenRefresh]
  );

  // Login function
  const login = useCallback(
    async (tokenData) => {
      const { access_token, refresh_token } = tokenData;

      if (!access_token || !refresh_token) {
        throw new Error('Invalid token response');
      }

      const accessTokenDecoded = jwtDecode(access_token);
      const refreshTokenDecoded = jwtDecode(refresh_token);

      Cookies.set('access_token', access_token, {
        secure: true,
        sameSite: 'Strict',
        expires: new Date(accessTokenDecoded.exp * 1000),
        path: '/',
      });

      Cookies.set('refresh_token', refresh_token, {
        secure: true,
        sameSite: 'Strict',
        expires: new Date(refreshTokenDecoded.exp * 1000),
        path: '/',
      });

      const userData = decodeToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      startTokenRefreshTimer(access_token);
      scheduleLogout();

      // Add to token blacklist on backend
      try {
        await authFetch(`${CQ_BASE_URL}/bq/api/token-blacklist`, {
          method: 'POST',
          body: JSON.stringify({
            token: access_token,
            expires_at: new Date(accessTokenDecoded.exp * 1000).toISOString(),
          }),
        });
      } catch (error) {
        console.error('Failed to add token to blacklist:', error);
      }
    },
    [startTokenRefreshTimer, scheduleLogout, authFetch]
  );

  // Logout function
  const logout = useCallback(
    async (force = false) => {
      try {
        const token = Cookies.get('access_token');
        const refreshToken = Cookies.get('refresh_token');

        if (token) {
          await authFetch(`${CQ_BASE_URL}/bq/api/token-blacklist`, {
            method: 'POST',
            body: JSON.stringify({
              token: token,
              expires_at: new Date(Date.now() + 1000).toISOString(),
            }),
          });
        }

        // Clear all tokens
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          setTokenRefreshInterval(null);
        }

        if (logoutTimeout) {
          clearTimeout(logoutTimeout);
          setLogoutTimeout(null);
        }

        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
      }
    },
    [authFetch, navigate, tokenRefreshInterval, logoutTimeout]
  );

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      if (logoutTimeout) {
        clearTimeout(logoutTimeout);
      }
    };
  }, [initializeAuth]);

  // Check token validity periodically
  useEffect(() => {
    const checkTokenValidity = () => {
      const refreshExpiry = getRefreshTokenExpiry();
      const now = Date.now();

      if (refreshExpiry && refreshExpiry <= now) {
        logout();
      }
    };

    const interval = setInterval(checkTokenValidity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [logout, getRefreshTokenExpiry]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        authFetch,
        handleTokenRefresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
// } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import Cookies from "js-cookie";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);
//   const navigate = useNavigate();

//   // Initialize auth state
//   const initializeAuth = useCallback(async () => {
//     try {
//       const accessToken = Cookies.get("access_token");
//       const refreshToken = Cookies.get("refresh_token");

//       if (!accessToken || !refreshToken) {
//         setIsLoading(false);
//         return;
//       }

//       // Check if tokens are valid
//       if (isTokenExpired(accessToken)) {
//         // Access token expired, try to refresh
//         await handleTokenRefresh();
//       } else {
//         // Tokens are valid, set user state
//         const userData = decodeToken(accessToken);
//         setUser(userData);
//         setIsAuthenticated(true);
//         startTokenRefreshTimer(accessToken);
//       }
//     } catch (error) {
//       console.error("Auth initialization error:", error);
//       await logout();
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // Decode JWT token
//   const decodeToken = (token) => {
//     try {
//       const decoded = jwtDecode(token);
//       return {
//         ...decoded,
//         first_name: decoded.firstname || decoded.given_name || "",
//         last_name: decoded.lastname || decoded.family_name || "",
//         email: decoded.email || decoded.emailid || "",
//       };
//     } catch (error) {
//       console.error("Token decode error:", error);
//       return null;
//     }
//   };

//   // Check if token is expired or about to expire
//   const isTokenExpired = (token) => {
//     if (!token) return true;
//     try {
//       const decoded = jwtDecode(token);
//       // Consider token expired if it expires within the next 2 minutes
//       return decoded.exp * 1000 < Date.now() + 120000;
//     } catch {
//       return true;
//     }
//   };

//   // Start token refresh timer
//   const startTokenRefreshTimer = useCallback(
//     (token) => {
//       if (tokenRefreshInterval) {
//         clearInterval(tokenRefreshInterval);
//       }

//       try {
//         const decoded = jwtDecode(token);
//         const expiresIn = decoded.exp * 1000 - Date.now();
//         const refreshTime = Math.max(expiresIn - 120000, 30000); // Refresh 2 min before expiry, minimum 30 sec

//         const interval = setInterval(() => {
//           handleTokenRefresh();
//         }, refreshTime);

//         setTokenRefreshInterval(interval);
//       } catch (error) {
//         console.error("Error setting token refresh timer:", error);
//       }
//     },
//     [tokenRefreshInterval]
//   );

//   // Handle token refresh
//   const handleTokenRefresh = useCallback(async () => {
//     try {
//       const refreshToken = Cookies.get("refresh_token");
//       if (!refreshToken) {
//         throw new Error("No refresh token available");
//       }

//       if (isTokenExpired(refreshToken)) {
//         throw new Error("Refresh token expired");
//       }

//       const response = await fetch(
//         `${process.env.REACT_APP_BQ_BASE_URL}/bq/api/refresh`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ refresh_token: refreshToken }),
//         }
//       );

//       if (!response.ok) {
//         const error = await response.json().catch(() => ({}));
//         throw new Error(error.message || "Token refresh failed");
//       }

//       const { access_token, refresh_token: newRefreshToken } =
//         await response.json();

//       if (!access_token || !newRefreshToken) {
//         throw new Error("Invalid token response");
//       }

//       // Decode tokens to get expiration
//       const accessTokenDecoded = jwtDecode(access_token);
//       const refreshTokenDecoded = jwtDecode(newRefreshToken);

//       // Set cookies with proper expiration
//       Cookies.set("access_token", access_token, {
//         secure: true,
//         sameSite: "Strict",
//         expires: new Date(accessTokenDecoded.exp * 1000),
//         path: "/",
//       });

//       Cookies.set("refresh_token", newRefreshToken, {
//         secure: true,
//         sameSite: "Strict",
//         expires: new Date(refreshTokenDecoded.exp * 1000),
//         path: "/",
//       });

//       // Update state
//       const userData = decodeToken(access_token);
//       setUser(userData);
//       setIsAuthenticated(true);

//       // Reset refresh timer
//       startTokenRefreshTimer(access_token);

//       return { access_token, refresh_token: newRefreshToken };
//     } catch (error) {
//       console.error("Token refresh failed:", error);
//       await logout();
//       return null;
//     }
//   }, []);

//   // Authenticated fetch wrapper
//   const authFetch = useCallback(
//     async (url, options = {}) => {
//       let accessToken = Cookies.get("access_token");
//       let response;

//       try {
//         // First attempt with current token
//         response = await fetch(url, {
//           ...options,
//           headers: {
//             ...options.headers,
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${accessToken}`,
//           },
//         });

//         // If token expired, try to refresh
//         if (response.status === 401) {
//           const newTokens = await handleTokenRefresh();

//           if (newTokens) {
//             // Retry with new token
//             response = await fetch(url, {
//               ...options,
//               headers: {
//                 ...options.headers,
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${newTokens.access_token}`,
//               },
//             });
//           } else {
//             // Refresh failed - force logout
//             await logout();
//             throw new Error("Session expired");
//           }
//         }

//         return response;
//       } catch (error) {
//         console.error("API request failed:", error);
//         throw error;
//       }
//     },
//     [handleTokenRefresh]
//   );

//   // Login function
//   const login = useCallback(
//     async (tokenData) => {
//       const { access_token, refresh_token } = tokenData;

//       if (!access_token || !refresh_token) {
//         throw new Error("Invalid token response");
//       }

//       const accessTokenDecoded = jwtDecode(access_token);
//       const refreshTokenDecoded = jwtDecode(refresh_token);

//       Cookies.set("access_token", access_token, {
//         secure: true,
//         sameSite: "Strict",
//         expires: new Date(accessTokenDecoded.exp * 1000),
//         path: "/",
//       });

//       Cookies.set("refresh_token", refresh_token, {
//         secure: true,
//         sameSite: "Strict",
//         expires: new Date(refreshTokenDecoded.exp * 1000),
//         path: "/",
//       });

//       const userData = decodeToken(access_token);
//       setUser(userData);
//       setIsAuthenticated(true);
//       startTokenRefreshTimer(access_token);
//     },
//     [startTokenRefreshTimer]
//   );

//   // Logout function
//   const logout = useCallback(async () => {
//     try {
//       const token = Cookies.get("access_token");
//       if (token) {
//         await authFetch(`${process.env.REACT_APP_BQ_BASE_URL}/bq/api/logout`, {
//           method: "POST",
//         });
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       Cookies.remove("access_token");
//       Cookies.remove("refresh_token");

//       if (tokenRefreshInterval) {
//         clearInterval(tokenRefreshInterval);
//         setTokenRefreshInterval(null);
//       }

//       setUser(null);
//       setIsAuthenticated(false);
//       navigate("/login");
//     }
//   }, [authFetch, navigate, tokenRefreshInterval]);

//   // Initialize auth on mount
//   useEffect(() => {
//     initializeAuth();

//     // Cleanup interval on unmount
//     return () => {
//       if (tokenRefreshInterval) {
//         clearInterval(tokenRefreshInterval);
//       }
//     };
//   }, [initializeAuth]);

//   // Silent refresh check
//   useEffect(() => {
//     const silentRefreshCheck = setInterval(async () => {
//       const accessToken = Cookies.get("access_token");
//       if (accessToken && isTokenExpired(accessToken)) {
//         try {
//           await handleTokenRefresh();
//         } catch (error) {
//           console.error("Silent refresh failed:", error);
//         }
//       }
//     }, 30000); // Check every 30 seconds

//     return () => clearInterval(silentRefreshCheck);
//   }, [handleTokenRefresh]);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isAuthenticated,
//         isLoading,
//         login,
//         logout,
//         authFetch,
//         handleTokenRefresh,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };
