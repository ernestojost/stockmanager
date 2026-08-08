export default function StockBadge({ stockActual, stockMinimo }) {
  const bajo = stockActual <= stockMinimo;
  return (
    <span className={bajo ? 'badge badge-danger' : 'badge badge-neutral'}>
      {stockActual}
      {bajo && ' ⚠ bajo'}
    </span>
  );
}
