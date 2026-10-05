import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CustomerApiService } from '../../core/services/customer-api.service';
import { ThemeService } from '../../core/services/theme.service';
import {
  CatalogProduct,
  CheckoutResponse,
  CustomerCatalog,
  CustomerProfile,
  CustomerSale,
} from '../../core/models/customer.models';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './storefront.component.html',
  styleUrl: './storefront.component.scss',
})
export class StorefrontComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly theme = inject(ThemeService);
  private readonly api = inject(CustomerApiService);

  readonly catalog = signal<CustomerCatalog | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly productsMenuOpen = signal(false);
  readonly page = signal<'home' | 'products' | 'cart' | 'profile' | 'purchases'>(this.getPage(this.router.url));
  readonly accountMenuOpen = signal(false);
  readonly accountLoading = signal(false);
  readonly accountError = signal('');
  readonly customerProfile = signal<CustomerProfile | null>(null);
  readonly customerSales = signal<CustomerSale[]>([]);
  readonly totalPurchased = computed(() =>
    this.customerSales().reduce((total, sale) => total + sale.total, 0),
  );
  readonly availableProducts = computed(() =>
    (this.catalog()?.products ?? []).filter((product) => product.stock > 0),
  );
  readonly featuredProducts = computed(() =>
    [...this.availableProducts()]
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 4),
  );
  readonly notice = signal<{ kind: 'success' | 'warning' | 'info'; message: string } | null>(null);
  readonly filteredProducts = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const products = this.availableProducts();
    return query
      ? products.filter((product) =>
        `${product.name} ${product.category} ${product.description ?? ''}`
          .toLocaleLowerCase()
          .includes(query),
      )
      : products;
  });

  checkoutBusy = false;
  checkoutResult: CheckoutResponse | null = null;
  lastSaleId: number | null = null;
  receiptBusy = false;

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.page.set(this.getPage(event.urlAfterRedirects));
      this.productsMenuOpen.set(false);
      this.accountMenuOpen.set(false);
      this.loadAccountPage(this.page());
    });

    const welcome = new URLSearchParams(globalThis.location.search).get('welcome');
    if (welcome === 'true') {
      const emailSent = new URLSearchParams(globalThis.location.search).get('registrationEmailSent') === 'true';
      this.notice.set({
        kind: emailSent ? 'success' : 'info',
        message: emailSent
          ? `¡Bienvenido, ${this.auth.currentUser()?.fullName ?? 'cliente'}! Tu cuenta quedó lista y te enviamos un correo de confirmación.`
          : '¡Bienvenido! Tu cuenta quedó lista. El correo de confirmación no pudo enviarse en este momento.',
      });
    }

    this.loadCatalog();
    this.loadAccountPage(this.page());
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getCatalog().subscribe({
      next: (catalog) => {
        this.catalog.set(catalog);
        this.cart.setTaxRate(catalog.taxRate);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(apiErrorMessage(error, 'No se pudo cargar el catálogo. Inténtalo de nuevo.'));
        this.loading.set(false);
      },
    });
  }

  toggleProductsMenu(): void {
    this.productsMenuOpen.update((open) => !open);
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((open) => !open);
  }

  loadAccountPage(page: 'home' | 'products' | 'cart' | 'profile' | 'purchases'): void {
    if (page !== 'profile' && page !== 'purchases') return;

    this.accountLoading.set(true);
    this.accountError.set('');
    if (page === 'profile') {
      forkJoin({
        profile: this.api.getProfile(),
        sales: this.api.getMySales(),
      }).subscribe({
        next: ({ profile, sales }) => {
          this.customerProfile.set(profile);
          this.customerSales.set(sales);
        },
        error: (error: unknown) => {
          this.accountError.set(apiErrorMessage(error, 'No se pudo cargar tu perfil. Inténtalo de nuevo.'));
          this.accountLoading.set(false);
        },
        complete: () => this.accountLoading.set(false),
      });
      return;
    }
    this.api.getMySales().subscribe({
      next: (sales) => this.customerSales.set(sales),
      error: (error: unknown) => {
        this.accountError.set(apiErrorMessage(error, 'No se pudieron cargar tus compras. Inténtalo de nuevo.'));
        this.accountLoading.set(false);
      },
      complete: () => this.accountLoading.set(false),
    });
  }

  downloadSaleReceipt(sale: CustomerSale): void {
    this.api.downloadReceipt(sale.id).subscribe({
      next: (pdf) => {
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-${sale.reference}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.notice.set({
        kind: 'warning',
        message: apiErrorMessage(error, 'No se pudo descargar el comprobante. Inténtalo nuevamente.'),
      }),
    });
  }

  productSummary(sale: CustomerSale): string {
    return sale.details.slice(0, 2).map((detail) => detail.product).join(', ');
  }

  handleProductImageError(event: Event): void {
    if (event.target instanceof HTMLImageElement) {
      event.target.classList.add('image-failed');
      event.target.removeAttribute('src');
    }
  }

  addToCart(product: CatalogProduct): void {
    this.cart.add(product);
    this.checkoutResult = null;
    this.notice.set({ kind: 'info', message: `${product.name} se agregó al carrito.` });
  }

  updateQuantity(productId: number, amount: number): void {
    this.cart.changeQuantity(productId, amount);
    this.checkoutResult = null;
  }

  removeFromCart(productId: number): void {
    this.cart.remove(productId);
    this.checkoutResult = null;
  }

  checkout(): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/login');
      return;
    }
    if (this.cart.items().length === 0 || this.checkoutBusy) return;

    this.checkoutBusy = true;
    this.notice.set(null);
    this.api.checkout(
      this.cart.items().map(({ product, quantity }) => ({ productId: product.id, quantity })),
    ).subscribe({
      next: (result) => {
        this.checkoutResult = result;
        this.lastSaleId = result.sale.id;
        this.cart.clear();
        this.checkoutBusy = false;
        this.notice.set({
          kind: result.receiptEmailSent ? 'success' : 'warning',
          message: result.message,
        });
      },
      error: (error: unknown) => {
        this.notice.set({
          kind: 'warning',
          message: apiErrorMessage(error, 'No se pudo completar la compra. Revisa el carrito e inténtalo de nuevo.'),
        });
        this.checkoutBusy = false;
      },
    });
  }

  downloadReceipt(): void {
    if (!this.lastSaleId || this.receiptBusy) return;
    this.receiptBusy = true;
    this.api.downloadReceipt(this.lastSaleId).subscribe({
      next: (pdf) => {
        const url = URL.createObjectURL(pdf);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante-${this.checkoutResult?.sale.reference ?? this.lastSaleId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.receiptBusy = false;
      },
      error: (error: unknown) => {
        this.notice.set({
          kind: 'warning',
          message: apiErrorMessage(error, 'No se pudo descargar el comprobante. Inicia sesión e inténtalo nuevamente.'),
        });
        this.receiptBusy = false;
      },
    });
  }

  logout(): void {
    this.auth.clearSession();
    this.checkoutResult = null;
    this.lastSaleId = null;
    void this.router.navigateByUrl('/');
  }

  private getPage(url: string): 'home' | 'products' | 'cart' | 'profile' | 'purchases' {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    if (path === '/products') return 'products';
    if (path === '/cart') return 'cart';
    if (path === '/profile') return 'profile';
    if (path === '/purchases') return 'purchases';
    return 'home';
  }
}
