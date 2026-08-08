import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/productos', label: 'Productos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/pedidos', label: 'Pedidos' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">StockManager</div>
        <nav className="topbar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span>{usuario?.nombre}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
