import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ChartVentas from '../components/ChartVentas';

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

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const PERIODOS = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

function VendedorLanding() {
  const { usuario } = useAuth();
  return (
    <div className="dashboard-ledger dashboard-ledger--compact">
      <h2>Hola, {usuario?.nombre}</h2>
      <p className="muted">Accesos rápidos:</p>
      <div className="ticket-link-row">
        <Link to="/pedidos/nuevo" className="ticket-link">
          <div className="ticket-link-label">Nuevo pedido</div>
          <div className="ticket-link-value">Crear pedido para un cliente</div>
        </Link>
        <Link to="/pedidos" className="ticket-link">
          <div className="ticket-link-label">Pedidos</div>
          <div className="ticket-link-value">Ver y actualizar estado</div>
        </Link>
        <Link to="/productos" className="ticket-link">
          <div className="ticket-link-label">Productos</div>
          <div className="ticket-link-value">Consultar stock y precios</div>
        </Link>
      </div>
      <div className="ticket-row-edge" aria-hidden="true" />
    </div>
  );
}

function AdminDashboard() {
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState(null);
  const [agrupacion, setAgrupacion] = useState('dia');
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/dashboard/resumen')
      .then(({ data }) => setResumen(data))
      .catch(() => setError('No se pudo cargar el dashboard'));
  }, []);

  useEffect(() => {
    client
      .get('/dashboard/ventas', { params: { agrupacion } })
      .then(({ data }) => setVentas(data))
      .catch(() => setVentas([]));
  }, [agrupacion]);

  if (error) return <div className="dashboard-ledger form-error">{error}</div>;
  if (!resumen) return <p className="dashboard-ledger muted">Cargando…</p>;

  return (
    <div className="dashboard-ledger">
      <h2>Dashboard</h2>

      <div className="ticket-row">
        <div className="ticket">
          <div className="ticket-label">Total vendido este mes</div>
          <div className="ticket-value">{formatoMoneda.format(resumen.total_vendido_mes)}</div>
        </div>
        <div className="ticket">
          <div className="ticket-label">Pedidos pendientes</div>
          <div className="ticket-value">{resumen.pedidos_pendientes}</div>
        </div>
        <div className="ticket">
          <div className="ticket-label">Producto más vendido</div>
          <div className="ticket-value ticket-value-sm">
            {resumen.productos_mas_vendidos[0]?.nombre || '—'}
          </div>
        </div>
      </div>
      <div className="ticket-row-edge" aria-hidden="true" />

      <div className="chart-section">
        <div className="chart-section-header">
          <h3>Ventas por período</h3>
          <div className="periodo-toggle">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={agrupacion === p.value ? 'active' : ''}
                onClick={() => setAgrupacion(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {ventas === null ? (
          <p className="muted">Cargando…</p>
        ) : (
          <ChartVentas datos={ventas} agrupacion={agrupacion} />
        )}
      </div>

      <h3>Top 5 productos más vendidos</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Unidades vendidas</th>
          </tr>
        </thead>
        <tbody>
          {resumen.productos_mas_vendidos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.unidades_vendidas}</td>
            </tr>
          ))}
          {resumen.productos_mas_vendidos.length === 0 && (
            <tr>
              <td colSpan={2} className="muted">
                Todavía no hay ventas.
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
  return isAdmin ? <AdminDashboard /> : <VendedorLanding />;
}
