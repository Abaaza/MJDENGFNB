import XLSX from 'xlsx';
import fs from 'fs';
<<<<<<< HEAD:backend/scripts/exportPriceList.cjs

=======
>>>>>>> b4874feb0bc217881d4ae06175177def7b297ab9:backend/scripts/exportPriceList.js

const input = process.argv[2] || 'pricing/pricelist.xlsx';
const sheet = process.argv[3] || 'SERVICES';

const wb = XLSX.readFile(input);
const ws = wb.Sheets[sheet];
if (!ws) {
  console.error('Sheet not found:', sheet);
  process.exit(1);
}
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const items = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r[0] || !r[3]) continue; // require BQ Id and Description
  if (r[0] === 'BQ Id' || r[3] === 'Description') continue; // skip header rows
  const item = {
    code: String(r[0]),
    ref: r[1] ? String(r[1]) : undefined,
    description: r[3],
    unit: r[4] || undefined,
    rate: r[5] !== '' ? Number(r[5]) : undefined,
  };
  items.push(item);
}
fs.writeFileSync('pricing/db-pricelist.json', JSON.stringify(items, null, 2));
console.log('Wrote', items.length, 'items');
