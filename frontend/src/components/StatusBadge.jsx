const CLASSES = {
  pending: 'badge badge-warning',
  delivered: 'badge badge-success',
  cancelled: 'badge badge-danger',
};

export default function StatusBadge({ status }) {
  return <span className={CLASSES[status] || 'badge badge-neutral'}>{status ? status[0].toUpperCase() + status.slice(1) : status}</span>;
}
