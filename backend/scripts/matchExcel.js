import fs from 'fs';
import path from 'path';
import { matchFromFiles } from '../src/services/matchService.js';

const [,, pricePath, inputPath] = process.argv;

if (!pricePath || !inputPath) {
  console.error('Usage: node matchExcel.js <price_list.xlsx> <input.xlsx>');
  process.exit(1);
}

const priceFile = path.resolve(pricePath);
const inputFile = path.resolve(inputPath);

try {
  const buf = fs.readFileSync(inputFile);
  const results = matchFromFiles(priceFile, buf);
  console.log(JSON.stringify(results, null, 2));
} catch (err) {
  console.error('Match failed:', err.message);
  process.exit(1);
}
