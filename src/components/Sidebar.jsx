const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const ProgresoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const NAV = [
  { screen: 'home',    label: 'Inicio',   Icon: HomeIcon },
  { screen: 'stats',   label: 'Progreso', Icon: ProgresoIcon },
  { screen: 'profile', label: 'Perfil',   Icon: ProfileIcon },
]

export { MenuIcon }

export default function Sidebar({ current, onNavigate, open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">OPE Quiz</span>
          <span className="sidebar-brand-sub">Técnico/a Informática · Osakidetza</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ screen, label, Icon }) => (
            <button
              key={screen}
              className={`sidebar-item${current === screen ? ' sidebar-item-active' : ''}`}
              onClick={() => { onNavigate(screen); onClose() }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          OPE Informática · Convocatoria 2026
        </div>
      </aside>
    </>
  )
}
