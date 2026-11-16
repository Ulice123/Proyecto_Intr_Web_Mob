import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';
import { ResultadoValidacion } from './validacion.model';
import { ValidacionService } from './validacion.service';

describe('ValidacionService', () => {
  let service: ValidacionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ValidacionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('retorna AUTORIZADO cuando el servidor responde 200 con autorizado=true', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-A1B2C3D4').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-A1B2C3D4/validar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ codigo: 'EP-A1B2C3D4', autorizado: true, estado: 'UTILIZADA' });

    expect(resultado).toEqual({
      tipo: 'AUTORIZADO',
      codigo: 'EP-A1B2C3D4',
      estado: 'UTILIZADA',
    });
  });

  it('retorna RECHAZADO NO_AUTORIZADO cuando el servidor responde 200 con autorizado=false', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-TEST0001').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-TEST0001/validar`);
    req.flush({ codigo: 'EP-TEST0001', autorizado: false, mensaje: 'No permitido' });

    expect(resultado).toEqual({
      tipo: 'RECHAZADO',
      codigo: 'EP-TEST0001',
      causa: 'NO_AUTORIZADO',
      mensaje: 'No permitido',
    });
  });

  it('retorna RECHAZADO ENTRADA_UTILIZADA cuando el servidor responde 409', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-A1B2C3D4').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-A1B2C3D4/validar`);
    req.flush(
      { error: 'ENTRADA_UTILIZADA', mensaje: 'Entrada ya utilizada' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(resultado).toEqual({
      tipo: 'RECHAZADO',
      codigo: 'EP-A1B2C3D4',
      causa: 'ENTRADA_UTILIZADA',
      mensaje: 'Entrada ya utilizada',
    });
  });

  it('retorna RECHAZADO ENTRADA_NO_EXISTE cuando el servidor responde 404 con cuerpo', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-NOEXISTE').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-NOEXISTE/validar`);
    req.flush(
      { error: 'ENTRADA_NO_EXISTE', mensaje: 'Entrada no encontrada en BD' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(resultado).toEqual({
      tipo: 'RECHAZADO',
      codigo: 'EP-NOEXISTE',
      causa: 'ENTRADA_NO_EXISTE',
      mensaje: 'Entrada no encontrada en BD',
    });
  });

  it('retorna RECHAZADO ENTRADA_NO_EXISTE con mensaje por defecto cuando 404 no tiene cuerpo', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-NOEXISTE').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-NOEXISTE/validar`);
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(resultado).toEqual({
      tipo: 'RECHAZADO',
      codigo: 'EP-NOEXISTE',
      causa: 'ENTRADA_NO_EXISTE',
      mensaje: 'Entrada no encontrada',
    });
  });

  it('retorna ERROR cuando ocurre un error de red (status 0)', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-A1B2C3D4').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-A1B2C3D4/validar`);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(resultado).toEqual({
      tipo: 'ERROR',
      codigo: 'EP-A1B2C3D4',
      mensaje: 'No se pudo contactar al servidor',
    });
  });

  it('retorna ERROR cuando el servidor responde 500', () => {
    let resultado: ResultadoValidacion | undefined;
    service.validar('EP-A1B2C3D4').subscribe((res) => (resultado = res));

    const req = httpTesting.expectOne(`${environment.gatewayUrl}/api/entradas/EP-A1B2C3D4/validar`);
    req.flush({ error: 'INTERNAL' }, { status: 500, statusText: 'Internal Server Error' });

    expect(resultado).toEqual({
      tipo: 'ERROR',
      codigo: 'EP-A1B2C3D4',
      mensaje: 'Error del servidor (HTTP 500)',
    });
  });

  it('codifica caracteres especiales del código en la URL', () => {
    const codigo = 'EP/A+B C?1#2';
    let resultado: ResultadoValidacion | undefined;
    service.validar(codigo).subscribe((res) => (resultado = res));

    const expectedUrl = `${environment.gatewayUrl}/api/entradas/${encodeURIComponent(codigo)}/validar`;
    const req = httpTesting.expectOne(expectedUrl);
    req.flush({ codigo, autorizado: true, estado: 'UTILIZADA' });

    expect(resultado?.tipo).toBe('AUTORIZADO');
  });

  it('usa gatewayUrl de ConfigService y elimina barra final', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { gatewayUrl: 'https://custom-gw.test/' } },
      ],
    });
    const customService = TestBed.inject(ValidacionService);
    const customHttpTesting = TestBed.inject(HttpTestingController);

    let resultado: ResultadoValidacion | undefined;
    customService.validar('EP-A1B2C3D4').subscribe((res) => (resultado = res));

    const req = customHttpTesting.expectOne('https://custom-gw.test/api/entradas/EP-A1B2C3D4/validar');
    req.flush({ codigo: 'EP-A1B2C3D4', autorizado: true, estado: 'UTILIZADA' });

    expect(resultado?.tipo).toBe('AUTORIZADO');
    customHttpTesting.verify();
  });
});
