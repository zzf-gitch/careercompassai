import { useState, useEffect } from 'react'
import { getAllSystemLogs, formatTime } from '../../utils/db'
import './SystemLog.css'

const ACTION_ICONS = {
  '登录系统': '🔐',
  '投递简历': '📤',
  '修改个人资料': '✏️',
  '收藏职位': '🔖',
  '发布职位': '➕',
  '删除职位': '🗑️',
  '面试邀请': '📅',
  '筛选简历': '📋',
  'Offer': '🎉',
  '未通过': '❌',
  '注册账号': '🆕',
}

function getActionIcon(action) {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.includes(key)) return icon
  }
  return '📌'
}

function SystemLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((n) => n + 1)
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [])

  useEffect(() => {
    (async () => {
      const data = await getAllSystemLogs()
      setLogs(data)
      setLoading(false)
    })()
  }, [tick])

  if (loading) return <div className="syslog-loading">加载中...</div>

  return (
    <div className="syslog-page">
      <div className="syslog-header">
        <div>
          <h1 className="syslog-title">系统记录</h1>
          <p className="syslog-subtitle">所有系统操作日志，共 {logs.length} 条记录</p>
        </div>
      </div>

      <div className="syslog-list">
        {logs.length === 0 ? (
          <div className="syslog-empty">
            <span className="syslog-empty-icon">📭</span>
            <p>暂无系统操作记录</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={log.id} className="syslog-item">
              <div className="syslog-timeline">
                <div className="syslog-dot" />
                {idx < logs.length - 1 && <div className="syslog-line" />}
              </div>
              <div className="syslog-card">
                <div className="syslog-card-icon">{getActionIcon(log.action)}</div>
                <div className="syslog-card-body">
                  <div className="syslog-action">{log.action}</div>
                  <div className="syslog-detail">{log.detail}</div>
                  <div className="syslog-meta">
                    <span className="syslog-user">👤 {log.user}</span>
                    <span className="syslog-time">🕐 {formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SystemLog
