import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultadoValidacion } from '../core/validacion.model';
import { ValidacionService } from '../core/validacion.service';

export interface LecturaHistorial {
  hora: string;
  codigo: string;
  tipo: ResultadoValidacion['tipo'];
}

const MAX_HISTORIAL = 5;

function formatearHora(fecha: Date): string {
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  const ss = String(fecha.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

@Component({
  selector: 'app-acceso',
  imports: [FormsModule],
  templateUrl: './acceso.component.html',
  styleUrl: './acceso.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'onWindowKeydown($event)',
  },
})
export class AccesoComponent {
  private readonly validacionService = inject(ValidacionService);
  private readonly codigoInput = viewChild<ElementRef<HTMLInputElement>>('codigoInput');

  protected readonly codigo = signal('');
  protected readonly codigoNormalizado = computed(() => this.codigo().trim().toUpperCase());
  protected readonly validando = signal(false);
  protected readonly codigoEnCurso = signal('');
  protected readonly resultado = signal<ResultadoValidacion | null>(null);
  protected readonly historial = signal<LecturaHistorial[]>([]);

  protected onCodigoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.codigo.set(input.value);
  }

  protected onWindowKeydown(event: KeyboardEvent): void {
    const el = this.codigoInput()?.nativeElement;
    if (!el || document.activeElement === el) {
      return;
    }
    const activeTag = document.activeElement?.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') {
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      el.focus();
    }
  }

  protected validar(): void {
    const codigo = this.codigoNormalizado();
    if (this.validando() || !codigo) {
      return;
    }

    this.validando.set(true);
    this.codigoEnCurso.set(codigo);

    this.validacionService.validar(codigo).subscribe((res) => {
      this.validando.set(false);
      this.codigoEnCurso.set('');
      this.resultado.set(res);
      this.codigo.set('');
      this.agregarHistorial(res);
      this.enfocarInput();
    });
  }

  private agregarHistorial(res: ResultadoValidacion): void {
    const entrada: LecturaHistorial = {
      hora: formatearHora(new Date()),
      codigo: res.codigo,
      tipo: res.tipo,
    };
    this.historial.update((prev) => [entrada, ...prev].slice(0, MAX_HISTORIAL));
  }

  private enfocarInput(): void {
    const el = this.codigoInput()?.nativeElement;
    if (!el) {
      return;
    }
    el.focus();
    setTimeout(() => el.focus());
  }
}
