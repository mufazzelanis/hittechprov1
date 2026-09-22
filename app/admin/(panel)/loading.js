export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="shimmer h-10 w-full max-w-md" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-28" />)}
      </div>
      <div className="shimmer h-64" />
    </div>
  );
}
