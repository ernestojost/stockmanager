import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import StockBadge from '../components/StockBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' });

const TYPE_LABEL = {
  initial_stock: 'Initial stock',
  manual_adjustment: 'Manual adjustment',
  sale: 'Sale',
  cancellation: 'Order cancellation',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  current_stock: '',
  min_stock: '',
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyFor, setHistoryFor] = useState(null); // selected product or null
  const [movements, setMovements] = useState([]);

  const loadProducts = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category_id = categoryFilter;
    client.get('/products', { params }).then(({ data }) => setProducts(data));
  }, [search, categoryFilter]);

  useEffect(() => {
    client.get('/categories').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadProducts, 250);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  function openNew() {
    setForm(EMPTY_FORM);
    setError('');
    setEditing({});
  }

  function openEdit(product) {
    setForm({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id || '',
      price: product.price,
      current_stock: product.current_stock,
      min_stock: product.min_stock,
    });
    setError('');
    setEditing(product);
  }

  async function save(e) {
    e.preventDefault();
    setError('');

    if (Number(form.price) < 0) {
      setError('Price cannot be negative');
      return;
    }
    if (Number(form.current_stock) < 0 || Number(form.min_stock) < 0) {
      setError('Stock cannot be negative');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      price: Number(form.price),
      current_stock: Number(form.current_stock),
      min_stock: Number(form.min_stock),
    };

    setSaving(true);
    try {
      if (editing?.id) {
        await client.put(`/products/${editing.id}`, payload);
      } else {
        await client.post('/products', payload);
      }
      setEditing(null);
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the product');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(product) {
    if (!confirm(`Deactivate "${product.name}"?`)) return;
    await client.delete(`/products/${product.id}`);
    loadProducts();
  }

  async function openHistory(product) {
    setHistoryFor(product);
    const { data } = await client.get(`/products/${product.id}/movements`);
    setMovements(data);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            + New product
          </button>
        )}
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={!p.active ? 'row-inactive' : ''}>
              <td>{p.name}</td>
              <td>{p.category_name || '—'}</td>
              <td>{currencyFormat.format(p.price)}</td>
              <td>
                <StockBadge currentStock={p.current_stock} minStock={p.min_stock} />
              </td>
              <td>{p.active ? 'Active' : 'Inactive'}</td>
              <td className="table-actions">
                {isAdmin && (
                  <>
                    <button type="button" className="btn btn-ghost" onClick={() => openHistory(p)}>
                      History
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    {p.active && (
                      <button type="button" className="btn btn-ghost btn-danger" onClick={() => deactivate(p)}>
                        Deactivate
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No products match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? 'Edit product' : 'New product'} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span>Description</span>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Current stock</span>
                <input
                  type="number"
                  min="0"
                  value={form.current_stock}
                  onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Minimum stock</span>
                <input
                  type="number"
                  min="0"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  required
                />
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {historyFor && (
        <Modal title={`Stock history — ${historyFor.name}`} onClose={() => setHistoryFor(null)}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Resulting stock</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{dateFormat.format(new Date(m.created_at))}</td>
                  <td>
                    {TYPE_LABEL[m.type] || m.type}
                    {m.order_id && <span className="muted"> (order #{m.order_id})</span>}
                  </td>
                  <td className={m.quantity < 0 ? 'text-danger' : 'text-success'}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td>{m.resulting_stock}</td>
                  <td>{m.user_name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
