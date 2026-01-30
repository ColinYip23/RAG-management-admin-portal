"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useProfile } from "@/app/hooks/useProfile"
import CreateNotebookModal from "./CreateNotebookModal"
import EditNotebookModal from "./EditNotebookModal"
import LearningOpportunitiesModal from "./LearningOpportunitiesModal"

type Notebook = {
  id: string
  title: string
  department: string | null
  is_global: boolean
  type: string | null
  system_prompt?: string | null
  created_at: string
}

export default function NotebookList() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [filteredNotebooks, setFilteredNotebooks] = useState<Notebook[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [learningNotebook, setLearningNotebook] = useState<Notebook | null>(null)

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user)
    })
  }, [])

  // Get user profile (role and department)
  const { profile, loading: profileLoading } = useProfile(currentUser?.email)


  async function loadNotebooks() {
    console.log("📚 Loading notebooks...")
    const { data } = await supabase
      .from("notebooks")
      .select("*")
      .order("created_at", { ascending: false })

    console.log("📚 All notebooks:", data)
    setNotebooks(data ?? [])
  }

  // Filter notebooks based on user role and department
  useEffect(() => {
    if (!profile || !notebooks.length) {
      setFilteredNotebooks(notebooks)
      return
    }

    console.log("🔍 Filtering notebooks for:", {
      role: profile.role,
      department: profile.department,
    })

    if (profile.role === "admin") {
      // Admin can see ALL notebooks
      console.log("👑 Admin: Showing all notebooks")
      setFilteredNotebooks(notebooks)
    } else {
      // User can only see:
      // 1. Global notebooks (is_global = true)
      // 2. Notebooks from their own department
      const filtered = notebooks.filter((nb) => {
        const isGlobal = nb.is_global === true
        const isOwnDepartment = nb.department === profile.department
        
        return isGlobal || isOwnDepartment
      })

      console.log(`👤 User: Showing ${filtered.length}/${notebooks.length} notebooks`)
      console.log("  - Department:", profile.department)
      console.log("  - Filtered notebooks:", filtered.map(n => n.title))
      
      setFilteredNotebooks(filtered)
    }
  }, [notebooks, profile])

  // Check if user can edit a notebook
  function canEdit(notebook: Notebook): boolean {
    if (!profile) return false
    
    // Admin can edit everything
    if (profile.role === "admin") return true
    
    // User can edit their own department notebooks (including global ones they created)
    return notebook.department === profile.department
  }

  // Check if user can delete a notebook
  function canDelete(notebook: Notebook): boolean {
    if (!profile) return false
    
    // Admin can delete everything
    if (profile.role === "admin") return true
    
    // User can delete their own department notebooks (including global ones they created)
    return notebook.department === profile.department
  }

  async function deleteNotebook(notebook: Notebook) {
    // Check permission
    if (!canDelete(notebook)) {
      alert("❌ You don't have permission to delete this notebook")
      return
    }

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notebook.title}"?\n\nThis will permanently remove:\n- The notebook entry\n- Knowledge base table (${notebook.title}_kb)\n- Vector database table (${notebook.title}_db)`
    )
    
    if (!confirmed) return

    setDeletingId(notebook.id)

    try {
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

      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Failed to delete notebook")
      }

      // Success - refresh the list
      alert(`✅ Notebook "${notebook.title}" deleted successfully`)
      await loadNotebooks()
      
    } catch (error: any) {
      console.error("Delete error:", error)
      alert(`❌ Error deleting notebook: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    loadNotebooks()
  }, [])

  if (profileLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm opacity-60">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Notebooks Listing</h3>
          {profile && (
            <p className="text-xs opacity-60 mt-1">
              {profile.role === "admin" ? (
                "👑 Admin - Viewing all notebooks"
              ) : (
                `👤 User - Viewing ${profile.department} & Global notebooks`
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="
            px-3 py-1
            bg-blue-600 text-white
            rounded text-sm
            hover:bg-blue-700
            transition-colors
            duration-200
          "
        >
          + Create Notebook
        </button>
      </div>

      {filteredNotebooks.length === 0 ? (
        <p className="text-sm opacity-60">
          {notebooks.length === 0 
            ? "No notebooks found" 
            : "No notebooks available for your department"}
        </p>
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
            {filteredNotebooks.map((nb) => {
              const userCanEdit = canEdit(nb)
              const userCanDelete = canDelete(nb)

              return (
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
                      disabled={!nb.department || !nb.type || !userCanEdit}
                      onClick={() => {
                        if (!nb.department || !nb.type || !userCanEdit) return

                        setEditingNotebook(nb)
                      }}
                      title={
                        !userCanEdit 
                          ? "You don't have permission to edit this notebook" 
                          : "Edit notebook"
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: "var(--border)" }}
                      disabled={deletingId === nb.id || !userCanDelete}
                      onClick={() => deleteNotebook(nb)}
                      title={
                        !userCanDelete 
                          ? "You don't have permission to delete this notebook" 
                          : "Delete notebook"
                      }
                    >
                      {deletingId === nb.id ? "Deleting..." : "Delete"}
                    </button>

                    <button
                      className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      style={{ borderColor: "var(--border)" }}
                      onClick={() => setLearningNotebook(nb)}
                    >
                      Learn
                    </button>

                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {showCreate && profile && (
        <CreateNotebookModal
          onClose={() => setShowCreate(false)}
          onCreated={loadNotebooks}
          userProfile={profile}
        />
      )}
      {editingNotebook && (
        <EditNotebookModal
          notebook={editingNotebook}
          onClose={() => setEditingNotebook(null)}
          onUpdate={loadNotebooks}
        />
      )}
      {learningNotebook && (
        <LearningOpportunitiesModal
          notebookTitle={learningNotebook.title}
          department={learningNotebook.department}
          type={learningNotebook.type}
          onClose={() => setLearningNotebook(null)}
        />
      )}
    </div>
  )
}