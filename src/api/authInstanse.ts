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

const pendingRequests = new Map();

const getRequestKey = (config: any) => 
  `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`;

axiosInstance.interceptors.request.use(
  async (config) => {
    const requestKey = getRequestKey(config);

    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
      return Promise.reject({ 
        __DUPLICATE__: true, 
        response: pendingRequest 
      });
    }

    const requestPromise = axios(config);
    pendingRequests.set(requestKey, requestPromise);
    
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config);
    pendingRequests.delete(requestKey);
    return response;
  },
  (error) => {
    if (error.__DUPLICATE__) {
      return error.response;
    }

    const requestKey = error.config && getRequestKey(error.config);
    if (requestKey) {
      pendingRequests.delete(requestKey);
    }

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
