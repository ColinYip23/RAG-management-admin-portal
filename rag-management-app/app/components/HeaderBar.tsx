"use client"

import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/app/hooks/useAuth"
import Link from "next/link"

type HeaderBarProps = {
  theme: "light" | "dark"
  setTheme: (t: "light" | "dark") => void
}

export default function HeaderBar({ theme, setTheme }: HeaderBarProps) {
  const {
    user,
    email,
    password,
    authBusy,
    authError,
    setEmail,
    setPassword,
    setAuthError,
    login,
  } = useAuth()

  return (
    <div className="flex justify-between items-center">
      <div className="text-sm opacity-70">
        {user ? `Logged in as ${user.email}` : "Not logged in"}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/tenant-mapping">
          <button
            className="
              flex items-center gap-2
              px-3 py-1
              border rounded
              text-sm
              hover:bg-gray-100
              dark:hover:bg-gray-800
              transition-colors
            "
            style={{ borderColor: "var(--border)" }}
          >
            🗺️ Tenant Mapping
          </button>
        </Link>


        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="
            flex items-center gap-2 
            px-3 py-1 
            border rounded 
            text-sm
            hover:bg-gray-100
            dark:hover:bg-gray-800
            transition-colors
          "
          style={{ borderColor: "var(--border)" }}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="
              px-3 py-1 
              border rounded 
              text-sm
              hover:bg-gray-100
              dark:hover:bg-gray-800
              transition-colors
            "
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
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border px-2 py-1 rounded text-sm"
            />

            <button
              disabled={authBusy}
              onClick={() => {
                setAuthError(null)
                login()
              }}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              {authBusy ? "Signing in…" : "Login"}
            </button>
          </div>
        )}
      </div>

      {authError && (
        <p className="text-xs text-red-600 absolute top-full right-0 mt-1">
          {authError}
        </p>
      )}
    </div>
  )
}
