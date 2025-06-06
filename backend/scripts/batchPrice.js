import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';
import { parseBoqFile, priceBoq } from '../src/services/boqService.js';

dotenv.config();

const RATE_FILE = process.env.RATE_FILE || path.resolve('backend/MJD-PRICELIST.xlsx');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node batchPrice.js <file1> <file2> ...');
  process.exit(1);
}

for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${file}`);
    continue;
  }
  try {
    const items = parseBoqFile(abs);
    const result = priceBoq(items, RATE_FILE);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.items);
    XLSX.utils.book_append_sheet(wb, ws, 'BoQ');
    const outName = path.join(path.dirname(abs), `priced_${path.basename(file, path.extname(file))}.xlsx`);
    XLSX.writeFile(wb, outName);
    console.log(`Priced ${file} -> ${outName}`);
  } catch (err) {
    console.error(`Failed to process ${file}:`, err.message);
  }
}
