"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Notebook = {
  id: string
  title: string
}

export function useNotebookSelection(department: string) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!department) {
      setNotebooks([])
      setSelected([])
      return
    }

    async function load() {
      setLoading(true)

      const { data, error } = await supabase
        .from("notebooks")
        .select("id, title")
        .or(
          `department.eq.${encodeURIComponent(
            department
          )},is_global.eq.true`
        )

      if (!error) {
        setNotebooks(data ?? [])
      }

      setLoading(false)
    }

    load()
  }, [department])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  const selectedNames = notebooks
    .filter((n) => selected.includes(n.id))
    .map((n) => n.title)

  return {
    notebooks,
    selected,
    selectedNames,
    toggle,
    loading,
  }
}
