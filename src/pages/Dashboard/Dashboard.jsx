import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getAllSystemLogs, formatTime } from '../../utils/db'
import './Dashboard.css'

/* ── Read user profile from localStorage ── */
function readCurrentUser() {
  const email = localStorage.getItem('userEmail') || 'user@example.com'
  const defaultName = email.split('@')[0]
  try {
    const raw = localStorage.getItem('user_profile')
    if (raw) {
      const p = JSON.parse(raw)
      return {
        name: p.displayName || defaultName,
        email: p.email || email,
        avatarColor: p.avatarColor || '#7c5cfc',
        gender: p.gender || '未设置',
      }
    }
  } catch {}
  return { name: defaultName, email, avatarColor: '#7c5cfc', gender: '未设置' }
}

/* ── Quick actions ── */
const quickActions = [
  { label: '浏览机会', icon: '💼', to: '/opportunities', desc: '查看推荐职位' },
  { label: '社区动态', icon: '💬', to: '/feed', desc: '了解行业资讯' },
  { label: '查看申请', icon: '📋', to: '/applications', desc: '追踪投递进度' },
  { label: '收藏', icon: '🔖', to: '/saved', desc: '查看收藏的职位' },
]

function Dashboard() {
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [stats, setStats] = useState({ submitted: 0, interviews: 0, offers: 0, saved: 0 })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  // 监听 profile-updated 事件，用户修改个人资料后刷新
  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

  // 从 IndexedDB 读取实时统计数据
  useEffect(() => {
    (async () => {
      try {
        const s = await getDashboardStats()
        setStats(s)

        // 从系统日志读取操作记录（动态计算相对时间）
        const logs = await getAllSystemLogs()
        const acts = logs.slice(0, 6).map((l) => ({
          id: l.id,
          text: l.detail,
          time: formatTime(l.timestamp),
          type: l.action,
        }))
        setActivities(acts.length > 0 ? acts : [
          { id: 0, text: '暂无操作记录', time: '', type: 'viewed' },
        ])
      } catch {}
      setLoading(false)
    })()
  }, [tick])

  const currentUser = useMemo(() => readCurrentUser(), [tick])
  const initial = currentUser.name.charAt(0).toUpperCase()

  /* ── Greeting based on time of day ── */
  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 12) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  }

  /* ── Activity icon helper ── */
  const activityIcon = (action) => {
    if (action.includes('登录')) return '🔐'
    if (action.includes('投递')) return '📤'
    if (action.includes('资料') || action.includes('修改')) return '✏️'
    if (action.includes('收藏')) return '🔖'
    if (action.includes('发布') || action.includes('创建')) return '➕'
    if (action.includes('删除')) return '🗑️'
    if (action.includes('面试') || action.includes('筛选')) return '📅'
    if (action.includes('Offer') || action.includes('未通过')) return '📋'
    return '📌'
  }

  /* ── Stats data ── */
  const statsCards = [
    { label: '已投递', value: stats.submitted, icon: '📤', color: '#7c5cfc' },
    { label: '面试邀请', value: stats.interviews, icon: '📅', color: '#3b82f6' },
    { label: 'Offer', value: stats.offers, icon: '🎉', color: '#10b981' },
    { label: '收藏职位', value: stats.saved, icon: '🔖', color: '#f59e0b' },
  ]

  return (
    <div className="dashboard-page">
      {/* ════════ Welcome Banner ════════ */}
      <div className="dash-welcome-card">
        <div className="dash-welcome-left">
          <div className="dash-greeting">
            {getGreeting()}，<span className="dash-user-name">{currentUser.name}</span>
          </div>
          <p className="dash-subtitle">这是你的求职总览 — 继续保持前进！</p>
        </div>
        <div className="dash-welcome-right">
          <div className="dash-avatar-circle" style={{ background: currentUser.avatarColor }}>
            {initial}
          </div>
        </div>
      </div>

      {/* ════════ Stats Grid ════════ */}
      <div className="dash-stats-grid">
        {statsCards.map((stat) => (
          <div key={stat.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: `${stat.color}18`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="dash-stat-value">{stat.value}</div>
            <div className="dash-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ════════ Quick Actions + Recent Activity ════════ */}
      <div className="dash-two-columns">
        {/* ── Quick Actions ── */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-icon">⚡</span>
            <h3>快捷操作</h3>
          </div>
          <div className="dash-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="dash-action-btn"
                onClick={() => navigate(action.to)}
              >
                <span className="dash-action-icon">{action.icon}</span>
                <span className="dash-action-label">{action.label}</span>
                <span className="dash-action-desc">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 操作记录 ── */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-icon">📋</span>
            <h3>操作记录</h3>
          </div>
          <div className="dash-activity-list">
            {activities.map((act) => (
              <div key={act.id} className="dash-activity-item">
                <span className="dash-activity-icon">{activityIcon(act.type)}</span>
                <div className="dash-activity-body">
                  <p className="dash-activity-text">{act.text}</p>
                  <span className="dash-activity-time">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ Tips / Reminder Banner ════════ */}
      <div className="dash-tip-banner">
        <span className="dash-tip-icon">💡</span>
        <span className="dash-tip-text">
          提示：完善你的个人资料和简历，能让 recruiter 更了解你 —
          <button className="dash-tip-link" onClick={() => navigate('/profile')}>
            去完善
          </button>
        </span>
      </div>
    </div>
  )
}

export default Dashboard
