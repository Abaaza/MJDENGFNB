import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function ProjectBoq() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_URL}/api/projects/${id}/pricing`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
          if (data.length) setRows(data[data.length - 1].items || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (id) fetchHistory();
  }, [id]);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        await uploadBoq(file);
        priceItems(json);
      } catch (err) {
        toast.error('Failed to read file');
      }
    };

    reader.readAsBinaryString(file);
  }

  async function uploadBoq(file) {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}/bluebeam`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      setRows(data);
      toast.success('Measurements merged');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function priceItems(items) {
    try {
      const res = await fetch(`${API_URL}/api/boq/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Pricing failed');
      const priced = await res.json();
      setRows(priced);
      toast.success('BoQ priced');
    } catch (err) {
      toast.error(err.message);
      setRows(items);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-dark">BoQ – {id}</h1>
        <Link to="/" className="text-brand-accent underline">
          ← Back
        </Link>
      </div>

      <input type="file" accept=".xls,.xlsx,.csv,.xml" onChange={handleFile} />

      {rows.length > 0 && (
        <>
          <button
            onClick={() => priceItems(rows)}
            className="mt-2 mb-2 px-3 py-1 bg-brand-dark text-white rounded"
          >
            Price BoQ
          </button>
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(rows[0]).map((h) => (
                    <th key={h} className="px-2 py-1 whitespace-nowrap text-left border-r">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((val, j) => (
                      <td key={j} className="px-2 py-1 border-t border-r">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {history.length > 0 && (
            <div className="mt-4 text-xs">
              <p className="font-semibold mb-1">Pricing history</p>
              <ul className="list-disc pl-4 space-y-1">
                {history.map((h, i) => (
                  <li key={i}>{new Date(h.timestamp).toLocaleString()} – total: {h.total}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
