import { useEffect, useRef, useCallback } from 'react'

const BAR_COUNT = 64
const STORAGE_KEY = 'audio_wave_visible'
const COLORS = [
  '#7c5cfc', // 紫色主色
  '#b794f4', // 浅紫
  '#f472b6', // 粉色
  '#60a5fa', // 蓝色
]

/* ── 读取 localStorage 偏好 ── */
export function getStoredVisible() {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    return val === 'true'
  } catch {
    return false
  }
}

/* ── 写入 localStorage ── */
export function setStoredVisible(v) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? 'true' : 'false')
  } catch {
    // 忽略
  }
}

export default function AudioWave({ visible, onToggle }) {
  const barsRef = useRef([])
  const smoothRef = useRef(new Float32Array(BAR_COUNT).fill(0))
  const timeRef = useRef(0)
  const rafRef = useRef(null)

  /* ── 动画循环：直接操作 DOM scaleY，GPU 加速 ── */
  const animate = useCallback(() => {
    timeRef.current += 1
    const t = timeRef.current
    const smooth = smoothRef.current
    const bars = barsRef.current

    for (let i = 0; i < BAR_COUNT; i++) {
      // 多层正弦波叠加
      const wave1 = Math.sin(t * 0.025 + i * 0.18) * 0.15
      const wave2 = Math.sin(t * 0.04 + i * 0.09) * 0.12
      const wave3 = Math.sin(t * 0.01 + i * 0.35) * 0.1
      const wave4 = Math.sin((t * 0.05 + i * 0.5) * 0.7) * 0.07
      const wave5 = Math.sin(t * 0.018 - i * 0.22) * 0.06

      const pulse1 = Math.sin(t * 0.06) * 0.05 + 0.05
      const pulse2 = Math.sin(t * 0.1 + 2) * 0.04 + 0.04

      const noise = Math.sin(t * 0.12 + i * 2.3) * 0.5 + 0.5

      let target =
        wave1 + wave2 + wave3 + wave4 + wave5 +
        pulse1 + pulse2 +
        noise * 0.025 +
        0.06

      // 拱形：两端低中间高
      const edge = Math.sin((i / BAR_COUNT) * Math.PI) * 0.3 + 0.7
      target *= edge

      target = Math.max(0.02, Math.min(1.0, target))

      // 平滑过渡
      smooth[i] = smooth[i] * 0.78 + target * 0.22

      if (bars[i]) {
        bars[i].style.transform = `scaleY(${smooth[i] * 25 + 1})`
      }
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  const handleToggle = () => {
    if (onToggle) onToggle(!visible)
  }

  /* ── ref 回调 ── */
  const setBarRef = useCallback((el, i) => {
    barsRef.current[i] = el
  }, [])

  return (
    <div className={`wave-wrap ${visible ? 'wave-on' : 'wave-off'}`}>
      <div className="wave-glow" />
      <div className="wave-bars">
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const colorIdx = Math.floor((i / BAR_COUNT) * COLORS.length) % COLORS.length
          const nextIdx = (colorIdx + 1) % COLORS.length
          const mix = ((i / BAR_COUNT) * COLORS.length) % 1
          return (
            <span
              key={i}
              ref={(el) => setBarRef(el, i)}
              className="wave-bar"
              style={{
                '--color': COLORS[colorIdx],
                '--color2': COLORS[nextIdx],
                '--mix': mix,
              }}
            />
          )
        })}
      </div>
      <button
        className="wave-toggle"
        onClick={handleToggle}
        title={visible ? '隐藏波纹' : '显示波纹'}
        aria-label={visible ? '隐藏波纹' : '显示波纹'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {visible ? (
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <polyline points="17.5 6.5 17.5 12 17.5 17.5" />
              <polyline points="12 8.5 12 12 12 15.5" />
              <polyline points="6.5 11 6.5 12 6.5 14" />
            </>
          ) : (
            <>
              <polyline points="17.5 6.5 17.5 12 17.5 17.5" />
              <polyline points="12 8.5 12 12 12 15.5" />
              <polyline points="6.5 11 6.5 12 6.5 14" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
