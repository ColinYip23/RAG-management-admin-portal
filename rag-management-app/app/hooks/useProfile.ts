"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export type UserProfile = {
  email: string
  role: "admin" | "user"
  department: string | null
}

export function useProfile(userEmail?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userEmail) return

    async function fetchProfile() {
      setLoading(true)

      const { data, error } = await supabase
        .from("profiles")
        .select("email, role, department")
        .eq("email", userEmail)
        .single()

      if (error) {
        console.error("Failed to load profile:", error)
        setProfile(null)
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    fetchProfile()
  }, [userEmail])

  return { profile, loading }
}
