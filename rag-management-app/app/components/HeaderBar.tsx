"use client"

import { supabase } from "@/lib/supabaseClient"

type HeaderBarProps = {
  user: any
  theme: "light" | "dark"
  setTheme: (t: "light" | "dark") => void

  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void

  authBusy: boolean
  setAuthBusy: (v: boolean) => void
  setAuthError: (v: string | null) => void
}

export default function HeaderBar({
  user,
  theme,
  setTheme,
  email,
  setEmail,
  password,
  setPassword,
  authBusy,
  setAuthBusy,
  setAuthError,
}: HeaderBarProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm opacity-70">
        {user ? `Logged in as ${user.email}` : "Not logged in"}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="flex items-center gap-2 px-3 py-1 border rounded text-sm"
          style={{ borderColor: "var(--border)" }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {user ? (
          <button
            onClick={async () => await supabase.auth.signOut()}
            className="px-3 py-1 border rounded text-sm"
            style={{ borderColor: "var(--border)" }}
          >
            Logout
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
              style={{ borderColor: "var(--border)" }}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
              style={{ borderColor: "var(--border)" }}
            />

            <button
              disabled={authBusy}
              onClick={async () => {
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
              }}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              {authBusy ? "Signing in…" : "Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
