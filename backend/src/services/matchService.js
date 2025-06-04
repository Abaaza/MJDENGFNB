import XLSX from 'xlsx';

function preprocess(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' ') // drop standalone numbers
    .replace(/\s+(mm|cm|m|inch|in|ft)\b/g, ' ') // drop units
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function ratio(a, b) {
  if (!a && !b) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length, 1);
}

function jaccard(a, b) {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const v of setA) if (setB.has(v)) inter++;
  return inter / (setA.size + setB.size - inter);
}

function tokenSetRatio(a, b) {
  const setA = new Set(a.split(' '));
  const setB = new Set(b.split(' '));
  const inter = new Set([...setA].filter(x => setB.has(x)));
  const aLeft = [...setA].filter(x => !inter.has(x)).join(' ');
  const bLeft = [...setB].filter(x => !inter.has(x)).join(' ');
  const sortedInter = [...inter].sort().join(' ');
  const ratio1 = ratio(sortedInter + ' ' + aLeft, sortedInter + ' ' + bLeft);
  const ratio2 = ratio(sortedInter, sortedInter + ' ' + aLeft + ' ' + bLeft);
  return Math.max(ratio1, ratio2);
}

function detectHeader(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(v => String(v).trim());
    if (
      row.some(c => /(description|desc|details)/i.test(c)) &&
      row.some(c => /(rate|price|unit\s*price|unit\s*rate)/i.test(c))
    ) {
      return { header: row, index: i };
    }
  }
  return null;
}

function parseRows(rows, startIdx) {
  const header = rows[startIdx];
  const codeIdx = header.findIndex(h => /(code|item|ref|id)/i.test(h));
  const descIdx = header.findIndex(h => /(description|desc|details)/i.test(h));
  const qtyIdx = header.findIndex(h => /(qty|quantity|amount)/i.test(h));
  const rateIdx = header.findIndex(h => /(rate|price|unit\s*price|unit\s*rate)/i.test(h));
  const unitIdx = header.findIndex(h => /(unit|uom)/i.test(h));

  const items = [];
  for (let i = startIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(v => v === '' || v === null)) continue;
    const desc = r[descIdx];
    if (!desc) continue;
    const code = codeIdx !== -1 ? r[codeIdx] : '';
    const qty = qtyIdx !== -1 ? Number(r[qtyIdx] || 0) : 0;
    const rate = rateIdx !== -1 && r[rateIdx] !== '' ? Number(r[rateIdx]) : null;
    const unit = unitIdx !== -1 ? String(r[unitIdx] || '') : '';
    items.push({
      code: String(code || ''),
      description: String(desc || ''),
      qty,
      rate,
      unit,
      descClean: preprocess(desc)
    });
  }
  return items;
}

export function loadPriceList(path) {
  const wb = XLSX.readFile(path);
  const items = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const hdr = detectHeader(rows);
    if (!hdr) continue;
    items.push(...parseRows(rows, hdr.index));
  }
  return items;
}

export function parseInputBuffer(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const hdr = detectHeader(rows);
  if (!hdr) return [];
  return parseRows(rows, hdr.index);
}

export function matchItems(inputItems, priceItems, limit = 4) {
  return inputItems.map(item => {
    const scored = [];
    for (const p of priceItems) {
      const base = 0.6 * ratio(item.descClean, p.descClean) +
                   0.4 * jaccard(item.descClean, p.descClean);
      const s = Math.max(base, tokenSetRatio(item.descClean, p.descClean));
      scored.push({ item: p, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    const matches = scored.slice(0, limit).map(m => ({
      code: m.item.code,
      description: m.item.description,
      unit: m.item.unit,
      unitRate: m.item.rate,
      confidence: Math.round(m.score * 1000) / 1000
    }));
    return {
      inputDescription: item.description,
      quantity: item.qty,
      matches
    };
  });
}

export function matchFromFiles(priceFilePath, inputBuffer) {
  const priceItems = loadPriceList(priceFilePath);
  console.log('Price list items loaded:', priceItems.length);
  const inputItems = parseInputBuffer(inputBuffer);
  console.log('Input items parsed:', inputItems.length);
  return matchItems(inputItems, priceItems, 4);
}
