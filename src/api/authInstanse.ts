import axios from 'axios';
import { toast } from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      toast.error('Unable to connect to server. Please check your connection.');
    } else if (error.response) {
      toast.error(error.response.data?.message || 'An error occurred');
    } else {
      toast.error('An unexpected error occurred');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
