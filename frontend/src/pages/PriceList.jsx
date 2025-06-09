import { useState } from 'react';
import { usePrices, useUpdatePrice } from '../hooks/usePrices';

export default function PriceList() {
  const { data, isLoading, error } = usePrices();
  const update = useUpdatePrice();
  const [editing, setEditing] = useState({});

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  function handleChange(id, field, value) {
    setEditing(e => ({ ...e, [id]: { ...e[id], [field]: value } }));
  }

  function handleSave(id) {
    update.mutate({ id, updates: editing[id] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-dark">Price List</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Unit</th>
            <th className="p-2 text-left">Rate</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const values = editing[item._id] || {};
            return (
              <tr key={item._id} className="border-b">
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    defaultValue={item.description}
                    onChange={e => handleChange(item._id, 'description', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    defaultValue={item.unit}
                    onChange={e => handleChange(item._id, 'unit', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    defaultValue={item.rate}
                    onChange={e => handleChange(item._id, 'rate', parseFloat(e.target.value))}
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleSave(item._id)}
                    className="px-3 py-1 bg-brand-accent text-white rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            );
          });
        </tbody>
      </table>
    </div>
  );
}
