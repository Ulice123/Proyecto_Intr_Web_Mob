import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { ConfigService } from './config.service';
import { ResultadoValidacion } from './validacion.model';

interface ValidarResponseBody {
  codigo?: string;
  autorizado?: boolean;
  estado?: string;
  error?: string;
  mensaje?: string;
}

const REQUEST_TIMEOUT_MS = 8000;

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /**
   * Valida una entrada contra el Gateway. Nunca lanza error: siempre emite un ResultadoValidacion.
   */
  validar(codigo: string): Observable<ResultadoValidacion> {
    const baseUrl = this.config.gatewayUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/api/entradas/${encodeURIComponent(codigo)}/validar`;

    return this.http.post<ValidarResponseBody>(url, {}).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map((body) => this.mapSuccess(codigo, body)),
      catchError((err: unknown) => of(this.mapError(codigo, err))),
    );
  }

  private mapSuccess(codigo: string, body: ValidarResponseBody | null): ResultadoValidacion {
    if (body?.autorizado === true) {
      return {
        tipo: 'AUTORIZADO',
        codigo,
        estado: body.estado ?? '',
      };
    }

    return {
      tipo: 'RECHAZADO',
      codigo,
      causa: 'NO_AUTORIZADO',
      mensaje: body?.mensaje ?? 'Acceso no autorizado',
    };
  }

  private mapError(codigo: string, err: unknown): ResultadoValidacion {
    if (err instanceof HttpErrorResponse) {
      const body =
        err.error && typeof err.error === 'object' ? (err.error as ValidarResponseBody) : null;

      if (err.status === 409) {
        return {
          tipo: 'RECHAZADO',
          codigo,
          causa: 'ENTRADA_UTILIZADA',
          mensaje: body?.mensaje ?? 'Entrada ya utilizada',
        };
      }

      if (err.status === 404) {
        return {
          tipo: 'RECHAZADO',
          codigo,
          causa: 'ENTRADA_NO_EXISTE',
          mensaje: body?.mensaje ?? 'Entrada no encontrada',
        };
      }

      if (err.status > 0) {
        return {
          tipo: 'ERROR',
          codigo,
          mensaje: body?.mensaje ?? `Error del servidor (HTTP ${err.status})`,
        };
      }
    }

    return {
      tipo: 'ERROR',
      codigo,
      mensaje: 'No se pudo contactar al servidor',
    };
  }
}
