import axios from 'axios';
import { toast } from 'react-hot-toast';
import { environment } from '../environments/enviroment.prod';
// import { useNavigation } from '../contexts/navigation.context';

const axiosInstance = axios.create({
  baseURL: environment.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = sessionStorage.getItem('accessToken');

    if (accessToken) {
      const token = `Bearer ${accessToken}`;
      console.log('Request token:', token);
      config.headers['Authorization'] = token;
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    toast.error('An error occurred while sending the request');
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('Response error:', error);
    console.log('Response error status code :', error.response?.status);
    
    if (error.response.status == 401) {
      window.location.href = '/auth/login';  
    } 
    if (error.__DUPLICATE__) return error.response;
    if (error.code === 'ERR_NETWORK') {
      toast.error('Unable to connect to server. Please check your connection.');
    } else if (error.response) {
      console.log('Error response:', error.response);
      console.log('error ========>', error);
      
      toast.error(error.response?.data.message || error.response.message || 'An error occurred');
    }else  {
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;