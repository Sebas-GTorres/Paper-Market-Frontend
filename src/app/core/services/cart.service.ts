import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartResponse, AddCartItemRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getCart(customerId: number) {
    return this.http.get<CartResponse>(`${this.api}/carts/customer/${customerId}`);
  }

  addItem(customerId: number, body: AddCartItemRequest) {
    return this.http.post<CartResponse>(`${this.api}/carts/customer/${customerId}/items`, body);
  }

  updateItem(customerId: number, productId: number, quantity: number) {
    return this.http.put<CartResponse>(
      `${this.api}/carts/customer/${customerId}/items/${productId}?quantity=${quantity}`, {}
    );
  }

  removeItem(customerId: number, productId: number) {
    return this.http.delete<CartResponse>(`${this.api}/carts/customer/${customerId}/items/${productId}`);
  }

  clearCart(customerId: number) {
    return this.http.delete<void>(`${this.api}/carts/customer/${customerId}/clear`);
  }
}
