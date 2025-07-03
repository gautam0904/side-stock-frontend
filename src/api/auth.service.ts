import axiosInstance from './authInstanse';

export let currentUser: {
  createdAt: string;
  _id: string;
  name: string;
  type: string;
  updatedAt: string;
} | null = null;

// Initialize currentUser from sessionStorage on module load
const initializeUser = () => {
  const userData = sessionStorage.getItem('userData');
  if (userData) {
    try {
      currentUser = JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      sessionStorage.removeItem('userData');
      sessionStorage.removeItem('accessToken');
    }
  }
};

// Call initialization
initializeUser();

export const login = (username: string, password: string) => {
  return axiosInstance.post('/user/login', { name: username, password })
    .then((response) => {
      currentUser = response.data.data.user;
      sessionStorage.setItem('userData', JSON.stringify(response.data.data.user));
      sessionStorage.setItem('accessToken', response.data.data.token);
      return response.data;
    })
    .catch((error) => {
      throw error;
    });
};

export const signup = async (username: string, password: string, type: string) => {
  try {
    const response = await axiosInstance.post('/user/signup', {
      name: username,
      password,
      type
    });
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const logout = () => {
  currentUser = null;
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('accessToken');
  sessionStorage.clear();
  window.location.href = '/auth/login';
  return Promise.resolve();
};
