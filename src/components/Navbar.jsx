import { Link } from 'react-router-dom'

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          ElectZone
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">Welcome, {user.name || user.email}</span>
              <button onClick={onLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Voter Login
              </Link>
              <Link to="/admin/login" className="btn btn-secondary">
                Admin Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
