"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import * as XLSX from "xlsx"

// Match the Notebook type from NotebookList
type NotebookForEdit = {
  id: string
  title: string
  department: string | null
  type: string | null
  system_prompt?: string | null
  is_global?: boolean
  created_at?: string
}

export default function EditNotebookModal({
  notebook,
  onClose,
  onUpdate,
}: {
  notebook: NotebookForEdit
  onClose: () => void
  onUpdate?: () => void
}) {
  const [entries, setEntries] = useState<
    { question: string; answer: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState(notebook.system_prompt || "")
  const [savingPrompt, setSavingPrompt] = useState(false)

  const [xlsxRows, setXlsxRows] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [addingEntries, setAddingEntries] = useState(false)
  

  /* ========================= */
  /* FETCH EXISTING ENTRIES */
  /* ========================= */

  async function fetchEntries() {
    setLoading(true)

    const res = await fetch(
      "https://flow2.dlabs.com.my/webhook/KB_listing",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebook_title: notebook.title,
          department: notebook.department,
        }),
      }
    )

    const data = await res.json()
    const cleaned = Array.isArray(data)
        ? data.filter(
            (r: any) =>
                typeof r.question === "string" &&
                r.question.trim() !== ""
            )
        : []

    setEntries(cleaned)

    setLoading(false)
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  /* ========================= */
  /* SYSTEM PROMPT UPDATE */
  /* ========================= */

  async function saveSystemPrompt() {
    setSavingPrompt(true)

    try {
      const { error } = await supabase
        .from("notebooks")
        .update({ system_prompt: systemPrompt })
        .eq("id", notebook.id)

      if (error) {
        throw new Error(error.message)
      }

      alert("✅ System prompt updated successfully")
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate()
      }
    } catch (err: any) {
      console.error("Error updating system prompt:", err)
      alert(`❌ Error: ${err.message}`)
    } finally {
      setSavingPrompt(false)
    }
  }

  /* ========================= */
  /* XLSX HANDLING */
  /* ========================= */

  function handleXlsxFile(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      alert("Please upload a .xlsx file")
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(
          e.target?.result as ArrayBuffer
        )

        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        // 1️⃣ Read as raw rows (never empty unless sheet is empty)
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        }) as string[][]

        if (rows.length === 0) {
          alert("XLSX sheet is empty")
          return
        }

        // 2️⃣ Find header row dynamically
        const headerRowIndex = rows.findIndex((row) =>
          row.some(
            (cell) =>
              typeof cell === "string" &&
              cell.toLowerCase().trim() === "question"
          )
        )

        if (headerRowIndex === -1) {
          alert("Could not find 'question' column in XLSX")
          return
        }

        const headers = rows[headerRowIndex].map((h) =>
          String(h).toLowerCase().trim()
        )

        const questionIndex = headers.indexOf("question")
        const answerIndex = headers.indexOf("answer")

        if (questionIndex === -1 || answerIndex === -1) {
          alert(
            "XLSX must contain 'question' and 'answer' columns"
          )
          return
        }

        // 3️⃣ Convert rows → objects safely
        const parsedRows = rows
          .slice(headerRowIndex + 1)
          .map((row) => ({
            question: String(row[questionIndex] || "").trim(),
            answer: String(row[answerIndex] || "").trim(),
          }))
          .filter(
            (r) =>
              r.question.length > 0 &&
              r.answer.length > 0
          )

        if (parsedRows.length === 0) {
          alert("No valid rows found in XLSX")
          return
        }

        setXlsxRows(parsedRows)
      } catch (err) {
        console.error("XLSX parse error:", err)
        alert("Failed to read XLSX file")
      }
    }

    reader.readAsArrayBuffer(file)
  }


  async function appendEntries() {
    if (!xlsxRows.length || addingEntries) return

    setAddingEntries(true)

    try {
      const res = await fetch(
        "https://flow2.dlabs.com.my/webhook/table_entry",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebook_title: notebook.title,
            department: notebook.department,
            type: notebook.type,
            rows: xlsxRows.map((r: any) => ({
              question: r.question,
              answer: r.answer,
            })),
          }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to add entries")
      }

      setXlsxRows([])
      await fetchEntries()
    } catch (err) {
      console.error(err)
      alert("❌ Failed to add entries")
    } finally {
      setAddingEntries(false)
    }
  }


  /* ========================= */
  /* UI */
  /* ========================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white text-black p-5 rounded w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-4">

        <h3 className="text-lg font-semibold text-black">
          Edit Notebook — {notebook.title}
        </h3>

        {/* SYSTEM PROMPT SECTION */}
        <div className="border border-gray-300 rounded p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-black mb-2">System Prompt</h4>
          <textarea
            className="border p-2 w-full rounded bg-white text-black border-gray-300 text-sm"
            rows={4}
            placeholder="Enter system prompt for this notebook..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={saveSystemPrompt}
              disabled={savingPrompt}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-green-700"
            >
              {savingPrompt ? "Saving..." : "Save System Prompt"}
            </button>
          </div>
        </div>

        {/* ENTRIES TABLE */}
        <div className="border border-gray-300 rounded p-4">
          <h4 className="text-sm font-semibold text-black mb-2">Notebook Entries</h4>
          
          {loading ? (
            <p className="text-sm text-black">Loading entries…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-black italic">
              There are no entries yet.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto border rounded">
              <table className="w-full text-sm text-black">
                <thead className="bg-white border-b sticky top-0">
                  <tr>
                    <th className="p-2 text-left bg-gray-100">Question</th>
                    <th className="p-2 text-left bg-gray-100">Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2">{e.question}</td>
                      <td className="p-2">{e.answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* XLSX APPEND */}
        <div className="border border-gray-300 rounded p-4">
          <h4 className="text-sm font-semibold text-black mb-2">Add More Entries</h4>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault()
              handleXlsxFile(e.dataTransfer.files[0])
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-400 rounded p-4 text-center text-sm cursor-pointer bg-white text-black hover:bg-gray-50"
          >
            <p className="font-medium">
              Add entries via XLSX (Question / Answer)
            </p>
            <p className="text-gray-600">Click or drag file</p>

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

          {xlsxRows.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-green-600 mb-2">
                📄 {xlsxRows.length} entries ready to add
              </p>
              <button
                onClick={appendEntries}
                disabled={addingEntries}
                className="
                  bg-blue-600 text-white px-3 py-1 rounded text-sm
                  hover:bg-blue-700
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {addingEntries
                  ? "Adding entries…"
                  : `Add ${xlsxRows.length} entries`}
              </button>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
          <button 
            onClick={onClose} 
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}