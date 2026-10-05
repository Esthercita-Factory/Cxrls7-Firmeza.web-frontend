import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CatalogProduct } from '../models/customer.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0),
  );
  private readonly subtotalCents = computed(() =>
    this.items().reduce(
      (total, item) => total + Math.round(item.product.unitPrice * 100) * item.quantity,
      0,
    ),
  );
  readonly subtotal = computed(() => this.subtotalCents() / 100);
  readonly taxRate = signal(0.15);
  readonly tax = computed(() => {
    const rawCents = this.subtotalCents() * this.taxRate();
    const lowerCents = Math.floor(rawCents);
    const fraction = rawCents - lowerCents;
    const roundedCents = Math.abs(fraction - 0.5) < 1e-8
      ? lowerCents + (lowerCents % 2)
      : Math.round(rawCents);
    return roundedCents / 100;
  });
  readonly total = computed(() => this.subtotal() + this.tax());

  setTaxRate(rate: number): void {
    if (Number.isFinite(rate) && rate >= 0 && rate <= 1) this.taxRate.set(rate);
  }

  add(product: CatalogProduct): void {
    this.items.update((items) => {
      const current = items.find((item) => item.product.id === product.id);
      if (current) {
        return items.map((item) =>
          item.product.id === product.id
            ? { product, quantity: Math.min(item.quantity + 1, product.stock) }
            : item,
        );
      }
      return product.stock > 0 ? [...items, { product, quantity: 1 }] : items;
    });
  }

  changeQuantity(productId: number, amount: number): void {
    this.items.update((items) =>
      items
        .map((item) =>
          item.product.id === productId
            ? {
              ...item,
              quantity: Math.min(item.product.stock, item.quantity + amount),
            }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  remove(productId: number): void {
    this.items.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}
