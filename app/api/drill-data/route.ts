import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sessions, error: sErr } = await supabase
    .from('drill_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: true })

  const { data: gapLog, error: gErr } = await supabase
    .from('drill_gap_log')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true })

  if (sErr || gErr) {
    return NextResponse.json({ error: (sErr || gErr)?.message }, { status: 500 })
  }

  // Map snake_case DB columns to camelCase client fields
  const mappedSessions = (sessions ?? []).map((s: any) => ({
    id: s.id,
    dayType: s.day_type,
    company: s.company,
    domain: s.domain,
    grade: s.grade,
    startedAt: s.started_at,
    endedAt: s.ended_at,
    rawMessages: s.raw_messages ?? [],
    gapsFlaggedTotal: s.gaps_flagged_total ?? [],
  }))
  const mappedGapLog = (gapLog ?? []).map((e: any) => ({
    date: e.event_date,
    sessionId: e.session_id,
    category: e.category,
    hit: e.hit,
  }))

  return NextResponse.json({ sessions: mappedSessions, gapLog: mappedGapLog })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Upsert the current (in-progress or completed) session record
  if (body.session) {
    const s = body.session
    const { error } = await supabase.from('drill_sessions').upsert(
      {
        id: s.id,
        user_id: user.id,
        day_type: s.dayType,
        company: s.company ?? null,
        domain: s.domain ?? null,
        grade: s.grade ?? null,
        started_at: s.startedAt,
        ended_at: s.endedAt ?? null,
        raw_messages: s.rawMessages,
        gaps_flagged_total: s.gapsFlaggedTotal ?? [],
      },
      { onConflict: 'id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Append any new gap events (deduped server-side via unique constraint)
  if (Array.isArray(body.gapEvents) && body.gapEvents.length) {
    const rows = body.gapEvents.map((e: any) => ({
      user_id: user.id,
      event_date: e.date,
      session_id: e.sessionId,
      category: e.category,
      hit: e.hit,
    }))
    const { error } = await supabase
      .from('drill_gap_log')
      .upsert(rows, { onConflict: 'user_id,event_date,session_id,category', ignoreDuplicates: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: e1 } = await supabase.from('drill_sessions').delete().eq('user_id', user.id)
  const { error: e2 } = await supabase.from('drill_gap_log').delete().eq('user_id', user.id)
  if (e1 || e2) return NextResponse.json({ error: (e1 || e2)?.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
