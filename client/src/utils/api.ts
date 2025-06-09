// API configuration utility
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    REGISTER: '/api/register',
    CHECK_AUTH: '/api/check-auth',
  },
  LAPTOPS: {
    SEARCH: '/api/advancedsearch',
    SUGGESTIONS: '/api/suggestions',
    RANDOM: '/api/random',
    POPULAR: '/api/popular',
    DEALS: '/api/deals',
    RECOMMENDATIONS: (userId: string) => `/api/recommendations/${userId}`,
  },
  USER: {
    FAVORITES: '/api/favorites',
    HISTORY: '/api/history',
    USER_HISTORY: (userId: string) => `/api/history/${userId}`,
    LAPTOP_HISTORY: (userId: string, laptopId: string) => `/api/history/${userId}/${laptopId}`,
    USER_FAVORITES: (userId: string) => `/api/favorites/${userId}`,
  },
} as const;
