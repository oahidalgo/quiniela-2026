import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { logout as apiLogout } from '../lib/api'

export default function Layout() {
  const { user, isAdmin, token, logout } = useSession()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await apiLogout(token) } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar navbar-expand-md sticky-top px-3 px-md-4">
        <div className="container-xl">
          <span className="navbar-brand me-4">
            ⚽ MUNDIAL 2026
          </span>

          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto gap-1">
              <li className="nav-item">
                <NavLink to="/partidos" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                  <i className="bi bi-calendar3 me-1"></i>Pronosticar
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/historial" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                  <i className="bi bi-clock-history me-1"></i>Mi historial
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/tabla" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                  <i className="bi bi-trophy me-1"></i>Tabla
                </NavLink>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                    <i className="bi bi-shield-check me-1"></i>Admin
                  </NavLink>
                </li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                <i className="bi bi-person-circle me-1"></i>{user?.name}
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.8rem' }}>
                <i className="bi bi-box-arrow-right me-1"></i>Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container-xl py-4 px-3 px-md-4 flex-grow-1">
        <Outlet />
      </main>
    </div>
  )
}
