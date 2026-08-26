import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import '../styles/Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const base = "/Portfolio/"
  const navigate = useNavigate()
  const location = useLocation()

  const handleContact = () => {
    setOpen(false)
    const isPortfolio = location.pathname.startsWith(`CV`)

    if (isPortfolio) {
      // Already on portfolio page — just scroll
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navigate to portfolio then scroll after render
      navigate(base)
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }

  return (
    <header className="navbar">
      {/* end=true means only active when path is exactly /CV/ */}
      <NavLink to={base} end className="navbar-logo">
        Sargis Khachatryan
      </NavLink>

      <button
        className={`navbar-burger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <nav className={`navbar-links ${open ? 'open' : ''}`}>
        {/* end=true: only active on exact /CV/ — not on /CV/portfolio */}
        <NavLink to={base} end onClick={() => setOpen(false)}>Portfolio</NavLink>
        <NavLink to={base + 'CV'} onClick={() => setOpen(false)}>CV</NavLink>
        <button className="navbar-cta" onClick={handleContact}>
          Contact
        </button>
      </nav>
    </header>
  )
}