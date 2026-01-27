"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

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
  const [type, setType] = useState("") 
  const [isGlobal, setIsGlobal] = useState(false)
  const [department, setDepartment] = useState("")
  const [saving, setSaving] = useState(false)

  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [xlsxRows, setXlsxRows] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function handleXlsxFile(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      alert("Please upload a .xlsx file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      if (!json.length) {
        alert("XLSX file is empty")
        return
      }

      const headers = Object.keys(json[0] as any).map((h) =>
        h.toLowerCase()
      )

      if (!headers.includes("question") || !headers.includes("answer")) {
        alert("XLSX must contain 'question' and 'answer' columns")
        return
      }

      setXlsxFile(file)
      setXlsxRows(json)
    }

    reader.readAsArrayBuffer(file)
  }


  async function sendXlsxToWebhook() {
    if (!xlsxRows.length) return

    const payload = {
      notebook_title: title,
      department,
      type,
      rows: xlsxRows.map((row: any) => ({
        question: row.question,
        answer: row.answer,
      })),
    }

    const res = await fetch(
      "https://flow2.dlabs.com.my/webhook/table_entry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        "Failed to ingest XLSX into KB: " + text
      )
    }
  }



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
      /* ========================= */
      /* 1️⃣ CREATE TABLE (n8n) */
      /* ========================= */
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

      /* ========================= */
      /* 2️⃣ INSERT NOTEBOOK META */
      /* ========================= */
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

      /* ========================= */
      /* 3️⃣ INGEST XLSX (OPTIONAL) */
      /* ========================= */
      if (xlsxRows.length > 0) {
        await sendXlsxToWebhook()
      }

      /* ========================= */
      /* 4️⃣ SUCCESS */
      /* ========================= */
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

        {/* XLSX Import */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            handleXlsxFile(e.dataTransfer.files[0])
          }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed rounded p-4 text-center text-sm cursor-pointer bg-gray-50"
        >

          <p className="font-medium">
            Drag & drop XLSX (Question / Answer)
          </p>
          <p className="text-gray-500">
            or click to browse
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) =>
              e.target.files && handleXlsxFile(e.target.files[0])
            }
          />

        </div>

        {xlsxFile && (
          <p className="text-sm text-green-600">
            📄 {xlsxFile.name} loaded ({xlsxRows.length} rows)
          </p>
        )}

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
