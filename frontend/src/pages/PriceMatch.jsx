import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
const API_URL = import.meta.env.VITE_API_URL || 'https://2gng2p5vnc.execute-api.me-south-1.amazonaws.com';

export default function PriceMatch() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workbook, setWorkbook] = useState(null);
  const [editing, setEditing] = useState({});
  const [showSave, setShowSave] = useState(false);
  const [project, setProject] = useState({ id: '', client: '', type: '', due: '' });
  const timerRef = useRef(null);
  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      if (accepted && accepted[0]) handleFile(accepted[0]);
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });


  async function handleFile(file) {
    if (!file) return;
    const openaiKey = localStorage.getItem('openaiKey') || '';
    const cohereKey = localStorage.getItem('cohereKey') || '';
    const arrayBuffer = await file.arrayBuffer();
    setWorkbook(XLSX.read(arrayBuffer));
    const fd = new FormData();
    fd.append('file', file);
    if (openaiKey) {
      fd.append('openaiKey', openaiKey);
    }
    if (cohereKey) {
      fd.append('cohereKey', cohereKey);
    }
    console.log('Uploading file', file.name, file.size);
    console.log('Using OpenAI key:', openaiKey ? 'yes' : 'no');
    console.log('Using Cohere key:', cohereKey ? 'yes' : 'no');
    setLoading(true);
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 5 : 90));
    }, 500);
    try {
      const res = await fetch(`${API_URL}/api/match`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Match failed');
      const data = await res.json();
      console.log('Received results:', data.length);
      const formatted = data.map((r) => {
        const matches = (r.matches || []).filter(
          (m) =>
            m.unit &&
            String(m.unit).trim() !== '' &&
            m.unitRate !== null &&
            m.unitRate !== undefined
        );
        const first = matches[0] || {};
        return {
          ...r,
          matches,
          selected: 0,
          qty: r.quantity || 0,
          engine: r.engine || first.engine || '',
          code: first.code || '',
          matchDesc: first.description || '',
          unit: first.unit || '',
          rate: first.unitRate ?? '',
          confidence: first.confidence ?? '',
        };
      });
      setRows(formatted);
      setError('');
    } catch (err) {
      console.error('Price match error', err);
      setError(err.message);
      setRows([]);
    } finally {
      clearInterval(timerRef.current);
      setProgress(100);
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  function updateSelection(i, idx) {
    setRows((rows) =>
      rows.map((r, j) => {
        if (j !== i) return r;
        const m = r.matches[idx] || {};
        return {
          ...r,
          selected: idx,
          engine: m.engine || r.engine,
          code: m.code || '',
          matchDesc: m.description || '',
          unit: m.unit || '',
          rate: m.unitRate ?? '',
          confidence: m.confidence ?? '',
        };
      })
    );
  }

  function updateQty(i, val) {
    setRows((rows) =>
      rows.map((r, j) => (j === i ? { ...r, qty: val } : r))
    );
  }

  function updateField(i, field, val) {
    setRows((rows) =>
      rows.map((r, j) => (j === i ? { ...r, [field]: val } : r))
    );
  }

  function deleteRow(i) {
    setRows((rows) => rows.filter((_, j) => j !== i));
  }

  function rowTotal(r) {
    const q = parseFloat(r.qty) || 0;
    const rate = parseFloat(r.rate) || 0;
    return q * rate;
  }

  function toggleEdit(i) {
    setEditing((e) => ({ ...e, [i]: !e[i] }));
  }

  async function searchPricelist(i) {
    const desc = rows[i]?.inputDescription || '';
    try {
      const res = await fetch(`${API_URL}/api/prices/search?q=${encodeURIComponent(desc)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setRows((rows) =>
        rows.map((r, j) => {
          if (j !== i) return r;
          const searchMatches = data.map((d) => ({
            engine: 'search',
            code: d.code,
            description: d.description,
            unit: d.unit,
            unitRate: d.rate,
            confidence: ''
          }));
          const base = r.matches.filter((m) => m.engine !== 'search');
          return {
            ...r,
            matches: [...base, ...searchMatches]
          };
        })
      );
    } catch (err) {
      console.error('Search error', err);
    }
  }

  function buildData() {
    return rows.map((r) => ({
      description: r.inputDescription,
      code: r.code,
      match: r.matchDesc,
      unit: r.unit,
      qty: r.qty,
      rate: r.rate,
      confidence: r.confidence,
      total: rowTotal(r).toFixed(2),
    }));
  }

  function exportExcel() {
    if (!workbook) return;
    const name = workbook.SheetNames[0];
    const ws = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const headerIdx = data.findIndex((r) => r.some((c) => /(description|desc|details)/i.test(String(c))));
    const startCol = data[headerIdx].length;
    const extra = ['Code', 'Match', 'Unit', 'Rate', 'Confidence', 'Total'];
    XLSX.utils.sheet_add_aoa(ws, [extra], { origin: { r: headerIdx, c: startCol } });
    rows.forEach((r, i) => {
      const row = [r.code, r.matchDesc, r.unit, r.rate, r.confidence, rowTotal(r).toFixed(2)];
      XLSX.utils.sheet_add_aoa(ws, [row], { origin: { r: headerIdx + 1 + i, c: startCol } });
    });
    workbook.Sheets[name] = ws;
    XLSX.writeFile(workbook, 'price_match.xlsx');
  }

  function handleProjectChange(e) {
    setProject({ ...project, [e.target.name]: e.target.value });
  }

  async function saveToProject(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error('Failed to create project');

      const items = buildData();
      const saveRes = await fetch(`${API_URL}/api/projects/${project.id}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total: grandTotal }),
      });
      if (!saveRes.ok) throw new Error('Failed to save match');
      toast.success('Saved to project');
      setShowSave(false);
    } catch (err) {
      toast.error(err.message);
    }
  }

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">Price Match</h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${isDragActive ? 'bg-brand-light' : ''}`}
      >
        <input {...getInputProps()} accept=".xls,.xlsx" />
        <p className="text-sm text-gray-600 mb-2">Drag & drop an Excel file here, or click to browse</p>
        <button type="button" onClick={open} className="px-4 py-2 bg-brand-accent text-white rounded">Browse file</button>
      </div>
      {loading && (
        <div className="w-full bg-gray-200 h-2 rounded overflow-hidden mb-1">
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {loading && <p className="text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length > 0 && (
        <>
        <div className="overflow-x-auto border rounded text-xs shadow bg-white">
          <table className="min-w-full">
            <thead className="bg-brand-dark text-white text-left sticky top-0">
              <tr>
                <th className="px-2 py-1 border-r text-left">Description</th>
                <th className="px-2 py-1 border-r text-left">Match</th>
                <th className="px-2 py-1 border-r text-left">Unit</th>
                <th className="px-2 py-1 border-r text-left">Qty</th>
                <th className="px-2 py-1 border-r text-left">Rate</th>
                <th className="px-2 py-1 border-r text-left">Total</th>
                <th className="px-2 py-1 border-r text-left">Conf.</th>
                <th className="px-2 py-1 text-left">Del</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const m = r.matches[r.selected] || {};
                return (
                  <tr key={i} className="hover:bg-gray-50 even:bg-gray-50">
                    <td className="px-2 py-1 border-t border-r">
                      <textarea
                        readOnly
                        value={r.inputDescription}
                        className="min-w-[20rem] border rounded px-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1 border-t border-r">
                      <div className="space-y-1 mb-1">
                        {r.matches.map((m, idx) => (
                          <label key={idx} className="flex items-center gap-1">
                            <input
                              type="radio"
                              name={`match-${i}`}
                              checked={r.selected === idx}
                              onChange={() => updateSelection(i, idx)}
                              className="text-brand-accent"
                            />
                            <span>{m.code} - {m.description}</span>
                          </label>
                        ))}
                      </div>
                      {editing[i] ? (
                        <>
                          <textarea
                            value={r.matchDesc}
                            onChange={(e) => updateField(i, 'matchDesc', e.target.value)}
                            className="min-w-[20rem] border rounded px-1 mt-1 text-xs"
                          />
                          <input
                            type="text"
                            value={r.code}
                            onChange={(e) => updateField(i, 'code', e.target.value)}
                            className="w-32 border rounded px-1 mt-1"
                          />
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{r.code} - {r.matchDesc}</span>
                          <button onClick={() => toggleEdit(i)} className="text-blue-600">✎</button>
                        </div>
                      )}
                      <button onClick={() => searchPricelist(i)} className="ml-1 text-xs text-brand-accent underline">Search</button>
                    </td>
                    <td className="px-2 py-1 border-t border-r">{r.unit}</td>
                    <td className="px-2 py-1 border-t border-r">
                      <input
                        type="number"
                        value={r.qty}
                        onChange={(e) => updateQty(i, e.target.value)}
                        className="w-20 border rounded px-1"
                      />
                    </td>
                    <td className="px-2 py-1 border-t border-r">
                      <input
                        type="number"
                        value={r.rate}
                        onChange={(e) => updateField(i, 'rate', e.target.value)}
                        className="w-20 border rounded px-1"
                      />
                    </td>
                    <td className="px-2 py-1 border-t border-r">{rowTotal(r).toFixed(2)}</td>
                    <td className="px-2 py-1 border-t border-r">{r.confidence}</td>
                    <td className="px-2 py-1 border-t">
                      <button
                        onClick={() => deleteRow(i)}
                        className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6" className="px-2 py-1 text-right font-semibold border-t">
                  Total
                </td>
                <td className="px-2 py-1 border-t border-r font-semibold">
                  {grandTotal.toFixed(2)}
                </td>
                <td className="border-t" />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex gap-2 text-xs mt-2">
          <button onClick={exportExcel} className="px-4 py-2 bg-brand-dark text-white rounded hover:bg-brand-accent">Excel</button>
          <button onClick={() => setShowSave(!showSave)} className="px-4 py-2 bg-brand-accent text-white rounded hover:opacity-90">Save to Project</button>
        </div>
        {showSave && (
          <form onSubmit={saveToProject} className="mt-3 space-y-2 text-xs border p-3 rounded bg-gray-50 max-w-md">
            <div>
              <label className="block mb-1" htmlFor="proj-id">Code</label>
              <input id="proj-id" name="id" value={project.id} onChange={handleProjectChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block mb-1" htmlFor="proj-client">Client</label>
              <input id="proj-client" name="client" value={project.client} onChange={handleProjectChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block mb-1" htmlFor="proj-type">Type</label>
              <input id="proj-type" name="type" value={project.type} onChange={handleProjectChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <div>
              <label className="block mb-1" htmlFor="proj-due">Due</label>
              <input id="proj-due" name="due" type="date" value={project.due} onChange={handleProjectChange} className="w-full border rounded px-2 py-1" required />
            </div>
            <button type="submit" className="px-3 py-1 bg-brand-dark text-white rounded">Save</button>
          </form>
        )}
        </>
      )}
    </div>
  );
}
