import axiosInstance from './authInstanse';

export const login = (username: string, password: string) => {
  return axiosInstance.post('/user/login', { name: username, password })
    .then((response) => response.data)
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
    // Log the full error object for debugging
    console.error('Signup error:', error);
    throw error;
  }
};
