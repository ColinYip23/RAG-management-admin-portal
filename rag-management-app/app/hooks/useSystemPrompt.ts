"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export function useSystemPrompt(tenant: string) {
  const [prompt, setPrompt] = useState("")
  const [saving, setSaving] = useState(false)

  // Load prompt
  useEffect(() => {
    if (!tenant) return

    const loadPrompt = async () => {
      const { data } = await supabase
        .from("system prompts")
        .select("prompt")
        .eq("tenant", tenant)
        .single()

      setPrompt(data?.prompt ?? "")
    }

    loadPrompt()
  }, [tenant])

  // Save prompt
  const savePrompt = async () => {
    setSaving(true)
    try {
      await supabase
        .from("system prompts")
        .upsert(
          { tenant, prompt },
          { onConflict: "tenant" }
        )
    } finally {
      setSaving(false)
    }
  }

  return {
    prompt,
    setPrompt,
    savePrompt,
    saving,
  }
}
