"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Notebook = {
  id: string
  title: string
}

export function useNotebookTagging(
  whatsapp: string,
  department: string
) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)

      // 1️⃣ Fetch available notebooks (department + global)
      const { data: notebookData, error: notebookError } =
        await supabase
          .from("notebooks")
          .select("id, title")
          .or(
            `department.eq.${encodeURIComponent(
              department
            )},is_global.eq.true`
          )

      if (notebookError) {
        console.error("Failed to load notebooks", notebookError)
        setLoading(false)
        return
      }

      setNotebooks(notebookData ?? [])

      // 2️⃣ Fetch already-selected notebooks for this WhatsApp
      const { data: sessionData, error: sessionError } =
        await supabase
          .from("waha_sessions")
          .select("notebooks")
          .eq("WhatsApp", whatsapp)
          .single()

      if (sessionError) {
        console.error("Failed to load session notebooks", sessionError)
        setLoading(false)
        return
      }

      const savedNames: string[] = sessionData?.notebooks ?? []

      // 3️⃣ Convert saved notebook names → IDs
      const preselectedIds =
        notebookData
          ?.filter((n) => savedNames.includes(n.title))
          .map((n) => n.id) ?? []

      setSelected(preselectedIds)
      setLoading(false)
    }

    load()
  }, [whatsapp, department])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  async function save() {
    setSaving(true)

    const selectedNames = notebooks
      .filter((n) => selected.includes(n.id))
      .map((n) => n.title)

    const { error } = await supabase
      .from("waha_sessions")
      .update({
        notebooks: selectedNames,
      })
      .eq("WhatsApp", whatsapp)

    if (error) {
      console.error("Failed to save notebooks", error)
    }

    setSaving(false)
  }

  return {
    notebooks,
    selected,
    toggle,
    save,
    saving,
    loading,
  }
}
