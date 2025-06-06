import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..');

const proc = spawnSync('node', [
  'scripts/matchExcel.js',
  'MJD-PRICELIST.xlsx',
  '../frontend/Input.xlsx'
], { encoding: 'utf8', cwd });

assert.strictEqual(proc.status, 0);
const lines = proc.stdout.trim().split('\n');
const start = lines.findIndex(l => l.trim().startsWith('['));
const jsonStr = lines.slice(start).join('\n');
const data = JSON.parse(jsonStr);
assert.ok(Array.isArray(data));
assert.ok(data.length > 0);
assert.ok(Array.isArray(data[0].matches));

