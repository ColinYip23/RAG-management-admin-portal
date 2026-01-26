"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export type WahaSession = {
  id: number
  Department: string
  WhatsApp: string
  Status: string
  Enabled: boolean
  modified_at: string
  created_at: string
  inbox_id: number
  email: string
  noteboks: Array<string>
}

export function useSessions() {
  const [sessions, setSessions] = useState<WahaSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("waha_sessions")
      .select("*")

    if (!error && data) {
      setSessions(data)
    }

    setLoading(false)
  }, [])

  // initial load + auto refresh
  useEffect(() => {
    fetchSessions()

    const interval = setInterval(fetchSessions, 2 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  return {
    sessions,
    loading,
    refresh: fetchSessions,
    setSessions, // optional, useful for optimistic updates
  }
}
