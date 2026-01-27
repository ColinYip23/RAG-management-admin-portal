"use client"

import { useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"

export default function EditNotebookModal({
  notebook,
  onClose,
}: {
  notebook: {
    title: string
    department: string
    type: string
  }
  onClose: () => void
}) {
  const [entries, setEntries] = useState<
    { question: string; answer: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  const [xlsxRows, setXlsxRows] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
  /* XLSX HANDLING (REUSED) */
  /* ========================= */

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

      setXlsxRows(json)
    }

    reader.readAsArrayBuffer(file)
  }

  async function appendEntries() {
    if (!xlsxRows.length) return

    await fetch(
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

    setXlsxRows([])
    fetchEntries()
  }

  /* ========================= */
  /* UI */
  /* ========================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white text-black p-5 rounded w-full max-w-3xl space-y-4">

        <h3 className="text-lg font-semibold text-black">
          Edit Notebook – {notebook.title}
        </h3>

        {/* TABLE */}
        {loading ? (
            <p className="text-sm text-black">Loading entries…</p>
            ) : entries.length === 0 ? (
            <p className="text-sm text-black italic">
                There are no entries yet.
            </p>
            ) : (
            <div className="max-h-64 overflow-y-auto border rounded">
                <table className="w-full text-sm text-black">
                <thead className="bg-white border-b">
                    <tr>
                    <th className="p-2 text-left">Question</th>
                    <th className="p-2 text-left">Answer</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e, idx) => (
                    <tr key={idx} className="border-t">
                        <td className="p-2">{e.question}</td>
                        <td className="p-2">{e.answer}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}


        {/* XLSX APPEND */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            handleXlsxFile(e.dataTransfer.files[0])
          }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-black rounded p-4 text-center text-sm cursor-pointer bg-white text-black"
        >
          <p className="font-medium">
            Add entries via XLSX (Question / Answer)
          </p>
          <p className="text-black">Click or drag file</p>

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
          <button
            onClick={appendEntries}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add {xlsxRows.length} entries
          </button>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
