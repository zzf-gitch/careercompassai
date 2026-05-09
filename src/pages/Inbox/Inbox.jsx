import { useState, useEffect } from 'react'
import { getAll, del, put, formatTime } from '../../utils/db'
import './Inbox.css'

function Inbox() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const data = await getAll('messages')
    setMessages(data.sort((a, b) => {
      // 简单的排序，unread 优先，然后按 id 倒序
      if (a.unread !== b.unread) return a.unread ? -1 : 1
      return b.id - a.id
    }))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleMarkRead = async (id) => {
    const msg = messages.find((m) => m.id === id)
    if (!msg || !msg.unread) return
    await put('messages', { ...msg, unread: false })
    load()
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const handleDelete = async (id) => {
    await del('messages', id)
    load()
    window.dispatchEvent(new CustomEvent('profile-updated'))
  }

  const unreadCount = messages.filter((m) => m.unread).length
  const filtered = filter === 'all' ? messages : filter === 'unread' ? messages.filter((m) => m.unread) : messages

  if (loading) return <div className="inbox-loading">加载中...</div>

  return (
    <div className="inbox-page">
      <div className="inbox-header">
        <div>
          <h1 className="inbox-title">收件箱</h1>
          <p className="inbox-subtitle">
            {unreadCount > 0 ? `你有 ${unreadCount} 条未读消息` : '没有未读消息'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inbox-tabs">
        <button className={`inbox-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          全部 <span className="inbox-tab-badge">{messages.length}</span>
        </button>
        <button className={`inbox-tab ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
          未读 {unreadCount > 0 && <span className="inbox-tab-badge unread">{unreadCount}</span>}
        </button>
      </div>

      {/* List */}
      <div className="inbox-list">
        {filtered.length === 0 ? (
          <div className="inbox-empty">
            <span className="inbox-empty-icon">✉️</span>
            <p>{filter === 'unread' ? '没有未读消息' : '收件箱为空'}</p>
          </div>
        ) : (
          filtered.map((msg) => (
            <div
              key={msg.id}
              className={`inbox-card ${msg.unread ? 'unread' : ''}`}
              onClick={() => msg.unread && handleMarkRead(msg.id)}
            >
              <div className="inbox-card-left">
                <div className="inbox-card-avatar">{msg.from.charAt(0)}</div>
                <div className="inbox-card-body">
                  <div className="inbox-card-top">
                    <span className="inbox-card-from">{msg.from}</span>
                    <span className="inbox-card-time">{msg._timestamp ? formatTime(msg._timestamp) : msg.time}</span>
                  </div>
                  <p className="inbox-card-content">{msg.content}</p>
                </div>
              </div>
              <div className="inbox-card-right">
                {msg.unread && <span className="inbox-unread-dot" />}
                <button className="inbox-del-btn" onClick={(e) => { e.stopPropagation(); handleDelete(msg.id) }} title="删除">
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Inbox
