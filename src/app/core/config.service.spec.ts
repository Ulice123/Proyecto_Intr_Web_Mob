import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    service = new ConfigService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa gatewayUrl de config.json cuando está definido y elimina la barra final', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ gatewayUrl: 'https://gw.ejemplo.cl///' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await service.load();

    expect(globalThis.fetch).toHaveBeenCalledWith('config.json', { cache: 'no-store' });
    expect(service.gatewayUrl).toBe('https://gw.ejemplo.cl');
  });

  it('mantiene environment.gatewayUrl cuando config.json tiene gatewayUrl vacío', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ gatewayUrl: '   ' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await service.load();

    expect(service.gatewayUrl).toBe(environment.gatewayUrl);
  });

  it('mantiene environment.gatewayUrl cuando config.json responde 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await service.load();

    expect(service.gatewayUrl).toBe(environment.gatewayUrl);
  });

  it('mantiene environment.gatewayUrl cuando fetch falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    await service.load();

    expect(service.gatewayUrl).toBe(environment.gatewayUrl);
  });
});
