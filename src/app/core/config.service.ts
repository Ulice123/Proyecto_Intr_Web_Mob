import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

interface RuntimeConfig {
  gatewayUrl?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private _gatewayUrl = environment.gatewayUrl;

  get gatewayUrl(): string {
    return this._gatewayUrl;
  }

  /**
   * Carga config.json en tiempo de ejecución. Si falla o está vacío, mantiene environment.gatewayUrl.
   */
  async load(): Promise<void> {
    try {
      const response = await fetch('config.json', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as RuntimeConfig | null;
      if (data && typeof data.gatewayUrl === 'string') {
        const trimmed = data.gatewayUrl.trim().replace(/\/+$/, '');
        if (trimmed.length > 0) {
          this._gatewayUrl = trimmed;
        }
      }
    } catch {
      // Mantiene environment.gatewayUrl si config.json no está disponible o es inválido
    }
  }
}
