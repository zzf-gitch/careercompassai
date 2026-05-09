/* ════════════════════════════════════════
   IndexedDB 服务层 — 轻量级 Promise 封装
   ════════════════════════════════════════ */

const DB_NAME = 'careercompass_db'
const DB_VERSION = 3

/** 所有对象仓库配置 */
const STORES = {
  applications: { keyPath: 'id' },
  saved_items:   { keyPath: 'id' },
  messages:      { keyPath: 'id' },
  opportunities: { keyPath: 'id' },
  system_logs:   { keyPath: 'id' },
}

/* ── 打开 / 创建数据库 ── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      Object.entries(STORES).forEach(([name, opts]) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, opts)
        }
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/* ── 通用 CRUD ── */

/** 获取 store 中所有记录 */
export async function getAll(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** 根据 id 获取单条记录 */
export async function getById(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.get(id)
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** 添加一条记录（自动生成 id 如果未提供） */
export async function add(storeName, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    if (!data.id) data.id = Date.now() + Math.random() * 1000
    const req = store.add(data)
    req.onsuccess = () => { db.close(); resolve(data) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** 更新一条记录（完全替换） */
export async function put(storeName, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.put(data)
    req.onsuccess = () => { db.close(); resolve(data) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** 删除一条记录 */
export async function del(storeName, id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.delete(id)
    req.onsuccess = () => { db.close(); resolve() }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/** 清空整个 store */
export async function clear(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const req = store.clear()
    req.onsuccess = () => { db.close(); resolve() }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

/* ── 相对时间格式化 ── */
export function formatTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 172800000) return '昨天'
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return new Date(timestamp).toISOString().slice(0, 10)
}

/* ── 初始化示例数据（首次使用时填充） ── */
const SEEDED_KEY = 'db_seeded_v4'

export async function seedIfEmpty() {
  if (localStorage.getItem(SEEDED_KEY)) return

  const db = await openDB()

  // ── 示例职位机会（使用真实时间戳） ──
  const oppNow = Date.now()
  const DAY_MS = 86400000
  const opportunities = [
    { id: 1, title: '高级前端工程师', company: 'ByteDance', location: '北京', salary: '35K-55K', type: '全职', tags: ['React', 'TypeScript', '前端架构'], description: '负责核心业务的前端架构设计与开发，推动前端工程化建设。', _posted: oppNow - 2 * DAY_MS, logo: '🎯' },
    { id: 2, title: '全栈工程师', company: 'Alibaba', location: '杭州', salary: '30K-50K', type: '全职', tags: ['Node.js', 'React', 'MySQL'], description: '参与电商中台系统的全栈开发，负责高并发场景下的系统优化。', _posted: oppNow - 1 * DAY_MS, logo: '🛵' },
    { id: 3, title: 'React 前端开发', company: 'Tencent', location: '深圳', salary: '28K-45K', type: '全职', tags: ['React', 'Next.js', 'CSS'], description: '负责腾讯云产品的前端开发，打造极致的用户体验。', _posted: oppNow - 3 * DAY_MS, logo: '🐧' },
    { id: 4, title: '前端实习生', company: 'Meituan', location: '北京', salary: '6K-8K', type: '实习', tags: ['React', 'Vue', 'JavaScript'], description: '参与美团到店业务的前端开发，有导师一对一指导。', _posted: oppNow - 5 * DAY_MS, logo: '🛵' },
    { id: 5, title: '资深 UI 工程师', company: 'Xiaomi', location: '南京', salary: '25K-40K', type: '全职', tags: ['Figma', 'React', '动画'], description: '负责小米智能家居产品的前端开发与交互实现。', _posted: oppNow - 7 * DAY_MS, logo: '📱' },
    { id: 6, title: '后端开发工程师', company: 'JD.com', location: '北京', salary: '30K-48K', type: '全职', tags: ['Go', 'Java', '微服务'], description: '负责京东零售中台的后端服务开发，保障系统稳定性。', _posted: oppNow - 4 * DAY_MS, logo: '🐶' },
    { id: 7, title: 'DevOps 工程师', company: 'NetEase', location: '广州', salary: '28K-42K', type: '全职', tags: ['Docker', 'K8s', 'CI/CD'], description: '负责网易云音乐的运维平台建设与自动化部署。', _posted: oppNow - 3 * DAY_MS, logo: '🎵' },
    { id: 8, title: '数据分析师', company: 'Baidu', location: '上海', salary: '22K-38K', type: '全职', tags: ['SQL', 'Python', 'Tableau'], description: '负责百度搜索的数据分析，为产品决策提供数据支持。', _posted: oppNow - 2 * DAY_MS, logo: '🔍' },
  ]

  // ── 示例申请记录 ──
  const applications = [
    { id: 1, company: 'ByteDance', position: '高级前端工程师', status: 'reviewing', appliedAt: '2026-05-01', logo: '🎯', notes: '已完成第一轮技术面' },
    { id: 2, company: 'Alibaba', position: '全栈工程师', status: 'interview', appliedAt: '2026-04-28', logo: '🛵', notes: '面试时间：后天 14:00' },
    { id: 3, company: 'Tencent', position: 'React 前端开发', status: 'submitted', appliedAt: '2026-05-03', logo: '🐧', notes: '等待简历筛选结果' },
    { id: 4, company: 'Meituan', position: '前端实习生', status: 'offer', appliedAt: '2026-04-20', logo: '🛵', notes: '已收到 Offer，薪资 7K/月' },
    { id: 5, company: 'Xiaomi', position: '资深 UI 工程师', status: 'rejected', appliedAt: '2026-04-15', logo: '📱', notes: '未通过简历筛选' },
  ]

  // ── 示例收藏（含 jobId 与机会列表关联） ──
  const savedItems = [
    { id: 1, jobId: 1, title: '高级前端工程师', company: 'ByteDance', savedAt: '2026-05-05', type: 'job', logo: '🎯', reason: '感兴趣的技术栈' },
    { id: 2, jobId: 2, title: '全栈工程师', company: 'Alibaba', savedAt: '2026-05-04', type: 'job', logo: '🛵', reason: '不错的平台' },
    { id: 3, title: 'React 性能优化实战', company: null, savedAt: '2026-05-02', type: 'article', logo: '📝', reason: '技术提升' },
    { id: 4, jobId: 7, title: 'DevOps 工程师', company: 'NetEase', savedAt: '2026-05-01', type: 'job', logo: '🎵', reason: '发展方向' },
  ]

  // ── 示例消息（使用真实时间戳） ──
  const msgNow = Date.now()
  const HOUR_MS = 3600000
  const messages = [
    { id: 1, from: 'ByteDance HR', content: '你好，我们已经收到你的简历，期待与你进一步沟通。', _timestamp: msgNow - 2 * HOUR_MS, unread: true },
    { id: 2, from: 'Alibaba 招聘系统', content: '你的简历已通过初步筛选，请选择面试时间。', _timestamp: msgNow - 5 * HOUR_MS, unread: true },
    { id: 3, from: '系统通知', content: '有 3 个新的职位推荐给你，快去看看吧。', _timestamp: msgNow - 1 * DAY_MS, unread: false },
    { id: 4, from: 'Tencent HR', content: '感谢你投递 React 前端开发职位，我们正在审阅你的简历。', _timestamp: msgNow - 2 * DAY_MS, unread: false },
    { id: 5, from: '系统通知', content: '你的收藏职位「高级前端工程师」有新的更新。', _timestamp: msgNow - 3 * DAY_MS, unread: false },
  ]

  // ── 示例系统日志 ──
  const now = Date.now()
  const systemLogs = [
    { id: 1, action: '登录系统', detail: '用户 Kawasaki 登录了职业罗盘', timestamp: now - 180000, user: 'Kawasaki' },
    { id: 2, action: '投递简历', detail: '投递了「高级前端工程师」至 ByteDance', timestamp: now - 3600000, user: 'Kawasaki' },
    { id: 3, action: '修改个人资料', detail: '更新了个人信息设置', timestamp: now - 7200000, user: 'Kawasaki' },
    { id: 4, action: '收藏职位', detail: '收藏了「全栈工程师」- Alibaba', timestamp: now - 86400000, user: 'Kawasaki' },
    { id: 5, action: '登录系统', detail: '用户 Kawasaki 登录了职业罗盘', timestamp: now - 172800000, user: 'Kawasaki' },
  ]

  // 写入数据
  const tx = db.transaction(Object.keys(STORES), 'readwrite')
  const appStore = tx.objectStore('applications')
  const savedStore = tx.objectStore('saved_items')
  const msgStore = tx.objectStore('messages')
  const oppStore = tx.objectStore('opportunities')
  const logStore = tx.objectStore('system_logs')

  // 写入示例数据
  applications.forEach((a) => appStore.add(a))
  savedItems.forEach((s) => savedStore.add(s))
  messages.forEach((m) => msgStore.add(m))
  opportunities.forEach((o) => oppStore.add(o))
  systemLogs.forEach((l) => logStore.add(l))

  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  db.close()

  localStorage.setItem(SEEDED_KEY, '1')
}

/* ── 统计工具（供仪表盘使用） ── */
export async function getDashboardStats() {
  const applications = await getAll('applications')
  const savedItems = await getAll('saved_items')
  const messages = await getAll('messages')

  const submitted = applications.length
  const interviews = applications.filter((a) => a.status === 'interview').length
  const offers = applications.filter((a) => a.status === 'offer').length
  const saved = savedItems.filter((i) => i.type === 'job').length

  return {
    submitted,
    interviews,
    offers,
    saved,
    totalApplications: submitted,
    unreadMessages: messages.filter((m) => m.unread).length,
  }
}

/* ── 获取当前登录用户的身份（求职者 / Boss） ── */
export function getUserRole() {
  try {
    const raw = localStorage.getItem('user_settings')
    if (raw) {
      const p = JSON.parse(raw)
      if (p.role) return p.role
    }
  } catch {}
  return 'seeker' // 默认为求职者
}

/* ── 自动添加系统消息（供各页面调用） ── */
export async function addSystemMessage(from, content) {
  const now = Date.now()
  const msg = {
    id: now + Math.random() * 1000,
    from,
    content,
    time: formatTime(now),
    _timestamp: now,
    unread: true,
  }
  await add('messages', msg)
  window.dispatchEvent(new CustomEvent('profile-updated'))
}

/* ── 获取当前登录邮箱（从独立的 user_session 中读取） ── */
export function getCurrentEmail() {
  try {
    const raw = localStorage.getItem('user_session')
    if (raw) {
      const p = JSON.parse(raw)
      if (p.email) return p.email
    }
  } catch {}
  return ''
}

/* ── 记录系统操作日志 ── */
export async function logActivity(action, detail) {
  const email = getCurrentEmail() || 'unknown'
  const user = email.split('@')[0]
  const now = Date.now()
  const entry = {
    id: now + Math.random() * 1000,
    action,
    detail,
    timestamp: now,
    time: formatTime(now),
    user,
  }
  await add('system_logs', entry)
  window.dispatchEvent(new CustomEvent('profile-updated'))
}

/* ── 获取所有系统日志（按时间倒序） ── */
export async function getAllSystemLogs() {
  const logs = await getAll('system_logs')
  return logs.sort((a, b) => b.timestamp - a.timestamp)
}
