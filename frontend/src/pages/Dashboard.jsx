import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import SalesChart from '../components/SalesChart';

/*
 * THESIS: The Dashboard is a running paper tape, not a SaaS admin panel —
 *   every number reads freshly printed, refusing the soft-shadow stat-card
 *   grid every dashboard ships.
 * OWN-WORLD: Warm ledger paper, tabular monospace figures, black ink by
 *   default with a single stamped-indigo accent, dashed rules standing in
 *   for card borders. Flat — no shadows, no rounded corners.
 * STORY: A viewer (admin, or a recruiter skimming this as a portfolio
 *   piece) reads "this is a live system of record," not a mockup.
 * FIRST VIEWPORT: A ticket row of three KPIs separated by dashed rules,
 *   a torn-edge perforation beneath it, then the sales chart on a dashed
 *   baseline, then the top-products ledger table.
 * FORM: "Register-Tape Ledger" — POS/register-receipt world, direction 7
 *   of the resonance-ordered candidate list, assigned by concept-seed.mjs
 *   (seed 333827d7), confirmed by the user over the "Pipe Organ Keydesk"
 *   challenger. Scoped to this route only — see DESIGN.md.
 */

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function SellerLanding() {
  const { user } = useAuth();
  return (
    <div className="dashboard-ledger dashboard-ledger--compact">
      <h2>Hi, {user?.name}</h2>
      <p className="muted">Quick actions:</p>
      <div className="ticket-link-row">
        <Link to="/orders/new" className="ticket-link">
          <div className="ticket-link-label">New order</div>
          <div className="ticket-link-value">Create an order for a customer</div>
        </Link>
        <Link to="/orders" className="ticket-link">
          <div className="ticket-link-label">Orders</div>
          <div className="ticket-link-value">View and update status</div>
        </Link>
        <Link to="/products" className="ticket-link">
          <div className="ticket-link-label">Products</div>
          <div className="ticket-link-value">Check stock and prices</div>
        </Link>
      </div>
      <div className="ticket-row-edge" aria-hidden="true" />
    </div>
  );
}

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [groupBy, setGroupBy] = useState('day');
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/dashboard/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Could not load the dashboard'));
  }, []);

  useEffect(() => {
    client
      .get('/dashboard/sales', { params: { group_by: groupBy } })
      .then(({ data }) => setSales(data))
      .catch(() => setSales([]));
  }, [groupBy]);

  if (error) return <div className="dashboard-ledger form-error">{error}</div>;
  if (!summary) return <p className="dashboard-ledger muted">Loading…</p>;

  return (
    <div className="dashboard-ledger">
      <h2>Dashboard</h2>

      <div className="ticket-row">
        <div className="ticket">
          <div className="ticket-label">Sales this month</div>
          <div className="ticket-value">{currencyFormat.format(summary.month_sales_total)}</div>
        </div>
        <div className="ticket">
          <div className="ticket-label">Pending orders</div>
          <div className="ticket-value">{summary.pending_orders}</div>
        </div>
        <div className="ticket">
          <div className="ticket-label">Top-selling product</div>
          <div className="ticket-value ticket-value-sm">
            {summary.top_products[0]?.name || '—'}
          </div>
        </div>
      </div>
      <div className="ticket-row-edge" aria-hidden="true" />

      <div className="chart-section">
        <div className="chart-section-header">
          <h3>Sales by period</h3>
          <div className="period-toggle">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={groupBy === p.value ? 'active' : ''}
                onClick={() => setGroupBy(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {sales === null ? (
          <p className="muted">Loading…</p>
        ) : (
          <SalesChart data={sales} groupBy={groupBy} />
        )}
      </div>

      <h3>Top 5 best-selling products</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Units sold</th>
          </tr>
        </thead>
        <tbody>
          {summary.top_products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.units_sold}</td>
            </tr>
          ))}
          {summary.top_products.length === 0 && (
            <tr>
              <td colSpan={2} className="muted">
                No sales yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <SellerLanding />;
}
