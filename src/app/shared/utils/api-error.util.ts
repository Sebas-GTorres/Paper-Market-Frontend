import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../core/models';

/** Extracts a user-friendly message from an HttpErrorResponse */
export function extractApiError(err: HttpErrorResponse): string {
  if (err.error && typeof err.error === 'object') {
    const apiErr = err.error as ApiError;
    if (apiErr.message) return apiErr.message;
  }
  if (err.status === 0) return 'Sin conexión con el servidor. Verifique que el backend esté activo.';
  if (err.status === 404) return 'Recurso no encontrado.';
  if (err.status === 500) return 'Error interno del servidor.';
  return err.message || 'Ocurrió un error inesperado.';
}

/** Extracts field validation errors map from a VALIDATION_FAILED response */
export function extractValidationErrors(err: HttpErrorResponse): Record<string, string> {
  if (err.error && typeof err.error === 'object') {
    const apiErr = err.error as ApiError;
    if (apiErr.errors) return apiErr.errors;
  }
  return {};
}
