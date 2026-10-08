import { Component } from '@angular/core';
import { OrderManagementComponent } from '../../employee/order-management/order-management.component';

/**
 * Admin variant — identical to employee order management,
 * but detail links go to /admin/orders/:id
 */
@Component({
  selector: 'app-admin-order-management',
  standalone: true,
  imports: [],
  template: ``,
})
export class AdminOrderManagementComponent {}

// We reuse OrderManagementComponent directly in admin routes with data: { base: '/admin/orders' }
