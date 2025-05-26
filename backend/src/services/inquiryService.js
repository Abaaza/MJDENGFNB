// src/services/inquiryService.js
// Handles incoming inquiry emails and document management

import fs from 'fs';
import path from 'path';

const BASE_DIR = process.env.SHAREFILE_BASE || './sharefile';

function findExistingFolder(projectCode) {
  if (!fs.existsSync(BASE_DIR)) return null;
  const entries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
  const match = entries.find(
    d => d.isDirectory() && d.name.startsWith(`Tender_${projectCode}_`)
  );
  return match ? path.join(BASE_DIR, match.name) : null;
}

export function getProjectFolder(projectCode) {
  return findExistingFolder(projectCode);
}


function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function createProjectFolder(projectCode, clientName, projectType, dueDate) {
    const existing = findExistingFolder(projectCode);
    if (existing) return existing;

  const folderName = `Tender_${projectCode}_${dueDate}`;
  const folderPath = path.join(BASE_DIR, folderName);
  ensureDir(folderPath);

  const metaPath = path.join(folderPath, 'metadata.json');
  if (!fs.existsSync(metaPath)) {
    const meta = {
      client: clientName,
      type: projectType,
      due: dueDate,
      created: new Date().toISOString(),
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  return folderPath;
}

export function addAddendum(folderPath, fileName, content) {
  ensureDir(folderPath);
  const versionName = `${Date.now()}_${fileName}`;
  fs.writeFileSync(path.join(folderPath, versionName), content);
  fs.writeFileSync(path.join(folderPath, 'current.txt'), fileName);

   const metaPath = path.join(folderPath, 'metadata.json');
  let meta = { documents: [] };
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch {
      meta = { documents: [] };
    }
  }
  meta.documents = meta.documents || [];
  meta.documents.push({
    file: versionName,
    original: fileName,
    timestamp: new Date().toISOString(),
  });
  meta.current = fileName;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

export function addBoqFile(folderPath, fileName, content) {
  ensureDir(folderPath);
  const versionName = `${Date.now()}_${fileName}`;
  fs.writeFileSync(path.join(folderPath, versionName), content);

  const metaPath = path.join(folderPath, 'metadata.json');
  let meta = {};
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch {
      meta = {};
    }
  }
  meta.boq = meta.boq || [];
  meta.boq.push({
    file: versionName,
    original: fileName,
    timestamp: new Date().toISOString(),
  });
  meta.boqCurrent = fileName;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
}

export function savePricingResult(folderPath, result) {
  ensureDir(folderPath);
  const pricePath = path.join(folderPath, 'pricing.json');
  let history = [];
  if (fs.existsSync(pricePath)) {
    try {
      history = JSON.parse(fs.readFileSync(pricePath, 'utf8'));
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }
  }
  history.push({ timestamp: new Date().toISOString(), ...result });
  fs.writeFileSync(pricePath, JSON.stringify(history, null, 2));
}

export function getPricingHistory(folderPath) {
  const pricePath = path.join(folderPath, 'pricing.json');
  if (!fs.existsSync(pricePath)) return [];
  try {
    const history = JSON.parse(fs.readFileSync(pricePath, 'utf8'));
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}



export function processEmail(msg) {
  const { projectCode, client, type, due, attachments = [] } = msg;
  const folder = createProjectFolder(projectCode, client, type, due);
  for (const att of attachments) {
    addAddendum(folder, att.filename, att.content);
  }

  return folder;
}