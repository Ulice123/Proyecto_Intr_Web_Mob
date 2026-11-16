import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockGatewayInterceptor, resetMockGateway } from './mock-gateway.interceptor';

describe('mockGatewayInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    resetMockGateway();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockGatewayInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('responde 200 la primera vez para EP-TEST0001 y 409 la segunda vez', async () => {
    const first = await firstValueFrom(
      http.post<{ codigo: string; autorizado: boolean; estado: string }>(
        'http://localhost:8080/api/entradas/EP-TEST0001/validar',
        {},
      ),
    );
    expect(first).toEqual({
      codigo: 'EP-TEST0001',
      autorizado: true,
      estado: 'UTILIZADA',
    });

    await expect(
      firstValueFrom(http.post('http://localhost:8080/api/entradas/EP-TEST0001/validar', {})),
    ).rejects.toMatchObject({
      status: 409,
      error: {
        error: 'ENTRADA_UTILIZADA',
        mensaje: 'Entrada ya utilizada',
      },
    } satisfies Partial<HttpErrorResponse>);
  });

  it('responde 404 para un código desconocido', async () => {
    await expect(
      firstValueFrom(http.post('http://localhost:8080/api/entradas/DESCONOCIDO/validar', {})),
    ).rejects.toMatchObject({
      status: 404,
      error: {
        error: 'ENTRADA_NO_EXISTE',
        mensaje: 'Entrada no encontrada',
      },
    } satisfies Partial<HttpErrorResponse>);
  });
});
