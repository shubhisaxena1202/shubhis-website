import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DrillPadClient from './DrillPadClient'

export const metadata = {
  robots: { index: false, follow: false }, // keep it out of search engines
}

export default async function DrillPadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/drill-pad/login')
  }

  return <DrillPadClient userEmail={user!.email ?? ''} />
}
