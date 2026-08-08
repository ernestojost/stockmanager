import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true, adminOnly: true },
  { to: '/productos', label: 'Productos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/usuarios', label: 'Usuarios', adminOnly: true },
];

export default function Layout() {
  const { usuario, logout, isAdmin } = useAuth();
  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">StockManager</div>
        <nav className="topbar-nav">
          {visibleLinks.map((link) => (
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
          <span>
            {usuario?.nombre}
            {!isAdmin && <span className="muted"> · vendedor</span>}
          </span>
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
