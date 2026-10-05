import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { CatalogProduct } from '../models/customer.models';

describe('CartService', () => {
  let cart: CartService;
  const product: CatalogProduct = {
    id: 1,
    name: 'Cemento',
    imageUrl: null,
    description: null,
    category: 'Construcción',
    unitOfMeasure: 'saco',
    unitPrice: 10,
    stock: 3,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CartService] });
    cart = TestBed.inject(CartService);
  });

  it('calculates the subtotal, configured tax, and total for cart quantities', () => {
    cart.setTaxRate(0.15);
    cart.add(product);
    cart.add(product);

    expect(cart.subtotal()).toBe(20);
    expect(cart.tax()).toBe(3);
    expect(cart.total()).toBe(23);
    expect(cart.itemCount()).toBe(2);
  });

  it('does not allow a cart quantity to exceed current stock', () => {
    cart.add(product);
    cart.changeQuantity(product.id, 10);

    expect(cart.items()[0].quantity).toBe(product.stock);
  });

  it('uses the same midpoint-to-even cent rounding as the API', () => {
    cart.setTaxRate(0.05);
    cart.add({ ...product, unitPrice: 0.1 });

    expect(cart.tax()).toBe(0);
  });
});
