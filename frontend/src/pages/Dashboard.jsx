import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ChartVentas from '../components/ChartVentas';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const PERIODOS = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
];

function VendedorLanding() {
  const { usuario } = useAuth();
  return (
    <div>
      <h2>Hola, {usuario?.nombre}</h2>
      <p className="muted">Accesos rápidos:</p>
      <div className="cards-row">
        <Link to="/pedidos/nuevo" className="card card-link">
          <div className="card-label">Nuevo pedido</div>
          <div className="card-value card-value-sm">Crear pedido para un cliente</div>
        </Link>
        <Link to="/pedidos" className="card card-link">
          <div className="card-label">Pedidos</div>
          <div className="card-value card-value-sm">Ver y actualizar estado</div>
        </Link>
        <Link to="/productos" className="card card-link">
          <div className="card-label">Productos</div>
          <div className="card-value card-value-sm">Consultar stock y precios</div>
        </Link>
      </div>
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

  if (error) return <div className="form-error">{error}</div>;
  if (!resumen) return <p className="muted">Cargando…</p>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="cards-row">
        <div className="card">
          <div className="card-label">Total vendido este mes</div>
          <div className="card-value">{formatoMoneda.format(resumen.total_vendido_mes)}</div>
        </div>
        <div className="card">
          <div className="card-label">Pedidos pendientes</div>
          <div className="card-value">{resumen.pedidos_pendientes}</div>
        </div>
        <div className="card">
          <div className="card-label">Producto más vendido</div>
          <div className="card-value card-value-sm">
            {resumen.productos_mas_vendidos[0]?.nombre || '—'}
          </div>
        </div>
      </div>

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
