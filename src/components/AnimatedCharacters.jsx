import { useState, useEffect, useRef } from 'react'

/* ── Pupil — 纯瞳孔点，跟随鼠标 ── */
function Pupil({ size = 12, maxDistance = 5, pupilColor = '#2D2D2D', forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const pupilRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY }
    }
    const rect = pupilRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mouseX - cx
    const dy = mouseY - cy
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPosition()

  return (
    <div
      ref={pupilRef}
      style={{
        width: size,
        height: size,
        backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.1s ease-out',
        borderRadius: '9999px',
      }}
    />
  )
}

/* ── EyeBall — 白色眼球+瞳孔，支持眨眼 ── */
function EyeBall({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = 'white', pupilColor = '#2D2D2D', isBlinking = false, forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const eyeRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY }
    }
    const rect = eyeRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mouseX - cx
    const dy = mouseY - cy
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPosition()

  return (
    <div
      ref={eyeRef}
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: 'transform 0.1s ease-out',
            borderRadius: '9999px',
          }}
        />
      )}
    </div>
  )
}

/* ── AnimatedCharacters — 四个角色的组合动画 ── */
export default function AnimatedCharacters({ isTyping = false, showPassword = false, passwordLength = 0 }) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false)
  const [isBlackBlinking, setIsBlackBlinking] = useState(false)
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPurplePeeking, setIsPurplePeeking] = useState(false)
  const purpleRef = useRef(null)
  const blackRef = useRef(null)
  const yellowRef = useRef(null)
  const orangeRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX)
      setMouseY(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 紫色角色随机眨眼
  useEffect(() => {
    const schedule = () => {
      const timeout = setTimeout(() => {
        setIsPurpleBlinking(true)
        setTimeout(() => {
          setIsPurpleBlinking(false)
          schedule()
        }, 150)
      }, Math.random() * 4000 + 3000)
      return timeout
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // 黑色角色随机眨眼
  useEffect(() => {
    const schedule = () => {
      const timeout = setTimeout(() => {
        setIsBlackBlinking(true)
        setTimeout(() => {
          setIsBlackBlinking(false)
          schedule()
        }, 150)
      }, Math.random() * 4000 + 3000)
      return timeout
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  // 开始打字时互相看
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true)
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
      return () => clearTimeout(t)
    }
    setIsLookingAtEachOther(false)
  }, [isTyping])

  // 密码可见时紫色偷看（对齐原版：依赖 isPurplePeeking 实现循环偷看）
  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const schedule = () => {
        const t = setTimeout(() => {
          setIsPurplePeeking(true)
          setTimeout(() => setIsPurplePeeking(false), 800)
        }, Math.random() * 3000 + 2000)
        return t
      }
      const t = schedule()
      return () => clearTimeout(t)
    }
    setIsPurplePeeking(false)
  }, [passwordLength, showPassword, isPurplePeeking])

  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 3
    const dx = mouseX - cx
    const dy = mouseY - cy
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  const purplePos = calcPos(purpleRef)
  const blackPos = calcPos(blackRef)
  const yellowPos = calcPos(yellowRef)
  const orangePos = calcPos(orangeRef)

  const isHidingPassword = passwordLength > 0 && !showPassword

  return (
    <div style={{ position: 'relative', width: 550, height: 400 }}>
      {/* 🟣 紫色矩形 — 背景层 */}
      <div
        ref={purpleRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 70,
          width: 180,
          height: isTyping || isHidingPassword ? 440 : 400,
          backgroundColor: '#6C3FF5',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform:
            passwordLength > 0 && showPassword
              ? 'skewX(0deg)'
              : isTyping || isHidingPassword
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                : `skewX(${purplePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        {/* 眼睛 */}
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: 32,
            left:
              passwordLength > 0 && showPassword
                ? 20
                : isLookingAtEachOther
                  ? 55
                  : 45,
            top:
              passwordLength > 0 && showPassword
                ? 35
                : isLookingAtEachOther
                  ? 65
                  : 40,
            transform: `translate(${passwordLength > 0 && showPassword ? 0 : purplePos.faceX}px, ${passwordLength > 0 && showPassword ? 0 : purplePos.faceY}px)`,
            transition: 'all 0.7s ease-in-out',
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking}
            forceLookX={passwordLength > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
          <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking}
            forceLookX={passwordLength > 0 && showPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
          />
        </div>
      </div>

      {/* ⚫ 黑色矩形 — 中间层 */}
      <div
        ref={blackRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 240,
          width: 120,
          height: 310,
          backgroundColor: '#2D2D2D',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform:
            passwordLength > 0 && showPassword
              ? 'skewX(0deg)'
              : isLookingAtEachOther
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                : isTyping || isHidingPassword
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                  : `skewX(${blackPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: 24,
            left:
              passwordLength > 0 && showPassword
                ? 10
                : isLookingAtEachOther
                  ? 32
                  : 26,
            top:
              passwordLength > 0 && showPassword
                ? 28
                : isLookingAtEachOther
                  ? 12
                  : 32,
            transform: `translate(${passwordLength > 0 && showPassword ? 0 : blackPos.faceX}px, ${passwordLength > 0 && showPassword ? 0 : blackPos.faceY}px)`,
            transition: 'all 0.7s ease-in-out',
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
            forceLookX={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking}
            forceLookX={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
          />
        </div>
      </div>

      {/* 🟠 橙色半圆 — 前左 */}
      <div
        ref={orangeRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 240,
          height: 200,
          zIndex: 3,
          backgroundColor: '#FF9B6B',
          borderRadius: '120px 120px 0 0',
          transform:
            passwordLength > 0 && showPassword
              ? 'skewX(0deg)'
              : `skewX(${orangePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: 32,
            left:
              passwordLength > 0 && showPassword
                ? 50
                : 82,
            top:
              passwordLength > 0 && showPassword
                ? 85
                : 90,
            transform: `translate(${passwordLength > 0 && showPassword ? 0 : (orangePos.faceX || 0)}px, ${passwordLength > 0 && showPassword ? 0 : (orangePos.faceY || 0)}px)`,
            transition: 'all 0.2s ease-out',
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
          />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
          />
        </div>
      </div>

      {/* 🟡 黄色矩形 — 前右 */}
      <div
        ref={yellowRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 310,
          width: 140,
          height: 230,
          backgroundColor: '#E8D754',
          borderRadius: '70px 70px 0 0',
          zIndex: 4,
          transform:
            passwordLength > 0 && showPassword
              ? 'skewX(0deg)'
              : `skewX(${yellowPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: 24,
            left:
              passwordLength > 0 && showPassword
                ? 20
                : 52,
            top:
              passwordLength > 0 && showPassword
                ? 35
                : 40,
            transform: `translate(${passwordLength > 0 && showPassword ? 0 : (yellowPos.faceX || 0)}px, ${passwordLength > 0 && showPassword ? 0 : (yellowPos.faceY || 0)}px)`,
            transition: 'all 0.2s ease-out',
          }}
        >
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
          />
          <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D"
            forceLookX={passwordLength > 0 && showPassword ? -5 : undefined}
            forceLookY={passwordLength > 0 && showPassword ? -4 : undefined}
          />
        </div>
        {/* 嘴巴横线 */}
        <div
          style={{
            position: 'absolute',
            width: 80,
            height: 4,
            backgroundColor: '#2D2D2D',
            borderRadius: '9999px',
            left:
              passwordLength > 0 && showPassword
                ? 10
                : 40,
            top:
              passwordLength > 0 && showPassword
                ? 88
                : 88,
            transform: `translate(${passwordLength > 0 && showPassword ? 0 : (yellowPos.faceX || 0)}px, ${passwordLength > 0 && showPassword ? 0 : (yellowPos.faceY || 0)}px)`,
            transition: 'all 0.2s ease-out',
          }}
        />
      </div>
    </div>
  )
}
