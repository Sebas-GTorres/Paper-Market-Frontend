import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserResponse, UpdateUserRequest, UserState } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getMe()                              { return this.http.get<UserResponse>(`${this.api}/users/me`); }
  updateMe(body: UpdateUserRequest)    { return this.http.put<UserResponse>(`${this.api}/users/me`, body); }

  getAll()                             { return this.http.get<UserResponse[]>(`${this.api}/users`); }
  getById(id: number)                  { return this.http.get<UserResponse>(`${this.api}/users/${id}`); }
  getByState(state: UserState)         { return this.http.get<UserResponse[]>(`${this.api}/users/state/${state}`); }
  update(id: number, body: UpdateUserRequest) { return this.http.put<UserResponse>(`${this.api}/users/${id}`, body); }
  changeStatus(id: number, status: UserState) {
    return this.http.patch<UserResponse>(`${this.api}/users/${id}/status?status=${status}`, {});
  }
}
