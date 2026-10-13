import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CheckoutResponse,
  CustomerEmailChangeResponse,
  CustomerEmailIdentityVerifiedResponse,
  CustomerProfile,
  CustomerProfileUpdate,
  CustomerCatalog,
  CustomerSale,
  CreateSupportRequestResponse,
  SupportRequest,
  SupportRequestActionResponse,
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

  updateProfile(profile: CustomerProfileUpdate) {
    return this.http.put<CustomerProfile>('/api/client/profile', profile);
  }

  requestEmailChange() {
    return this.http.post<{ message: string; emailSent: boolean }>(
      '/api/client/profile/email-change/request',
      {},
    );
  }

  confirmEmailChange(code: string) {
    return this.http.post<CustomerEmailIdentityVerifiedResponse>(
      '/api/client/profile/email-change/confirm',
      { code },
    );
  }

  changeEmail(email: string) {
    return this.http.put<CustomerEmailChangeResponse>(
      '/api/client/profile/email',
      { email },
    );
  }

  getMySales() {
    return this.http.get<CustomerSale[]>('/api/client/sales');
  }

  getSupportRequests() {
    return this.http.get<SupportRequest[]>('/api/client/support-requests');
  }

  createSupportRequest(request: { saleId: number | null; subject: string; message: string }) {
    return this.http.post<CreateSupportRequestResponse>('/api/client/support-requests', request);
  }

  replyToSupportRequest(id: number, message: string) {
    return this.http.post<SupportRequestActionResponse>(`/api/client/support-requests/${id}/messages`, { message });
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
