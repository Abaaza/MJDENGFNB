import { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function PriceMatch() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/match`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Match failed');
      const data = await res.json();
      setRows(data);
      setError('');
    } catch (err) {
      setError(err.message);
      setRows([]);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">Price Match</h1>
      <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto border rounded text-xs">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(rows[0]).map(h => (
                  <th key={h} className="px-2 py-1 border-r text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {Object.values(r).map((v, j) => (
                    <td key={j} className="px-2 py-1 border-t border-r">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
