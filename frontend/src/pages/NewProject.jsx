import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function NewProject() {
  const [form, setForm] = useState({
    id: '',
    client: '',
    type: '',
    due: '',
  });
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create project');
      toast.success('Project created');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-dark">New Project</h1>
        <Link to="/" className="text-brand-accent underline">
          ← Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm mb-1" htmlFor="id">
            Code
          </label>
          <input
            id="id"
            name="id"
            value={form.id}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="client">
            Client
          </label>
          <input
            id="client"
            name="client"
            value={form.client}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="type">
            Type
          </label>
          <input
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="due">
            Due
          </label>
          <input
            type="date"
            id="due"
            name="due"
            value={form.due}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-accent text-white rounded"
        >
          Create
        </button>
      </form>
    </div>
  );
}
