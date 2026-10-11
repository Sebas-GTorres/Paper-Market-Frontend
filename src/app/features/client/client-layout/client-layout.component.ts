import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastContainerComponent, IconComponent],
  template: `
    <div class="min-h-screen bg-background">

      <!-- Navbar -->
      <header class="sticky top-0 z-30 bg-primary shadow-md">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          <!-- Brand -->
          <a routerLink="/client/catalog" class="flex items-center gap-2.5 text-white font-bold text-lg shrink-0">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <app-icon name="book-open" [size]="18"/>
            </div>
            <span class="hidden sm:block">Pape market</span>
          </a>

          <!-- Nav (desktop) -->
          <nav class="hidden md:flex items-center gap-1">
            <a routerLink="/client/catalog" routerLinkActive="bg-white/20"
               class="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors">
              <app-icon name="store" [size]="16"/> Catálogo
            </a>
            <a routerLink="/client/orders" routerLinkActive="bg-white/20"
               class="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors">
              <app-icon name="clipboard-list" [size]="16"/> Mis Pedidos
            </a>
            <a routerLink="/client/profile" routerLinkActive="bg-white/20"
               class="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium hover:bg-white/10 transition-colors">
              <app-icon name="user" [size]="16"/> Mi Perfil
            </a>
          </nav>

          <!-- Right -->
          <div class="flex items-center gap-2">
            <a routerLink="/client/cart"
               class="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <app-icon name="shopping-cart" [size]="20"/>
            </a>
            <div class="relative">
              <button (click)="menuOpen.set(!menuOpen())"
                      class="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
                <div class="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                  {{ auth.currentUser()?.names?.charAt(0) }}
                </div>
                <span class="hidden sm:block">{{ auth.currentUser()?.names }}</span>
                <app-icon name="chevron-down" [size]="14"/>
              </button>

              @if (menuOpen()) {
                <div class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-modal border border-gray-100 w-48 py-1 z-50">
                  <a routerLink="/client/profile" (click)="menuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50">
                    <app-icon name="user" [size]="15" class="text-text-secondary"/> Mi Perfil
                  </a>
                  <div class="divider my-1"></div>
                  <button (click)="logout()"
                          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-red-50">
                    <app-icon name="log-out" [size]="15"/> Cerrar Sesión
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Mobile bottom nav -->
        <div class="md:hidden flex border-t border-white/20">
          <a routerLink="/client/catalog"  routerLinkActive="bg-white/20" class="flex-1 flex flex-col items-center py-2 text-white hover:bg-white/10 gap-1">
            <app-icon name="store" [size]="16"/><span class="text-xs">Catálogo</span>
          </a>
          <a routerLink="/client/cart"     routerLinkActive="bg-white/20" class="flex-1 flex flex-col items-center py-2 text-white hover:bg-white/10 gap-1">
            <app-icon name="shopping-cart" [size]="16"/><span class="text-xs">Carrito</span>
          </a>
          <a routerLink="/client/orders"   routerLinkActive="bg-white/20" class="flex-1 flex flex-col items-center py-2 text-white hover:bg-white/10 gap-1">
            <app-icon name="clipboard-list" [size]="16"/><span class="text-xs">Pedidos</span>
          </a>
          <a routerLink="/client/profile"  routerLinkActive="bg-white/20" class="flex-1 flex flex-col items-center py-2 text-white hover:bg-white/10 gap-1">
            <app-icon name="user" [size]="16"/><span class="text-xs">Perfil</span>
          </a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-6">
        <router-outlet/>
      </main>
    </div>

    <app-toast-container/>

    @if (menuOpen()) {
      <div class="fixed inset-0 z-20" (click)="menuOpen.set(false)"></div>
    }
  `
})
export class ClientLayoutComponent {
  auth     = inject(AuthService);
  menuOpen = signal(false);
  logout() { this.menuOpen.set(false); this.auth.logout(); }
}
