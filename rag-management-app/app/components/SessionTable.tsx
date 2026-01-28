"use client"

import { WahaSession } from "../hooks/useSessions"

type Props = {
  sessions: WahaSession[]
  loading: boolean
  onRefresh: () => void
  onEdit: (session: WahaSession) => void
  onCreate: () => void   
}

export default function SessionTable({
  sessions,
  loading,
  onRefresh,
  onEdit,
  onCreate,
}: Props) {

  async function handleDelete(session: WahaSession) {
    const confirmed = confirm(
      `Delete WhatsApp session for ${session.WhatsApp}?`
    )
    if (!confirmed) return

    try {
      const res = await fetch(
        "https://flow2.dlabs.com.my/webhook/delete_session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            whatsapp: session.WhatsApp,
            department: session.Department,
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to delete session")
      }

      // refresh list after successful deletion
      onRefresh()
    } catch (err: any) {
      alert(err.message || "Delete failed")
    }
  }


  return (
    <section
      className="border p-4 rounded space-y-4"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          📱 WhatsApp Sessions
        </h2>

        <button
          onClick={onRefresh}
          disabled={loading}
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

      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: "var(--card)" }}>
            <th
              className="border p-2 text-left"
              style={{ borderColor: "var(--border)" }}
            >
              Department / WhatsApp
            </th>
            <th
              className="border p-2 text-center"
              style={{ borderColor: "var(--border)" }}
            >
              Status
            </th>
            <th
              className="border p-2 text-center"
              style={{ borderColor: "var(--border)" }}
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
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
                  <div className="font-medium">{s.Department}</div>
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
                    className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => onEdit(s)}
                  >
                    Edit
                  </button>

                  <button
                    className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => handleDelete(s)}
                  >
                    Delete
                  </button>

                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Footer */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onCreate}
          className="
            px-4 py-2
            bg-blue-600 text-white rounded
            hover:bg-blue-700
            transition-colors
          "
        >
          Create Session
        </button>
      </div>
    </section>
  )
}
