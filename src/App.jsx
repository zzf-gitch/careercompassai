import { useState, useEffect, useRef, useCallback } from 'react'
import { getAll, put, formatTime } from './utils/db'
import FullscreenButton, { ExitContentFullscreen } from './components/FullscreenButton'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import logo from '@/assets/icon.png'
import AudioWave, { getStoredVisible, setStoredVisible } from './components/AudioWave'
import TabBar from './components/TabBar'
import BackgroundSkin, { getActiveBgUrl } from './components/BackgroundSkin'

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

/* ── 所有路由的标签元信息（含非侧边栏路由） ── */
const routeMeta = {
  '/Dashboard':   { labelCn: '仪表盘',   icon: '📊' },
  '/feed':        { labelCn: '社区动态', icon: '💬' },
  '/opportunities': { labelCn: '机会',   icon: '💼' },
  '/applications':  { labelCn: '我的申请', icon: '📋' },
  '/saved':       { labelCn: '收藏',     icon: '🔖' },
  '/profile':     { labelCn: '个人资料', icon: '👤' },
  '/inbox':       { labelCn: '收件箱',   icon: '✉️' },
  '/systemlog':   { labelCn: '系统记录', icon: '📋' },
}

/* ── 获取当前登录邮箱（从独立的 user_session key 读取） ── */
function getCurrentEmail() {
  try {
    const raw = localStorage.getItem('user_session')
    if (raw) {
      const p = JSON.parse(raw)
      if (p.email) return p.email
    }
  } catch {}
  return ''
}

/* ── Read user settings from localStorage（个人偏好，不包含密码） ── */
function readUserSettings() {
  try {
    const raw = localStorage.getItem('user_settings')
    if (raw) {
      const p = JSON.parse(raw)
      return {
        displayName: p.displayName || '',
        avatarColor: p.avatarColor || '#7c5cfc',
        gender: p.gender || '',
        role: p.role || 'seeker',
      }
    }
  } catch {}
  return { displayName: '', avatarColor: '#7c5cfc', gender: '', role: 'seeker' }
}

/* ── Read user profile for App header (email from session + settings) ── */
function readUserProfile() {
  const email = getCurrentEmail() || 'user@example.com'
  const defaultName = email.split('@')[0]
  const settings = readUserSettings()
  return {
    email,
    displayName: settings.displayName || defaultName,
    avatarColor: settings.avatarColor,
  }
}


