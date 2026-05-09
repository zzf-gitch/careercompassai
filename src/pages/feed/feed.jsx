import { useState, useEffect, useMemo } from 'react'
import './feed.css'

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
        role: 'Job Seeker',
        avatar: null,
        avatarColor: p.avatarColor || '#7c5cfc',
      }
    }
  } catch {}
  return { name: defaultName, role: 'Job Seeker', avatar: null, avatarColor: '#7c5cfc' }
}

/* ── Available avatar colors ── */
const AVATAR_COLORS = ['#7c5cfc', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f97316']

function getAvatarColor(name) {
  // 只有当前登录用户才使用保存的颜色，其他人用名字 hash 确定颜色
  const email = localStorage.getItem('userEmail') || ''
  const defaultName = email.split('@')[0]
  const isCurrentUser =
    name === defaultName ||
    (() => {
      try {
        const p = JSON.parse(localStorage.getItem('user_profile') || '{}')
        return name === p.displayName
      } catch {
        return false
      }
    })()

  if (isCurrentUser) {
    try {
      const p = JSON.parse(localStorage.getItem('user_profile') || '{}')
      if (p.avatarColor) return p.avatarColor
    } catch {}
  }

  // 基于名字 hash 的确定性颜色
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/* ── Mock Data ── */
const initialPosts = [
  {
    id: 1,
    author: '万志鹏',
    role: 'Job Seeker',
    avatar: null,
    time: '9 days ago',
    content: '原神。牛逼',
    likes: 0,
    comments: 1,
    shares: 15,
    liked: false,
  },
  {
    id: 2,
    author: 'xinyi',
    role: 'Employer',
    avatar: null,
    time: '9 days ago',
    content: '到此一游',
    likes: 2,
    comments: 1,
    shares: 15,
    liked: false,
  },
  {
    id: 3,
    author: 'AdamKeanu',
    role: 'Job Seeker',
    avatar: null,
    time: '15 days ago',
    content: '666',
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
  },
]

function Avatar({ name, size = 40 }) {
  const initials = name.slice(0, 1).toUpperCase()
  const color = getAvatarColor(name)
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.42,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}

function Feed() {
  const [posts, setPosts] = useState(initialPosts)
  const [postText, setPostText] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [tick, setTick] = useState(0)

  // 监听 profile-updated 自定义事件，保存后立即刷新当前用户信息
  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

  /* ── Current User (read on every render to stay in sync with login changes) ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentUser = useMemo(() => readCurrentUser(), [tick])

  /* ── Like togggle ── */
  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )
  }

  /* ── Submit a new post ── */
  const handlePost = (e) => {
    e.preventDefault()
    const text = postText.trim()
    if (!text) return
    const newPost = {
      id: Date.now(),
      author: currentUser.name,
      role: currentUser.role,
      avatar: null,
      time: 'just now',
      content: text,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
    }
    setPosts((prev) => [newPost, ...prev])
    setPostText('')
    setShowActions(false)
  }

  /* ── Delete a post ── */
  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  /* ── Cancel ── */
  const handleCancel = () => {
    setPostText('')
    setShowActions(false)
  }

  return (
    <div className="community-page">
      {/* ── Left column: Feed ── */}
      <div className="feed-column">
        {/* Page header */}
        <div className="feed-header">
          <h1 className="feed-title">社区动态</h1>
          <p className="feed-subtitle">与职业社区保持联系。</p>
        </div>

        {/* ── Start a post ── */}
        <form className="post-box" onSubmit={handlePost}>
          <div className="post-box-top">
            <Avatar name={currentUser.name} size={42} />
            <input
              className="post-input"
              type="text"
              placeholder="开始发帖…"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              onFocus={() => setShowActions(true)}
            />
          </div>
          {showActions && (
            <div className="post-box-actions">
              <button type="button" className="post-cancel-btn" onClick={handleCancel}>
                取消
              </button>
              <button type="submit" className="post-submit-btn" disabled={!postText.trim()}>
                发布
              </button>
            </div>
          )}
        </form>

        {/* ── Feed Posts ── */}
        <div className="feed-posts">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              {/* Header */}
              <div className="post-card-header">
                <Avatar name={post.author} size={44} />
                <div className="post-card-meta">
                  <span className="post-card-author">{post.author}</span>
                  <span className="post-card-role">{post.role}</span>
                  <span className="post-card-time">{post.time}</span>
                </div>
                <button
                  className="post-delete-btn"
                  onClick={() => handleDelete(post.id)}
                  title="删除帖子"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="post-card-body">{post.content}</div>

              {/* Stats */}
              <div className="post-card-stats">
                {post.likes > 0 && <span>{post.likes} 喜欢</span>}
                {post.comments > 0 && <span>{post.comments} 评论</span>}
                {post.shares > 0 && <span>{post.shares} 分享</span>}
              </div>

              {/* Actions */}
              <div className="post-card-actions">
                <button
                  className={`post-action-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  喜欢
                </button>
                <button className="post-action-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  评论
                </button>
                <button className="post-action-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  分享
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Feed
