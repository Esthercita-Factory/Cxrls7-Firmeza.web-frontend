import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Customer,
  CustomerInput,
  Dashboard,
  ImportResult,
  Product,
  ProductInput,
  Sale,
  SaleInput,
} from '../models/api.models';
import { SupportRequest, SupportRequestActionResponse } from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getDashboard() {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  getProducts(search = '') {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Product[]>('/api/products', { params });
  }

  saveProduct(input: ProductInput, id?: number) {
    return id
      ? this.http.put<Product>(`/api/products/${id}`, input)
      : this.http.post<Product>('/api/products', input);
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`/api/products/${id}`);
  }

  getCustomers(search = '') {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Customer[]>('/api/customers', { params });
  }

  saveCustomer(input: CustomerInput, id?: number) {
    return id
      ? this.http.put<Customer>(`/api/customers/${id}`, input)
      : this.http.post<Customer>('/api/customers', input);
  }

  deleteCustomer(id: number) {
    return this.http.delete<void>(`/api/customers/${id}`);
  }

  getSales() {
    return this.http.get<Sale[]>('/api/sales');
  }

  createSale(input: SaleInput) {
    return this.http.post<Sale>('/api/sales', input);
  }

  getSupportRequests() {
    return this.http.get<SupportRequest[]>('/api/support-requests');
  }

  updateSupportRequestStatus(id: number, status: string) {
    return this.http.put<SupportRequestActionResponse>(`/api/support-requests/${id}/status`, { status });
  }

  replyToSupportRequest(id: number, message: string) {
    return this.http.post<SupportRequestActionResponse>(`/api/support-requests/${id}/messages`, { message });
  }

  getImportTemplate() {
    return this.http.get('/api/reports/import/template', { responseType: 'blob' });
  }

  importFile(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ImportResult>('/api/reports/import', body);
  }
}
