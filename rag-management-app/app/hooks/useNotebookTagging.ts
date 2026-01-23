"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Notebook = {
  id: number
  title: string
}

export function useNotebookTagging(sessionId: number) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  // Load notebooks + existing tags
  useEffect(() => {
    if (!sessionId) return

    const load = async () => {
      const { data: all } = await supabase
        .from("notebooks")
        .select("id, title")

      const { data: links } = await supabase
        .from("session_notebooks")
        .select("notebook_id")
        .eq("session_id", sessionId)

      setNotebooks(all ?? [])
      setSelected(links?.map((l) => l.notebook_id) ?? [])
    }

    load()
  }, [sessionId])

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((n) => n !== id)
        : [...prev, id]
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      await supabase
        .from("session_notebooks")
        .delete()
        .eq("session_id", sessionId)

      if (selected.length > 0) {
        await supabase
          .from("session_notebooks")
          .insert(
            selected.map((id) => ({
              session_id: sessionId,
              notebook_id: id,
            }))
          )
      }
    } finally {
      setSaving(false)
    }
  }

  return {
    notebooks,
    selected,
    toggle,
    save,
    saving,
  }
}
