import axiosInstance from './authInstanse';
import { IProducts, IGetParams } from 'src/interfaces/common.interface';

class ProductService {
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

  getAllProducts(params: IGetParams = {}, signal?: AbortSignal) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = params;

    const requestKey = this.createRequestKey('/product/get', params);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.get('/product/get', {
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
        throw error;
      })
    );
  }

  addProduct(productData: any) {
    const requestKey = this.createRequestKey('/product/create', productData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.post('/product/create', productData)
        .then(response => response.data)
        .catch(error => {
          throw error;
        })
    );
  }

  updateProduct(id: string, productData: any) {
    const requestKey = this.createRequestKey(`/product/update/${id}`, productData);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.put(`/product/update/${id}`, productData)
        .then(response => response.data)
        .catch(error => {
          throw error;
        })
    );
  }

  deleteProduct(id: string) {
    const requestKey = this.createRequestKey(`/product/delete/${id}`);

    return this.debounceRequest(requestKey, () =>
      axiosInstance.delete(`/product/delete/${id}`)
        .then(response => response.data)
        .catch(error => {
          throw error;
        })
    );
  }

  clearPendingRequests() {
    this.pendingRequests.clear();
  }
}

export const productService = new ProductService();