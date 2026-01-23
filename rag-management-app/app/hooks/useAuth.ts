"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export type AuthMode = "login" | "signup"

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("login")

  // Load session + listen to auth changes
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = async () => {
    if (authBusy) return

    setAuthError(null)
    setAuthBusy(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setAuthBusy(false)

    if (error) {
      setAuthError(error.message)
    }
  }

  const signup = async () => {
    if (authBusy) return

    setAuthError(null)
    setAuthBusy(true)

    // Check duplicate email
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (error) {
      setAuthBusy(false)
      setAuthError("Unable to verify email. Try again.")
      return
    }

    if (data) {
      setAuthBusy(false)
      setAuthError("An account with this email already exists.")
      return
    }

    const res = await supabase.auth.signUp({
      email,
      password,
    })

    setAuthBusy(false)

    if (res.error) {
      setAuthError(res.error.message)
      return
    }

    alert("Check your email to confirm your account 📧")
  }

  return {
    // state
    user,
    authLoading,
    email,
    password,
    authError,
    authBusy,
    authMode,

    // setters
    setEmail,
    setPassword,
    setAuthMode,
    setAuthError,
    setAuthBusy,

    // actions
    login,
    signup,
  }
}
