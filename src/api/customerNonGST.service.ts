import axiosInstance from './authInstanse';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class CustomerNonGSTService {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private lastRequestTime: number = 0;
  private readonly DEBOUNCE_TIME = 1000;

  private createRequestKey(endpoint: string, params?: any): string {
    return `${endpoint}-${JSON.stringify(params || {})}`;
  }

  private debounceRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (now - this.lastRequestTime < this.DEBOUNCE_TIME) {
      const existingRequest = this.pendingRequests.get(key);
      if (existingRequest) {
        return existingRequest;
      }
    }

    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
      this.lastRequestTime = Date.now();
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  getAllCustomerNonGST(params: GetCustomersParams = {}, signal?: AbortSignal) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    const requestKey = this.createRequestKey('/purchase/get', params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/customerNonGST/get', {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
          search
        },
        signal
      })
      .then(response => response.data)
      .catch(error => {
        if (error.name === 'AbortError') {
          // Handle aborted request
          return;
        }
        console.error('Get purchase error:', error);
        throw error;
      })
    );
  }

  addCustomerNonGST(purchaseData: any) {
    const requestKey = this.createRequestKey('/customerNonGST/create', purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/customerNonGST/create', purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Add customerNonGST error:', error);
          throw error;
        })
    );
  }

  updateCustomerNonGST(id: string, purchaseData: any) {
    const requestKey = this.createRequestKey(`/customerNonGST/update/${id}`, purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/customerNonGST/update/${id}`, purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Update customerNonGST error:', error);
          throw error;
        })
    );
  }

  deleteCustomerNonGST(id: string) {
    const requestKey = this.createRequestKey(`/customerNonGST/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/customerNonGST/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Delete customerNonGST error:', error);
          throw error;
        })
    );
  }

  getCustomerNonGSTById(id: string) {
    const requestKey = this.createRequestKey(`/customerNonGST/get/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get(`/customerNonGST/get/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Get customerNonGST by ID error:', error);
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const customerNonGSTService = new CustomerNonGSTService();