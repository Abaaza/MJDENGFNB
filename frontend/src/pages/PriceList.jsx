import { useState } from 'react';
import { usePrices, useUpdatePrice, useSearchPrices } from '../hooks/usePrices';
import Spinner from '../components/Spinner';

export default function PriceList() {
  const [search, setSearch] = useState('');
  const pricesQuery = usePrices();
  const searchQuery = useSearchPrices(search);
  const data = search ? searchQuery.data ?? [] : pricesQuery.data ?? [];
  const isLoading = search ? searchQuery.isLoading : pricesQuery.isLoading;
  const error = search ? searchQuery.error : pricesQuery.error;
  const update = useUpdatePrice();
  const [editing, setEditing] = useState({});

  if (isLoading) return <Spinner className="py-10" />;
  if (error) return <p className="text-red-600">{error.message}</p>;

  function handleChange(id, field, value) {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  function handleSave(id) {
    if (editing[id]) {
      const upd = { ...editing[id] };
      if (typeof upd.keywords === 'string') {
        upd.keywords = upd.keywords
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (typeof upd.phrases === 'string') {
        upd.phrases = upd.phrases
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      update.mutate({ id, updates: upd });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-brand-dark">Price List</h1>
      <div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-2 py-1 rounded mb-2 w-64"
        />
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Sub Category</th>
            <th className="p-2 text-left">Unit</th>
            <th className="p-2 text-left">Rate</th>
            <th className="p-2 text-left">Keywords</th>
            <th className="p-2 text-left">Phrases</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const {
              _id,
              description,
              category,
              subCategory,
              unit,
              rate,
              keywords = [],
              phrases = [],
            } = item;
            const values = editing[_id] || {};
            return (
              <tr key={_id} className="border-b">
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.description ?? description}
                    onChange={e => handleChange(_id, 'description', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.category ?? category}
                    onChange={e => handleChange(_id, 'category', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.subCategory ?? subCategory}
                    onChange={e => handleChange(_id, 'subCategory', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.unit ?? unit}
                    onChange={e => handleChange(_id, 'unit', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    className="w-full border px-2 py-1"
                    value={values.rate ?? rate}
                    onChange={e => handleChange(_id, 'rate', parseFloat(e.target.value))}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.keywords ?? keywords.join(', ')}
                    onChange={e => handleChange(_id, 'keywords', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-full border px-2 py-1"
                    value={values.phrases ?? phrases.join(', ')}
                    onChange={e => handleChange(_id, 'phrases', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleSave(_id)}
                    className="px-3 py-1 bg-brand-accent text-white rounded"
                  >
                    Save
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
