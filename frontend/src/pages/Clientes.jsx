import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';

const FORM_VACIO = { nombre: '', telefono: '', email: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    const params = search ? { search } : {};
    client.get('/clientes', { params }).then(({ data }) => setClientes(data));
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 250);
    return () => clearTimeout(timeout);
  }, [cargar]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await client.post('/clientes', {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
      });
      setAbierto(false);
      setForm(FORM_VACIO);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el cliente');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Clientes</h2>
        <button type="button" className="btn btn-primary" onClick={() => setAbierto(true)}>
          + Nuevo cliente
        </button>
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.telefono || '—'}</td>
              <td>{c.email || '—'}</td>
            </tr>
          ))}
          {clientes.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                No hay clientes que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {abierto && (
        <Modal title="Nuevo cliente" onClose={() => setAbierto(false)}>
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
              <span>Teléfono</span>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setAbierto(false)}>
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
