import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCo', standalone: true })
export class CurrencyСoPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
  }
}
