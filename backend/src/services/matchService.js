import XLSX from 'xlsx';

const synonymMap = {
  bricks: 'brick',
  brickwork: 'brick',
  blocks: 'brick',
  blockwork: 'brick',
  cement: 'concrete',
  concrete: 'concrete',
  footing: 'foundation',
  footings: 'foundation',
  excavation: 'excavate',
  excavations: 'excavate',
  excavate: 'excavate',
  dig: 'excavate',
  installation: 'install',
  installing: 'install',
  installed: 'install',
  demolition: 'demolish',
  demolish: 'demolish',
  demolishing: 'demolish',
  remove: 'demolish',
  supply: 'provide',
  supplies: 'provide',
  providing: 'provide'
};

const STOP_WORDS = new Set([
  'the','and','of','to','in','for','on','at','by','from','with',
  'a','an','be','is','are','as','it','its','into','or'
]);

function applySynonyms(text) {
  return text.split(' ').map(w => {
    const mapped = synonymMap[w];
    if (mapped) return mapped;
    if (w.length > 3) {
      return w.replace(/(ings|ing|ed|es|s)$/u, '');
    }
    return w;
  }).join(' ');
}

function removeStopWords(text) {
  return text
    .split(' ')
    .filter(w => w && !STOP_WORDS.has(w))
    .join(' ');
}

function preprocess(text) {
  const cleaned = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' ') // drop standalone numbers
    .replace(/\s+(mm|cm|m|inch|in|ft)\b/g, ' ') // drop units
    .replace(/\s+/g, ' ')
    .trim();
  const normalized = applySynonyms(cleaned);
  return removeStopWords(normalized);
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

function wordFreq(text) {
  const freq = Object.create(null);
  for (const w of text.split(' ')) {
    if (!w) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

function cosineSim(a, b) {
  const fa = wordFreq(a);
  const fb = wordFreq(b);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const w in fa) {
    const v = fa[w];
    normA += v * v;
  }
  for (const w in fb) {
    const v = fb[w];
    normB += v * v;
    if (fa[w]) dot += v * fa[w];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

function jaroWinkler(a, b) {
  if (a === b) return 1;
  const lenA = a.length;
  const lenB = b.length;
  if (!lenA || !lenB) return 0;
  const matchDist = Math.floor(Math.max(lenA, lenB) / 2) - 1;
  const aMatches = new Array(lenA).fill(false);
  const bMatches = new Array(lenB).fill(false);
  let matches = 0;
  for (let i = 0; i < lenA; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, lenB);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] === b[j]) {
        aMatches[i] = bMatches[j] = true;
        matches++;
        break;
      }
    }
  }
  if (!matches) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < lenA; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;
  const jaro =
    (matches / lenA + matches / lenB + (matches - transpositions) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, lenA, lenB); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
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
  return items.filter(
    it =>
      it.rate !== null &&
      it.rate !== undefined &&
      it.unit &&
      String(it.unit).trim() !== ''
  );
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
  function pickDiverse(sorted) {
    const out = [];
    for (const cand of sorted) {
      const tooSimilar = out.some(m => jaccard(m.item.descClean, cand.item.descClean) > 0.8);
      if (!tooSimilar) out.push(cand);
      if (out.length >= limit) break;
    }
    if (out.length < limit) {
      for (const cand of sorted) {
        if (!out.includes(cand)) {
          out.push(cand);
          if (out.length >= limit) break;
        }
      }
    }
    return out;
  }

  return inputItems.map(item => {
    const scored = [];
    for (const p of priceItems) {
      const jw = jaroWinkler(item.descClean, p.descClean);
      const c = cosineSim(item.descClean, p.descClean);
      const t = tokenSetRatio(item.descClean, p.descClean);
      const s = 0.4 * jw + 0.4 * c + 0.2 * t;
      scored.push({ item: p, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    const diverse = pickDiverse(scored);
    const matches = diverse.map(m => ({
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
