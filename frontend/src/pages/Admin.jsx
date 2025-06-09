import { useState, useEffect } from 'react';

export default function Admin() {
  const [openai, setOpenai] = useState('');
  const [gemini, setGemini] = useState('');
  const [cohere, setCohere] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOpenai(localStorage.getItem('openaiKey') || '');
    setGemini(localStorage.getItem('geminiKey') || '');
    setCohere(localStorage.getItem('cohereKey') || '');
  }, []);

  function save() {
    localStorage.setItem('openaiKey', openai);
    localStorage.setItem('geminiKey', gemini);
    localStorage.setItem('cohereKey', cohere);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <label className="block text-sm">
        OpenAI Key
        <input
          type="text"
          value={openai}
          onChange={(e) => setOpenai(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
        />
      </label>
      <label className="block text-sm">
        Gemini Key
        <input
          type="text"
          value={gemini}
          onChange={(e) => setGemini(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
        />
      </label>
      <label className="block text-sm">
        Cohere Key
        <input
          type="text"
          value={cohere}
          onChange={(e) => setCohere(e.target.value)}
          className="w-full border rounded px-2 py-1 mt-1"
        />
      </label>
      <button onClick={save} className="px-4 py-2 bg-brand-dark text-white rounded">
        Save
      </button>
      {saved && <p className="text-green-600 text-sm">Saved!</p>}
    </div>
  );
}
