import axios from 'axios';
import { currentUser } from './auth.service';
import { set } from 'lodash';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_BACKEND;

// Helper to get auth token from sessionStorage
const getAuthToken = () => {
  return sessionStorage.getItem('accessToken');
};

// Configure axios with authentication
const configureAxios = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    withCredentials: true
  };
};

export const userPreferencesService = {
  getPreferenceByKey: async (key: string) => {
    try {
      const userId = currentUser?._id;
      if (!userId) {
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
          window.location.href = '/auth/login';
          setTimeout(() => {
            toast.error('Please login to access your preferences');
          }, 1000);
          return;
        }
        // Try to get userId from sessionStorage if currentUser is not available
        const parsedUserData = JSON.parse(userData);
        if (!parsedUserData?._id) {
          window.location.href = '/auth/login';
          return;
        }
        const response = await axios.get(`${API_URL}/user-preferences/${parsedUserData._id}/${key}`, configureAxios());
        return response.data;
      }
      const response = await axios.get(`${API_URL}/user-preferences/${userId}/${key}`, configureAxios());
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      console.error(`Error getting preference for key '${key}':`, error);
      throw error;
    }
  },

  savePreferenceByKey: async (key: string, preferences: any) => {
    try {
      const userId = currentUser?._id;
      if (!userId) {
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
          window.location.href = '/auth/login';
          setTimeout(() => {
            toast.error('Please login to access your preferences');
          }, 1000);
          return;
        }
        // Try to get userId from sessionStorage if currentUser is not available
        const parsedUserData = JSON.parse(userData);
        if (!parsedUserData?._id) {
          window.location.href = '/auth/login';
          return;
        }
        const response = await axios.post(`${API_URL}/user-preferences/${parsedUserData._id}/${key}`, { preferences }, configureAxios());
        return response.data;
      }
      const response = await axios.post(`${API_URL}/user-preferences/${userId}/${key}`, { preferences }, configureAxios());
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/auth/login';
        return;
      }
      console.error(`Error saving preference for key '${key}':`, error);
      throw error;
    }
  }
}; 