function App() {
  const navigate = useNavigate()
  const location = useLocation()


  // 如果未登录，重定向到登录页
  useEffect(() => {
    const email = getCurrentEmail()
    if (!email) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  /* ── 标签页状态 ── */
  // 从 localStorage 加载保存的标签页（包括 pinned 状态）
  const loadSavedTabs = () => {
    // 新窗口打开（?newWindow=1）：只保留 Dashboard，后续由路由同步自动添加当前页
    if (window.location.search.includes('newWindow=1')) {
      const homeMeta = routeMeta['/Dashboard']
      return [{ id: '/Dashboard', ...homeMeta, closable: false }]
    }
    try {
      const saved = localStorage.getItem('tabs_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 刷新页面后，只保留 Dashboard + 已固定的标签页，其余关闭
          const filtered = parsed.filter((t) => t.id === '/Dashboard' || t.pinned)
          // 确保 Dashboard 始终存在且在首位
          const hasDashboard = filtered.some((t) => t.id === '/Dashboard')
          if (!hasDashboard) {
            const homeMeta = routeMeta['/Dashboard']
            filtered.unshift({ id: '/Dashboard', ...homeMeta, closable: false })
          }
          // 确保 Dashboard 始终在索引 0
          if (filtered[0]?.id !== '/Dashboard') {
            const dashIdx = filtered.findIndex((t) => t.id === '/Dashboard')
            if (dashIdx > 0) {
              const [dash] = filtered.splice(dashIdx, 1)
              filtered.unshift(dash)
            }
          }
          return filtered
        }
      }
    } catch {}
    const homeMeta = routeMeta['/Dashboard']
    return [{ id: '/Dashboard', ...homeMeta, closable: false }]
  }

  const [tabs, setTabs] = useState(loadSavedTabs)

  // 标签页变化时保存到 localStorage（新窗口不保存，避免覆盖原窗口的标签状态）
  useEffect(() => {
    if (window.location.search.includes('newWindow=1')) return
    localStorage.setItem('tabs_state', JSON.stringify(tabs))
  }, [tabs])

  // 标签页拖拽排序（支持插入到目标之前或之后）
  const handleTabMove = useCallback((dragId, dropId, insertAfter = false) => {
    if (dragId === '/Dashboard') return // 主页标签不可拖动
    setTabs((prev) => {
      const dragIdx = prev.findIndex((t) => t.id === dragId)
      const dropIdx = prev.findIndex((t) => t.id === dropId)
      if (dragIdx === -1 || dropIdx === -1 || dragIdx === dropIdx) return prev
      // 不允许其他标签页移动到 Dashboard 前面（Dashboard 必须是索引 0）
      if (dropIdx === 0 && !insertAfter) return prev
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      // 如果 dragIdx 在 dropIdx 之前，删除 dragIdx 后 dropIdx 会左移一位
      const adjustedDropIdx = dragIdx < dropIdx ? dropIdx - 1 : dropIdx
      const targetIdx = insertAfter ? adjustedDropIdx + 1 : adjustedDropIdx
      // 确保不超出数组边界
      if (targetIdx < 0 || targetIdx > next.length) {
        next.splice(next.length, 0, moved)
      } else {
        next.splice(targetIdx, 0, moved)
      }
      return next
    })
  }, [])
  const [activeTab, setActiveTab] = useState('/Dashboard')

  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  const addTab = useCallback((path) => {
    const meta = routeMeta[path]
    if (!meta) return
    setTabs((prev) => {
      if (prev.some((t) => t.id === path)) return prev
      return [...prev, { id: path, ...meta, closable: true }]
    })
  }, [])

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab.id)
    navigate(tab.id)
  }, [navigate])

  const handleTabClose = useCallback((tab) => {
    const homeMeta = routeMeta['/Dashboard']
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tab.id)
      const next = prev.filter((t) => t.id !== tab.id)
      if (activeTabRef.current === tab.id) {
        const prevTab = idx > 0 ? next[idx - 1] : next.length > 0 ? next[0] : { id: '/Dashboard', ...homeMeta }
        const targetId = prevTab ? prevTab.id : '/Dashboard'
        setTimeout(() => {
          setActiveTab(targetId)
          navigate(targetId)
        }, 0)
      }
      return next
    })
  }, [navigate])

  // 路由变化时同步标签页
  useEffect(() => {
    const path = location.pathname
    const hasMeta = routeMeta[path]
    if (hasMeta) {
      setActiveTab(path)
      addTab(path)
    }
  }, [location.pathname, addTab])

  /* ── 右键菜单状态 ── */
  const [contextMenu, setContextMenu] = useState(null)

  const handleContextMenu = useCallback((e, tab) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, tab })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleContextAction = useCallback((action, tab) => {
    setContextMenu(null)
    switch (action) {
      case 'refresh':
        setRefreshKey((k) => k + 1)
        setRefreshing(true)
        setTimeout(() => navigate(tab.id), 0)
        break
      case 'close':
        handleTabClose(tab)
        break
      case 'closeOthers': {
        setTabs((prev) => {
          // 保留 Dashboard + 固定标签 + 当前右键的标签
          const next = prev.filter((t) => t.id === '/Dashboard' || t.pinned || t.id === tab.id)
          if (activeTabRef.current !== tab.id && activeTabRef.current !== '/Dashboard') {
            setTimeout(() => {
              setActiveTab(tab.id)
              navigate(tab.id)
            }, 0)
          }
          return next
        })
        break
      }
      case 'closeAll': {
        // 保留 Dashboard + 已固定的标签页
        const homeMeta = routeMeta['/Dashboard']
        setTabs((prev) => {
          const next = prev.filter((t) => t.id === '/Dashboard' || t.pinned)
          // 确保 Dashboard 存在
          const hasDashboard = next.some((t) => t.id === '/Dashboard')
          if (!hasDashboard) {
            next.unshift({ id: '/Dashboard', ...homeMeta, closable: false })
          }
          return next
        })
        if (activeTabRef.current !== '/Dashboard') {
          setActiveTab('/Dashboard')
          navigate('/Dashboard')
        }
        break
      }
      // ── 新窗口中打开（使用 hash 路由格式，确保路径正确）
      // 添加 ?newWindow=1 参数，让新窗口只加载 Dashboard + 当前页面，而非读取全部 localStorage
      case 'openInNewWindow': {
        const url = window.location.origin + '/?newWindow=1#' + tab.id
        window.open(url, '_blank')
        break
      }
      // ── 固定/取消固定标签页 ──
      case 'pinTab': {
        setTabs((prev) => {
          const idx = prev.findIndex((t) => t.id === tab.id)
          if (idx === -1 || tab.id === '/Dashboard') return prev
          const next = [...prev]
          next[idx] = { ...next[idx], pinned: !next[idx].pinned }
          return next
        })
        break
      }
      default:
        break
    }
  }, [handleTabClose, navigate])

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifMessages, setNotifMessages] = useState([])
  const cardRef = useRef(null)
  const notifRef = useRef(null)
  const sidebarRef = useRef(null)
  const [tick, setTick] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  // 主题区域/内容区域全屏状态（用于右键菜单文字切换）
  const [isThemeAreaFullscreen, setIsThemeAreaFullscreen] = useState(false)
  const [isContentFullscreen, setIsContentFullscreen] = useState(false)

  // 全屏切换
  const handleFullscreenToggle = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [])

  // 监听全屏状态变化（同时跟踪是哪个元素在全屏）
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
      const fsEl = document.fullscreenElement
      setIsThemeAreaFullscreen(!!fsEl && fsEl.classList?.contains('theme-area'))
      setIsContentFullscreen(!!fsEl && fsEl.classList?.contains('page-content'))
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 刷新动画结束后自动复位
  useEffect(() => {
    if (!refreshing) return
    const t = setTimeout(() => setRefreshing(false), 700)
    return () => clearTimeout(t)
  }, [refreshing])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bgDrawerOpen, setBgDrawerOpen] = useState(false)
  const [bgUrl, setBgUrl] = useState(getActiveBgUrl())
  // 波纹动画启停状态
  const [waveVisible, setWaveVisible] = useState(getStoredVisible)
  // 自定义提示弹窗
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastMsg(msg)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2500)
  }

  // 点击背景缩略图时立即切换（不等待抽屉关闭）
  const handleBgSelect = (id) => {
    if (id) {
      // 选择背景时，如果当前是深色模式则自动切回浅色
      setTheme((prev) => {
        if (prev === 'dark') {
          localStorage.setItem('theme', 'light')
          return 'light'
        }
        return prev
      })
    }
    setBgUrl(id ? getActiveBgUrl() : '')
  }
  // 波纹动画启停
  const handleWaveToggle = (next) => {
    setWaveVisible(next)
    setStoredVisible(next)
  }

  // 关闭抽屉
  const handleBgClose = () => {
    setBgDrawerOpen(false)
  }

  const profile = readUserProfile()
  const { email: userEmail, displayName: userName, avatarColor } = profile

  const loadNotifs = useCallback(async () => {
    try {
      const msgs = await getAll('messages')
      const unread = msgs.filter((m) => m.unread).sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 3)
      setNotifMessages(unread)
    } catch {
      setNotifMessages([])
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      setTick((n) => n + 1)
      loadNotifs()
    }
    loadNotifs()
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [loadNotifs])

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const handleToggleTheme = () => {
    if (bgUrl) {
      showToast('有皮肤背景时无法切换主题，请先选择"无背景"')
      return
    }
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
    localStorage.removeItem('user_session')
    localStorage.removeItem('tabs_state')
    navigate('/', { replace: true })
  }

  const handleToggle = () => {
    setDropdownOpen((prev) => !prev)
  }

  const handleNotifToggle = async () => {
    await loadNotifs()
    setDropdownOpen(false)
    setNotifOpen((prev) => !prev)
  }

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
    if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  useEffect(() => {
    setTick((n) => n + 1)
  }, [location])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  return (
    <div className={`app-layout${bgUrl ? ' has-bg' : ''}`}>
      {/* 背景 backdrop — 只有背景图，无蒙层，蒙层效果由内容区半透明实现 */}
      {bgUrl && (
        <div
          className="bg-backdrop"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />
      )}

      {/* 移动端菜单按钮 */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="切换菜单"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* 移动端遮罩层 */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ===== Left Sidebar ===== */}
      <aside className={`sidebar${sidebarOpen ? ' mobile-open' : ''}`} ref={sidebarRef}>
        <div className="sidebar-brand">
          <img src={logo} alt="CareerCompass" width="28" height="28" />
          <span>职业罗盘</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
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
          ))}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="main-content">
        {/* ===== Sticky Header（顶边栏，始终可见不在全屏区域内） ===== */}
        <div className="sticky-header">
          {/* ===== Top Bar ===== */}
          <div className="topbar">
            <div className="topbar-left">
              <button className="topbar-icon-btn" onClick={() => navigate(-1)} title="返回上一页">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
              <button className={`topbar-icon-btn${refreshing ? ' refreshing' : ''}`} onClick={() => { setRefreshKey((k) => k + 1); setRefreshing(true) }} title="刷新当前页面">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
              <FullscreenButton isFullscreen={isFullscreen} onToggle={handleFullscreenToggle} />
            </div>
            <div className="topbar-actions">
              {/* Notification Bell */}
              <div className="notif-card" ref={notifRef}>
                <button className="notif-btn" onClick={handleNotifToggle} title="通知">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notifMessages.length > 0 && (
                    <span className="notif-badge">{notifMessages.length}</span>
                  )}
                </button>
                <div className={`notif-dropdown${notifOpen ? ' open' : ''}`}>
                  <div className="notif-dropdown-header"><span>通知</span></div>
                  <div className="notif-dropdown-body">
                    {notifMessages.length === 0 ? (
                      <div className="notif-empty">暂无新通知</div>
                    ) : (
                      notifMessages.map((msg) => (
                        <div key={msg.id} className="notif-item" onClick={() => handleNotifClick(msg)}>
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

              {/* 波纹启停按钮 */}
              <button
                className="topbar-icon-btn wave-topbar-btn"
                onClick={() => handleWaveToggle(!waveVisible)}
                title={waveVisible ? '隐藏波纹' : '显示波纹'}
                aria-label={waveVisible ? '隐藏波纹' : '显示波纹'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {waveVisible ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <polyline points="17.5 6.5 17.5 12 17.5 17.5" />
                      <polyline points="12 8.5 12 12 12 15.5" />
                      <polyline points="6.5 11 6.5 12 6.5 14" />
                    </>
                  ) : (
                    <>
                      <polyline points="17.5 6.5 17.5 12 17.5 17.5" />
                      <polyline points="12 8.5 12 12 12 15.5" />
                      <polyline points="6.5 11 6.5 12 6.5 14" />
                    </>
                  )}
                </svg>
              </button>

              {/* Background Skin */}
              <button className="topbar-icon-btn bg-skin-btn" onClick={() => setBgDrawerOpen(true)} title="皮肤背景">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </button>

              {/* Theme Toggle */}
              <button className="theme-toggle-btn" onClick={handleToggleTheme}
                title={bgUrl ? '有皮肤背景时无法切换主题' : (theme === 'light' ? '切换到深色模式' : '切换到浅色模式')}
              >
                {theme === 'light' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        </div>
        {/* ===== Sticky Header 结束 ===== */}

        {/* ===== 主题区域容器（全屏主体区域时整个区域全屏：TabBar+内容区） ===== */}
        <div className="theme-area">
          {/* TabBar — 固定在顶边栏下方 */}
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
            onContextMenu={handleContextMenu}
            contextMenu={contextMenu}
            onContextAction={handleContextAction}
            onCloseContextMenu={closeContextMenu}
            onTabMove={handleTabMove}
            isThemeAreaFullscreen={isThemeAreaFullscreen}
            isContentFullscreen={isContentFullscreen}
            onFullscreenContent={() => {
              const el = document.querySelector('.page-content')
              if (el) {
                if (!document.fullscreenElement) {
                  el.requestFullscreen?.()
                } else {
                  document.exitFullscreen?.()
                }
              }
            }}
            onFullscreenThemeArea={() => {
              const el = document.querySelector('.theme-area')
              if (el) {
                if (!document.fullscreenElement) {
                  el.requestFullscreen?.()
                } else {
                  document.exitFullscreen?.()
                }
              }
            }}
          />

          {/* Page Content */}
          <div className={`page-content${refreshing ? ' refreshing' : ''}`}>
            <Outlet key={refreshKey} />
            {/* 全屏内容区域退出按钮 — 放在 page-content 内部才能在 fullscreen 中显示 */}
            <ExitContentFullscreen targetSelector=".page-content" />
          </div>
          <AudioWave visible={waveVisible} onToggle={handleWaveToggle} />
          {/* 全屏主体区域退出按钮 — 放在 theme-area 内部才能在 fullscreen 中显示 */}
          <ExitContentFullscreen targetSelector=".theme-area" />
        </div>
        {/* ===== theme-area 结束 ===== */}

        {/* 皮肤背景抽屉 */}
        <BackgroundSkin open={bgDrawerOpen} onClose={handleBgClose} onBgSelect={handleBgSelect} />

        {/* 自定义提示弹窗 */}
        {toastMsg && (
          <div className="bg-toast">
            <span>{toastMsg}</span>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
