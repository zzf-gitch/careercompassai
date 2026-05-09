import { useState, useEffect, useMemo, useRef } from 'react'
import { getAll, add, del, getUserRole, addSystemMessage, logActivity, formatTime } from '../../utils/db'
import './Opportunities.css'

const TYPE_OPTIONS = ['全部', '全职', '实习', '兼职']
const LOCATIONS = ['全部', '北京', '上海', '杭州', '深圳', '广州', '南京']

function Opportunities() {
  const [allJobs, setAllJobs] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('全部')
  const [locFilter, setLocFilter] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState(new Set())
  const [role, setRole] = useState('seeker')

  // Boss 添加职位相关状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const logoPickerRef = useRef(null)
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '北京',
    salary: '',
    type: '全职',
    tags: '',
    description: '',
    logo: '🏢',
  })

  const LOGO_OPTIONS = ['🏢', '💻', '🚀', '💡', '📱', '🌐', '🎯', '🏦', '🏭', '🎮', '📊', '🛒', '🏪', '🏗️', '🧬', '⚕️', '🎨', '📰', '🔬', '💳', '🎪', '🚗', '✈️', '🏨', '🍔', '🛠️']

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (logoPickerRef.current && !logoPickerRef.current.contains(e.target)) {
        setShowLogoPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = async () => {
    const jobs = await getAll('opportunities')
    setAllJobs(jobs)

    // 加载收藏列表 — 兼容有 jobId（新数据）和无 jobId（旧数据）两种情况
    const savedItems = await getAll('saved_items')
    const ids = new Set(
      savedItems
        .filter((i) => i.type === 'job')
        .map((i) => {
          if (i.jobId) return i.jobId
          // 旧数据没有 jobId，通过 title + company 匹配
          const job = jobs.find((j) => j.title === i.title && j.company === i.company)
          return job ? job.id : null
        })
        .filter(Boolean)
    )
    setSavedIds(ids)

    setRole(getUserRole())
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    return allJobs.filter((job) => {
      const matchSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        (job.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchType = typeFilter === '全部' || job.type === typeFilter
      const matchLoc = locFilter === '全部' || job.location === locFilter
      return matchSearch && matchType && matchLoc
    })
  }, [allJobs, search, typeFilter, locFilter])

  /* ── 收藏 / 取消收藏 ── */
  const handleToggleSave = async (job) => {
    const savedItems = await getAll('saved_items')
    const existing = savedItems.find((i) => i.type === 'job' && i.jobId === job.id)
    if (existing) {
      // 已收藏 → 取消收藏（从 saved_items 删除）
      await del('saved_items', existing.id)
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(job.id)
        return next
      })
      logActivity('收藏职位', `取消了收藏「${job.title}」- ${job.company}`)
    } else {
      // 未收藏 → 添加收藏
      const newItem = {
        id: Date.now() + Math.random() * 1000,
        jobId: job.id,
        title: job.title,
        company: job.company,
        savedAt: new Date().toISOString().slice(0, 10),
        type: 'job',
        logo: job.logo || '💼',
        reason: '',
      }
      await add('saved_items', newItem)
      setSavedIds((prev) => new Set(prev).add(job.id))
      logActivity('收藏职位', `收藏了「${job.title}」- ${job.company}`)
    }
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  /* ── Boss 添加职位 ── */
  const handleAddJob = async (e) => {
    e.preventDefault()
    const now = Date.now()
    const job = {
      id: now + Math.random() * 1000,
      title: newJob.title.trim(),
      company: newJob.company.trim(),
      location: newJob.location,
      salary: newJob.salary.trim(),
      type: newJob.type,
      tags: newJob.tags.split(/[,，、]/).map((t) => t.trim()).filter(Boolean),
      description: newJob.description.trim(),
      _posted: now,
      logo: newJob.logo || '🏢',
    }
    await add('opportunities', job)
    setAllJobs((prev) => [job, ...prev])
    setShowAddModal(false)
    setNewJob({ title: '', company: '', location: '北京', salary: '', type: '全职', tags: '', description: '', logo: '🏢' })
    await addSystemMessage('系统通知', `你发布了新职位「${job.title}」- ${job.company}，等待求职者投递。`)
    logActivity('发布职位', `发布了新职位「${job.title}」- ${job.company}`)
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  /* ── Boss 删除职位 ── */
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('确定要删除该职位吗？')) return
    await del('opportunities', jobId)
    setAllJobs((prev) => prev.filter((j) => j.id !== jobId))
    await addSystemMessage('系统通知', `你已删除了一条职位招聘信息。`)
    logActivity('删除职位', `删除了一个招聘职位（ID: ${jobId}）`)
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const statusLabel = (type) => {
    switch (type) {
      case '全职': return <span className="opp-tag opp-tag-fulltime">全职</span>
      case '实习': return <span className="opp-tag opp-tag-intern">实习</span>
      case '兼职': return <span className="opp-tag opp-tag-parttime">兼职</span>
      default: return <span className="opp-tag">{type}</span>
    }
  }

  if (loading) return <div className="opp-loading">加载中...</div>

  return (
    <div className="opp-page">
      <div className="opp-header">
        <div>
          <h1 className="opp-title">职位机会</h1>
          <p className="opp-subtitle">发现适合你的工作机会，共 {filtered.length} 个职位</p>
        </div>
        {role === 'boss' && (
          <button className="opp-add-btn" onClick={() => setShowAddModal(true)}>
            <span>＋</span> 发布职位
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="opp-filters">
        <div className="opp-search-wrap">
          <span className="opp-search-icon">🔍</span>
          <input
            className="opp-search-input"
            type="text"
            placeholder="搜索职位、公司、技能..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="opp-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="opp-filter-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="opp-select">
            {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="opp-select">
            {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="opp-list">
        {filtered.length === 0 ? (
          <div className="opp-empty">
            <span className="opp-empty-icon">🔍</span>
            <p>没有找到匹配的职位</p>
            <button className="opp-reset-btn" onClick={() => { setSearch(''); setTypeFilter('全部'); setLocFilter('全部') }}>重置筛选</button>
          </div>
        ) : (
          filtered.map((job) => {
            const isSaved = savedIds.has(job.id)
            return (
              <div key={job.id} className="opp-card">
                <div className="opp-card-left">
                  <div className="opp-card-logo">{job.logo}</div>
                  <div className="opp-card-body">
                    <h3 className="opp-card-title">{job.title}</h3>
                    <div className="opp-card-meta">
                      <span>{job.company}</span>
                      <span className="opp-dot">·</span>
                      <span>{job.location}</span>
                      <span className="opp-dot">·</span>
                      <span>{job.salary}</span>
                    </div>
                    <p className="opp-card-desc">{job.description}</p>
                    <div className="opp-card-tags">
                      {(job.tags || []).map((tag) => (
                        <span key={tag} className="opp-tag-skill">{tag}</span>
                      ))}
                      {statusLabel(job.type)}
                    </div>
                  </div>
                </div>
                <div className="opp-card-right">
                  <span className="opp-card-time">{job._posted ? formatTime(job._posted) : job.posted || '刚刚'}</span>
                  <button
                    className={`opp-save-btn${isSaved ? ' saved' : ''}`}
                    onClick={() => handleToggleSave(job)}
                    title={isSaved ? '取消收藏' : '收藏职位'}
                  >
                    {isSaved ? '★' : '☆'}
                  </button>
                  {role === 'boss' && (
                    <button
                      className="opp-del-btn"
                      onClick={() => handleDeleteJob(job.id)}
                      title="删除职位"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ════════ Boss 发布职位 Modal ════════ */}
      {showAddModal && (
        <div className="opp-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="opp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="opp-modal-header">
              <h3>发布新职位</h3>
              <button className="opp-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form className="opp-modal-form" onSubmit={handleAddJob}>
              <div className="opp-modal-grid">
                <div className="opp-modal-field">
                  <label>职位名称 *</label>
                  <input
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="例如：高级前端工程师"
                  />
                </div>
                <div className="opp-modal-field">
                  <label>公司名称 *</label>
                  <input
                    required
                    value={newJob.company}
                    onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    placeholder="例如：ByteDance"
                  />
                </div>
                <div className="opp-modal-field">
                  <label>公司图标</label>
                  <div className="opp-logo-picker-wrap" ref={logoPickerRef}>
                    <button type="button" className="opp-logo-picker-trigger" onClick={() => setShowLogoPicker(!showLogoPicker)}>
                      <span className="opp-logo-preview">{newJob.logo}</span>
                      <span className="opp-logo-arrow">▼</span>
                    </button>
                    {showLogoPicker && (
                      <div className="opp-logo-picker-dropdown">
                        {LOGO_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className={`opp-logo-option${newJob.logo === emoji ? ' selected' : ''}`}
                            onClick={() => { setNewJob({ ...newJob, logo: emoji }); setShowLogoPicker(false) }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="opp-modal-field">
                  <label>工作地点</label>
                  <select value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}>
                    {LOCATIONS.filter((l) => l !== '全部').map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="opp-modal-field">
                  <label>薪资范围</label>
                  <input
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="例如：30K-50K"
                  />
                </div>
                <div className="opp-modal-field">
                  <label>工作类型</label>
                  <select value={newJob.type} onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}>
                    <option value="全职">全职</option>
                    <option value="实习">实习</option>
                    <option value="兼职">兼职</option>
                  </select>
                </div>
                <div className="opp-modal-field">
                  <label>技能标签（逗号分隔）</label>
                  <input
                    value={newJob.tags}
                    onChange={(e) => setNewJob({ ...newJob, tags: e.target.value })}
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>
              </div>
              <div className="opp-modal-field opp-modal-field-wide">
                <label>职位描述</label>
                <textarea
                  rows="3"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="描述职位职责和要求..."
                />
              </div>
              <div className="opp-modal-actions">
                <button type="button" className="opp-modal-cancel" onClick={() => setShowAddModal(false)}>取消</button>
                <button type="submit" className="opp-modal-submit">发布职位</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Opportunities
