"use client"

import { WahaSession } from "../hooks/useSessions"

type Props = {
  sessions: WahaSession[]
  loading: boolean
  onRefresh: () => void
  onEdit: (session: WahaSession) => void
}

export default function SessionTable({
  sessions,
  loading,
  onRefresh,
  onEdit,
}: Props) {
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
                    className="px-2 py-1 border rounded"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => onEdit(s)}
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
  )
}
