import { useState } from 'react'
import { logActivity } from '../../utils/db'
import './Profile.css'

/* ── Available avatar colors ── */
const AVATAR_COLORS = ['#7c5cfc', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f97316']

/* ── Storage keys ── */
const STORAGE_KEY = 'login_remember_credentials'
const SETTINGS_KEY = 'user_settings'

/* ── Dispatch custom event to notify App.jsx & other components ── */
function notifyProfileUpdated() {
  window.dispatchEvent(new CustomEvent('profile-updated'))
}

function Profile() {
  /* ── 从 user_session 读取当前登录邮箱 ── */
  const sessionEmail = (() => {
    try {
      const raw = localStorage.getItem('user_session')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.email) return p.email
      }
    } catch {}
    return ''
  })()

  /* ── 从 user_settings 读取个人偏好（不包含密码） ── */
  const savedSettings = (() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })()

  /* ── 从 remember_credentials 读取已保存的密码 ── */
  const savedCredentials = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        if (p.remember) return p
      }
    } catch {}
    return {}
  })()

  /* ── State ── */
  const [displayName, setDisplayName] = useState(savedSettings.displayName || sessionEmail.split('@')[0] || '')
  const [email, setEmail] = useState(sessionEmail)
  const [password, setPassword] = useState(savedCredentials.password || '')
  const [gender, setGender] = useState(savedSettings.gender || '')
  const [role, setRole] = useState(savedSettings.role || 'seeker')
  const [avatarColor, setAvatarColor] = useState(savedSettings.avatarColor || '#7c5cfc')
  const [toast, setToast] = useState('')

  /* ── Show toast briefly ── */
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  /* ── Save handler ── */
  const handleSave = (e) => {
    e.preventDefault()

    const name = displayName.trim() || email.split('@')[0] || 'User'

    // 1. Save user_session (update email if changed)
    localStorage.setItem('user_session', JSON.stringify({ email }))

    // 2. Save user_settings（个人偏好，不含密码）
    const settings = { displayName: name, email, gender, role, avatarColor }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))

    // 3. Sync remember-credentials（密码仅保存在这里，不混入个人资料）
    if (password) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ email, password, remember: true })
      )
    }

    // 4. Notify all open tabs / components to refresh profile data
    notifyProfileUpdated()

    logActivity('修改个人资料', `用户 ${name} 更新了个人信息设置`)
    showToast('✅ 保存成功')
  }

  /* ── Handle avatar color change ── */
  const handleColorChange = (color) => {
    setAvatarColor(color)
  }

  /* ── Get the current initial for avatar ── */
  const initial = (displayName || email.split('@')[0] || 'U').charAt(0).toUpperCase()

  return (
    <div className="profile-page">
      {/* ── Page Header ── */}
      <div className="profile-header">
        <div>
          <h1>个人资料</h1>
          <p className="profile-subtitle">管理你的个人信息，所有修改实时生效。</p>
        </div>
      </div>

      {/* ── Avatar & Identity Card ── */}
      <div className="profile-identity-card">
        <div className="profile-identity-left">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-img" style={{ background: avatarColor }}>
              {initial}
            </div>
            <div className="profile-avatar-overlay">更换颜色</div>
          </div>
          <div className="profile-identity-info">
            <h2>{displayName || email.split('@')[0] || 'User'}</h2>
            <span className="profile-identity-email">{email}</span>
            <div className="profile-color-picker">
              <span className="profile-color-label">头像颜色</span>
              <div className="profile-color-row">
                {AVATAR_COLORS.map((c) => (
                  <div
                    key={c}
                    className={`profile-color-dot${avatarColor === c ? ' active' : ''}`}
                    style={{ background: c }}
                    onClick={() => handleColorChange(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* ── Basic Info ── */}
        <div className="profile-section">
          <div className="profile-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>基本信息</span>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <label htmlFor="profile-name">用户名</label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="输入显示名称"
              />
            </div>
            <div className="profile-field">
              <label htmlFor="profile-gender">性别</label>
              <select
                id="profile-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">—— 请选择 ——</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="profile-field">
              <label htmlFor="profile-role">身份</label>
              <select
                id="profile-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="seeker">求职者</option>
                <option value="boss">Boss / 招聘方</option>
              </select>
            </div>
            <div className="profile-field profile-field-wide">
              <label htmlFor="profile-email">邮箱</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="profile-section">
          <div className="profile-section-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>安全设置</span>
          </div>
          <div className="profile-field">
            <label htmlFor="profile-password">密码</label>
            <input
              id="profile-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码以记住登录"
            />
            <div className="profile-field-hint">
              保存密码后，登录页「记住邮箱密码」功能将自动填充此密码。
            </div>
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="profile-actions">
          <button type="submit" className="profile-save-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            保存修改
          </button>
        </div>
      </form>

      {/* ── Toast ── */}
      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  )
}

export default Profile
