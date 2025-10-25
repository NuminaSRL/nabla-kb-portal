import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayoutClient from './layout-client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // Redirect to login with return URL parameter
    redirect('/login?returnUrl=/dashboard')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get tier limits
  let tierLimits = null
  if (profile) {
    const { data: limits } = await supabase
      .from('tier_limits')
      .select('*')
      .eq('tier', profile.tier)
      .single()
    tierLimits = limits
  }

  // Get today's usage
  let usageData = null
  if (user) {
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('action_count')
      .eq('user_id', user.id)
      .eq('action_type', 'search')
      .eq('action_date', today)
      .maybeSingle()
    usageData = usage
  }

  return (
    <DashboardLayoutClient 
      user={user} 
      profile={profile}
      tierLimits={tierLimits}
      usageData={usageData}
    >
      {children}
    </DashboardLayoutClient>
  )
}
