import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..');

const proc = spawnSync('node', [
  'scripts/matchExcel.js',
  '../frontend/MJD-PRICELIST.xlsx',
  '../frontend/Input.xlsx'
], { encoding: 'utf8', cwd });

assert.strictEqual(proc.status, 0);
const data = JSON.parse(proc.stdout);
assert.ok(Array.isArray(data));
assert.ok(data.length > 0);
assert.ok(data[0].hasOwnProperty('confidence'));

