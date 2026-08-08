import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import EstadoBadge from '../components/EstadoBadge';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formatoFecha = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [actualizando, setActualizando] = useState(null);

  const cargar = useCallback(() => {
    const params = {};
    if (estado) params.estado = estado;
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    client.get('/pedidos', { params }).then(({ data }) => setPedidos(data));
  }, [estado, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(pedido, nuevoEstado) {
    setActualizando(pedido.id);
    try {
      await client.patch(`/pedidos/${pedido.id}/estado`, { estado: nuevoEstado });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setActualizando(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Pedidos</h2>
        <Link to="/pedidos/nuevo" className="btn btn-primary">
          + Nuevo pedido
        </Link>
      </div>

      <div className="filters-row">
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <label className="filter-date">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="filter-date">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.cliente_nombre}</td>
              <td>{formatoFecha.format(new Date(p.created_at))}</td>
              <td>{formatoMoneda.format(p.total)}</td>
              <td>
                <EstadoBadge estado={p.estado} />
              </td>
              <td className="table-actions">
                {p.estado === 'pendiente' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={actualizando === p.id}
                      onClick={() => cambiarEstado(p, 'entregado')}
                    >
                      Marcar entregado
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-danger"
                      disabled={actualizando === p.id}
                      onClick={() => cambiarEstado(p, 'cancelado')}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {pedidos.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No hay pedidos que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
