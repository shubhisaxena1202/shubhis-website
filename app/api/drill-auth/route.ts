import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars", url: !!url, key: !!key }, { status: 500 })
  }

  const { email, password } = await req.json()

  try {
    const start = Date.now()
    const res = await fetch(url + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    })
    const elapsed = Date.now() - start
    const body = await res.text()
    return NextResponse.json({
      status: res.status,
      elapsed: elapsed + "ms",
      body: body.substring(0, 500),
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || "fetch failed",
      name: err?.name,
      url: url + "/auth/v1/token?grant_type=password",
    }, { status: 500 })
  }
}
