import axios from 'axios';
import {storage} from '../utils/storage';

export const API_BASE_URL = 'https://hydrationlink.onrender.com'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token from storage.
// If the caller already set an explicit Authorization header (e.g. during
// claimRole before the token is persisted), the interceptor leaves it alone.
apiClient.interceptors.request.use(
  async (config) => {
    if (config.headers?.Authorization) {
      return config;
    }

    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;