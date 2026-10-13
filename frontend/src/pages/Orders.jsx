import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' });

export default function Orders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [updating, setUpdating] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    const params = {};
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;
    client.get('/orders', { params }).then(({ data }) => setOrders(data));
  }, [status, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order, newStatus) {
    setUpdating(order.id);
    try {
      await client.patch(`/orders/${order.id}/status`, { status: newStatus });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update the order status');
    } finally {
      setUpdating(null);
    }
  }

  async function exportList(format) {
    setExporting(true);
    try {
      const params = { format };
      if (status) params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;

      const { data } = await client.get('/orders/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not export the order list');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <div className="page-header-actions">
          {isAdmin && (
            <>
              <button type="button" className="btn btn-ghost" disabled={exporting} onClick={() => exportList('csv')}>
                Export CSV
              </button>
              <button type="button" className="btn btn-ghost" disabled={exporting} onClick={() => exportList('pdf')}>
                Export PDF
              </button>
            </>
          )}
          <Link to="/orders/new" className="btn btn-primary">
            + New order
          </Link>
        </div>
      </div>

      <div className="filters-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="filter-date">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="filter-date">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.customer_name}</td>
              <td>{dateFormat.format(new Date(o.created_at))}</td>
              <td>{currencyFormat.format(o.total)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td className="table-actions">
                {o.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={updating === o.id}
                      onClick={() => changeStatus(o, 'delivered')}
                    >
                      Mark delivered
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-danger"
                      disabled={updating === o.id}
                      onClick={() => changeStatus(o, 'cancelled')}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No orders match the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
