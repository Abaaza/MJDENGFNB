// src/services/bluebeamParser.js
// Utilities to parse BlueBeam XML/CSV exports

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import xml2js from 'xml2js';

export async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });
  return records.map(r => ({
    description: r.Description,
    measurement: Number(r.Measurement || 0),
    unit: r.Units,
    scale: r.Scale || '',
  }));
}

export async function parseXML(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = await xml2js.parseStringPromise(content);
  const items = data?.Measurements?.Item || [];
  return items.map(i => ({
    description: i.Description?.[0] || '',
    measurement: Number(i.Value?.[0] || 0),
    unit: i.Units?.[0] || '',
    scale: i.Scale?.[0] || '',
  }));
}