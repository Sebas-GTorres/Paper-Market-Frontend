import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserResponse, UserState, UpdateUserRequest, RoleResponse, RegisterRequest } from '../../../core/models';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { extractApiError } from '../../../shared/utils/api-error.util';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DateEsPipe, EmptyStateComponent, IconComponent],
  template: `
    <div class="page-header flex-row justify-between items-start">
      <div>
        <h1 class="page-title">Usuarios</h1>
        <p class="page-subtitle">Gestión de cuentas del sistema</p>
      </div>
      <button (click)="openCreate()" class="btn btn-primary mt-1 gap-2">
        <app-icon name="user-plus" [size]="16"/> Nuevo Usuario
      </button>
    </div>

    <!-- Filtros -->
    <div class="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <app-icon name="search" [size]="16"/>
        </span>
        <input type="text" [(ngModel)]="searchQ" (input)="filterLocal()"
               class="search-input" placeholder="Buscar por nombre o email..."/>
      </div>
      <select [(ngModel)]="stateFilter" (change)="onStateFilter()" class="form-control w-full sm:w-40">
        <option value="">Todos los estados</option>
        <option value="ACTIVE">Activo</option>
        <option value="INACTIVE">Inactivo</option>
        <option value="BLOCKED">Bloqueado</option>
        <option value="SUSPENDED">Suspendido</option>
      </select>
    </div>

    @if (loading()) {
      <div class="flex justify-center py-16">
        <app-icon name="loader" [size]="32" class="animate-spin text-primary"/>
      </div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="users" title="Sin usuarios" subtitle="No se encontraron usuarios."/>
    } @else {
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Documento</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of filtered(); track user.id) {
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                      {{ user.names.charAt(0) }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-medium text-text-primary text-sm truncate">{{ user.names }} {{ user.surnames }}</p>
                      <p class="text-xs text-text-secondary truncate">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="text-sm font-mono">{{ user.document }}</td>
                <td><span class="badge badge-primary text-xs">{{ user.role.name }}</span></td>
                <td><span [ngClass]="stateClass(user.state)" class="badge">{{ user.state }}</span></td>
                <td class="text-sm text-text-secondary">{{ user.registrationDate | dateEs:'short' }}</td>
                <td>
                  <div class="flex items-center gap-1">
                    <button (click)="openEdit(user)" class="btn btn-ghost btn-sm" title="Editar">
                      <app-icon name="pencil" [size]="15"/>
                    </button>
                    <select class="form-control text-xs py-1 px-2 w-32"
                            (change)="changeState(user, $any($event.target).value)">
                      <option value="">Estado...</option>
                      <option value="ACTIVE">Activar</option>
                      <option value="INACTIVE">Desactivar</option>
                      <option value="BLOCKED">Bloquear</option>
                      <option value="SUSPENDED">Suspender</option>
                    </select>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Modal Editar usuario existente -->
    @if (editModal()) {
      <div class="overlay" (click)="closeEdit()">
        <div class="modal modal-md p-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Editar usuario</h3>
            <button (click)="closeEdit()" class="btn btn-ghost btn-sm p-1">
              <app-icon name="x" [size]="18"/>
            </button>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Nombres *</label>
                <input type="text" formControlName="names" class="form-control"/>
                @if (editForm.controls['names'].invalid && editForm.controls['names'].touched) {
                  <p class="form-error">Requerido.</p>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Apellidos *</label>
                <input type="text" formControlName="surnames" class="form-control"/>
                @if (editForm.controls['surnames'].invalid && editForm.controls['surnames'].touched) {
                  <p class="form-error">Requerido.</p>
                }
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="tel" formControlName="phone" class="form-control"/>
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input type="text" formControlName="address" class="form-control"/>
            </div>
            <div class="form-group">
              <label class="form-label">URL Foto de perfil</label>
              <input type="url" formControlName="profilePhoto" class="form-control"/>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary gap-2" [disabled]="saving()">
                @if (saving()) {
                  <app-icon name="loader" [size]="14" class="animate-spin"/> Guardando...
                } @else {
                  <app-icon name="save" [size]="14"/> Guardar
                }
              </button>
              <button type="button" (click)="closeEdit()" class="btn btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal Crear nuevo usuario (Admin) -->
    @if (createModal()) {
      <div class="overlay" (click)="closeCreate()">
        <div class="modal modal-md p-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold">Nuevo Usuario</h3>
            <button (click)="closeCreate()" class="btn btn-ghost btn-sm p-1">
              <app-icon name="x" [size]="18"/>
            </button>
          </div>
          <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Nombres *</label>
                <input type="text" formControlName="names" class="form-control"/>
                @if (cf['names'].invalid && cf['names'].touched) {
                  <p class="form-error">Requerido.</p>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Apellidos *</label>
                <input type="text" formControlName="surnames" class="form-control"/>
                @if (cf['surnames'].invalid && cf['surnames'].touched) {
                  <p class="form-error">Requerido.</p>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Documento *</label>
              <input type="text" formControlName="document" class="form-control"
                     placeholder="Máx. 10 caracteres" maxlength="10"/>
              @if (cf['document'].invalid && cf['document'].touched) {
                <p class="form-error">Requerido (máx. 10 caracteres).</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Correo electrónico *</label>
              <input type="email" formControlName="email" class="form-control"
                     placeholder="correo@ejemplo.com"/>
              @if (cf['email'].invalid && cf['email'].touched) {
                <p class="form-error">Correo válido requerido.</p>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña *</label>
              <input type="password" formControlName="password" class="form-control"
                     placeholder="Mínimo 6 caracteres"/>
              @if (cf['password'].invalid && cf['password'].touched) {
                <p class="form-error">Mínimo 6 caracteres.</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="tel" formControlName="phone" class="form-control"/>
              </div>
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" formControlName="address" class="form-control"/>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Rol *</label>
              <select formControlName="roleId" class="form-control">
                <option value="">Seleccionar rol...</option>
                @for (role of roles(); track role.id) {
                  <option [value]="role.id">{{ role.name }}</option>
                }
              </select>
              @if (cf['roleId'].invalid && cf['roleId'].touched) {
                <p class="form-error">Seleccione un rol.</p>
              }
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" class="btn btn-primary gap-2" [disabled]="creating()">
                @if (creating()) {
                  <app-icon name="loader" [size]="14" class="animate-spin"/> Creando...
                } @else {
                  <app-icon name="user-plus" [size]="14"/> Crear Usuario
                }
              </button>
              <button type="button" (click)="closeCreate()" class="btn btn-ghost">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class UserManagementComponent implements OnInit {
  private userSvc  = inject(UserService);
  private roleSvc  = inject(RoleService);
  private http     = inject(HttpClient);
  private toast    = inject(ToastService);
  private fb       = inject(FormBuilder);
  private api      = environment.apiUrl;

  allUsers    = signal<UserResponse[]>([]);
  filtered    = signal<UserResponse[]>([]);
  roles       = signal<RoleResponse[]>([]);
  loading     = signal(true);
  editModal   = signal(false);
  createModal = signal(false);
  saving      = signal(false);
  creating    = signal(false);
  editId      = 0;

  searchQ     = '';
  stateFilter = '';

  // Formulario edición
  editForm = this.fb.group({
    names:        ['', Validators.required],
    surnames:     ['', Validators.required],
    phone:        [''],
    address:      [''],
    profilePhoto: ['']
  });

  // Formulario creación (admin puede elegir roleId)
  createForm = this.fb.group({
    names:    ['', Validators.required],
    surnames: ['', Validators.required],
    document: ['', [Validators.required, Validators.maxLength(10)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone:    [''],
    address:  [''],
    roleId:   ['', Validators.required]
  });

  get cf() { return this.createForm.controls; }

  ngOnInit() {
    this.loadAll();
    this.roleSvc.getAll().subscribe({
      next: r => this.roles.set(r),
      error: () => {}
    });
  }

  loadAll() {
    this.loading.set(true);
    this.userSvc.getAll().subscribe({
      next: u  => { this.allUsers.set(u); this.filterLocal(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onStateFilter() {
    if (!this.stateFilter) { this.loadAll(); return; }
    this.loading.set(true);
    this.userSvc.getByState(this.stateFilter as UserState).subscribe({
      next: u  => { this.allUsers.set(u); this.filterLocal(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterLocal() {
    const q = this.searchQ.toLowerCase();
    this.filtered.set(q
      ? this.allUsers().filter(u => `${u.names} ${u.surnames} ${u.email}`.toLowerCase().includes(q))
      : this.allUsers()
    );
  }

  stateClass(state: string) {
    return { ACTIVE: 'badge-success', INACTIVE: 'badge-gray', BLOCKED: 'badge-danger', SUSPENDED: 'badge-warning' }[state] ?? 'badge-gray';
  }

  // ── Editar usuario ──
  openEdit(user: UserResponse) {
    this.editId = user.id;
    this.editForm.patchValue({
      names: user.names, surnames: user.surnames,
      phone: user.phone ?? '', address: user.address ?? '',
      profilePhoto: user.profilePhoto ?? ''
    });
    this.editModal.set(true);
  }

  closeEdit() { this.editModal.set(false); }

  saveEdit() {
    if (this.editForm.invalid) return;
    this.saving.set(true);
    this.userSvc.update(this.editId, this.editForm.value as UpdateUserRequest).subscribe({
      next: () => {
        this.toast.success('Usuario actualizado');
        this.closeEdit();
        this.saving.set(false);
        this.loadAll();
      },
      error: err => { this.toast.error(extractApiError(err)); this.saving.set(false); }
    });
  }

  changeState(user: UserResponse, state: string) {
    if (!state) return;
    this.userSvc.changeStatus(user.id, state as UserState).subscribe({
      next: () => { this.toast.success('Estado actualizado'); this.loadAll(); },
      error: err => this.toast.error(extractApiError(err))
    });
  }

  // ── Crear nuevo usuario (solo admin) ──
  openCreate() {
    this.createForm.reset();
    this.createModal.set(true);
  }

  closeCreate() { this.createModal.set(false); }

  submitCreate() {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    const body: RegisterRequest = {
      ...this.createForm.value,
      roleId: Number(this.createForm.value.roleId)
    } as RegisterRequest;

    this.http.post<UserResponse>(`${this.api}/auth/register`, body).subscribe({
      next: () => {
        this.toast.success('Usuario creado exitosamente');
        this.closeCreate();
        this.creating.set(false);
        this.loadAll();
      },
      error: err => { this.toast.error(extractApiError(err)); this.creating.set(false); }
    });
  }
}
