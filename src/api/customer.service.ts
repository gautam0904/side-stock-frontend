import axiosInstance from './authInstanse';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class CustomerService {
  getAllCustomers(params: GetCustomersParams = {}, signal?: AbortSignal) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    return axiosInstance.get('/customer/get', {
      params: {
        page,
        limit,
        sortBy,
        sortOrder,
        search
      }
    })
    .then(response => response.data)
    .catch(error => {
      console.error('Get customers error:', error);
      throw error;
    });
  }

  addCustomer(customerData: any) {
    return axiosInstance.post('/customer/create', customerData , {
      headers: {
        'Content-Type': 'multipart/form-data',
    },
    })
      .then(response => response.data)
      .catch(error => {
        console.error('Add customer error:', error);
        throw error;
      });
  }

  updateCustomer(id: string, customerData: any) {
    return axiosInstance.put(`/customer/update/${id}`, customerData)
      .then(response => response.data)
      .catch(error => {
        console.error('Update customer error:', error);
        throw error;
      });
  }

  deleteCustomer(id: string) {
    return axiosInstance.delete(`/customer/delete/${id}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Delete customer error:', error);
        throw error;
      });
  }

  getCustomerById(id: string) {
    return axiosInstance.get(`/customer/get/${id}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Get customer by ID error:', error);
        throw error;
      });
  }

  getCustomerByName(id: string) {
    return axiosInstance.get(`/customer/getByName/${id}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Get customer by ID error:', error);
        throw error;
      });
  }
}

export const customerService = new CustomerService();