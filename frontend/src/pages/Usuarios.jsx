import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'vendedor' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    client.get('/usuarios').then(({ data }) => setUsuarios(data));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await client.post('/usuarios', form);
      setAbierto(false);
      setForm(FORM_VACIO);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el usuario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Usuarios</h2>
        <button type="button" className="btn btn-primary" onClick={() => setAbierto(true)}>
          + Nuevo usuario
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>
                <span className={u.rol === 'admin' ? 'badge badge-success' : 'badge badge-neutral'}>{u.rol}</span>
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                No hay usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {abierto && (
        <Modal title="Nuevo usuario" onClose={() => setAbierto(false)}>
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
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required
              />
            </label>
            <label className="field">
              <span>Rol</span>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Admin</option>
              </select>
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
