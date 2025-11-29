
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log(API_BASE_URL);
// Auth token management
export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
export const removeRefreshToken = () => localStorage.removeItem('refresh_token');

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to refresh the access token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  
  if (!response.ok) {
    removeAuthToken();
    removeRefreshToken();
    throw new Error('Failed to refresh token');
  }
  
  const data = await response.json();
  setAuthToken(data.access);
  
  // If a new refresh token is provided (token rotation), update it
  if (data.refresh) {
    setRefreshToken(data.refresh);
  }
  
  return data.access;
};

// API request helper with JWT token and automatic refresh
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Always try to parse body (may be JSON or plain text)
  let data: any;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Try to refresh the token
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${token}`,
            };
            return fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers: newHeaders,
            }).then(res => res.json());
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        isRefreshing = false;

        // Retry the original request with new token
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: newHeaders,
        });

        if (retryResponse.ok) {
          return await retryResponse.json();
        } else {
          throw new Error('Request failed after token refresh');
        }
      } catch (error) {
        processQueue(error, null);
        isRefreshing = false;
        removeAuthToken();
        removeRefreshToken();
        window.location.href = '/login';
        throw error;
      }
    }
    // ✅ throw structured error object
    throw {
      status: response.status,
      data,
    };
  }

  return data;
};


// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData: { email: string; password: string; username: string; room_number: string }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    
  getProfile: () => apiRequest('/auth/profile'),
};

// Services API calls
export const servicesAPI = {
  getAll: () => apiRequest('/services'),
  
  book: (bookingData: {
    service_id: string;
    date: string;
    time_slot: string;
    special_instructions?: string;
  }) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),
  getUnavailableSlots: (serviceId: string, date: string) =>
    apiRequest(`/bookings/availability?service_id=${serviceId}&date=${date}`)
};

// Bookings API calls
export const bookingsAPI = {
  getMyBookings: () => apiRequest('/bookings/my'),
  
  cancel: (bookingId: string) => apiRequest(`/bookings/${bookingId}/cancel`, {
    method: 'PUT',
  }),
  
  reschedule: (bookingId: string, newDateTime: { date: string; time_slot: string }) =>
    apiRequest(`/bookings/${bookingId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(newDateTime),
    }),
  
  rate: (bookingId: string, rating: { rating: number; comment?: string }) =>
    apiRequest(`/bookings/${bookingId}/rate`, {
      method: 'POST',
      body: JSON.stringify(rating),
    }),

  // Service provider specific endpoints
  getAssignedBookings: () => apiRequest('/bookings/assigned'),
  
  updateBookingStatus: (bookingId: string, status: string) =>
    apiRequest(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Admin API calls
export const adminAPI = {
  getAllBookings: () => apiRequest('/admin/bookings'),
  getAllUsers: () => apiRequest('/admin/users'),
  getServiceProviders: () => apiRequest('/admin/service-providers'),
  
  updateBookingStatus: (bookingId: number, status: string) =>
    apiRequest(`/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  
  deleteUser: (userId: number) =>
    apiRequest(`/admin/users/${userId}/delete`, {
      method: 'DELETE',
    }),
  
  createServiceProvider: (providerData: {
    username: string;
    email: string;
    phone: string;
    services: string[];
    specialization: string;
  }) => apiRequest('/admin/service-providers/create', {
    method: 'POST',
    body: JSON.stringify(providerData),
  }),
  
  updateServiceProvider: (providerId: string, providerData: any) =>
    apiRequest(`/admin/service-providers/${providerId}`, {
      method: 'PUT',
      body: JSON.stringify(providerData),
    }),
  
  deleteServiceProvider: (providerId: string) =>
    apiRequest(`/admin/service-providers/${providerId}/delete/`, {
      method: 'DELETE',
    }),
};

// Service Provider API calls
export const serviceProviderAPI = {
  getProfile: () => apiRequest('/service-provider/profile'),
  
  getAssignedBookings: () => apiRequest('/service-provider/bookings'),
  
  updateBookingStatus: (bookingId: string, status: string) =>
    apiRequest(`/service-provider/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

// Notifications API calls  
export const notificationsAPI = {
  getUserNotifications: () => apiRequest('/notifications'),
  
  markAsRead: (notificationId: string) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    }),
  
  markAllAsRead: () =>
    apiRequest('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};

// Stats API calls
export const statsAPI = {
  getDashboard: () => apiRequest('/stats/dashboard'),
  getServiceProviderStats: () => apiRequest('/stats/service-provider'),
};
