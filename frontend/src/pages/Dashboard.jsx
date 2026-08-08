import { useEffect, useState } from 'react';
import client from '../api/client';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/dashboard/resumen')
      .then(({ data }) => setResumen(data))
      .catch(() => setError('No se pudo cargar el dashboard'));
  }, []);

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
