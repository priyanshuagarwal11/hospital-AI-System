// ============================================================
// components/UI/AlertBadge.jsx - Live unread alert count
// ============================================================
import React, { useEffect, useState } from 'react'
import { alertsAPI } from '../../api'

export default function AlertBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await alertsAPI.getAll({ isRead: false, isResolved: false, limit: 1 })
        setCount(data.total || 0)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 30000) // poll every 30s
    return () => clearInterval(id)
  }, [])

  if (!count) return null
  return (
    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-red-500/30">
      {count > 99 ? '99+' : count}
    </span>
  )
}
