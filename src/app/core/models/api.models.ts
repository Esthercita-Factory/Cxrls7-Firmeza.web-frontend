export interface AppUser {
  email: string;
  role: string;
  fullName: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  stock: number;
  minimumStock: number;
  isActive: boolean;
}

export type ProductInput = Omit<Product, 'id'>;

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  documentNumber: string;
  documentType: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  age: number | null;
  createdAtUtc: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'fullName' | 'createdAtUtc'>;

export interface SaleLine {
  productId: number;
  product: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: number;
  reference: string;
  customer: string;
  status: string;
  createdAtUtc: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  details: SaleLine[];
}

export interface SaleInput {
  customerId: number;
  items: { productId: number; quantity: number }[];
}

export interface Dashboard {
  productCount: number;
  customerCount: number;
  monthlySaleCount: number;
  monthlyRevenue: number;
  recentSales: Sale[];
}

export interface ImportResult {
  successfulRows: number;
  issues: { worksheet: string; row: number; message: string }[];
}
