import axiosInstance from './authInstanse';
import { AxiosResponse } from 'axios';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class SaleService {
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

  getAllSales(params: GetCustomersParams = {}, signal?: AbortSignal) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    const requestKey = this.createRequestKey('/sale/get', params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/sale/get', {
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
        console.error('Get sale error:', error);
        throw error;
      })
    );
  }

  addSales(purchaseData: any) {
    const requestKey = this.createRequestKey('/sale/create', purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/sale/create', purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Add sale error:', error);
          throw error;
        })
    );
  }

  updateSales(id: string, purchaseData: any) {
    const requestKey = this.createRequestKey(`/sale/update/${id}`, purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/sale/update/${id}`, purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Update sale error:', error);
          throw error;
        })
    );
  }

  deleteSales(id: string) {
    const requestKey = this.createRequestKey(`/sale/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/sale/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Delete sale error:', error);
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const saleService = new SaleService();