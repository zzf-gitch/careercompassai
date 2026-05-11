import { useRef, useEffect } from 'react'

/* ── 内置背景图片 ── */
import bg1 from '@/assets/background-1.png'
import bg2 from '@/assets/background-2.png'
import bg3 from '@/assets/background-3.png'

const BUILTIN_BGS = [
  { id: 'none',    name: '无背景', url: '' },
  { id: 'builtin-1', name: '青春少女', url: bg1 },
  { id: 'builtin-2', name: '蜘蛛侠', url: bg2 },
  { id: 'builtin-3', name: '名侦探柯南', url: bg3 },
]

/* ── localStorage key ── */
const ACTIVE_BG_KEY = 'active_bg'

/* ── 读取当前激活的背景 ID ── */
export function getActiveBg() {
  return localStorage.getItem(ACTIVE_BG_KEY) || ''
}

/* ── 读取当前激活的背景 URL ── */
export function getActiveBgUrl() {
  const id = getActiveBg()
  if (!id) return ''
  const bg = BUILTIN_BGS.find((b) => b.id === id)
  return bg ? bg.url : ''
}

/* ── 将图片 ID 转为 URL ── */
function getUrlById(id) {
  if (!id) return ''
  const bg = BUILTIN_BGS.find((b) => b.id === id)
  return bg ? bg.url : ''
}

export default function BackgroundSkin({ open, onClose, onBgSelect }) {
  const fileRef = useRef(null)
  // 无操作，仅用来触发隐藏 file input

  /* ── 点击外部关闭抽屉 ── */
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!e.target.closest('.bg-skin-drawer') && !e.target.closest('.bg-skin-btn')) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  /* ── 选中背景 ── */
  const handleSelect = (id) => {
    localStorage.setItem(ACTIVE_BG_KEY, id)
    if (onBgSelect) onBgSelect(id)
  }

  return (
    <>
      {/* 遮罩层 */}
      <div className={`bg-skin-overlay${open ? ' open' : ''}`} onClick={onClose} />

      {/* 抽屉面板 */}
      <div className={`bg-skin-drawer${open ? ' open' : ''}`}>
        {/* 头部 */}
        <div className="bg-skin-header">
          <h3>背景皮肤</h3>
          <button className="bg-skin-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="bg-skin-body">
          <div className="bg-skin-grid">
            {BUILTIN_BGS.map((bg) => (
              <div
                key={bg.id}
                className="bg-skin-item"
                onClick={() => handleSelect(bg.id)}
              >
                <div
                  className={`bg-skin-thumb${bg.id === 'none' ? ' bg-skin-thumb-none' : ''}`}
                  style={bg.url ? { backgroundImage: `url(${bg.url})` } : {}}
                >
                  {bg.id === 'none' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                  )}
                </div>
                <span className="bg-skin-item-name">{bg.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
