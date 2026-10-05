export interface CustomerUser {
  email: string;
  role: 'Cliente';
  fullName: string;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  documentType: string;
  maskedDocumentNumber: string;
  phone: string | null;
  registeredAtUtc: string;
}

export interface CustomerAuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: CustomerUser;
}

export interface CustomerRegistration {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string | null;
  password: string;
  confirmPassword: string;
}

export interface RegistrationResponse {
  message: string;
  registrationEmailSent: boolean;
}

export interface CatalogProduct {
  id: number;
  name: string;
  imageUrl: string | null;
  description: string | null;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  stock: number;
}

export interface CustomerCatalog {
  taxRate: number;
  products: CatalogProduct[];
}

export interface CustomerSaleLine {
  productId: number;
  product: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerSale {
  id: number;
  reference: string;
  customer: string;
  status: string;
  createdAtUtc: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  details: CustomerSaleLine[];
}

export interface CheckoutResponse {
  sale: CustomerSale;
  receiptEmailSent: boolean;
  message: string;
}

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}
