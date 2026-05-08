import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [email, setEmail] = useState('')
  const sceneRef = useRef(null)
  const pupilsRef = useRef([])
  const dotEyesRef = useRef([])
  const submitTimerRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [, forceTick] = useState(0)

  // ---------- Animation state machine ----------
  const [animState, setAnimState] = useState('idle')

  const triggerExcited = useCallback(() => {
    setAnimState('excited')
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    submitTimerRef.current = setTimeout(() => {
      setAnimState('idle')
    }, 1500)
  }, [])

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    triggerExcited()
    localStorage.setItem('userEmail', email)
    setTimeout(() => navigate('/Dashboard'), 700)
  }

  // ---------- Mouse tracking ----------
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const handleMouseMove = (e) => {
      const rect = scene.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const rawDx = (e.clientX - cx) / (rect.width / 2)
      const rawDy = (e.clientY - cy) / (rect.height / 2)
      const dx = Math.max(-1, Math.min(1, rawDx))
      const dy = Math.max(-1, Math.min(1, rawDy))
      const dist = Math.sqrt(dx * dx + dy * dy)
      const clamp = dist > 1 ? 1 / dist : 1
      const maxTravel = 4
      mouseRef.current = { x: dx * clamp * maxTravel, y: dy * clamp * maxTravel }
      forceTick((n) => n + 1)
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: 0, y: 0 }
      forceTick((n) => n + 1)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // ===================================================================
  //  CHARACTER TRANSFORM MAPS
  // ===================================================================

  // 🟠 橙色圆形 — 微笑脸，有眨眼动画
  // idle: 正常微笑 | curious(email聚焦): 微笑变大 | cautious: 微笑收紧 | excited: 点头
  const orangeTransform = {
    idle:     'skewX(0deg) skewY(0deg)',
    curious:  'skewX(0deg) skewY(0deg) scale(1.04)',
    cautious: 'skewX(0deg) skewY(0deg) scale(0.97)',
    excited:  'skewX(0deg) skewY(0deg) translateY(-8px)',
  }

  // 🟣 紫色矩形 — 头部微动
  // idle: 直立 | curious(email输入): 轻微右倾 | cautious: 轻微倾斜 | excited: 轻微跳跃
  const purpleTransform = {
    idle:     'skewX(0deg) skewY(0deg)',
    curious:  'skewX(8deg) skewY(0deg)',
    cautious: 'skewX(4deg) skewY(2deg)',
    excited:  'skewX(0deg) skewY(0deg) translateY(-10px) scale(1.04)',
  }

  // ⚫ 黑色矩形 — 眼神跟随输入（瞳孔本就有鼠标跟踪，密码聚焦时强指向右下）
  // idle: 正常 | curious: 微微右看 | cautious: 强指向密码框右下 | excited: 睁大
  const darkTransform = {
    idle:     'skewX(0deg) skewY(0deg)',
    curious:  'skewX(0deg) skewY(0deg)',
    cautious: 'skewX(0deg) skewY(0deg)',
    excited:  'skewX(0deg) skewY(0deg) translateY(-6px) scale(1.03)',
  }

  // 🟡 黄色形状 — 肢体摆动 + 嘴巴表情
  // idle: 轻微摆动 | curious: 嘴巴微张 | cautious(密码输入): "嘘"小横线 | excited: 雀跃
  const yellowTransform = {
    idle:     'skewX(0deg) skewY(0deg)',
    curious:  'skewX(0deg) skewY(0deg) scale(1.02)',
    cautious: 'skewX(0deg) skewY(0deg)',
    excited:  'skewX(0deg) skewY(0deg) translateY(-10px)',
  }

  // ===================================================================
  //  PUPIL OFFSET — 所有角色的瞳孔偏移
  // ===================================================================
  // 橙色瞳孔（新加的，用于橙色眼睛）
  const orangePupilOffset = {
    idle:     { x: 0, y: 0 },
    curious:  { x: 5, y: -1 },
    cautious: { x: 2, y: 3 },
    excited:  { x: 0, y: -3 },
  }
  // 紫色瞳孔
  const purplePupilOffset = {
    idle:     { x: 0, y: 0 },
    curious:  { x: 4, y: -1 },
    cautious: { x: 2, y: 2 },
    excited:  { x: 0, y: -3 },
  }
  // 黑色瞳孔（密码聚焦时强指向右下）
  const blackPupilOffset = {
    idle:     { x: 0, y: 0 },
    curious:  { x: 3, y: 0 },
    cautious: { x: 6, y: 6 },
    excited:  { x: 0, y: -4 },
  }
  // 黄色小瞳孔（当作眼神点）
  const yellowPupilOffset = {
    idle:     { x: 0, y: 0 },
    curious:  { x: 4, y: -1 },
    cautious: { x: 1, y: 1 },
    excited:  { x: 0, y: -3 },
  }

  const pupilScaleMap = {
    idle:     1,
    curious:  1.1,
    cautious: 0.85,
    excited:  1.3,
  }
  const pupilScale = pupilScaleMap[animState]

  // 合成瞳孔偏移 = 角色特定焦点偏移 + 鼠标追踪偏移
  const combine = (base) => ({
    x: base[animState].x + mouseRef.current.x,
    y: base[animState].y + mouseRef.current.y,
  })

  const orangePupil = combine(orangePupilOffset)
  const purplePupil = combine(purplePupilOffset)
  const blackPupil = combine(blackPupilOffset)
  const yellowPupil = combine(yellowPupilOffset)

  const dotTransform = `translate(${mouseRef.current.x}px, ${mouseRef.current.y}px)`

  // ===================================================================
  //  HANDLERS
  // ===================================================================
  const handleFocus = (field) => {
    setAnimState(field === 'email' ? 'curious' : 'cautious')
  }

  const handleBlur = () => {
    setAnimState('idle')
  }

  const T = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'

  return (
    <div className="login-page">
      {/* ==================== LEFT PANEL ==================== */}
      <div className="login-left">
        <div className="login-left-logo">
          <Link to="/" className="login-brand">
            <img alt="CareerCompass logo" loading="lazy" width="32" height="32" decoding="async" className="login-brand-img" src="https://i.postimg.cc/nLrDYrHW/icon.png" />
            <span>职业罗盘</span>
          </Link>
        </div>

        <div className="login-illustration">
          <div className={`illus-scene illus-scene--${animState}`} ref={sceneRef}>

            {/* ============================== */}
            {/* 🟠 橙色圆形 — 微笑脸，有眨眼动画 */}
            {/* ============================== */}
            <div
              className="illus-orange"
              style={{ transform: orangeTransform[animState], transition: T }}
            >
              {/* 橙色笑脸的眼睛 */}
              <div className="illus-orange-face">
                <div className={`illus-orange-eyes ${animState === 'cautious' ? 'illus-orange-eyes--squint' : ''}`}>
                  <div className="illus-orange-eye">
                    <div
                      className="illus-orange-pupil"
                      ref={(el) => { dotEyesRef.current[0] = el }}
                      style={{
                        transform: `translate(${orangePupil.x}px, ${orangePupil.y}px) scale(${pupilScale})`,
                        transition: T,
                      }}
                    />
                  </div>
                  <div className="illus-orange-eye">
                    <div
                      className="illus-orange-pupil"
                      ref={(el) => { dotEyesRef.current[1] = el }}
                      style={{
                        transform: `translate(${orangePupil.x}px, ${orangePupil.y}px) scale(${pupilScale})`,
                        transition: T,
                      }}
                    />
                  </div>
                </div>
                {/* 橙色嘴巴 — idle=微笑 curious=大笑 cautious=抿嘴 excited=开心大张嘴 */}
                <div className={`illus-orange-mouth illus-orange-mouth--${animState}`} />
              </div>
              {/* 橙色腮红点（保留原 dots 但改为 blush 风格） */}
              <div className="illus-orange-blush">
                <div className="illus-blush-dot" style={{ transform: dotTransform, transition: T }} />
                <div className="illus-blush-dot" style={{ transform: dotTransform, transition: T }} />
              </div>
            </div>

            {/* ============================== */}
            {/* 🟣 紫色矩形 — 头部微动效果 */}
            {/* ============================== */}
            <div
              className="illus-purple"
              style={{ transform: purpleTransform[animState], transition: T }}
            >
              <div className={`illus-eyes ${animState === 'excited' ? 'illus-eyes--wide' : ''}`}>
                <div className="illus-eye">
                  <div
                    className="illus-pupil"
                    ref={(el) => { pupilsRef.current[0] = el }}
                    style={{
                      transform: `translate(${purplePupil.x}px, ${purplePupil.y}px) scale(${pupilScale})`,
                      transition: T,
                    }}
                  />
                </div>
                <div className="illus-eye">
                  <div
                    className="illus-pupil"
                    ref={(el) => { pupilsRef.current[1] = el }}
                    style={{
                      transform: `translate(${purplePupil.x}px, ${purplePupil.y}px) scale(${pupilScale})`,
                      transition: T,
                    }}
                  />
                </div>
              </div>
              {/* 紫色头部微动装饰线 */}
              <div className="illus-purple-accent" />
            </div>

            {/* ============================== */}
            {/* ⚫ 黑色矩形 — 眼神跟随输入 */}
            {/* ============================== */}
            <div
              className="illus-dark"
              style={{ transform: darkTransform[animState], transition: T }}
            >
              <div className={`illus-eyes illus-eyes-sm ${animState === 'cautious' ? 'illus-eyes--squint' : ''} ${animState === 'excited' ? 'illus-eyes--wide' : ''}`}>
                <div className="illus-eye">
                  <div
                    className="illus-pupil"
                    ref={(el) => { pupilsRef.current[2] = el }}
                    style={{
                      transform: `translate(${blackPupil.x}px, ${blackPupil.y}px) scale(${pupilScale})`,
                      transition: T,
                    }}
                  />
                </div>
                <div className="illus-eye">
                  <div
                    className="illus-pupil"
                    ref={(el) => { pupilsRef.current[3] = el }}
                    style={{
                      transform: `translate(${blackPupil.x}px, ${blackPupil.y}px) scale(${pupilScale})`,
                      transition: T,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ============================== */}
            {/* 🟡 黄色形状 — 肢体摆动 + 嘴巴表情 */}
            {/* ============================== */}
            <div
              className={`illus-yellow illus-yellow--${animState}`}
              style={{ transform: yellowTransform[animState], transition: T }}
            >
              {/* 黄色的小眼睛（点状） */}
              <div className="illus-yellow-dot-eyes">
                <div
                  className="illus-yellow-dot"
                  ref={(el) => { dotEyesRef.current[2] = el }}
                  style={{
                    transform: `translate(${yellowPupil.x}px, ${yellowPupil.y}px) scale(${pupilScale})`,
                    transition: T,
                  }}
                />
                <div
                  className="illus-yellow-dot"
                  ref={(el) => { dotEyesRef.current[3] = el }}
                  style={{
                    transform: `translate(${yellowPupil.x}px, ${yellowPupil.y}px) scale(${pupilScale})`,
                    transition: T,
                  }}
                />
              </div>
              {/* 黄色嘴巴 — idle=微笑 cautious=嘘小横线 curious=微张 excited=大笑 */}
              <div className={`illus-yellow-mouth illus-yellow-mouth--${animState}`} />
              {/* 黄色手臂（通过伪元素实现摆动） */}
              <div className="illus-yellow-arms" />
            </div>

          </div>
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
            <img alt="CareerCompass logo" loading="lazy" width="32" height="32" decoding="async" className="login-brand-img-mobile" src="https://i.postimg.cc/nLrDYrHW/icon.png" />
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
                onFocus={() => handleFocus('email')}
                onBlur={handleBlur}
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">密码</label>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="????????"
                  name="password"
                  onFocus={() => handleFocus('password')}
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
                <label className="login-checkbox-label" htmlFor="remember">记住我 30 天</label>
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
