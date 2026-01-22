"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type WahaSession = {
    id: number
    Account: string
    WhatsApp: string
    Status: string
    Enabled: boolean
    modified_at: string
    created_at: string
    inbox_id: number
    email: string
  }

export default function AdminDashboardPage() {
  const [editingSession, setEditingSession] = useState<WahaSession | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [waNumber, setWaNumber] = useState("")
  const [inboxName, setInboxName] = useState("")
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [sessions, setSessions] = useState<WahaSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  const [updatingAgent, setUpdatingAgent] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const [systemPrompt, setSystemPrompt] = useState("")
  const [savingPrompt, setSavingPrompt] = useState(false)

  const [wizardOpen, setWizardOpen] = useState(true)



  const resetCreateSessionForm = () => {
    setWaNumber("")
    setInboxName("")
    setQrValue(null)
    setCreateError(null)
    setCreatingSession(false)
    setSecondsLeft(null)
  }

  const handleCreateSession = async () => {
    if (!waNumber || !inboxName) {
      setCreateError("Please enter WhatsApp number and inbox name")
      return
    }

    try {
      setCreatingSession(true)
      setCreateError(null)
      setQrValue(null)

      const res = await fetch(
        "https://flow.dlabs.com.my/webhook/session creation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whatsapp_number: waNumber,
            inbox_name: inboxName,
          }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to create session")
      }

      const data = await res.json()

      // adjust key if needed (qr / value)
      setQrValue(data.qr ?? data.value)

      // Clear existing timers
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      // Start countdown
      setSecondsLeft(60)

      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Auto-reset after 60 seconds
      resetTimerRef.current = setTimeout(() => {
        resetCreateSessionForm()
      }, 60_000)

      // Clear any existing timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }

      // Reset after 1 minute
      resetTimerRef.current = setTimeout(() => {
        resetCreateSessionForm()
      }, 60_000) // 60 seconds


    } catch (err: any) {
      setCreateError(err.message || "Something went wrong")
    } finally {
      setCreatingSession(false)
    }
  }


  const fetchSessions = async () => {
    setSessionsLoading(true)

    const { data, error } = await supabase
      .from("waha_sessions")
      .select("*")

    if (!error && data) {
      setSessions(data)
    }

    setSessionsLoading(false)
  }

  useEffect(() => {
    console.log("URL =", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log(
      "ANON =",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20)
    )
  }, [])


  useEffect(() => {
    fetchSessions()

    // refresh every 2 hours
    const interval = setInterval(
      fetchSessions,
      2 * 60 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [])


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
  

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])


  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    console.log("SESSION FROM APP:", data.session)
  })
}, [])


  useEffect(() => {
    if (!editingSession) return

    const loadPrompt = async () => {
      const { data, error } = await supabase
        .from("system_prompts")
        .select("prompt")
        .eq("tenant", editingSession.WhatsApp)
        .single()

      if (!error && data?.prompt) {
        setSystemPrompt(data.prompt)
      } else {
        setSystemPrompt("")
      }
    }

    loadPrompt()
  }, [editingSession])



  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading authentication…</p>
      </div>
    )
  }

  if (!user) {
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
            onClick={async () => {
              if (authBusy) return

              setAuthError(null)
              setAuthBusy(true)

              // ✅ Only check on signup
              if (authMode === "signup") {
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
              }

              // Proceed with auth
              const res =
                authMode === "login"
                  ? await supabase.auth.signInWithPassword({
                      email,
                      password,
                    })
                  : await supabase.auth.signUp({
                      email,
                      password,
                    })

              setAuthBusy(false)

              if (res.error) {
                if (res.error.message.toLowerCase().includes("already registered")) {
                  setAuthError("This email is already registered. Please log in.")
                } else {
                  setAuthError(res.error.message)
                }
                return
              }


              if (authMode === "signup") {
                alert("Check your email to confirm your account 📧")
              }
            }}
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


  return (
    <main className="min-h-screen p-6 space-y-10">

      {/* ========================= */}
      {/* GLOBAL HEADER */}
      {/* ========================= */}
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

      {authError && (
        <p className="text-xs text-red-600 mt-1 text-right">
          {authError}
        </p>
      )}


      {/* ========================= */}
      {/* SESSION LISTING */}
      {/* ========================= */}
      <section
        className="border p-4 rounded space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            📱 WhatsApp Sessions
          </h2>

          <button
            onClick={fetchSessions}
            disabled={sessionsLoading}
            title="Refresh sessions"
            aria-label="Refresh sessions"
            className="p-2 rounded border text-sm
                      hover:bg-gray-100
                      dark:hover:bg-gray-800
                      disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}
          >
            🔄
          </button>
        </div>


        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "var(--card)" }}>
              <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                Account / WhatsApp
              </th>
              <th className="border p-2" style={{ borderColor: "var(--border)" }}>
                Status
              </th>
              <th className="border p-2" style={{ borderColor: "var(--border)" }}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {sessionsLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="border p-4 text-center text-sm opacity-60"
                  style={{ borderColor: "var(--border)" }}
                >
                  Loading sessions…
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="border p-4 text-center text-sm opacity-60"
                  style={{ borderColor: "var(--border)" }}
                >
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td
                    className="border p-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="font-medium">{s.Account}</div>
                    <div className="text-sm opacity-70">
                      {s.WhatsApp}
                    </div>
                  </td>

                  <td
                    className="border p-2 text-center"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        s.Status === "CONNECTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.Status}
                    </span>
                  </td>

                  <td
                    className="border p-2 space-x-2 text-center"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <a
                      href={`https://cem.dlabs.com.my/app/accounts/1/inboxes/${s.id}/conversations`}
                      className="underline text-blue-600"
                      target="_blank"
                    >
                      Chatwoot
                    </a>

                    <button
                      className="px-2 py-1 border rounded"
                      style={{ borderColor: "var(--border)" }}
                      onClick={() => setEditingSession(s)}
                    >
                      Edit
                    </button>

                    <button
                      className="px-2 py-1 border rounded text-red-600"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* ========================= */}
      {/* EDIT SESSION */}
      {/* ========================= */}
      {editingSession && (
        <section className="border p-4 rounded space-y-6 dark:border-white-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              ✏️ Edit Session
            </h2>

            <button
              className="text-sm text-gray-500 underline"
              onClick={() => setEditingSession(null)}
            >
              Close
            </button>
          </div>

          <div className="border p-3 rounded space-y-2 dark:border-white-700">
            <p className="text-sm">
              <span className="font-medium">Account:</span>{" "}
              {editingSession.Account}
            </p>

            <p className="text-sm">
              <span className="font-medium">WhatsApp:</span>{" "}
              {editingSession.WhatsApp}
            </p>

            <p className="text-sm">
              <span className="font-medium">Status:</span>{" "}
              {editingSession.Status}
            </p>
          </div>

          <div className="border p-3 rounded dark:border-gray-700">
            <h3 className="font-semibold mb-2">
              ⚠️ Activity Safety Meter (KIV)
            </h3>
            <p>Risk Level: Low / Medium / High</p>
          </div>

          <div className="border p-3 rounded space-y-2 dark:border-white-700">
            <h3 className="font-semibold">
              🤖 AI Agent Chatbot
            </h3>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!editingSession.Enabled}
                disabled={updatingAgent}
                onChange={async (e) => {
                  if (!editingSession) return

                  const newValue = e.target.checked
                  setUpdatingAgent(true)

                  try {
                    // Call n8n webhook
                    const res = await fetch(
                      "",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          inbox_id: editingSession.inbox_id,
                          enabled: newValue,
                        }),
                      }
                    )

                    if (!res.ok) {
                      throw new Error("Failed to trigger n8n workflow")
                    }

                    // Update Supabase
                    const { error } = await supabase
                      .from("waha_sessions")
                      .update({ Enabled: newValue })
                      .eq("id", editingSession.id)

                    if (error) {
                      throw error
                    }

                    // Update local UI state
                    setEditingSession({
                      ...editingSession,
                      Enabled: newValue,
                    })

                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === editingSession.id
                          ? { ...s, Enabled: newValue }
                          : s
                      )
                    )
                  } catch (err) {
                    console.error(err)
                    alert("Failed to toggle AI agent")
                  } finally {
                    setUpdatingAgent(false)
                  }
                }}
              />

              <span>{editingSession.Enabled ? "Enabled" : "Disabled"}</span>
            </label>


            <span
              className={`inline-block px-2 py-1 text-xs rounded ${
                editingSession.Enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {editingSession.Enabled ? "AI Agent Active" : "AI Agent Inactive"}
            </span>

            <textarea
              className="w-full border p-2 rounded
                        dark:bg-white-800 dark:border-white-700"
              placeholder="System prompt (optional)..."
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />

            <button
              disabled={savingPrompt}
              onClick={async () => {
                if (!editingSession) return

                setSavingPrompt(true)

                try {
                  const { error } = await supabase
                    .from("system_prompts")
                    .upsert(
                      {
                        tenant: editingSession.WhatsApp,
                        prompt: systemPrompt,
                      },
                      { onConflict: "tenant" }
                    )

                  if (error) throw error

                  alert("System prompt saved successfully ✅")
                } catch (err) {
                  console.error(err)
                  alert("Failed to save system prompt")
                } finally {
                  setSavingPrompt(false)
                }
              }}
              className="px-3 py-1 border rounded text-sm
                        cursor-pointer
                        disabled:opacity-50
                        disabled:cursor-not-allowed"
              style={{ borderColor: "var(--border)" }}
            >
              {savingPrompt ? "Saving…" : "Save System Prompt"}
            </button>

          </div>
        </section>
      )}

      {/* ========================= */}
      {/* CREATE SESSION */}
      {/* ========================= */}
      <section
        className="border p-4 rounded space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setWizardOpen((prev) => !prev)}
        >
          <h2 className="text-xl font-semibold">
            🧙 Create Session Wizard
          </h2>

          <span className="text-lg select-none">
            {wizardOpen ? "⬆️" : "⬇️"}
          </span>
        </div>

        {/* Collapsible Body */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            wizardOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-4 space-y-4">
            {/* Step 1 – Input */}
            <input
              className="border p-2 w-full"
              style={{ borderColor: "var(--border)" }}
              placeholder="WhatsApp Number"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
            />

            <input
              className="border p-2 w-full"
              style={{ borderColor: "var(--border)" }}
              placeholder="Inbox Name"
              value={inboxName}
              onChange={(e) => setInboxName(e.target.value)}
            />

            <button
              onClick={handleCreateSession}
              disabled={creatingSession}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {creatingSession ? "Creating session…" : "Create Session"}
            </button>

            {createError && (
              <p className="text-sm text-red-600">
                {createError}
              </p>
            )}

            {/* Step 2 – QR Code */}
            <div className="border p-3 rounded space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  Session Connection
                </h3>

                {secondsLeft !== null && (
                  <span className="text-sm text-red-600">
                    ⏱ QR expires in {secondsLeft}s
                  </span>
                )}
              </div>

              <div className="border h-64 flex items-center justify-center">
                {qrValue ? (
                  <img
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(
                      qrValue
                    )}&size=250&ecLevel=H`}
                    alt="WhatsApp QR Code"
                    style={{
                      width: 250,
                      height: 250,
                      border: "10px solid white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      borderRadius: 8,
                    }}
                  />
                ) : (
                  <span className="text-sm opacity-60">
                    QR CODE PLACEHOLDER
                  </span>
                )}
              </div>

              <ol className="text-sm mt-2 list-decimal list-inside">
                <li>Open WhatsApp on your phone</li>
                <li>Press the 3 dots in the top right corner</li>
                <li>Go to Linked Devices</li>
                <li>Click Link a Device</li>
                <li>Scan the QR code</li>
              </ol>
            </div>
          </div>
        </div>
      </section>


      {/* ========================= */}
      {/* KNOWLEDGE BASE */}
      {/* ========================= */}
      <section
        className="border p-4 rounded space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            📚 Knowledge Base Management
          </h2>

          <select
            className="border px-3 py-1 rounded text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
              color: "var(--fg)"
            }}
          >
            <option value="">All Departments</option>
            <option value="education">Education</option>
            <option value="property">Property</option>
            <option value="property-mgmt">Property Management</option>
            <option value="fd-team">FD Team</option>
          </select>
        </div>

        {/* Notebooks Listing */}
        <div className="border p-3 rounded space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Notebooks Listing</h3>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              + Create Notebook
            </button>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr style={{ backgroundColor: "var(--card)" }}>
                <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                  Title
                </th>
                <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                  Sources
                </th>
                <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                  Created
                </th>
                <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                  <div className="font-medium">Education FAQ</div>
                  <div className="text-sm opacity-70">Education Dept</div>
                </td>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                  <div className="text-sm">12 documents</div>
                  <div className="text-xs opacity-70">PDF, TXT, MD</div>
                </td>
                <td className="border p-2 text-sm" style={{ borderColor: "var(--border)" }}>
                  Jan 15, 2026
                </td>
                <td className="border p-2 space-x-2 text-center" style={{ borderColor: "var(--border)" }}>
                  <button
                    className="px-2 py-1 border rounded text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 border rounded text-sm text-red-600"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>

              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                  <div className="font-medium">Property Listings Guide</div>
                  <div className="text-sm opacity-70">Property Dept</div>
                </td>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                  <div className="text-sm">8 documents</div>
                  <div className="text-xs opacity-70">PDF, DOCX</div>
                </td>
                <td className="border p-2 text-sm" style={{ borderColor: "var(--border)" }}>
                  Jan 10, 2026
                </td>
                <td className="border p-2 space-x-2 text-center" style={{ borderColor: "var(--border)" }}>
                  <button
                    className="px-2 py-1 border rounded text-sm"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 border rounded text-sm text-red-600"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Create Notebook Form */}
        <div className="border p-3 rounded space-y-3" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold">Create Notebook</h3>

          <div className="space-y-3">
            <input
              className="border p-2 w-full rounded"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)"
              }}
              placeholder="Notebook Title"
            />

            <select
              className="border p-2 w-full rounded"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--fg)"
              }}
            >
              <option value="">Select Department</option>
              <option value="education">Education</option>
              <option value="property">Property</option>
              <option value="property-mgmt">Property Management</option>
              <option value="fd-team">FD Team</option>
            </select>

            <div className="border-2 border-dashed p-6 rounded text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm mb-2">Import Sources</p>
              <p className="text-xs opacity-70 mb-3">Drag & drop files here or click to browse</p>
              <button
                className="px-4 py-2 border rounded text-sm"
                style={{ borderColor: "var(--border)" }}
              >
                Choose Files
              </button>
              <p className="text-xs opacity-60 mt-2">Supported: PDF, TXT, MD, DOCX</p>
            </div>

            <div className="border p-3 rounded" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-sm font-semibold mb-2">Notes Listing (0)</h4>
              <p className="text-xs opacity-60">Upload files to see them listed here</p>
            </div>

            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Create & Sync to Vector DB
              </button>
              <button
                className="px-4 py-2 border rounded"
                style={{ borderColor: "var(--border)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Department Status Overview */}
        <div className="border p-3 rounded space-y-3" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold">Cross-Department Status</h3>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--card)" }}>
                <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                  Department
                </th>
                <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  Active Notebooks
                </th>
                <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  Total Documents
                </th>
                <th className="border p-2 text-left" style={{ borderColor: "var(--border)" }}>
                  Last Updated
                </th>
                <th className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  Sync Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Education</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>3</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>28</td>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Jan 15, 2026 14:32</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-green-600">✓ Synced</span>
                </td>
              </tr>
              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Property</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>2</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>15</td>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Jan 12, 2026 09:15</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-green-600">✓ Synced</span>
                </td>
              </tr>
              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Property Management</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>1</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>6</td>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>Jan 10, 2026 16:45</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                  <span className="text-yellow-600">⟳ Syncing...</span>
                </td>
              </tr>
              <tr>
                <td className="border p-2" style={{ borderColor: "var(--border)" }}>FD Team</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>0</td>
                <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>0</td>
                <td className="border p-2 opacity-50" style={{ borderColor: "var(--border)" }}>—</td>
                <td className="border p-2 text-center opacity-50" style={{ borderColor: "var(--border)" }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================= */}
      {/* WARMING UP NUMBERS */}
      {/* ========================= */}
      <section
        className="border p-4 rounded space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="text-xl font-semibold">
          🔥 Warming Up Numbers
        </h2>

        <label className="flex items-center gap-2">
          <input type="checkbox" />
          +60 12-345 6789
        </label>

        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded"
            style={{ borderColor: "var(--border)" }}
          >
            Start
          </button>
          <button
            className="px-3 py-1 border rounded"
            style={{ borderColor: "var(--border)" }}
          >
            Pause
          </button>
          <button
            className="px-3 py-1 border rounded"
            style={{ borderColor: "var(--border)" }}
          >
            Stop
          </button>
        </div>
      </section>

    </main>
  )
}