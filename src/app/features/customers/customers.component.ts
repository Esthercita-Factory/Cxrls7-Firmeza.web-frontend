import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Customer, CustomerInput } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent implements OnInit {
  private readonly api = inject(ApiService);
  customers: Customer[] = [];
  search = '';
  form: CustomerInput = this.emptyCustomer();
  editingId: number | null = null;
  showForm = false;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void { this.loadCustomers(); }

  loadCustomers(): void {
    this.isLoading = true;
    this.api.getCustomers(this.search).subscribe({
      next: (customers) => { this.customers = customers; this.isLoading = false; },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar los clientes.');
        this.isLoading = false;
      },
    });
  }

  newCustomer(): void {
    this.form = this.emptyCustomer();
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  editCustomer(customer: Customer): void {
    const { id, fullName, createdAtUtc, ...input } = customer;
    this.form = { ...input };
    this.editingId = id;
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  saveCustomer(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.api.saveCustomer(this.form, this.editingId ?? undefined).subscribe({
      next: () => {
        this.showForm = false;
        this.isSaving = false;
        this.successMessage = this.editingId ? 'Cliente actualizado.' : 'Cliente creado.';
        this.loadCustomers();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo guardar el cliente.');
        this.isSaving = false;
      },
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!window.confirm(`¿Eliminar el cliente "${customer.fullName}"?`)) return;
    this.errorMessage = '';
    this.api.deleteCustomer(customer.id).subscribe({
      next: () => { this.successMessage = 'Cliente eliminado.'; this.loadCustomers(); },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo eliminar el cliente.');
      },
    });
  }

  private emptyCustomer(): CustomerInput {
    return {
      firstName: '',
      lastName: '',
      documentNumber: '',
      documentType: 'Cédula',
      email: '',
      phone: '',
      address: '',
      age: null,
    };
  }
}
