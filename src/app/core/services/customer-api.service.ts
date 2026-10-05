import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CheckoutResponse,
  CustomerProfile,
  CustomerCatalog,
  CustomerSale,
} from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);

  getCatalog() {
    return this.http.get<CustomerCatalog>('/api/client/catalog');
  }

  getProfile() {
    return this.http.get<CustomerProfile>('/api/client/profile');
  }

  getMySales() {
    return this.http.get<CustomerSale[]>('/api/client/sales');
  }

  checkout(items: { productId: number; quantity: number }[]) {
    return this.http.post<CheckoutResponse>('/api/client/sales', { items });
  }

  downloadReceipt(saleId: number) {
    return this.http.get(`/api/client/sales/${saleId}/receipt`, {
      responseType: 'blob',
    });
  }
}
