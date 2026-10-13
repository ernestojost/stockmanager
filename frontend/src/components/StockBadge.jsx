export default function StockBadge({ currentStock, minStock }) {
  const low = currentStock <= minStock;
  return (
    <span className={low ? 'badge badge-danger' : 'badge badge-neutral'}>
      {currentStock}
      {low && ' ⚠ low'}
    </span>
  );
}
