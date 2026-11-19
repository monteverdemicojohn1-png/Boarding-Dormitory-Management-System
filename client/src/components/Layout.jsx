import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

export default function Layout() {
  const navigate = useNavigate();

  async function logout() {
    try { await api('/admin/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    setToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">BD</span>
          <div><strong>Boarding Dormitory</strong><small>Management System</small></div>
        </div>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/tenants">Tenants</NavLink>
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </nav>
        <button className="btn btn-ghost btn-block" onClick={logout}>Log out</button>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
