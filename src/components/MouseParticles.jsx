import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 30
const COLORS = [
  '124, 92, 252',   // 紫色 #7c5cfc
  '183, 148, 244',  // 浅紫 #b794f4
  '96, 165, 250',   // 蓝色 #60a5fa
  '244, 114, 182',  // 粉色 #f472b6
  '168, 85, 247',   // 紫罗兰 #a855f7
]

export default function MouseParticles() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 })
  const particlesRef = useRef([])
  const rafRef = useRef(null)
  const prevMouseRef = useRef({ x: -1000, y: -1000 })
  const lastSpawnRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e) => {
      const prev = prevMouseRef.current
      const curr = { x: e.clientX, y: e.clientY }
      mouseRef.current.vx = curr.x - prev.x
      mouseRef.current.vy = curr.y - prev.y
      mouseRef.current.x = curr.x
      mouseRef.current.y = curr.y
      prevMouseRef.current = curr
    }

    const onTouchMove = (e) => {
      const touch = e.touches[0]
      if (!touch) return
      const prev = prevMouseRef.current
      const curr = { x: touch.clientX, y: touch.clientY }
      mouseRef.current.vx = curr.x - prev.x
      mouseRef.current.vy = curr.y - prev.y
      mouseRef.current.x = curr.x
      mouseRef.current.y = curr.y
      prevMouseRef.current = curr
    }

    const onTouchStart = (e) => {
      const touch = e.touches[0]
      if (!touch) return
      const pos = { x: touch.clientX, y: touch.clientY }
      prevMouseRef.current = pos
      mouseRef.current.x = pos.x
      mouseRef.current.y = pos.y
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchstart', onTouchStart, { passive: true })

    const animate = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy)

      // 生成新粒子
      if (timestamp - lastSpawnRef.current > 30 && speed > 0.5) {
        lastSpawnRef.current = timestamp
        const colors = COLORS
        const color = colors[Math.floor(Math.random() * colors.length)]
        const size = 2 + Math.random() * 4
        particlesRef.current.push({
          x: mouse.x,
          y: mouse.y,
          vx: (Math.random() - 0.5) * 2 - mouse.vx * 0.08,
          vy: (Math.random() - 0.5) * 2 - mouse.vy * 0.08,
          size,
          alpha: 0.7 + Math.random() * 0.3,
          decay: 0.008 + Math.random() * 0.015,
          color,
          life: 1,
        })

        // 限制粒子数量
        if (particlesRef.current.length > PARTICLE_COUNT) {
          particlesRef.current.splice(0, particlesRef.current.length - PARTICLE_COUNT)
        }
      }

      // 更新 & 绘制粒子
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.02 // 微弱下沉
        p.vx *= 0.98
        p.vy *= 0.98
        p.life -= p.decay
        p.alpha = p.life * 0.7

        if (p.life <= 0 || p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        const a = p.alpha
        const s = p.size * (0.5 + p.life * 0.5)

        // 发光外圈
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 3)
        gradient.addColorStop(0, `rgba(${p.color}, ${a})`)
        gradient.addColorStop(0.3, `rgba(${p.color}, ${a * 0.5})`)
        gradient.addColorStop(1, `rgba(${p.color}, 0)`)
        ctx.beginPath()
        ctx.arc(p.x, p.y, s * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // 核心亮点
        ctx.beginPath()
        ctx.arc(p.x, p.y, s * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.6})`
        ctx.fill()
      }

      // 速度衰减
      mouse.vx *= 0.85
      mouse.vy *= 0.85

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchstart', onTouchStart)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="mouse-particles-canvas"
    />
  )
}
