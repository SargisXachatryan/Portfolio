import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/Navbar.css'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const base = "/Portfolio/"
  const navigate = useNavigate()
  const location = useLocation()

  // Locks mobile body scrolling when the menu modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handles smooth scrolling to #contact when navigating or on current page
  const handleContact = () => {
    setOpen(false)
    const isPortfolio = location.pathname === base || location.pathname === base.slice(0, -1)

    const triggerScroll = () => {
      const el = document.getElementById('contact')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }

    if (!isPortfolio) {
      navigate(base)
      // Small tick delay gives React Router time to mount the target page DOM
      setTimeout(triggerScroll, 100)
    } else {
      triggerScroll()
    }
  }

  return (
    <header className="navbar">
      <NavLink to={base} end className="navbar-logo" onClick={() => setOpen(false)}>
        Sargis Khachatryan
      </NavLink>

      <button
        className={`navbar-burger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile backdrop for tapping outside */}
      {open && <div className="navbar-backdrop" onClick={() => setOpen(false)} />}

      <nav className={`navbar-links ${open ? 'open' : ''}`}>
        <NavLink to={base} end onClick={() => setOpen(false)}>Portfolio</NavLink>
        <NavLink to={`${base}CV`} onClick={() => setOpen(false)}>CV</NavLink>
        <button className="navbar-cta" onClick={handleContact}>
          Contact
        </button>
      </nav>
    </header>
  )
}