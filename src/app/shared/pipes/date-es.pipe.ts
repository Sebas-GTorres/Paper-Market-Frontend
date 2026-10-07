import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateEs', standalone: true })
export class DateEsPipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'short' | 'medium' | 'long' = 'medium'): string {
    if (!value) return '—';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const opts: Intl.DateTimeFormatOptions =
        format === 'short'  ? { day: '2-digit', month: '2-digit', year: 'numeric' } :
        format === 'long'   ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } :
        /* medium */          { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Intl.DateTimeFormat('es-CO', opts).format(d);
    } catch { return value; }
  }
}
