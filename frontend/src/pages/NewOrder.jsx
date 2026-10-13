import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function NewOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // { product_id, name, price, current_stock, quantity }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/customers').then(({ data }) => setCustomers(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      client
        .get('/products', { params: { search, active: 'true' } })
        .then(({ data }) => setProducts(data.filter((p) => p.current_stock > 0)));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );

  function addProduct(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) return prev;
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          current_stock: product.current_stock,
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(productId, quantity) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const clamped = Math.max(1, Math.min(quantity, i.current_stock));
        return { ...i, quantity: clamped };
      })
    );
  }

  function removeProduct(productId) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  async function submitOrder(e) {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Select a customer');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one product');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/orders', {
        customer_id: Number(customerId),
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>New order</h2>

      <form onSubmit={submitOrder} className="new-order">
        <label className="field">
          <span>Customer</span>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="new-order-grid">
          <div>
            <label className="field">
              <span>Search products</span>
              <input
                type="text"
                placeholder="Product name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <ul className="product-picker-list">
              {products.map((p) => (
                <li key={p.id} className="product-picker-item">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted">
                      {currencyFormat.format(p.price)} · {p.current_stock} in stock
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={() => addProduct(p)}>
                    Add
                  </button>
                </li>
              ))}
              {products.length === 0 && <li className="muted">No results.</li>}
            </ul>
          </div>

          <div>
            <h3>Cart</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.product_id}>
                    <td>{i.name}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={i.current_stock}
                        value={i.quantity}
                        onChange={(e) => changeQuantity(i.product_id, Number(e.target.value))}
                        className="qty-input"
                      />
                    </td>
                    <td>{currencyFormat.format(i.price * i.quantity)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-danger"
                        onClick={() => removeProduct(i.product_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No products added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="order-total">Total: {currencyFormat.format(total)}</div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-footer">
          <button type="submit" className="btn btn-primary" disabled={submitting || cart.length === 0}>
            {submitting ? 'Creating order…' : 'Place order'}
          </button>
        </div>
      </form>
    </div>
  );
}
