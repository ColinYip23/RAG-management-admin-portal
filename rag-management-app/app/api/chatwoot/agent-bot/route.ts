import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { inboxId, enabled } = await req.json()

    if (!inboxId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      )
    }

    const CHATWOOT_TOKEN = process.env.CHATWOOT_API_TOKEN
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID

    if (!CHATWOOT_TOKEN || !CHATWOOT_ACCOUNT_ID) {
      return NextResponse.json(
        { error: "Chatwoot env not configured" },
        { status: 500 }
      )
    }

    const res = await fetch(
      `https://app.chatwoot.com/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes/${inboxId}/set_agent_bot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          api_access_token: CHATWOOT_TOKEN,
        },
        body: JSON.stringify({
          agent_bot: enabled ? 1 : 0,
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }
}
