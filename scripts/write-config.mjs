import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.GATEWAY_URL !== undefined) {
  const target = fileURLToPath(
    new URL('../dist/eventpass-acceso/browser/config.json', import.meta.url),
  );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    JSON.stringify({ gatewayUrl: process.env.GATEWAY_URL ?? '' }, null, 2) + '\n',
    'utf8',
  );
}
