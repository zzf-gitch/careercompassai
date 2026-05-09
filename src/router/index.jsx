import { createHashRouter , createBrowserRouter } from 'react-router-dom'
import RouteGuard from './RouteGuard.jsx'
import App from '../App.jsx'
import Feed from '../pages/feed/feed.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import Opportunities from '../pages/Opportunities/Opportunities.jsx'
import Applications from '../pages/Applications/Applications.jsx'
import Saved from '../pages/Saved/Saved.jsx'
import Profile from '../pages/Profile/Profile.jsx'
import Inbox from '../pages/Inbox/Inbox.jsx'
import SystemLog from '../pages/SystemLog/SystemLog.jsx'
import Login from '../pages/Login/Login.jsx'
import NotFound from '../pages/NotFound/NotFound.jsx'

const router = createHashRouter([
  // 路由守卫 — 每次跳转自动设置浏览器标题
  {
    element: <RouteGuard />,
    children: [
      // Login page as the entry point
      {
        path: '/',
        element: <Login />,
        handle: { title: '登录' },
      },
      // App shell with sidebar — all authenticated pages at top-level paths
      {
        element: <App />,
        children: [
          {
            path: 'Dashboard',
            element: <Dashboard />,
            handle: { title: '仪表盘' },
          },
          {
            path: 'feed',
            element: <Feed />,
            handle: { title: '社区动态' },
          },
          {
            path: 'opportunities',
            element: <Opportunities />,
            handle: { title: '机会' },
          },
          {
            path: 'applications',
            element: <Applications />,
            handle: { title: '我的申请' },
          },
          {
            path: 'saved',
            element: <Saved />,
            handle: { title: '收藏' },
          },
          {
            path: 'profile',
            element: <Profile />,
            handle: { title: '个人资料' },
          },
          {
            path: 'inbox',
            element: <Inbox />,
            handle: { title: '收件箱' },
          },
          {
            path: 'systemlog',
            element: <SystemLog />,
            handle: { title: '系统记录' },
          },
          {
            path: '*',
            element: <NotFound />,
            handle: { title: '404 - 页面未找到' },
          },
        ],
      },
    ],
  },
])

export default router
