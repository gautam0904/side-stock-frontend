import axiosInstance from './authInstanse';
import { AxiosResponse } from 'axios';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class BillService {
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

  getAllBill(params: any = {}, signal?: AbortSignal) {
    const requestKey = this.createRequestKey('/bill/get', params);
console.log(params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/bill/get', {
        params,
        signal
      })
      .then(response => response.data)
      .catch(error => {
        if (error.name === 'AbortError') {
          // Handle aborted request
          return;
        }
        console.error('Get bill error:', error);
        throw error;
      })
    );
  }

  addBill(purchaseData: any) {
    const requestKey = this.createRequestKey('/bill/create', purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/bill/create', purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Add bill error:', error);
          throw error;
        })
    );
  }

  updateBill(id: string, purchaseData: any) {
    const requestKey = this.createRequestKey(`/bill/update/${id}`, purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/bill/update/${id}`, purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Update bill error:', error);
          throw error;
        })
    );
  }

  deleteBill(id: string) {
    const requestKey = this.createRequestKey(`/bill/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/sale/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Delete bill error:', error);
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const billService = new BillService();