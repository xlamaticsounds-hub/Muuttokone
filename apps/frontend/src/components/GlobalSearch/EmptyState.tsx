import { useHits } from "react-instantsearch";

export default function EmptyState() {
  const { items } = useHits();

  if (items.length) return null;

  return (
    <div className="p-8">
      <p className="text-center text-base text-body">No items found...</p>
    </div>
  );
}
