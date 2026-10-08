import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface NavItem { label: string; icon: string; link: string; }

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent, IconComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <aside [class.translate-x-0]="sidebarOpen()"
             [class.-translate-x-full]="!sidebarOpen()"
             class="fixed md:static md:translate-x-0 inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300">

        <div class="p-5 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <app-icon name="book-open" [size]="20"/>
            </div>
            <div>
              <p class="font-bold text-text-primary text-sm leading-tight">Pape market</p>
              <p class="text-xs text-text-secondary">Administrador</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
          @for (item of navItems; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="active"
               [routerLinkActiveOptions]="{exact: item.link.endsWith('dashboard')}"
               class="sidebar-link" (click)="sidebarOpen.set(false)">
              <app-icon [name]="item.icon" [size]="18"/>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="p-3 border-t border-gray-200">
          <div class="flex items-center gap-3 p-2 rounded-lg">
            <div class="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
              {{ auth.currentUser()?.names?.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text-primary truncate">{{ auth.currentUser()?.names }} {{ auth.currentUser()?.surnames }}</p>
              <p class="text-xs text-text-secondary truncate">{{ auth.currentUser()?.email }}</p>
            </div>
            <button (click)="auth.logout()" title="Cerrar sesión"
                    class="text-text-secondary hover:text-danger transition-colors p-1 shrink-0">
              <app-icon name="log-out" [size]="16"/>
            </button>
          </div>
        </div>
      </aside>

      @if (sidebarOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 md:hidden" (click)="sidebarOpen.set(false)"></div>
      }

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
          <button (click)="sidebarOpen.set(!sidebarOpen())"
                  class="md:hidden p-2 rounded-lg hover:bg-gray-100 text-text-secondary">
            <app-icon name="menu" [size]="20"/>
          </button>
          <div class="flex-1"></div>
          <span class="badge bg-red-100 text-red-800 text-xs px-3 py-1">ADMIN</span>
        </header>

        <main class="flex-1 overflow-y-auto p-4 md:p-6">
          <router-outlet/>
        </main>
      </div>
    </div>

    <app-toast-container/>
  `
})
export class AdminLayoutComponent {
  auth        = inject(AuthService);
  sidebarOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',      icon: 'layout-dashboard', link: '/admin/dashboard' },
    { label: 'Usuarios',       icon: 'users',            link: '/admin/users' },
    { label: 'Roles',          icon: 'shield',           link: '/admin/roles' },
    { label: 'Productos',      icon: 'package',          link: '/admin/products' },
    { label: 'Categorías',     icon: 'tags',             link: '/admin/categories' },
    { label: 'Proveedores',    icon: 'truck',            link: '/admin/suppliers' },
    { label: 'Compras',        icon: 'shopping-bag',     link: '/admin/purchases' },
    { label: 'Ventas',         icon: 'receipt',          link: '/admin/sales' },
    { label: 'Clientes',       icon: 'user-check',       link: '/admin/customers' },
    { label: 'Pedidos',        icon: 'clipboard-list',   link: '/admin/orders' },
    { label: 'Mi Perfil',      icon: 'settings',         link: '/admin/profile' },
  ];
}
