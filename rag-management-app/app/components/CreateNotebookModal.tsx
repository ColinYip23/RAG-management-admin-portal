"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const DEPARTMENTS = [
  "property management",
  "property",
  "findoc",
  "education",
]

const NOTEBOOK_TYPES = ["QnA", "Article"]

export default function CreateNotebookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [type, setType] = useState("") // 👈 NEW
  const [isGlobal, setIsGlobal] = useState(false)
  const [department, setDepartment] = useState("")
  const [saving, setSaving] = useState(false)

  async function createNotebook() {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    if (!type) {
      alert("Please select a notebook type")
      return
    }

    if (!department) {
      alert("Please select a department")
      return
    }

    setSaving(true)

    try {
      // 1️⃣ Call n8n webhook to create KB + DB
      const webhookRes = await fetch(
        "https://flow2.dlabs.com.my/webhook/table_creation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebook_title: title,
            department,
          }),
        }
      )

      const webhookData = await webhookRes.json()

      if (!webhookRes.ok || webhookData.success === false) {
        throw new Error(
          webhookData?.error || "Failed to create notebook storage"
        )
      }

      // 2️⃣ Insert notebook metadata into Supabase
      const { error } = await supabase.from("notebooks").insert({
        title,
        type,
        system_prompt: systemPrompt,
        is_global: isGlobal,
        department,
      })

      if (error) {
        throw new Error(error.message)
      }

      // 3️⃣ Success UI
      alert("Notebook created successfully ✅")
      onCreated()
      onClose()
    } catch (err: any) {
      alert(err.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 p-5 rounded w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Create Notebook</h3>

        {/* Title */}
        <input
          className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
          placeholder="Notebook title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Type */}
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select type</option>
            {NOTEBOOK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <textarea
          className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
          rows={4}
          placeholder="System prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />

        {/* Department */}
        <div>
          <label className="text-sm font-medium">Department</label>
          <select
            className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Global */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
          />
          <span>Global (visible to all departments)</span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>

          <button
            disabled={saving}
            onClick={createNotebook}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}
