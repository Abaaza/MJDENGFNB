import { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const API_URL = import.meta.env.VITE_API_URL || 'https://2gng2p5vnc.execute-api.me-south-1.amazonaws.com';

export default function PriceMatch() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workbook, setWorkbook] = useState(null);
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
    } else if (cohereKey) {
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

  function buildData() {
    return rows.map((r) => ({
      Description: r.inputDescription,
      Code: r.code,
      Match: r.matchDesc,
      Unit: r.unit,
      Qty: r.qty,
      Rate: r.rate,
      Engine: r.engine,
      Confidence: r.confidence,
      Total: rowTotal(r).toFixed(2),
    }));
  }

  function exportExcel() {
    const data = buildData();
    const resultSheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    if (workbook) {
      for (const name of workbook.SheetNames) {
        XLSX.utils.book_append_sheet(wb, workbook.Sheets[name], name);
      }
    }
    XLSX.utils.book_append_sheet(wb, resultSheet, 'Results');
    XLSX.writeFile(wb, 'price_match.xlsx');
  }

  function exportPdf() {
    const data = buildData();
    const headers = Object.keys(data[0] || {});
    const body = data.map((d) => headers.map((h) => d[h]));
    const doc = new jsPDF();
    autoTable(doc, { head: [headers], body });
    doc.save('price_match.pdf');
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
                <th className="px-2 py-1 border-r text-left">Engine</th>
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
                      <textarea
                        readOnly
                        value={r.matchDesc}
                        className="min-w-[20rem] border rounded px-1 mt-1 text-xs"
                      />
                      <input
                        type="text"
                        value={r.code}
                        onChange={(e) => updateField(i, 'code', e.target.value)}
                        className="w-32 border rounded px-1 mt-1"
                      />
                    </td>
                    <td className="px-2 py-1 border-t border-r">
                      <input
                        type="text"
                        value={r.unit}
                        onChange={(e) => updateField(i, 'unit', e.target.value)}
                        className="w-16 border rounded px-1"
                      />
                    </td>
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
                    <td className="px-2 py-1 border-t border-r">{r.engine}</td>
                    <td className="px-2 py-1 border-t border-r">
                      <input
                        type="number"
                        value={r.confidence}
                        onChange={(e) => updateField(i, 'confidence', e.target.value)}
                        className="w-20 border rounded px-1"
                      />
                    </td>
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
                <td colSpan="7" className="px-2 py-1 text-right font-semibold border-t">
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
          <button onClick={exportPdf} className="px-4 py-2 bg-brand-dark text-white rounded hover:bg-brand-accent">PDF</button>
        </div>
        </>
      )}
    </div>
  );
}
