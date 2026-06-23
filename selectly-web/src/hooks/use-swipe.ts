"use client"

import { useRef, useState } from "react"

type SwipeDirection = "left" | "right" | "up" | null

export function useSwipe(onSwipe?: (direction: SwipeDirection) => void) {
  const [swiping, setSwiping] = useState(false)
  const touchStart = useRef({ x: 0, y: 0 })
  const touchEnd = useRef({ x: 0, y: 0 })

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.targetTouches[0]
    if (!t) return
    setSwiping(true)
    touchStart.current = {
      x: t.clientX,
      y: t.clientY,
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.targetTouches[0]
    if (!t) return
    touchEnd.current = {
      x: t.clientX,
      y: t.clientY,
    }
  }

  const onTouchEnd = () => {
    setSwiping(false)
    const dx = touchStart.current.x - touchEnd.current.x
    const dy = touchStart.current.y - touchEnd.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx < 30 && absDy < 30) return

    let direction: SwipeDirection = null
    if (absDx > absDy) {
      direction = dx > 0 ? "left" : "right"
    } else if (dy < 0) {
      direction = "up"
    }

    onSwipe?.(direction)
    touchStart.current = { x: 0, y: 0 }
    touchEnd.current = { x: 0, y: 0 }
  }

  return { swiping, onTouchStart, onTouchMove, onTouchEnd }
}
