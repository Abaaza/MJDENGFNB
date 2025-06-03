import mongoose from 'mongoose';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import PriceItem from '../src/models/PriceItem.js';

dotenv.config();

async function main() {
  const conn = process.env.CONNECTION_STRING;
  if (!conn) {
    console.error('Missing CONNECTION_STRING');
    process.exit(1);
  }
  await mongoose.connect(conn);

  const wb = XLSX.readFile('Lookalike sheet.xlsx');
  const ws = wb.Sheets['SERVICES'];
  if (!ws) {
    console.error('SERVICES sheet not found');
    return;
  }
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });
  const header = rows[0];
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || !r[3]) continue; // require BQ Id and description
    const item = {
      code: String(r[0]),
      ref: r[1] ? String(r[1]) : undefined,
      description: r[3],
      unit: r[4] || undefined,
      rate: r[6] !== '' ? Number(r[6]) : r[7] !== '' ? Number(r[7]) : undefined,
    };
    items.push(item);
  }

  if (items.length === 0) {
    console.log('No items found');
    return;
  }

  await PriceItem.deleteMany({});
  await PriceItem.insertMany(items);
  console.log(`Imported ${items.length} price items.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
