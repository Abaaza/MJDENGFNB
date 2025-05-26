// ProjectTable.jsx
import { useState, useMemo } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import format from 'date-fns/format';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';

export default function ProjectTable({ projects }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'due', dir: 1 });
  const [statuses, setStatuses] = useState([]);

  const navigate = useNavigate();

  /* ---------- filter + sort ---------- */
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return projects
      .filter((p) =>
        [p.id, p.client, p.type].some((f) => f.toLowerCase().includes(q))
      )
      .filter((p) => (statuses.length ? statuses.includes(p.status) : true));
  }, [projects, query, statuses]);

  const data = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      return aVal > bVal ? sort.dir : -sort.dir;
    });
  }, [filtered, sort]);

  /* ---------- header helper ---------- */
  const TH = (key, label) => (
    <th
      key={key}
      onClick={() =>
        setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))
      }
      className="px-6 py-3 cursor-pointer select-none whitespace-nowrap"
    >
      <div className="flex items-center gap-1">
        {label}
        {sort.key === key &&
          (sort.dir === 1 ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          ))}
      </div>
    </th>
  );

  /* ---------- empty state ---------- */
  if (!data.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">No inquiries yet</p>
      </div>
    );

  /* ---------- table ---------- */
  return (
    <div className="space-y-4">
      {/* search + status filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>

        {['NEW', 'UNDER_REVIEW', 'PRICED', 'SENT'].map((s) => (
          <button
            key={s}
            onClick={() =>
              setStatuses((st) =>
                st.includes(s) ? st.filter((x) => x !== s) : [...st, s]
              )
            }
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              statuses.includes(s) ? 'bg-brand-accent text-white' : 'bg-gray-100'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-sm rounded-lg text-sm">
          <thead className="bg-brand-light text-left font-semibold uppercase tracking-wide">
            <tr>
              {TH('id', 'Code')}
              {TH('client', 'Client')}
              {TH('type', 'Type')}
              {TH('due', 'Due')}
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">BoQ</th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {data.map((p) => {
              const near =
                differenceInCalendarDays(new Date(p.due), new Date()) <= 3;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-brand-light/50 cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <td className="px-6 py-4 font-medium sticky left-0 bg-white z-10">
                    {p.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.client}</td>
                  <td className="px-6 py-4">{p.type}</td>
                  <td
                    className={`px-6 py-4 ${
                      near ? 'text-red-600 font-semibold' : ''
                    }`}
                  >
                    {format(new Date(p.due), 'd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label={p.status} />
                  </td>
                   <td className="px-6 py-4">
                    {p.boqUploaded ? (
                      <span className="text-green-600">✔</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Missing</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
