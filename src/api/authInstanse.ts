import axios from 'axios';
import { toast } from 'react-hot-toast';
import { environment } from '../environments/enviroment.prod';

const axiosInstance = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});


axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.__DUPLICATE__) return error.response;
    if (error.code === 'ERR_NETWORK') {
      toast.error('Unable to connect to server. Please check your connection.');
    } else if (error.response) {
      toast.error(error.response.message || 'An error occurred');
    } else {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;