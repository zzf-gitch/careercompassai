import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getAvatarColor } from './utils/avatar.js'
import './App.css'

const navItems = [
  { label: 'Dashboard', labelCn: '仪表盘', icon: '📊', to: '/Dashboard' },
  { label: 'QSearch', labelCn: '搜索', icon: '🔍', to: '/search' },
  { label: 'Community Feed', labelCn: '社区动态', icon: '💬', to: '/feed' },
  { label: 'Opportunities', labelCn: '机会', icon: '💼', to: '/opportunities' },
  { label: 'Applications', labelCn: '我的申请', icon: '📋', to: '/applications' },
  { label: 'LaunchPad', labelCn: '启动台', icon: '🚀', to: '/launchpad' },
  { label: 'Saved', labelCn: '收藏', icon: '🔖', to: '/saved' },
  { label: 'Profile', labelCn: '个人资料', icon: '👤', to: '/profile' },
  { label: 'Inbox', labelCn: '收件箱', icon: '✉️', to: '/inbox' },
  { label: 'Insights', labelCn: '洞察', icon: '📈', to: '/insights' },
]

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const cardRef = useRef(null)

  const userEmail = localStorage.getItem('userEmail') || 'user@example.com'
  const userName = userEmail.split('@')[0]

  /* ── Theme ── */
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', next)
      return next
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleSignOut = () => {
    localStorage.removeItem('userEmail')
    navigate('/')
  }

  const handleToggle = () => {
    setDropdownOpen((prev) => !prev)
  }

  const handleClickOutside = useCallback((e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setDropdownOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  return (
    <div className="app-layout">
      {/* ===== Left Sidebar ===== */}
      <aside className="sidebar">
        {/* Logo / Brand */}
        <div className="sidebar-brand">
          <img
            src="https://i.postimg.cc/nLrDYrHW/icon.png"
            alt="CareerCompass"
            width="28"
            height="28"
          />
          <span>职业罗盘</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
                end={item.to === '/Dashboard'}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.labelCn}</span>
              </NavLink>
            )
          })}
        </nav>

      </aside>

      {/* ===== Main Content ===== */}
      <main className="main-content">
        {/* ===== Top Bar with Theme Toggle & User Card ===== */}
        <div className="topbar">
          <div className="topbar-actions">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={handleToggleTheme}
              title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            >
              {theme === 'light' ? (
                /* moon icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                /* sun icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>

            {/* User Card */}
            <div className="topbar-user-card" ref={cardRef}>
              <div className="topbar-user-trigger" onClick={handleToggle}>
                <div className="topbar-user-avatar" style={{ background: getAvatarColor(userName) }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className={`topbar-user-dropdown${dropdownOpen ? ' open' : ''}`}>
                <div className="topbar-user-info">
                  <div className="topbar-user-avatar-lg" style={{ background: getAvatarColor(userName) }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="topbar-user-name">{userName}</span>
                  <span className="topbar-user-email-full">{userEmail}</span>
                </div>
                <div className="topbar-user-divider" />
                <button className="topbar-user-view-btn">查看个人资料</button>
                <button className="topbar-user-signout" onClick={handleSignOut}>
                  登出
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default App
