import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ApiService } from '../../core/services/api.service';
import { Dashboard } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AdminAuthService);
  readonly today = new Date();
  dashboard: Dashboard | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo cargar el resumen del negocio.');
        this.isLoading = false;
      },
    });
  }
}
