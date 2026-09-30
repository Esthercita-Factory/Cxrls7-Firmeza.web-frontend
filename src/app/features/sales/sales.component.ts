import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Customer, Product, Sale } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { apiErrorMessage } from '../../core/utils/api-error';

interface SaleItemForm {
  productId: number | null;
  quantity: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  private readonly api = inject(ApiService);
  sales: Sale[] = [];
  customers: Customer[] = [];
  products: Product[] = [];
  customerId: number | null = null;
  items: SaleItemForm[] = [this.newItem()];
  isLoading = true;
  isSaving = false;
  showForm = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadSales();
    forkJoin({ customers: this.api.getCustomers(), products: this.api.getProducts() }).subscribe({
      next: ({ customers, products }) => { this.customers = customers; this.products = products; },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar los datos para registrar ventas.');
      },
    });
  }

  loadSales(): void {
    this.isLoading = true;
    this.api.getSales().subscribe({
      next: (sales) => { this.sales = sales; this.isLoading = false; },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar las ventas.');
        this.isLoading = false;
      },
    });
  }

  addItem(): void { this.items = [...this.items, this.newItem()]; }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items = this.items.filter((_, itemIndex) => itemIndex !== index);
  }

  estimatedSubtotal(): number {
    return this.items.reduce((total, item) => {
      const product = this.products.find((candidate) => candidate.id === item.productId);
      return total + (product ? product.unitPrice * (Number(item.quantity) || 0) : 0);
    }, 0);
  }

  submitSale(): void {
    const items = this.items
      .filter((item): item is SaleItemForm & { productId: number } => item.productId !== null)
      .map((item) => ({ productId: item.productId, quantity: Number(item.quantity) }));
    if (!this.customerId || !items.length) {
      this.errorMessage = 'Selecciona un cliente y agrega al menos un producto.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.api.createSale({ customerId: Number(this.customerId), items }).subscribe({
      next: (sale) => {
        this.successMessage = `Venta ${sale.reference} registrada correctamente.`;
        this.customerId = null;
        this.items = [this.newItem()];
        this.showForm = false;
        this.isSaving = false;
        this.loadSales();
        this.api.getProducts().subscribe({
          next: (products) => { this.products = products; },
          error: (error: unknown) => {
            this.errorMessage = apiErrorMessage(error, 'La venta quedó registrada, pero no se pudo actualizar el inventario visible.');
          },
        });
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo registrar la venta.');
        this.isSaving = false;
      },
    });
  }

  private newItem(): SaleItemForm { return { productId: null, quantity: 1 }; }
}
