import XLSX from 'xlsx';

function preprocess(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
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

function detectHeader(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(v => String(v).trim());
    if (
      row.some(c => /description/i.test(c)) &&
      row.some(c => /rate/i.test(c))
    ) {
      return { header: row, index: i };
    }
  }
  return null;
}

function parseRows(rows, startIdx) {
  const header = rows[startIdx];
  const codeIdx = header.findIndex(h => /code|item|ref|id/i.test(h));
  const descIdx = header.findIndex(h => /description/i.test(h));
  const qtyIdx = header.findIndex(h => /qty|quantity/i.test(h));
  const rateIdx = header.findIndex(h => /rate|price/i.test(h));

  const items = [];
  for (let i = startIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(v => v === '' || v === null)) continue;
    const desc = r[descIdx];
    if (!desc) continue;
    const code = codeIdx !== -1 ? r[codeIdx] : '';
    const qty = qtyIdx !== -1 ? Number(r[qtyIdx] || 0) : 0;
    const rate = rateIdx !== -1 && r[rateIdx] !== '' ? Number(r[rateIdx]) : null;
    items.push({
      code: String(code || ''),
      description: String(desc || ''),
      qty,
      rate,
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

export function matchItems(inputItems, priceItems) {
  return inputItems.map(item => {
    let best = null;
    let bestScore = 0;
    for (const p of priceItems) {
      const s = 0.6 * ratio(item.descClean, p.descClean) +
                0.4 * jaccard(item.descClean, p.descClean);
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }
    }
    const rate = best && best.rate != null ? best.rate : null;
    const total = rate != null ? rate * item.qty : null;
    return {
      inputDescription: item.description,
      matchedCode: best ? best.code : '',
      matchedDescription: best ? best.description : '',
      quantity: item.qty,
      unitRate: rate,
      total,
      confidence: Math.round(bestScore * 1000) / 1000
    };
  });
}

export function matchFromFiles(priceFilePath, inputBuffer) {
  const priceItems = loadPriceList(priceFilePath);
  const inputItems = parseInputBuffer(inputBuffer);
  return matchItems(inputItems, priceItems);
}
