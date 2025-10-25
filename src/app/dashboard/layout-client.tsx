'use client'

import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, TierLimits } from '@/lib/auth/types'

interface DashboardContextType {
  user: User
  profile: UserProfile | null
  tierLimits: TierLimits | null
  usageData: { action_count: number } | null
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayoutClient')
  }
  return context
}

export default function DashboardLayoutClient({
  user,
  profile,
  tierLimits,
  usageData,
  children,
}: {
  user: User
  profile: UserProfile | null
  tierLimits: TierLimits | null
  usageData: { action_count: number } | null
  children: React.ReactNode
}) {
  return (
    <DashboardContext.Provider value={{ user, profile, tierLimits, usageData }}>
      {children}
    </DashboardContext.Provider>
  )
}
