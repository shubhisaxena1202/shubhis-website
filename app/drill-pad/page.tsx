import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrillHub from './DrillHub'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function DrillPadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/drill-pad/login')
  }

  return <DrillHub userEmail={user!.email ?? ''} />
}
