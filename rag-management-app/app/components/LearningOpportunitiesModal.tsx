"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Props = {
  notebookTitle: string
  department: string | null
  type: string | null
  onClose: () => void
}

type LOEntry = {
  id: string
  question: string
  answer: string
  status: string
}

export default function LearningOpportunitiesModal({
  notebookTitle,
  department,
  type,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<LOEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const tableName = `${notebookTitle}_LO`

  async function loadEntries() {
    setLoading(true)

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load LO:", error)
      setEntries([])
    } else {
      setEntries(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadEntries()
  }, [])

  async function approveEntry(entry: LOEntry) {
    if (!department || !type) return

    setApprovingId(entry.id)

    try {
      // 1️⃣ Send to KB ingestion webhook
      await fetch("https://flow2.dlabs.com.my/webhook/table_entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebook_title: notebookTitle,
          department,
          type,
          rows: [
            {
              question: entry.question,
              answer: entry.answer,
            },
          ],
        }),
      })

      // 2️⃣ Mark LO as approved
      await supabase
        .from(tableName)
        .update({ status: "approved" })
        .eq("id", entry.id)

      // 3️⃣ Refresh list
      await loadEntries()
    } catch (err) {
      console.error("Approve failed:", err)
      alert("❌ Failed to approve learning opportunity")
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 p-5 rounded w-full max-w-6xl max-h-[85vh] overflow-y-auto space-y-4">

        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            🧠 Learning Opportunities — {notebookTitle}
          </h3>
          <button onClick={onClose}>✕</button>
        </div>

        {loading ? (
            <p className="text-sm opacity-60">Loading…</p>
            ) : entries.length === 0 ? (
            <p className="text-sm opacity-60">
                No pending learning opportunities
            </p>
            ) : (
            <div className="border rounded overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                    <tr>
                    <th className="border p-2 text-left w-1/3">
                        Question
                    </th>
                    <th className="border p-2 text-left w-1/2">
                        Answer
                    </th>
                    <th className="border p-2 text-center w-32">
                        Action
                    </th>
                    </tr>
                </thead>

                <tbody>
                    {entries.map((e) => (
                    <tr key={e.id} className="align-top">
                        {/* Question */}
                        <td className="border p-2">
                        <textarea
                            className="
                            w-full
                            border
                            rounded
                            p-2
                            text-sm
                            resize-vertical
                            min-h-[80px]
                            "
                            value={e.question}
                            onChange={(ev) => {
                            const q = ev.target.value
                            setEntries((prev) =>
                                prev.map((x) =>
                                x.id === e.id
                                    ? { ...x, question: q }
                                    : x
                                )
                            )
                            }}
                        />
                        </td>

                        {/* Answer */}
                        <td className="border p-2">
                        <textarea
                            className="
                            w-full
                            border
                            rounded
                            p-2
                            text-sm
                            resize-vertical
                            min-h-[80px]
                            "
                            value={e.answer}
                            onChange={(ev) => {
                            const a = ev.target.value
                            setEntries((prev) =>
                                prev.map((x) =>
                                x.id === e.id
                                    ? { ...x, answer: a }
                                    : x
                                )
                            )
                            }}
                        />
                        </td>

                        {/* Action */}
                        <td className="border p-2 text-center">
                        <button
                            disabled={approvingId === e.id}
                            onClick={() => approveEntry(e)}
                            className="
                            px-3 py-1
                            bg-green-600 text-white
                            rounded
                            text-sm
                            disabled:opacity-50
                            "
                        >
                            {approvingId === e.id
                            ? "Approving…"
                            : "Approve"}
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
      </div>
    </div>
  )
}
