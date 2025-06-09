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

  const idx = {
    code: header.findIndex(h => /bq.?id/i.test(h)),
    ref: header.findIndex(h => /^ref/i.test(h)),
    category: header.findIndex(h => /category/i.test(h)),
    subCategory: header.findIndex(h => /sub.?category/i.test(h)),
    description: header.findIndex(h => /description|desc|details/i.test(h)),
    unit: header.findIndex(h => /^unit$/i.test(h)),
    rate1: header.findIndex(h => /rate\s*1/i.test(h)),
    rate2: header.findIndex(h => /rate\s*2/i.test(h)),
    keywords: header.findIndex(h => /keyword/i.test(h)),
    phrases: header.findIndex(h => /phrase/i.test(h)),
  };

  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const code = idx.code !== -1 ? r[idx.code] : r[0];
    const desc = idx.description !== -1 ? r[idx.description] : r[3];
    if (!code || !desc) continue;
    const item = {
      code: String(code),
      ref: idx.ref !== -1 ? (r[idx.ref] ? String(r[idx.ref]) : undefined) : undefined,
      category: idx.category !== -1 ? r[idx.category] || undefined : undefined,
      subCategory: idx.subCategory !== -1 ? r[idx.subCategory] || undefined : undefined,
      description: desc,
      unit: idx.unit !== -1 ? r[idx.unit] || undefined : r[4] || undefined,
      rate:
        idx.rate1 !== -1 && r[idx.rate1] !== ''
          ? Number(r[idx.rate1])
          : idx.rate2 !== -1 && r[idx.rate2] !== ''
          ? Number(r[idx.rate2])
          : r[6] !== ''
          ? Number(r[6])
          : r[7] !== ''
          ? Number(r[7])
          : undefined,
      keywords:
        idx.keywords !== -1 && r[idx.keywords]
          ? String(r[idx.keywords])
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : undefined,
      phrases:
        idx.phrases !== -1 && r[idx.phrases]
          ? String(r[idx.phrases])
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : undefined,
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
