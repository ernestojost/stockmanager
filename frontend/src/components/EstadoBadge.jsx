const CLASES = {
  pendiente: 'badge badge-warning',
  entregado: 'badge badge-success',
  cancelado: 'badge badge-danger',
};

export default function EstadoBadge({ estado }) {
  return <span className={CLASES[estado] || 'badge badge-neutral'}>{estado}</span>;
}
