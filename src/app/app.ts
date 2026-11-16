import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccesoComponent } from './acceso/acceso.component';

@Component({
  imports: [AccesoComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
