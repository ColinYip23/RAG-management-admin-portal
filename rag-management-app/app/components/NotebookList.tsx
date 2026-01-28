"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import CreateNotebookModal from "./CreateNotebookModal"
import EditNotebookModal from "./EditNotebookModal"

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
  const [editingNotebook, setEditingNotebook] = useState<{
    title: string
    department: string
    type: string
  } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)


  async function loadNotebooks() {
    console.log("📚 Loading notebooks...")
    const { data } = await supabase
      .from("notebooks")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("📚 Notebooks loaded:", data)
    setNotebooks(data ?? [])
  }

  async function deleteNotebook(notebook: Notebook) {
    console.log("🗑️ DELETE FUNCTION CALLED!")
    console.log("🗑️ Notebook to delete:", notebook)
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notebook.title}"?\n\nThis will permanently remove:\n- The notebook entry\n- Knowledge base table (${notebook.title}_kb)\n- Vector database table (${notebook.title}_db)`
    )
    
    console.log("🗑️ User confirmed:", confirmed)
    
    if (!confirmed) {
      console.log("🗑️ Deletion cancelled by user")
      return
    }

    console.log("🗑️ Setting deletingId to:", notebook.id)
    setDeletingId(notebook.id)

    try {
      console.log("📡 Calling webhook API...")
      console.log("📡 URL:", "https://flow2.dlabs.com.my/webhook/notebook_deletion")
      console.log("📡 Payload:", {
        notebook_id: notebook.id,
        notebook_title: notebook.title,
        department: notebook.department,
      })
      
      // Call n8n webhook to delete tables and notebook row
      const response = await fetch(
        "https://flow2.dlabs.com.my/webhook/notebook_deletion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebook_id: notebook.id,
            notebook_title: notebook.title,
            department: notebook.department,
          }),
        }
      )

      console.log("📥 Response status:", response.status)
      console.log("📥 Response ok:", response.ok)

      const result = await response.json()
      console.log("📦 Response data:", result)

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Failed to delete notebook")
      }

      // Success - refresh the list
      console.log("✅ Deletion successful!")
      alert(`✅ Notebook "${notebook.title}" deleted successfully`)
      await loadNotebooks()
      
    } catch (error: any) {
      console.error("❌ Delete error:", error)
      alert(`❌ Error deleting notebook: ${error.message}`)
    } finally {
      console.log("🗑️ Resetting deletingId")
      setDeletingId(null)
    }
  }

  // Test function to verify the delete function exists
  useEffect(() => {
    console.log("🔍 Component mounted")
    console.log("🔍 deleteNotebook function exists:", typeof deleteNotebook === 'function')
  }, [])

  useEffect(() => {
    loadNotebooks()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Notebooks Listing</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="
            px-3 py-1 
            bg-blue-600 
            text-white 
            rounded 
            text-sm
            hover:bg-blue-700
            transition-colors
          "
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
                    className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border)" }}
                    disabled={!nb.department || !nb.type}
                    onClick={() => {
                      console.log("✏️ Edit button clicked for:", nb.title)
                      if (!nb.department || !nb.type) return

                      setEditingNotebook({
                        title: nb.title,
                        department: nb.department,
                        type: nb.type,
                      })
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border)" }}
                    disabled={deletingId === nb.id}
                    onClick={() => {
                      console.log("🔴 DELETE BUTTON CLICKED!")
                      console.log("🔴 Notebook:", nb)
                      deleteNotebook(nb)
                    }}
                  >
                    {deletingId === nb.id ? "Deleting..." : "Delete"}
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
      {editingNotebook && (
        <EditNotebookModal
          notebook={editingNotebook}
          onClose={() => setEditingNotebook(null)}
        />
      )}
    </div>
  )
}