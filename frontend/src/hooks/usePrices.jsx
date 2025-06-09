import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'https://2gng2p5vnc.execute-api.me-south-1.amazonaws.com';

async function fetchPrices() {
  const res = await fetch(`${API_URL}/api/prices`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json();
}

export function usePrices() {
  return useQuery({ queryKey: ['prices'], queryFn: fetchPrices });
}

export function useUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await fetch(`${API_URL}/api/prices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries(['prices']),
  });
}
