import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Product, ProductInput } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ApiService);
  products: Product[] = [];
  search = '';
  form: ProductInput = this.emptyProduct();
  editingId: number | null = null;
  showForm = false;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.api.getProducts(this.search).subscribe({
      next: (products) => { this.products = products; this.isLoading = false; },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudieron cargar los productos.');
        this.isLoading = false;
      },
    });
  }

  newProduct(): void {
    this.form = this.emptyProduct();
    this.editingId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  editProduct(product: Product): void {
    const { id, ...input } = product;
    this.form = { ...input };
    this.editingId = id;
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  saveProduct(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.api.saveProduct(this.form, this.editingId ?? undefined).subscribe({
      next: () => {
        this.showForm = false;
        this.isSaving = false;
        this.successMessage = this.editingId ? 'Producto actualizado.' : 'Producto creado.';
        this.loadProducts();
      },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo guardar el producto.');
        this.isSaving = false;
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!window.confirm(`¿Desactivar el producto "${product.name}"?`)) return;
    this.errorMessage = '';
    this.api.deleteProduct(product.id).subscribe({
      next: () => { this.successMessage = 'Producto desactivado.'; this.loadProducts(); },
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(error, 'No se pudo desactivar el producto.');
      },
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.errorMessage = '';
  }

  private emptyProduct(): ProductInput {
    return {
      sku: '',
      name: '',
      description: '',
      category: '',
      unitOfMeasure: 'unidad',
      unitPrice: 0,
      stock: 0,
      minimumStock: 0,
      isActive: true,
    };
  }
}
