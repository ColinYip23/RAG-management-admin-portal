// app/api/embeddings/route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Azure OpenAI configuration
    const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
    const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY
    const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "text-embedding-ada-002"

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
      return NextResponse.json(
        { error: "Azure OpenAI configuration missing" },
        { status: 500 }
      )
    }

    // Call Azure OpenAI Embeddings API
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/embeddings?api-version=2023-05-15`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          input: text,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Azure OpenAI error:", error)
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    return NextResponse.json({ embedding })
  } catch (error: any) {
    console.error("Embedding generation error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}