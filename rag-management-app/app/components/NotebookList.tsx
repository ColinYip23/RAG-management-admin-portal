"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import CreateNotebookModal from "./CreateNotebookModal"

type Notebook = {
  id: string
  title: string
  department: string | null
  is_global: boolean
  type: string | null
  created_at: string
}

export default function NotebookList() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [showCreate, setShowCreate] = useState(false)

  async function loadNotebooks() {
    const { data } = await supabase
      .from("notebooks")
      .select("*")
      .order("created_at", { ascending: false })

    setNotebooks(data ?? [])
  }

  useEffect(() => {
    loadNotebooks()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Notebooks Listing</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          + Create Notebook
        </button>
      </div>

      {notebooks.length === 0 ? (
        <p className="text-sm opacity-60">No notebooks found</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Department</th>
              <th className="border p-2 text-left">Scope</th>
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notebooks.map((nb) => (
              <tr key={nb.id}>
                <td className="border p-2 font-medium">{nb.title}</td>
                <td className="border p-2">
                  {nb.department ?? "—"}
                </td>
                <td className="border p-2">
                  {nb.is_global ? "🌍 Global" : "🏢 Department"}
                </td>
                <td className="border p-2">
                  {nb.type ?? "—"}
                </td>
                <td className="border p-2 space-x-2 text-center">
                  <button
                    className="px-2 py-1 border rounded"
                    style={{ borderColor: "var(--border)" }}
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
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <CreateNotebookModal
          onClose={() => setShowCreate(false)}
          onCreated={loadNotebooks}
        />
      )}
    </div>
  )
}
