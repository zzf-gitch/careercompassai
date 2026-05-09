import { useState, useEffect, useRef, useCallback } from 'react'
import { getAll, put, formatTime } from './utils/db'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import './App.css'

const navItems = [
  { label: 'Dashboard', labelCn: '仪表盘', icon: '📊', to: '/Dashboard' },
  { label: 'Community Feed', labelCn: '社区动态', icon: '💬', to: '/feed' },
  { label: 'Opportunities', labelCn: '机会', icon: '💼', to: '/opportunities' },
  { label: 'Applications', labelCn: '我的申请', icon: '📋', to: '/applications' },
  { label: 'Saved', labelCn: '收藏', icon: '🔖', to: '/saved' },
  { label: 'SystemLog', labelCn: '系统记录', icon: '📋', to: '/systemlog' },
  // 个人资料入口已移至右上角下拉菜单
  // 收件箱入口已移至右上角通知铃铛
]

/* ── Read user profile from localStorage ── */
function readUserProfile() {
  const email = localStorage.getItem('userEmail') || 'user@example.com'
  const defaultName = email.split('@')[0]
  try {
    const raw = localStorage.getItem('user_profile')
    if (raw) {
      const p = JSON.parse(raw)
      return {
        email: p.email || email,
        displayName: p.displayName || defaultName,
        avatarColor: p.avatarColor || '#7c5cfc',
      }
    }
  } catch {}
  return { email, displayName: defaultName, avatarColor: '#7c5cfc' }
}

/* ── Available avatar colors ── */
const AVATAR_COLORS = ['#7c5cfc', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f97316']

/* ── Deterministic color from name ── */
function getAvatarColor(name) {
  const used = localStorage.getItem('user_profile')
  if (used) {
    try {
      const p = JSON.parse(used)
      if (p.avatarColor) return p.avatarColor
    } catch {}
  }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // 如果未登录，重定向到登录页
  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    if (!email) {
      navigate('/', { replace: true })
    }
  }, [navigate])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifMessages, setNotifMessages] = useState([])
  const cardRef = useRef(null)
  const notifRef = useRef(null)
  const [tick, setTick] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // 每次渲染重新读取 localStorage，确保与 Profile 页修改实时同步
  const profile = readUserProfile()
  const { email: userEmail, displayName: userName, avatarColor } = profile

  /* ── 加载通知（仅未读，最多3条） ── */
  const loadNotifs = useCallback(async () => {
    try {
      const msgs = await getAll('messages')
      const unread = msgs.filter((m) => m.unread).sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 3)
      setNotifMessages(unread)
    } catch {
      setNotifMessages([])
    }
  }, [])

  // 监听 profile-updated 自定义事件，立即刷新数据
  useEffect(() => {
    const handler = () => {
      setTick((n) => n + 1)
      loadNotifs()
    }
    loadNotifs()
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [loadNotifs])

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
    // 清除所有用户相关数据
    localStorage.removeItem('userEmail')
    localStorage.removeItem('user_profile')
    navigate('/', { replace: true })
  }

  const handleToggle = () => {
    setDropdownOpen((prev) => !prev)
  }

  /* ── 点击通知铃铛：先刷新，再切换弹窗 ── */
  const handleNotifToggle = async () => {
    await loadNotifs()
    setDropdownOpen(false)
    setNotifOpen((prev) => !prev)
  }

  /* ── 点击通知项标记为已读 ── */
  const handleNotifClick = async (msg) => {
    if (!msg.unread) return
    await put('messages', { ...msg, unread: false })
    await loadNotifs()
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const handleClickOutside = useCallback((e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) {
      setDropdownOpen(false)
    }
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setNotifOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  // 每次导航时强制重新读取 profile，使修改后的用户名/头像即时生效
  useEffect(() => {
    setTick((n) => n + 1)
  }, [location])

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
        {/* ===== Top Bar with Back, Refresh, Theme Toggle & User Card ===== */}
        <div className="topbar">
          <div className="topbar-left">
            {/* Back Button */}
            <button
              className="topbar-icon-btn"
              onClick={() => navigate(-1)}
              title="返回上一页"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            {/* Refresh Button */}
            <button
              className="topbar-icon-btn"
              onClick={() => setRefreshKey((k) => k + 1)}
              title="刷新当前页面"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          <div className="topbar-actions">
            {/* Notification Bell */}
            <div className="notif-card" ref={notifRef}>
              <button
                className="notif-btn"
                onClick={handleNotifToggle}
                title="通知"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifMessages.length > 0 && (
                  <span className="notif-badge">{notifMessages.length}</span>
                )}
              </button>
              <div className={`notif-dropdown${notifOpen ? ' open' : ''}`}>
                <div className="notif-dropdown-header">
                  <span>通知</span>
                </div>
                <div className="notif-dropdown-body">
                  {notifMessages.length === 0 ? (
                    <div className="notif-empty">暂无新通知</div>
                  ) : (
                    notifMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="notif-item"
                        onClick={() => handleNotifClick(msg)}
                      >
                        <div className="notif-item-dot" />
                        <div className="notif-item-content">
                          <div className="notif-item-from">{msg.from}</div>
                          <div className="notif-item-text">{msg.content}</div>
                          <div className="notif-item-time">{msg._timestamp ? formatTime(msg._timestamp) : msg.time || '刚刚'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-dropdown-footer">
                  <button className="notif-view-all" onClick={() => { setNotifOpen(false); navigate('/inbox') }}>
                    查看收件箱 →
                  </button>
                </div>
              </div>
            </div>

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
                <div className="topbar-user-avatar" style={{ background: avatarColor }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className={`topbar-user-dropdown${dropdownOpen ? ' open' : ''}`}>
                <div className="topbar-user-info">
                  <div className="topbar-user-avatar-lg" style={{ background: avatarColor }}>
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="topbar-user-name">{userName}</span>
                  <span className="topbar-user-email-full">{userEmail}</span>
                </div>
                <div className="topbar-user-divider" />
                <button className="topbar-user-view-btn" onClick={() => { setDropdownOpen(false); navigate('/profile') }}>查看个人资料</button>
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
        <Outlet key={refreshKey} />
      </main>
    </div>
  )
}

export default App
