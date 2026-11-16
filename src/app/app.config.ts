import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { environment } from '../environments/environment';
import { ConfigService } from './core/config.service';
import { mockGatewayInterceptor } from './core/mock-gateway.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(ConfigService).load()),
    provideHttpClient(withInterceptors(environment.mock ? [mockGatewayInterceptor] : [])),
  ],
};
