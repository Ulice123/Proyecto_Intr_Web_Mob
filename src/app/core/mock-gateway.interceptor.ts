import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { switchMap, throwError, timer, of } from 'rxjs';

const SEED_CODES = new Set(['EP-A1B2C3D4', 'EP-TEST0001', 'EP-TEST0002', 'EP-TEST0003']);
const usedCodes = new Set<string>();

const VALIDAR_URL_PATTERN = /\/api\/entradas\/([^/]+)\/validar$/;
const MOCK_DELAY_MS = 400;

/**
 * Reinicia el estado en memoria del mock (útil en pruebas unitarias).
 */
export function resetMockGateway(): void {
  usedCodes.clear();
}

/**
 * Interceptor funcional que simula las respuestas del Gateway cuando environment.mock es true.
 */
export const mockGatewayInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST') {
    return next(req);
  }

  const match = VALIDAR_URL_PATTERN.exec(req.url);
  if (!match) {
    return next(req);
  }

  const codigo = decodeURIComponent(match[1]);

  return timer(MOCK_DELAY_MS).pipe(
    switchMap(() => {
      if (codigo === 'EP-CAIDA') {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 0,
              statusText: 'Unknown Error',
              url: req.url,
            }),
        );
      }

      if (codigo.startsWith('EP-') && SEED_CODES.has(codigo)) {
        if (usedCodes.has(codigo)) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 409,
                statusText: 'Conflict',
                url: req.url,
                error: {
                  error: 'ENTRADA_UTILIZADA',
                  mensaje: 'Entrada ya utilizada',
                },
              }),
          );
        }

        usedCodes.add(codigo);
        return of(
          new HttpResponse({
            status: 200,
            url: req.url,
            body: {
              codigo,
              autorizado: true,
              estado: 'UTILIZADA',
            },
          }),
        );
      }

      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            url: req.url,
            error: {
              error: 'ENTRADA_NO_EXISTE',
              mensaje: 'Entrada no encontrada',
            },
          }),
      );
    }),
  );
};
