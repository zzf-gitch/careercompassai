import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { setDocumentTitle } from '../hooks/useDocumentTitle'
import { seedIfEmpty } from '../utils/db'
import MouseParticles from '../components/MouseParticles'

/**
 * 路由守卫组件
 *
 * 功能类似于 Vue Router 的 beforeEach 路由守卫，
 * 每次路由跳转时自动从路由 meta (handle) 中读取 title
 * 并设置浏览器标签页标题。
 *
 * 用法：在路由配置中作为根路由的 element 包裹所有子路由
 */
export default function RouteGuard() {
  const matches = useMatches()

  // 每次路由匹配变化时，从最深层的路由 handle 中提取 title 并设置
  useEffect(() => {
    // 反向查找，优先取最深（最具体）子路由的 handle.title
    const match = [...matches].reverse().find((m) => m.handle?.title)
    const title = match?.handle?.title || ''
    setDocumentTitle(title)
  }, [matches])

  // 应用启动时初始化 IndexedDB 示例数据（仅首次运行）
  useEffect(() => {
    seedIfEmpty()
  }, [])

  return (
    <>
      <Outlet />
      <MouseParticles />
    </>
  )
}
