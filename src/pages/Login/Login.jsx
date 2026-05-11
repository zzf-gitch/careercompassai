import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logActivity } from '../../utils/db'
import AnimatedCharacters from '../../components/AnimatedCharacters'
import logo from '@/assets/icon.png'
import './Login.css'

const STORAGE_KEY = 'login_remember_credentials'

function Login() {
  const navigate = useNavigate()

  // 读取当前登录状态（从 user_session 中读取 email）
  function getLoggedInEmail() {
    try {
      const raw = localStorage.getItem('user_session')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.email) return p.email
      }
    } catch {}
    return null
  }

  // 如果已经登录，直接跳转到仪表盘
  useEffect(() => {
    const email = getLoggedInEmail()
    if (email) {
      navigate('/Dashboard', { replace: true })
    }
  }, [navigate])

  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const submitTimerRef = useRef(null)

  // 页面加载时从 localStorage 恢复已保存的凭据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.password) setPassword(parsed.password)
        if (parsed.remember) setRemember(true)
      }
    } catch {
      // ignore parse error
    }
  }, [])

  // 页面加载时读取并应用主题偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()

    // 保存登录会话到独立的 user_session key（仅含 email，不含密码）
    localStorage.setItem('user_session', JSON.stringify({ email }))

    if (remember) {
      // 保存邮箱和密码到 localStorage（用于下次自动填充）
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ email, password, remember: true })
      )
    } else {
      // 取消记住则清除已保存的凭据
      localStorage.removeItem(STORAGE_KEY)
    }

    logActivity('登录系统', `用户 ${email.split('@')[0]} 登录了职业罗盘`)
    setTimeout(() => navigate('/Dashboard'), 700)
  }

  const handleFocus = () => {
    setIsTyping(true)
  }

  const handleBlur = () => {
    setIsTyping(false)
  }

  return (
    <div className="login-page">
      {/* ==================== LEFT PANEL ==================== */}
      <div className="login-left">
        <div className="login-left-logo">
          <Link to="/" className="login-brand">
            <img alt="CareerCompass logo" loading="lazy" width="32" height="32" decoding="async" className="login-brand-img" src={logo} />
            <span>职业罗盘</span>
          </Link>
        </div>

        <div className="login-illustration">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={password.length}
          />
        </div>

        <div className="login-left-footer">
          <a href="#" className="login-left-link">隐私政策</a>
          <a href="#" className="login-left-link">服务条款</a>
        </div>
        <div className="login-left-grid" />
        <div className="login-left-blur login-left-blur-1" />
        <div className="login-left-blur login-left-blur-2" />
      </div>

      {/* ==================== RIGHT PANEL ==================== */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-mobile-logo">
            <img alt="CareerCompass logo" loading="lazy" width="32" height="32" decoding="async" className="login-brand-img-mobile" src={logo} />
            <span>职业罗盘</span>
          </div>
          <div className="login-heading">
            <h1>欢迎回来!</h1>
            <p>请输入您的信息</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="email">电子邮件</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                autoComplete="off"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">密码</label>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="m14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="login-options">
              <div className="login-checkbox-wrap">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  data-state={remember ? 'checked' : 'unchecked'}
                  className={`login-checkbox ${remember ? 'checked' : ''}`}
                  onClick={() => setRemember(!remember)}
                  id="remember"
                />
                <label className="login-checkbox-label" htmlFor="remember">记住邮箱密码</label>
              </div>
              <a href="#" className="login-forgot">忘记密码?</a>
            </div>
            <button type="submit" className="login-submit">
              <span className="login-submit-text">登录</span>
              <span className="login-submit-hover">
                登录
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>
          </form>

          <div className="login-divider">
            <button type="button" className="login-google">
              <span className="login-google-text">使用 Google 登录</span>
              <span className="login-google-hover">
                使用 Google 登录
                <svg width="20" height="20" viewBox="0 0 488 512" fill="currentColor">
                  <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 76.2C322.3 113.2 289.4 96 248 96c-88.8 0-160.1 71.9-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z" />
                </svg>
              </span>
            </button>
          </div>
          <div className="login-signup">
            还没有账号?{' '}
            <Link to="/signup">立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
