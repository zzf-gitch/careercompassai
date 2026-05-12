import { useRef, useEffect } from 'react'

export default function TabBar({
  tabs,
  activeTab,
  onTabClick,
  onTabClose,
  onContextMenu,
  contextMenu,
  onContextAction,
  onCloseContextMenu,
  onTabMove,
  onFullscreenContent,
  onFullscreenThemeArea,
  isThemeAreaFullscreen,
  isContentFullscreen,
}) {
  const scrollRef = useRef(null)
  const menuRef = useRef(null)
  const dragRef = useRef(null) // 记录当前拖拽的 tab id

  // 激活标签页自动滚动到可见区域
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector('.tab-item.active')
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [activeTab])

  // 点击右键菜单外部关闭菜单
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onCloseContextMenu()
      }
    }
    const handleScroll = () => onCloseContextMenu()
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [contextMenu, onCloseContextMenu])

  // 拖拽事件处理
  const handleDragStart = (e, tab) => {
    if (!tab.closable) {
      e.preventDefault() // 主页标签（Dashboard）不可拖动
      return
    }
    dragRef.current = tab.id
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽时的半透明效果
    e.dataTransfer.setData('text/plain', tab.id)
    // 延迟添加 dragging 类，让浏览器先渲染拖拽镜像
    setTimeout(() => {
      e.target.classList.add('dragging')
    }, 0)
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    dragRef.current = null
  }

  const handleDragOver = (e, tab) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    // 清除所有项目的 over 标记
    const items = scrollRef.current?.querySelectorAll('.tab-item')
    items?.forEach((el) => el.classList.remove('drag-over'))

    // 只对可关闭的标签页显示拖拽放置指示器
    if (tab.closable) {
      e.currentTarget.classList.add('drag-over')
    }
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over')
  }

  const handleDrop = (e, dropTab) => {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')
    const dragId = dragRef.current
    // 不允许拖拽到 Dashboard 上
    if (!dragId || dragId === dropTab.id || dropTab.id === '/Dashboard') return
    // 判断鼠标在目标标签的左侧还是右侧，以决定插入到目标之前还是之后
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const insertAfter = offsetX > rect.width / 2
    if (typeof onTabMove === 'function') {
      onTabMove(dragId, dropTab.id, insertAfter)
    }
    dragRef.current = null
  }

  return (
    <div className="tabbar-wrap">
      <div className="tabbar-scroll" ref={scrollRef}>
        {[...tabs].map((tab) => {
          const isActive = tab.id === activeTab
          const isDraggable = tab.closable // 主页标签(Dashboard)不可拖动，固定标签可拖动
          const classNames = ['tab-item']
          if (isActive) classNames.push('active')
          if (tab.pinned) classNames.push('pinned')
          return (
            <div
              key={tab.id}
              className={classNames.join(' ')}
              onClick={() => onTabClick(tab)}
              onContextMenu={(e) => onContextMenu(e, tab)}
              draggable={isDraggable}
              onDragStart={(e) => handleDragStart(e, tab)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, tab)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tab)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.labelCn}</span>
              {tab.closable && !tab.pinned ? (
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab)
                  }}
                  title="关闭标签页"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="tab-context-menu"
          ref={menuRef}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="tab-context-item"
            onClick={() => onContextAction('refresh', contextMenu.tab)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            刷新页面
          </button>
          <button
            className="tab-context-item"
            onClick={() => onContextAction('openInNewWindow', contextMenu.tab)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            新窗口中打开
          </button>
          <button
            className="tab-context-item"
            onClick={() => onContextAction('close', contextMenu.tab)}
            disabled={!contextMenu.tab.closable || contextMenu.tab.pinned}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            关闭标签页
          </button>
          <button
            className="tab-context-item"
            onClick={() => onContextAction('closeOthers', contextMenu.tab)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            关闭其他标签页
          </button>
          <div className="tab-context-divider" />
          <button
            className="tab-context-item"
            onClick={() => onContextAction('pinTab', contextMenu.tab)}
            disabled={!contextMenu.tab.closable}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
            </svg>
            {contextMenu.tab.pinned ? '取消固定' : '固定标签页'}
          </button>
          <button
            className="tab-context-item tab-context-item-danger"
            onClick={() => onContextAction('closeAll', contextMenu.tab)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            关闭全部标签页
          </button>
          <div className="tab-context-divider" />
          <button
            className="tab-context-item"
            onClick={() => {
              if (typeof onFullscreenThemeArea === 'function') {
                onFullscreenThemeArea()
              }
              onCloseContextMenu()
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            {isThemeAreaFullscreen ? '退出全屏主体区域' : '全屏主体区域'}
          </button>
          <button
            className="tab-context-item"
            onClick={() => {
              if (typeof onFullscreenContent === 'function') {
                onFullscreenContent()
              }
              onCloseContextMenu()
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isContentFullscreen ? '退出全屏内容区域' : '全屏内容区域'}
          </button>
        </div>
      )}
    </div>
  )
}
