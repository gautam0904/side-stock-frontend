import axiosInstance from './authInstanse';
import { AxiosResponse } from 'axios';

interface GetCustomersParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class PurchaseService {
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

  getAllPurchases(params: GetCustomersParams = {}, signal?: AbortSignal) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    const requestKey = this.createRequestKey('/purchase/get', params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/purchase/get', {
        params: {
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

  addPurchase(purchaseData: any) {
    const requestKey = this.createRequestKey('/purchase/create', purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/purchase/create', purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Add purchase error:', error);
          throw error;
        })
    );
  }

  updatePurchase(id: string, purchaseData: any) {
    const requestKey = this.createRequestKey(`/purchase/update/${id}`, purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/purchase/update/${id}`, purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Update purchase error:', error);
          throw error;
        })
    );
  }

  deletePurchase(id: string) {
    const requestKey = this.createRequestKey(`/purchase/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/purchase/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Delete purchase error:', error);
          throw error;
        })
    );
  }

  getCustomerById(id: string) {
    const requestKey = this.createRequestKey(`/customer/get/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get(`/customer/get/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Get purchase by ID error:', error);
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const purchaseService = new PurchaseService();