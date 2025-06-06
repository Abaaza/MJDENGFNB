import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { matchFromFiles } from '../src/services/matchService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pricePath = path.resolve(__dirname, '../MJD-PRICELIST.xlsx');
const inputBuf = fs.readFileSync(path.resolve(__dirname, '../../frontend/Input.xlsx'));

const results = matchFromFiles(pricePath, inputBuf);

assert.ok(Array.isArray(results));
assert.ok(results.length > 0);
assert.ok(results[0].hasOwnProperty('inputDescription'));
assert.ok(Array.isArray(results[0].matches));

