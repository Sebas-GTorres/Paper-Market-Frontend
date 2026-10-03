import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { redirectIfLoggedGuard } from './core/guards/redirect-if-logged.guard';

export const routes: Routes = [
  // ─── Redirect root ───────────────────────────────────────
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ─── Public Auth ─────────────────────────────────────────
  {
    path: 'login',
    canActivate: [redirectIfLoggedGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [redirectIfLoggedGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [redirectIfLoggedGuard],
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/auth/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },

  // ─── Client ──────────────────────────────────────────────
  {
    path: 'client',
    canActivate: [roleGuard('CLIENTE')],
    loadComponent: () => import('./features/client/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      { path: '', redirectTo: 'catalog', pathMatch: 'full' },
      {
        path: 'catalog',
        loadComponent: () => import('./features/client/catalog/catalog.component').then(m => m.CatalogComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/client/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/client/cart/cart.component').then(m => m.CartComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/client/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/client/my-orders/my-orders.component').then(m => m.MyOrdersComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/shared/my-profile/my-profile.component').then(m => m.MyProfileComponent)
      },
    ]
  },

  // ─── Employee ────────────────────────────────────────────
  {
    path: 'employee',
    canActivate: [roleGuard('EMPLEADO')],
    loadComponent: () => import('./features/employee/employee-layout/employee-layout.component').then(m => m.EmployeeLayoutComponent),
    children: [
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
      {
        path: 'orders',
        loadComponent: () => import('./features/employee/order-management/order-management.component').then(m => m.OrderManagementComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/employee/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        data: { base: '/employee/orders' }
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/employee/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/employee/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/shared/my-profile/my-profile.component').then(m => m.MyProfileComponent)
      },
    ]
  },

  // ─── Admin ───────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/admin/role-management/role-management.component').then(m => m.RoleManagementComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/admin/product-management/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/admin/category-management/category-management.component').then(m => m.CategoryManagementComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./features/admin/supplier-management/supplier-management.component').then(m => m.SupplierManagementComponent)
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/admin/purchase-management/purchase-management.component').then(m => m.PurchaseManagementComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./features/admin/sale-management/sale-management.component').then(m => m.SaleManagementComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/admin/customer-management/customer-management.component').then(m => m.CustomerManagementComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/employee/order-management/order-management.component').then(m => m.OrderManagementComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/employee/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        data: { base: '/admin/orders' }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/shared/my-profile/my-profile.component').then(m => m.MyProfileComponent)
      },
    ]
  },

  // ─── Wildcard ────────────────────────────────────────────
  { path: '**', redirectTo: 'login' }
];
