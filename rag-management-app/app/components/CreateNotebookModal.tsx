"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"
import type { UserProfile } from "@/app/hooks/useProfile"

const DEPARTMENTS = [
  "property management",
  "property",
  "findoc",
  "education",
]

const NOTEBOOK_TYPES = ["QnA", "Article"]

type CreateNotebookModalProps = {
  onClose: () => void
  onCreated: () => void
  userProfile: UserProfile
}

type QARow = {
  question: string
  answer: string
}

export default function CreateNotebookModal({
  onClose,
  onCreated,
  userProfile,
}: CreateNotebookModalProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState("") 
  const [isGlobal, setIsGlobal] = useState(false)
  const [department, setDepartment] = useState(
    userProfile.role === "user" ? userProfile.department || "" : ""
  )
  const [saving, setSaving] = useState(false)

  const [xlsxFile, setXlsxFile] = useState<File | null>(null)
  const [xlsxRows, setXlsxRows] = useState<any[]>([])
  const [articleLink, setArticleLink] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Check if user can choose department
  const canChooseDepartment = userProfile.role === "admin"

  function parseQAXlsx(file: File): Promise<QARow[]> {
    return new Promise((resolve, reject) => {
      if (!file.name.endsWith(".xlsx")) {
        reject(new Error("Please upload a .xlsx file"))
        return
      }

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]

          const rawRows = XLSX.utils.sheet_to_json(sheet, {
            defval: null,
            raw: false,
          }) as Record<string, any>[]

          if (!rawRows.length) {
            reject(new Error("XLSX file is empty"))
            return
          }

          // Normalize headers from first row
          const headerMap = Object.keys(rawRows[0]).reduce<Record<string, string>>(
            (acc, key) => {
              acc[key.toLowerCase().trim()] = key
              return acc
            },
            {}
          )

          if (!headerMap.question || !headerMap.answer) {
            reject(new Error("XLSX must contain 'question' and 'answer' columns"))
            return
          }

          const cleaned: QARow[] = rawRows
            .map((row) => {
              const question = row[headerMap.question]
              const answer = row[headerMap.answer]

              if (
                typeof question !== "string" ||
                typeof answer !== "string"
              ) {
                return null
              }

              if (!question.trim() || !answer.trim()) {
                return null
              }

              return {
                question: question.trim(),
                answer: answer.trim(),
              }
            })
            .filter(Boolean) as QARow[]

          if (!cleaned.length) {
            reject(new Error("No valid Q&A rows found in XLSX"))
            return
          }

          resolve(cleaned)
        } catch (err) {
          reject(new Error("Failed to parse XLSX file"))
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }

  async function handleXlsxFile(file: File) {
    try {
      const rows = await parseQAXlsx(file)
      setXlsxFile(file)
      setXlsxRows(rows)
    } catch (err: any) {
      alert(err.message)
    }
  }


  async function sendXlsxToWebhook() {
    if (!xlsxRows.length) return

    const payload = {
      notebook_title: title,
      department,
      type,
      article_link: type === "Article" ? articleLink : undefined,
      rows: xlsxRows, // already validated
    }

    const res = await fetch(
      "https://flow2.dlabs.com.my/webhook/table_entry",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      throw new Error(
        "Failed to ingest XLSX into KB: " + (await res.text())
      )
    }
  }



  async function createNotebook() {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }

    if (title.includes(" ")) {
      alert("Notebook title cannot contain spaces. Use underscores (_) instead.")
      return
    }

    if (!type) {
      alert("Please select a notebook type")
      return
    }

    // For users, department is forced to their own
    const finalDepartment = userProfile.role === "user" 
      ? userProfile.department 
      : department

    if (!finalDepartment) {
      alert("Please select a department")
      return
    }

    // Validate article link when Article type is selected and XLSX is imported
    if (type === "Article" && xlsxRows.length > 0 && !articleLink.trim()) {
      alert("Please enter an article link")
      return
    }

    // Both users and admins can create global notebooks (no validation needed)

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
            department: finalDepartment,
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
        is_global: isGlobal,
        department: finalDepartment,
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

        {/* Show user role info */}
        <div className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
          {userProfile.role === "admin" ? (
            <p>👑 <strong>Admin:</strong> You can create notebooks for any department and make them global</p>
          ) : (
            <p>👤 <strong>User:</strong> You can create notebooks for your department ({userProfile.department}) and make them global</p>
          )}
        </div>

        {/* Title */}
        <input
          className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
          placeholder="Notebook title (no spaces)"
          value={title}
          onChange={(e) => {
            const value = e.target.value

            // Block spaces
            if (value.includes(" ")) {
              alert("Notebook title cannot contain spaces. Use underscores (_) instead.")
              return
            }

            setTitle(value)
          }}
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

        {/* Department - Only for Admin */}
        <div>
          <label className="text-sm font-medium">
            Department
            {!canChooseDepartment && (
              <span className="text-xs opacity-60 ml-2">(Fixed to your department)</span>
            )}
          </label>
          {canChooseDepartment ? (
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
          ) : (
            <input
              className="border p-2 w-full rounded bg-gray-100 text-gray-900 border-gray-300"
              value={userProfile.department || "No department"}
              disabled
            />
          )}
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

        {/* Article Link - Required when Article type is selected and document is imported */}
        {type === "Article" && xlsxFile && (
          <div>
            <label className="text-sm font-medium">
              Article Link <span className="text-red-500">*</span>
            </label>
            <input
              className="border p-2 w-full rounded bg-white text-gray-900 border-gray-300"
              placeholder="https://example.com/article"
              value={articleLink}
              onChange={(e) => setArticleLink(e.target.value)}
            />
          </div>
        )}

        {/* Global - Available for all users */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
          />
          <span>
            Global (visible to all departments)
          </span>
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