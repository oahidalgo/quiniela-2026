import { useEffect, useRef, useState } from 'react';
import {
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { logout as apiLogout } from '../lib/api';

export default function Layout() {
  const { user, isAdmin, token, logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const offcanvasRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = offcanvasRef.current;
    if (!el) return;
    const onShow = () => setMenuOpen(true);
    const onHide = () => setMenuOpen(false);
    el.addEventListener('show.bs.offcanvas', onShow);
    el.addEventListener('hide.bs.offcanvas', onHide);
    return () => {
      el.removeEventListener('show.bs.offcanvas', onShow);
      el.removeEventListener('hide.bs.offcanvas', onHide);
    };
  }, []);

  // Cierra el menú al cambiar de ruta
  function closeMenu() {
    const el = offcanvasRef.current;
    const Offcanvas = window.bootstrap?.Offcanvas;
    if (el && Offcanvas) {
      Offcanvas.getOrCreateInstance(el).hide();
    }
  }

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  async function handleLogout() {
    closeMenu();
    try {
      await apiLogout(token);
    } catch {}
    logout();
    navigate('/login');
  }

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <nav className='navbar navbar-expand-md sticky-top px-3 px-md-4'>
        <div className='container-xl'>
          <span className='navbar-brand me-4'>
            <img
              src='/logo.png'
              alt='United 2026'
              className='brand-logo'
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className='brand-text'>United 2026</span>
            <span className='d-none d-sm-inline-flex gap-1 ms-1'>
              <img
                className='flag-chip'
                src='https://flagcdn.com/40x30/us.png'
                alt='US'
              />
              <img
                className='flag-chip'
                src='https://flagcdn.com/40x30/ca.png'
                alt='CA'
              />
              <img
                className='flag-chip'
                src='https://flagcdn.com/40x30/mx.png'
                alt='MX'
              />
            </span>
          </span>

          <button
            className='navbar-toggler border-0 shadow-none'
            type='button'
            data-bs-toggle='offcanvas'
            data-bs-target='#navMenu'
            aria-controls='navMenu'
            style={{ fontSize: '1.6rem', color: 'var(--text)', padding: '2px 8px' }}
          >
            <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>

          <div
            className='offcanvas offcanvas-start'
            tabIndex='-1'
            id='navMenu'
            aria-labelledby='navMenuLabel'
            ref={offcanvasRef}
          >
            <div className='offcanvas-body'>
              <ul className='navbar-nav me-auto gap-1 fs-5 fs-md-6'>
                <li className='nav-item'>
                  <NavLink
                    to='/partidos'

                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' active' : '')
                    }
                  >
                    <i className='bi bi-calendar3 me-2'></i>Pronosticar
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink
                    to='/historial'

                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' active' : '')
                    }
                  >
                    <i className='bi bi-clock-history me-2'></i>Mi historial
                  </NavLink>
                </li>
                <li className='nav-item'>
                  <NavLink
                    to='/tabla'

                    className={({ isActive }) =>
                      'nav-link' + (isActive ? ' active' : '')
                    }
                  >
                    <i className='bi bi-trophy me-2'></i>Tabla
                  </NavLink>
                </li>
                {isAdmin && (
                  <li className='nav-item'>
                    <NavLink
                      to='/admin'

                      className={({ isActive }) =>
                        'nav-link' + (isActive ? ' active' : '')
                      }
                    >
                      <i className='bi bi-shield-check me-2'></i>Admin
                    </NavLink>
                  </li>
                )}
              </ul>

              <div className='menu-user'>
                <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                  <i className='bi bi-person-circle me-1'></i>
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className='btn btn-sm btn-outline-secondary'
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className='bi bi-box-arrow-right me-1'></i>Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className='container-xl py-4 px-3 px-md-4 flex-grow-1'>
        <Outlet />
      </main>
    </div>
  );
}
