import { useState, useEffect, useRef } from 'react'
import { getAll, add, del, put, addSystemMessage, logActivity } from '../../utils/db'
import './Applications.css'

const STATUS_MAP = {
  submitted: { label: '已投递', color: '#3b82f6' },
  reviewing: { label: '筛选',   color: '#f59e0b' },
  interview: { label: '面试',   color: '#7c5cfc' },
  offer:     { label: 'Offer',  color: '#10b981' },
  rejected:  { label: '未通过', color: '#ef4444' },
}

const LOGO_OPTIONS = ['📄', '💼', '🏢', '💻', '🚀', '🎯', '🏦', '🏭', '🎮', '📱', '🌐', '🎨', '📊', '🛒', '⚕️', '🔬', '🎪', '✈️', '🏨', '🍔']

function Applications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [opportunities, setOpportunities] = useState([])
  const [form, setForm] = useState({ company: '', position: '', notes: '', status: 'submitted', logo: '📄' })
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const logoPickerRef = useRef(null)

  const load = async () => {
    const [data, opps] = await Promise.all([getAll('applications'), getAll('opportunities')])
    setApps(data.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)))
    setOpportunities(opps)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const handleClickOutside = (e) => {
      if (logoPickerRef.current && !logoPickerRef.current.contains(e.target)) {
        setShowLogoPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleJobSelect = (jobId) => {
    const job = opportunities.find((o) => o.id === jobId)
    if (job) {
      setForm({ ...form, company: job.company, position: job.title, logo: job.logo || '📄' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company.trim() || !form.position.trim()) return
    const now = new Date().toISOString().slice(0, 10)
    await add('applications', {
      company: form.company,
      position: form.position,
      notes: form.notes || '',
      status: form.status,
      appliedAt: now,
      logo: form.logo || '📄',
      id: Date.now() + Math.random() * 1000,
    })
    setForm({ company: '', position: '', notes: '', status: 'submitted', logo: '📄' })
    setShowForm(false)
    load()
    // 添加系统消息
    await addSystemMessage('系统通知', `已投递「${form.position}」至 ${form.company}，祝你好运！`)
    logActivity('投递简历', `投递了「${form.position}」至 ${form.company}`)
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const handleDelete = async (id) => {
    await del('applications', id)
    load()
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const handleStatusChange = async (id, newStatus) => {
    const item = apps.find((a) => a.id === id)
    if (!item) return

    const statusMsgs = {
      reviewing: `${item.company} 正在筛选你的「${item.position}」简历`,
      interview: `收到了 ${item.company} 的面试邀请！请查收并确认时间。`,
      offer: `🎉 恭喜！你收到了 ${item.company} 的 Offer！`,
      rejected: `${item.company} 的「${item.position}」未通过筛选，继续加油！`,
    }

    await put('applications', { ...item, status: newStatus })
    load()

    // 状态变更时添加系统消息
    const msg = statusMsgs[newStatus]
    if (msg) await addSystemMessage('系统通知', msg)

    // 根据状态变更类型记录不同的操作日志
    if (newStatus === 'offer') {
      logActivity('收到 Offer', `「${item.position}」- ${item.company} 发出了 Offer`)
    } else if (newStatus === 'rejected') {
      logActivity('未通过', `「${item.position}」- ${item.company} 未通过筛选`)
    } else {
      logActivity('投递简历', `「${item.position}」状态变更为 ${STATUS_MAP[newStatus].label}`)
    }
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  if (loading) return <div className="app-loading">加载中...</div>

  return (
    <div className="app-page">
      <div className="app-header">
        <div>
          <h1 className="app-title">我的申请</h1>
          <p className="app-subtitle">追踪你的职位申请状态，共 {apps.length} 条记录</p>
        </div>
        <button className="app-add-btn" onClick={() => setShowForm(true)}>
          + 添加申请
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="app-modal-overlay" onClick={() => setShowForm(false)}>
          <form className="app-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="app-modal-header">
              <h3>添加申请</h3>
              <button type="button" className="app-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="app-modal-body">
              {/* 从机会列表选择 */}
              {opportunities.length > 0 && (
                <div className="app-field">
                  <label>从职位列表选择</label>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) handleJobSelect(Number(e.target.value)) }}
                  >
                    <option value="">-- 选择一个机会快速填入 --</option>
                    {opportunities.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.logo} {job.title} - {job.company}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="app-field">
                <label>公司图标</label>
                <div className="app-logo-picker-wrap" ref={logoPickerRef}>
                  <button type="button" className="app-logo-picker-trigger" onClick={() => setShowLogoPicker(!showLogoPicker)}>
                    <span className="app-logo-preview">{form.logo}</span>
                    <span className="app-logo-arrow">▼</span>
                  </button>
                  {showLogoPicker && (
                    <div className="app-logo-picker-dropdown">
                      {LOGO_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`app-logo-option${form.logo === emoji ? ' selected' : ''}`}
                          onClick={() => { setForm({ ...form, logo: emoji }); setShowLogoPicker(false) }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="app-field">
                <label>公司名称 *</label>
                <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="例：ByteDance" />
              </div>
              <div className="app-field">
                <label>职位名称 *</label>
                <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="例：前端工程师" />
              </div>
              <div className="app-field">
                <label>申请状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="app-field">
                <label>备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="任何备注信息..." rows={3} />
              </div>
            </div>
            <div className="app-modal-actions">
              <button type="button" className="app-modal-cancel" onClick={() => setShowForm(false)}>取消</button>
              <button type="submit" className="app-modal-submit" disabled={!form.company.trim() || !form.position.trim()}>添加</button>
            </div>
          </form>
        </div>
      )}

      {/* Status Summary */}
      <div className="app-summary">
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const count = apps.filter((a) => a.status === k).length
          return (
            <div key={k} className="app-summary-item">
              <span className="app-summary-dot" style={{ background: v.color }} />
              <span className="app-summary-label">{v.label}</span>
              <span className="app-summary-count">{count}</span>
            </div>
          )
        })}
      </div>

      {/* List */}
      <div className="app-list">
        {apps.length === 0 ? (
          <div className="app-empty">
            <span className="app-empty-icon">📋</span>
            <p>还没有申请记录</p>
            <button className="app-add-btn" onClick={() => setShowForm(true)}>添加第一条</button>
          </div>
        ) : (
          apps.map((app) => {
            const st = STATUS_MAP[app.status] || STATUS_MAP.submitted
            return (
              <div key={app.id} className="app-card">
                <div className="app-card-left">
                  <div className="app-card-logo">{app.logo || '📄'}</div>
                  <div className="app-card-body">
                    <h3 className="app-card-title">{app.position}</h3>
                    <div className="app-card-company">{app.company}</div>
                    <div className="app-card-notes">{app.notes || '无备注'}</div>
                    <span className="app-card-date">投递于 {app.appliedAt}</span>
                  </div>
                </div>
                <div className="app-card-right">
                  <select
                    className="app-status-select"
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    style={{ borderColor: st.color, color: st.color }}
                  >
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button className="app-delete-btn" onClick={() => handleDelete(app.id)} title="删除">
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Applications
