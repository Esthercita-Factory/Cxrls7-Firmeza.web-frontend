import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportRequest } from '../../core/models/customer.models';
import { ApiService } from '../../core/services/api.service';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-support-requests',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './support-requests.component.html',
  styleUrl: './support-requests.component.scss',
})
export class SupportRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  requests: SupportRequest[] = [];
  readonly statuses = ['Recibida', 'En revisión', 'Esperando al cliente', 'Resuelta'];
  readonly replies: Record<number, string> = {};
  readonly expandedRequestIds = new Set<number>();
  isLoading = true;
  isSavingId: number | null = null;
  errorMessage = '';
  successMessage = '';
  private readonly savedStatuses: Record<number, string> = {};

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.getSupportRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        for (const request of requests) this.savedStatuses[request.id] = request.status;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar las solicitudes de atención.');
        this.isLoading = false;
      },
    });
  }

  updateStatus(request: SupportRequest): void {
    if (this.isSavingId !== null) return;
    this.isSavingId = request.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.updateSupportRequestStatus(request.id, request.status).subscribe({
      next: (result) => {
        this.replaceRequest(result.request);
        this.savedStatuses[result.request.id] = result.request.status;
        if (result.request.status === 'Resuelta') {
          this.expandedRequestIds.delete(result.request.id);
        }
        this.successMessage = result.message;
        this.isSavingId = null;
      },
      error: (error: unknown) => {
        request.status = this.savedStatuses[request.id] ?? request.status;
        this.errorMessage = apiErrorMessage(error, 'No se pudo actualizar el estado.');
        this.isSavingId = null;
      },
    });
  }

  sendReply(request: SupportRequest): void {
    const message = this.replies[request.id]?.trim();
    if (!message || this.isSavingId !== null) return;
    this.isSavingId = request.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.replyToSupportRequest(request.id, message).subscribe({
      next: (result) => {
        this.replaceRequest(result.request);
        this.savedStatuses[result.request.id] = result.request.status;
        this.replies[request.id] = '';
        this.successMessage = result.message;
        this.isSavingId = null;
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo enviar la respuesta.');
        this.isSavingId = null;
      },
    });
  }

  isExpanded(requestId: number): boolean {
    return this.expandedRequestIds.has(requestId);
  }

  toggleDetails(requestId: number): void {
    if (this.expandedRequestIds.has(requestId)) this.expandedRequestIds.delete(requestId);
    else this.expandedRequestIds.add(requestId);
  }

  private replaceRequest(updated: SupportRequest): void {
    this.requests = this.requests.map((request) => request.id === updated.id ? updated : request);
  }
}
