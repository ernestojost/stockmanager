import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import StockBadge from '../components/StockBadge';
import Modal from '../components/Modal';

const formatoMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  categoria_id: '',
  precio: '',
  stock_actual: '',
  stock_minimo: '',
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo, {...} = editar
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarProductos = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (categoriaFiltro) params.categoria_id = categoriaFiltro;
    client.get('/productos', { params }).then(({ data }) => setProductos(data));
  }, [search, categoriaFiltro]);

  useEffect(() => {
    client.get('/categorias').then(({ data }) => setCategorias(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(cargarProductos, 250);
    return () => clearTimeout(timeout);
  }, [cargarProductos]);

  function abrirNuevo() {
    setForm(FORM_VACIO);
    setError('');
    setEditando({});
  }

  function abrirEdicion(producto) {
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria_id: producto.categoria_id || '',
      precio: producto.precio,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
    });
    setError('');
    setEditando(producto);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');

    if (Number(form.precio) < 0) {
      setError('El precio no puede ser negativo');
      return;
    }
    if (Number(form.stock_actual) < 0 || Number(form.stock_minimo) < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria_id: form.categoria_id || null,
      precio: Number(form.precio),
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
    };

    setGuardando(true);
    try {
      if (editando?.id) {
        await client.put(`/productos/${editando.id}`, payload);
      } else {
        await client.post('/productos', payload);
      }
      setEditando(null);
      cargarProductos();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el producto');
    } finally {
      setGuardando(false);
    }
  }

  async function darDeBaja(producto) {
    if (!confirm(`¿Dar de baja "${producto.nombre}"?`)) return;
    await client.delete(`/productos/${producto.id}`);
    cargarProductos();
  }

  return (
    <div>
      <div className="page-header">
        <h2>Productos</h2>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo producto
        </button>
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className={!p.activo ? 'row-inactive' : ''}>
              <td>{p.nombre}</td>
              <td>{p.categoria_nombre || '—'}</td>
              <td>{formatoMoneda.format(p.precio)}</td>
              <td>
                <StockBadge stockActual={p.stock_actual} stockMinimo={p.stock_minimo} />
              </td>
              <td>{p.activo ? 'Activo' : 'De baja'}</td>
              <td className="table-actions">
                <button type="button" className="btn btn-ghost" onClick={() => abrirEdicion(p)}>
                  Editar
                </button>
                {p.activo && (
                  <button type="button" className="btn btn-ghost btn-danger" onClick={() => darDeBaja(p)}>
                    Dar de baja
                  </button>
                )}
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No hay productos que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editando && (
        <Modal title={editando.id ? 'Editar producto' : 'Nuevo producto'} onClose={() => setEditando(null)}>
          <form onSubmit={guardar}>
            <label className="field">
              <span>Nombre</span>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Descripción</span>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Categoría</span>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>Precio</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Stock actual</span>
                <input
                  type="number"
                  min="0"
                  value={form.stock_actual}
                  onChange={(e) => setForm({ ...form, stock_actual: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Stock mínimo</span>
                <input
                  type="number"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                  required
                />
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
