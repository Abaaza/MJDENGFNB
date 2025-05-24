// src/services/boqService.js
// Handles BoQ parsing, merging and pricing

import fs from 'fs';
import * as XLSX from 'xlsx';
import { parseCSV, parseXML } from './bluebeamParser.js';

export function parseBoqFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows.map(r => ({
    code: r.Code || '',
    description: r.Description || '',
    qty: Number(r.Quantity || 0),
    unit: r.Unit || '',
  }));
}

export function mergeBoq(clientBoq, systemItems) {
  const map = new Map();
  for (const item of systemItems) map.set(item.code, item);
  const merged = [];
  for (const item of clientBoq) {
    if (map.has(item.code)) {
      merged.push({ ...item, duplicate: true });
      map.delete(item.code);
    } else {
      merged.push(item);
    }
  }
  return merged.concat(Array.from(map.values()));
}

export async function importBluebeam(filePath) {
  if (filePath.endsWith('.csv')) return parseCSV(filePath);
  if (filePath.endsWith('.xml')) return parseXML(filePath);
  throw new Error('Unsupported BlueBeam format');
}