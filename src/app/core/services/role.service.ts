import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RoleResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll() { return this.http.get<RoleResponse[]>(`${this.api}/roles`); }

  create(name: string, description: string) {
    return this.http.post<RoleResponse>(
      `${this.api}/roles?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`,
      {}
    );
  }
}
