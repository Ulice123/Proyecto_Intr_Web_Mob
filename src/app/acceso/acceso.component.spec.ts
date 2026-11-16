import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { ResultadoValidacion } from '../core/validacion.model';
import { ValidacionService } from '../core/validacion.service';
import { AccesoComponent } from './acceso.component';

describe('AccesoComponent', () => {
  let fixture: ComponentFixture<AccesoComponent>;
  let response$: Subject<ResultadoValidacion>;
  let validacionServiceMock: { validar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    response$ = new Subject<ResultadoValidacion>();
    validacionServiceMock = {
      validar: vi.fn(() => response$.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [AccesoComponent],
      providers: [{ provide: ValidacionService, useValue: validacionServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccesoComponent);
    fixture.detectChanges();
  });

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input.codigo-input') as HTMLInputElement;
  }

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function getForm(): HTMLFormElement {
    return fixture.nativeElement.querySelector('form') as HTMLFormElement;
  }

  function getResultZone(): HTMLElement {
    return fixture.nativeElement.querySelector('.resultado-zona') as HTMLElement;
  }

  function setInput(value: string): void {
    const input = getInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    getForm().dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('shows initial neutral state and disabled button when input is empty', () => {
    expect(getResultZone().textContent).toContain('Esperando lectura…');
    expect(getButton().disabled).toBe(true);
  });

  it('normalizes code and calls validar once on submit', () => {
    setInput('  ep-test0001 ');
    submitForm();

    expect(validacionServiceMock.validar).toHaveBeenCalledTimes(1);
    expect(validacionServiceMock.validar).toHaveBeenCalledWith('EP-TEST0001');
    expect(getButton().disabled).toBe(true);
    expect(getButton().textContent?.trim()).toBe('Validando…');
    expect(getInput().readOnly).toBe(true);
    expect(getInput().disabled).toBe(false);
    expect(getResultZone().textContent).toContain('Validando EP-TEST0001…');
  });

  it('prevents double submit while validation is pending', () => {
    setInput('EP-TEST0001');
    submitForm();
    submitForm();

    expect(validacionServiceMock.validar).toHaveBeenCalledTimes(1);
  });

  it('clears input and restores focus after result arrives', () => {
    setInput('EP-TEST0001');
    submitForm();

    response$.next({ tipo: 'AUTORIZADO', codigo: 'EP-TEST0001', estado: 'UTILIZADA' });
    response$.complete();
    fixture.detectChanges();

    const input = getInput();
    expect(input.value).toBe('');
    expect(input.readOnly).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('renders AUTORIZADO, RECHAZADO (with mensaje), and ERROR states', () => {
    setInput('EP-OK-1');
    submitForm();
    response$.next({ tipo: 'AUTORIZADO', codigo: 'EP-OK-1', estado: 'UTILIZADA' });
    response$.complete();
    fixture.detectChanges();

    expect(getResultZone().textContent).toContain('✔ ACCESO AUTORIZADO');
    expect(getResultZone().textContent).toContain('EP-OK-1');

    response$ = new Subject<ResultadoValidacion>();
    setInput('EP-USADA');
    submitForm();
    response$.next({
      tipo: 'RECHAZADO',
      codigo: 'EP-USADA',
      causa: 'ENTRADA_UTILIZADA',
      mensaje: 'Entrada ya utilizada',
    });
    response$.complete();
    fixture.detectChanges();

    expect(getResultZone().textContent).toContain('✖ ACCESO RECHAZADO');
    expect(getResultZone().textContent).toContain('Entrada ya utilizada');
    expect(getResultZone().textContent).toContain('EP-USADA');

    response$ = new Subject<ResultadoValidacion>();
    setInput('EP-ERR');
    submitForm();
    response$.next({
      tipo: 'ERROR',
      codigo: 'EP-ERR',
      mensaje: 'No se pudo contactar al servidor',
    });
    response$.complete();
    fixture.detectChanges();

    expect(getResultZone().textContent).toContain('⚠ ERROR DE CONEXIÓN');
    expect(getResultZone().textContent).toContain('No se pudo validar. Intente nuevamente.');
    expect(getResultZone().textContent).toContain('EP-ERR');
  });

  it('does not call service when input is empty or whitespace', () => {
    submitForm();
    setInput('   ');
    submitForm();

    expect(validacionServiceMock.validar).not.toHaveBeenCalled();
  });

  it('allows validating the same code again after first validation finishes', () => {
    setInput('EP-REPEAT');
    submitForm();
    response$.next({ tipo: 'AUTORIZADO', codigo: 'EP-REPEAT', estado: 'UTILIZADA' });
    response$.complete();
    fixture.detectChanges();

    response$ = new Subject<ResultadoValidacion>();
    setInput('EP-REPEAT');
    submitForm();
    response$.next({
      tipo: 'RECHAZADO',
      codigo: 'EP-REPEAT',
      causa: 'ENTRADA_UTILIZADA',
      mensaje: 'Entrada ya utilizada',
    });
    response$.complete();
    fixture.detectChanges();

    expect(validacionServiceMock.validar).toHaveBeenCalledTimes(2);
    expect(getResultZone().textContent).toContain('✖ ACCESO RECHAZADO');
  });

  it('keeps at most 5 readings in history, newest first', () => {
    for (let i = 1; i <= 6; i++) {
      response$ = new Subject<ResultadoValidacion>();
      setInput(`EP-00${i}`);
      submitForm();
      response$.next({ tipo: 'AUTORIZADO', codigo: `EP-00${i}`, estado: 'UTILIZADA' });
      response$.complete();
      fixture.detectChanges();
    }

    const items = Array.from(
      fixture.nativeElement.querySelectorAll('.historial-item') as NodeListOf<HTMLElement>,
    );
    expect(items).toHaveLength(5);
    expect(items[0].textContent).toContain('EP-006');
    expect(items[4].textContent).toContain('EP-002');
    expect(items[0].querySelector('.historial-hora')?.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
