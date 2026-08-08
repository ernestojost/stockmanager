import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export default function PedidoNuevo() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [search, setSearch] = useState('');
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]); // { producto_id, nombre, precio, stock_actual, cantidad }
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    client.get('/clientes').then(({ data }) => setClientes(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      client
        .get('/productos', { params: { search, activo: 'true' } })
        .then(({ data }) => setProductos(data.filter((p) => p.stock_actual > 0)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const total = useMemo(
    () => carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    [carrito]
  );

  function agregarProducto(producto) {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto_id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock_actual) return prev;
        return prev.map((i) =>
          i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock_actual: producto.stock_actual,
          cantidad: 1,
        },
      ];
    });
  }

  function cambiarCantidad(productoId, cantidad) {
    setCarrito((prev) =>
      prev.map((i) => {
        if (i.producto_id !== productoId) return i;
        const clamped = Math.max(1, Math.min(cantidad, i.stock_actual));
        return { ...i, cantidad: clamped };
      })
    );
  }

  function quitarProducto(productoId) {
    setCarrito((prev) => prev.filter((i) => i.producto_id !== productoId));
  }

  async function confirmarPedido(e) {
    e.preventDefault();
    setError('');

    if (!clienteId) {
      setError('Seleccioná un cliente');
      return;
    }
    if (carrito.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }

    setEnviando(true);
    try {
      await client.post('/pedidos', {
        cliente_id: Number(clienteId),
        items: carrito.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      });
      navigate('/pedidos');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el pedido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h2>Nuevo pedido</h2>

      <form onSubmit={confirmarPedido} className="pedido-nuevo">
        <label className="field">
          <span>Cliente</span>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
            <option value="">Seleccioná un cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="pedido-nuevo-grid">
          <div>
            <label className="field">
              <span>Buscar producto</span>
              <input
                type="text"
                placeholder="Nombre del producto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <ul className="product-picker-list">
              {productos.map((p) => (
                <li key={p.id} className="product-picker-item">
                  <div>
                    <strong>{p.nombre}</strong>
                    <div className="muted">
                      {formatoMoneda.format(p.precio)} · stock {p.stock_actual}
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => agregarProducto(p)}>
                    Agregar
                  </button>
                </li>
              ))}
              {productos.length === 0 && <li className="muted">Sin resultados.</li>}
            </ul>
          </div>

          <div>
            <h3>Carrito</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((i) => (
                  <tr key={i.producto_id}>
                    <td>{i.nombre}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={i.stock_actual}
                        value={i.cantidad}
                        onChange={(e) => cambiarCantidad(i.producto_id, Number(e.target.value))}
                        className="qty-input"
                      />
                    </td>
                    <td>{formatoMoneda.format(i.precio * i.cantidad)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-danger"
                        onClick={() => quitarProducto(i.producto_id)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
                {carrito.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Todavía no agregaste productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pedido-total">Total: {formatoMoneda.format(total)}</div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-footer">
          <button type="submit" className="btn btn-primary" disabled={enviando || carrito.length === 0}>
            {enviando ? 'Creando pedido…' : 'Confirmar pedido'}
          </button>
        </div>
      </form>
    </div>
  );
}
