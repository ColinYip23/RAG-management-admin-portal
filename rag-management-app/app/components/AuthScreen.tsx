"use client"

import { AuthMode } from "../hooks/useAuth"

type Props = {
  authMode: AuthMode
  email: string
  password: string
  authBusy: boolean
  authError: string | null
  setEmail: (v: string) => void
  setPassword: (v: string) => void
  setAuthMode: (m: AuthMode) => void
  onSubmit: () => void
}

export default function AuthScreen({
  authMode,
  email,
  password,
  authBusy,
  authError,
  setEmail,
  setPassword,
  setAuthMode,
  onSubmit,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">
        {authMode === "login" ? "Login" : "Create Account"}
      </h1>

      <p className="text-sm opacity-70">
        {authMode === "login"
          ? "Please log in to access this page."
          : "Create an account to continue."}
      </p>

      <div className="flex flex-col gap-2 w-72">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border px-3 py-2 rounded text-sm"
          style={{ borderColor: "var(--border)" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 rounded text-sm"
          style={{ borderColor: "var(--border)" }}
        />

        <button
          disabled={authBusy}
          onClick={onSubmit}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50 cursor-pointer"
          style={{ borderColor: "var(--border)" }}
        >
          {authBusy
            ? authMode === "login"
              ? "Signing in…"
              : "Creating account…"
            : authMode === "login"
            ? "Login"
            : "Sign Up"}
        </button>

        {authError && (
          <p className="text-xs text-red-600 text-center">
            {authError}
          </p>
        )}
      </div>

      {/* Mode switch */}
      <button
        onClick={() =>
          setAuthMode(authMode === "login" ? "signup" : "login")
        }
        className="text-xs underline opacity-70 cursor-pointer"
      >
        {authMode === "login"
          ? "Don’t have an account? Sign up"
          : "Already have an account? Login"}
      </button>
    </div>
  )
}
