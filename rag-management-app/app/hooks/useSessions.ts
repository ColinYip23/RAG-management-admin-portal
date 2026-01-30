"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { WahaSession } from "@/app/types/WahaSession"

type UserProfile = {
  role: string
  department: string | null
}

export function useSessions(profile?: UserProfile | null) {
  const [sessions, setSessions] = useState<WahaSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    // Wait until profile is known
    if (!profile) {
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from("waha_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    // 🔐 Role-based filtering
    if (profile.role !== "admin" && profile.department) {
      query = query.eq("Department", profile.department)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch sessions:", error)
    } else if (data) {
      setSessions(data)
    }

    setLoading(false)
  }, [profile])

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
    setSessions,
  }
}
