/**
 * 自定义 Hook - 动态设置浏览器标签页标题
 *
 * 用法：
 *   useDocumentTitle('登录')        // → "登录 - 职业罗盘"
 *   useDocumentTitle('首页')        // → "首页 - 职业罗盘"
 *   useDocumentTitle('关于')        // → "关于 - 职业罗盘"
 *   useDocumentTitle('404 - 页面未找到') // → "404 - 页面未找到 - 职业罗盘"
 *
 * 原理：
 *   从 Vite 环境变量 VITE_APP_NAME 获取项目名称，
 *   拼接为 "页面标题 - 项目名称" 格式，设置 document.title。
 *   组件卸载时自动恢复为项目名称。
 */

import { useEffect } from 'react'
import { PROJECT_NAME } from '@/config/setting'

/**
 * 获取项目名称，提供默认降级值
 */
function getAppName() {
  return import.meta.env.VITE_APP_NAME
}

/**
 * 根据页面标题拼接完整的 document.title
 * @param {string} pageTitle - 当前页面的标题
 * @returns {string} 完整的标题字符串
 */
export function buildTitle(pageTitle) {
  const appName = PROJECT_NAME || getAppName()
  return pageTitle ? `${pageTitle} - ${appName}` : appName
}

/**
 * 设置浏览器标签页标题
 * @param {string} title - 要设置的标题（不含项目名称）
 */
export function setDocumentTitle(title) {
  document.title = buildTitle(title)
}

/**
 * React Hook：组件挂载时设置标题，卸载时恢复
 * @param {string} pageTitle - 当前页面的标题
 *
 * @example
 * function Home() {
 *   useDocumentTitle('首页')
 *   return <div>Home</div>
 * }
 */
export default function useDocumentTitle(pageTitle) {
  useEffect(() => {
    // 保存旧的标题用于恢复
    const prevTitle = document.title
    // 设置新标题
    setDocumentTitle(pageTitle)
    // 组件卸载时恢复
    return () => {
      document.title = prevTitle
    }
  }, [pageTitle])
}
