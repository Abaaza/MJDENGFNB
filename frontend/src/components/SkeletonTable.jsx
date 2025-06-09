export default function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-200 rounded" />
      ))}
    </div>
  );
}