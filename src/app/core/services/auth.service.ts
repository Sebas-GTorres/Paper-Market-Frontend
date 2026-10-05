import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse, LoginRequest, RegisterRequest,
  ForgotPasswordRequest, ResetPasswordRequest, UserResponse, CustomerResponse
} from '../models';

const TOKEN_KEY    = 'pf_token';
const USER_KEY     = 'pf_user';
const CUSTOMER_KEY = 'pf_customer_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private api    = environment.apiUrl;

  // ─── Signals ────────────────────────────────────────────
  currentUser = signal<UserResponse | null>(this.loadUser());

  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole        = computed(() => this.currentUser()?.role?.name ?? null);
  isAdmin         = computed(() => this.userRole() === 'ADMIN');
  isEmpleado      = computed(() => this.userRole() === 'EMPLEADO');
  isCliente       = computed(() => this.userRole() === 'CLIENTE');

  // ─── Helpers ─────────────────────────────────────────────
  private loadUser(): UserResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCustomerId(): number | null {
    const val = localStorage.getItem(CUSTOMER_KEY);
    return val ? Number(val) : null;
  }

  // ─── Auth Endpoints ──────────────────────────────────────

  // Cambio 5: login guarda customerId si el rol es CLIENTE
  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, body).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
      switchMap(res => {
        if (res.user.role?.name === 'CLIENTE') {
          return this.http.get<CustomerResponse>(`${this.api}/customers/user/${res.user.id}`).pipe(
            tap(customer => {
              localStorage.setItem(CUSTOMER_KEY, String(customer.id));
            }),
            map(() => res)
          );
        }
        return of(res);
      })
    );
  }

  // Cambio 1: register devuelve UserResponse, sin token
  register(body: RegisterRequest) {
    return this.http.post<UserResponse>(`${this.api}/auth/register`, body);
  }

  forgotPassword(body: ForgotPasswordRequest) {
    return this.http.post<{ message: string }>(`${this.api}/auth/forgot-password`, body);
  }

  resetPassword(body: ResetPasswordRequest) {
    return this.http.post<{ message: string }>(`${this.api}/auth/reset-password`, body);
  }

  // Cambio 6: logout limpia también pf_customer_id
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshCurrentUser(user: UserResponse) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  navigateByRole() {
    const role = this.userRole();
    if (role === 'ADMIN')         this.router.navigate(['/admin/dashboard']);
    else if (role === 'EMPLEADO') this.router.navigate(['/employee/orders']);
    else if (role === 'CLIENTE')  this.router.navigate(['/client/catalog']);
    else                          this.router.navigate(['/login']);
  }
}
