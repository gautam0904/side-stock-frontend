import axiosInstance from './authInstanse';
import { AxiosResponse } from 'axios';

interface GetCustomersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

class ChallanService {
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

  getAllChallan(params: GetCustomersParams = {}, signal?: AbortSignal) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    const requestKey = this.createRequestKey('/challan/get', params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/challan/get', {
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
        console.error('Get challan error:', error);
        throw error;
      })
    );
  }

  addChallan(purchaseData: any) {
    const requestKey = this.createRequestKey('/challan/create', purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/challan/create', purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Add challan error:', error);
          throw error;
        })
    );
  }

  updateChallan(id: string, purchaseData: any) {
    const requestKey = this.createRequestKey(`/challan/update/${id}`, purchaseData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/challan/update/${id}`, purchaseData)
        .then(response => response.data)
        .catch(error => {
          console.error('Update challan error:', error);
          throw error;
        })
    );
  }

  deleteChallan(id: string) {
    const requestKey = this.createRequestKey(`/challan/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/challan/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          console.error('Delete challan error:', error);
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const challanService = new ChallanService();