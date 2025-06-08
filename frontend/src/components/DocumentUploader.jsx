import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://2gng2p5vnc.execute-api.me-south-1.amazonaws.com/';
export default function DocumentUploader({ projectId }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/documents`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (projectId) fetchFiles();
  }, [projectId]);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    async onDrop(accepted) {
      if (!accepted.length || !projectId) return;
      const names = [];
      for (const file of accepted) {
        const fd = new FormData();
        fd.append('file', file);
        try {
          const res = await fetch(`${API_URL}/api/projects/${projectId}/documents`, {
            method: 'POST',
            body: fd,
          });
          if (res.ok) names.push(file.name);
        } catch (err) {
          console.error(err);
        }
      }
      if (names.length) {
        setFiles((prev) => [...names, ...prev]);
        toast.success(`Uploaded ${names.length} file${names.length > 1 ? 's' : ''}`);
      }
    },
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${
          isDragActive ? 'bg-brand-light' : ''
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-600 mb-4">
          Drag & drop files here, or click the button to select
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-brand-accent text-white rounded"
          onClick={open}
        >
          Browse files
        </button>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {files.map((name, i) => (
            <li key={i} className="flex justify-between bg-gray-50 p-2 rounded">
              <span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
