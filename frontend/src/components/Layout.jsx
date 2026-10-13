import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true, adminOnly: true },
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/orders', label: 'Orders' },
  { to: '/users', label: 'Users', adminOnly: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
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
              className={({ isActive }) => {
                const classes = ['nav-link'];
                if (isActive) classes.push('active');
                if (link.to === '/') classes.push('nav-link-ledger');
                return classes.join(' ');
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-user">
          <span>
            {user?.name}
            {!isAdmin && <span className="muted"> · seller</span>}
          </span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
