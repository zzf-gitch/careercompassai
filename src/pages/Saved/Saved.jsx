import { useState, useEffect } from 'react'
import { getAll, del } from '../../utils/db'
import './Saved.css'

function Saved() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const data = await getAll('saved_items')
    setItems(data.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (id) => {
    await del('saved_items', id)
    load()
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)
  const jobCount = items.filter((i) => i.type === 'job').length
  const articleCount = items.filter((i) => i.type === 'article').length

  if (loading) return <div className="saved-loading">加载中...</div>

  return (
    <div className="saved-page">
      <div className="saved-header">
        <div>
          <h1 className="saved-title">收藏</h1>
          <p className="saved-subtitle">你收藏的职位和内容，共 {items.length} 项</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="saved-tabs">
        <button className={`saved-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          全部 <span className="saved-tab-badge">{items.length}</span>
        </button>
        <button className={`saved-tab ${filter === 'job' ? 'active' : ''}`} onClick={() => setFilter('job')}>
          职位 <span className="saved-tab-badge">{jobCount}</span>
        </button>
        <button className={`saved-tab ${filter === 'article' ? 'active' : ''}`} onClick={() => setFilter('article')}>
          文章 <span className="saved-tab-badge">{articleCount}</span>
        </button>
      </div>

      {/* List */}
      <div className="saved-list">
        {filtered.length === 0 ? (
          <div className="saved-empty">
            <span className="saved-empty-icon">🔖</span>
            <p>{filter === 'all' ? '还没有收藏内容' : filter === 'job' ? '还没有收藏职位' : '还没有收藏文章'}</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="saved-card">
              <div className="saved-card-logo">{item.logo || (item.type === 'job' ? '💼' : '📝')}</div>
              <div className="saved-card-body">
                <h3 className="saved-card-title">{item.title}</h3>
                {item.company && <div className="saved-card-company">{item.company}</div>}
                {item.reason && <div className="saved-card-reason">收藏原因：{item.reason}</div>}
                <div className="saved-card-meta">
                  <span className="saved-type-tag">{item.type === 'job' ? '职位' : '文章'}</span>
                  <span>收藏于 {item.savedAt}</span>
                </div>
              </div>
              <button className="saved-remove-btn" onClick={() => handleRemove(item.id)} title="取消收藏">
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Saved
