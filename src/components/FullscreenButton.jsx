import { useState, useEffect } from 'react'

export default function FullscreenButton({ isFullscreen, onToggle }) {
  return (
    <button
      className="topbar-icon-btn fullscreen-btn"
      onClick={onToggle}
      title={isFullscreen ? '退出全屏' : '进入全屏'}
    >
      {isFullscreen ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  )
}

/**
 * 全屏内容区域退出按钮 — 当指定选择器的元素处于全屏状态时，
 * 在右上角显示「退出全屏」悬浮按钮
 */
export function ExitContentFullscreen({ targetSelector }) {
  const [isTargetFullscreen, setIsTargetFullscreen] = useState(false)

  useEffect(() => {
    const check = () => {
      const el = document.querySelector(targetSelector)
      if (!el) return
      // 判断当前全屏元素是否就是目标元素
      const fsEl = document.fullscreenElement
      setIsTargetFullscreen(!!fsEl && (fsEl === el || fsEl?.contains(el) || el.contains(fsEl)))
    }

    // 初始检查
    check()

    document.addEventListener('fullscreenchange', check)
    return () => document.removeEventListener('fullscreenchange', check)
  }, [targetSelector])

  if (!isTargetFullscreen) return null

  return (
    <button
      className="exit-content-fullscreen-btn"
      onClick={() => {
        document.exitFullscreen?.()
      }}
      title="退出全屏内容区域"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
      </svg>
      退出
    </button>
  )
}
