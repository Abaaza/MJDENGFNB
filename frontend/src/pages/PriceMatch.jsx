import { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function PriceMatch() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/match`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Match failed');
      const data = await res.json();
      const formatted = data.map((r) => ({
        ...r,
        selected: 0,
        qty: r.quantity || 0,
      }));
      setRows(formatted);
      setError('');
    } catch (err) {
      console.error('Price match error', err);
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function updateSelection(i, idx) {
    setRows((rows) =>
      rows.map((r, j) => (j === i ? { ...r, selected: idx } : r))
    );
  }

  function updateQty(i, val) {
    setRows((rows) =>
      rows.map((r, j) => (j === i ? { ...r, qty: val } : r))
    );
  }

  function rowTotal(r) {
    const m = r.matches[r.selected] || {};
    const q = parseFloat(r.qty) || 0;
    const rate = m.unitRate != null ? m.unitRate : 0;
    return q * rate;
  }

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">Price Match</h1>
      <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
      {loading && <p className="text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto border rounded text-xs">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 border-r text-left">Description</th>
                <th className="px-2 py-1 border-r text-left">Match</th>
                <th className="px-2 py-1 border-r text-left">Unit</th>
                <th className="px-2 py-1 border-r text-left">Qty</th>
                <th className="px-2 py-1 border-r text-left">Rate</th>
                <th className="px-2 py-1 border-r text-left">Total</th>
                <th className="px-2 py-1 text-left">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const m = r.matches[r.selected] || {};
                return (
                  <tr key={i}>
                    <td className="px-2 py-1 border-t border-r">{r.inputDescription}</td>
                    <td className="px-2 py-1 border-t border-r">
                      <select
                        value={r.selected}
                        onChange={(e) => updateSelection(i, Number(e.target.value))}
                        className="border rounded px-1"
                      >
                        {r.matches.map((m, idx) => (
                          <option key={idx} value={idx}>
                            {m.code} - {m.description}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1 border-t border-r">{m.unit || ''}</td>
                    <td className="px-2 py-1 border-t border-r">
                      <input
                        type="number"
                        value={r.qty}
                        onChange={(e) => updateQty(i, e.target.value)}
                        className="w-20 border rounded px-1"
                      />
                    </td>
                    <td className="px-2 py-1 border-t border-r">
                      {m.unitRate != null ? m.unitRate : ''}
                    </td>
                    <td className="px-2 py-1 border-t border-r">{rowTotal(r).toFixed(2)}</td>
                    <td className="px-2 py-1 border-t">{m.confidence}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="px-2 py-1 text-right font-semibold border-t">
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
      )}
    </div>
  );
}
