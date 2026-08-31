import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can call the AI
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 })
  }

  try {
    const { system, userPrompt, maxTokens } = await req.json()

    if (!system || !userPrompt) {
      return NextResponse.json(
        { error: { message: "Missing system or userPrompt in request body" } },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "ANTHROPIC_API_KEY is not configured on the server" } },
        { status: 500 }
      )
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens || 2600,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    const data = await anthropicRes.json()
    return NextResponse.json(data, { status: anthropicRes.status })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || "Unknown server error" } },
      { status: 500 }
    )
  }
}
