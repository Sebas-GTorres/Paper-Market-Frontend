import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CategoryResponse, CategoryRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll()                              { return this.http.get<CategoryResponse[]>(`${this.api}/categories`); }
  getActive()                           { return this.http.get<CategoryResponse[]>(`${this.api}/categories/active`); }
  getById(id: number)                   { return this.http.get<CategoryResponse>(`${this.api}/categories/${id}`); }
  create(body: CategoryRequest)         { return this.http.post<CategoryResponse>(`${this.api}/categories`, body); }
  update(id: number, body: CategoryRequest) { return this.http.put<CategoryResponse>(`${this.api}/categories/${id}`, body); }
  toggle(id: number)                    { return this.http.patch<CategoryResponse>(`${this.api}/categories/${id}/toggle`, {}); }
}
