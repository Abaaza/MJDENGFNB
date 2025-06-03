import assert from 'node:assert/strict';
import fs from 'fs';
import { matchFromFiles } from '../src/services/matchService.js';

const pricePath = '../frontend/MJD-PRICELIST.xlsx';
const inputBuf = fs.readFileSync('../frontend/Input.xlsx');

const results = matchFromFiles(pricePath, inputBuf);

assert.ok(Array.isArray(results));
assert.ok(results.length > 0);
assert.ok(results[0].hasOwnProperty('inputDescription'));
assert.ok(results[0].hasOwnProperty('confidence'));

