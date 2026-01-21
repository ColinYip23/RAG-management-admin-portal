"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function AdminDashboardPage() {
  const [editingSession, setEditingSession] = useState<string | null>(null)
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

  /*
  if (!user) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-lg">
        Please log in to access this page.
      </p>

      <button
        onClick={async () =>
          await supabase.auth.signInWithOAuth({
            provider: "google",
          })
        }
        className="px-4 py-2 border rounded text-sm"
        style={{ borderColor: "var(--border)" }}
      >
        Login with Google
      </button>
    </div>
  )
}
*/

  
    

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
            <button
              onClick={async () =>
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                })
              }
              className="px-3 py-1 border rounded text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* SESSION LISTING */}
      {/* ========================= */}
      <section
        className="border p-4 rounded space-y-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="text-xl font-semibold">
          📱 WhatsApp Sessions
        </h2>

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
            <tr>
              <td className="border p-2" style={{ borderColor: "var(--border)" }}>
                <div className="font-medium">Acme Corp</div>
                <div className="text-sm opacity-70">
                  +60 12-345 6789
                </div>
              </td>

              <td className="border p-2 text-center" style={{ borderColor: "var(--border)" }}>
                Connected
              </td>

              <td className="border p-2 space-x-2 text-center" style={{ borderColor: "var(--border)" }}>
                <a href="#" className="underline text-blue-600">
                  Chatwoot
                </a>

                <button
                  className="px-2 py-1 border rounded"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => setEditingSession("acme")}
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
              <span className="font-medium">Account:</span> Acme Corp
            </p>
            <p className="text-sm">
              <span className="font-medium">WhatsApp:</span> +60 12-345 6789
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span> Connected
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
              <input type="checkbox" />
              Enable AI Agent
            </label>

            <textarea
              className="w-full border p-2 rounded
                         dark:bg-white-800 white:border-white-700"
              placeholder="System prompt..."
              rows={4}
            />
          </div>

          <div className="border p-3 rounded dark:border-gray-700">
            <h3 className="font-semibold mb-2">
              📚 Knowledge Base Tagging
            </h3>

            <label className="block">
              <input type="checkbox" /> FAQ Notebook
            </label>
            <label className="block">
              <input type="checkbox" /> Product Docs
            </label>
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
        <h2 className="text-xl font-semibold">
          🧙 Create Session Wizard
        </h2>

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

        {/* Step 3 – Optional prompt */}
        <div className="border p-3 rounded">
          <h3 className="font-semibold">
            Session Detail
          </h3>

          <textarea
            className="w-full border p-2 rounded"
            placeholder="Optional system prompt..."
          />
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
