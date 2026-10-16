import { Routes } from '@angular/router';
import { CustomerAuthComponent } from './features/auth/customer-auth.component';
import { StorefrontComponent } from './features/storefront/storefront.component';
import { AdminLayoutComponent } from './features/admin-layout/admin-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { CustomersComponent } from './features/customers/customers.component';
import { SalesComponent } from './features/sales/sales.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SupportRequestsComponent } from './features/support-requests/support-requests.component';
import { authGuard } from './core/guards/auth.guard';
import { customerAuthGuard } from './core/guards/customer-auth.guard';

export const routes: Routes = [
  { path: '', component: StorefrontComponent },
  { path: 'products', component: StorefrontComponent },
  { path: 'cart', component: StorefrontComponent },
  { path: 'profile', component: StorefrontComponent, canActivate: [customerAuthGuard] },
  { path: 'purchases', component: StorefrontComponent, canActivate: [customerAuthGuard] },
  { path: 'login', component: CustomerAuthComponent, data: { mode: 'login' } },
  { path: 'register', component: CustomerAuthComponent, data: { mode: 'register' } },
  { path: 'admin/login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'sales', component: SalesComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'support-requests', component: SupportRequestsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
