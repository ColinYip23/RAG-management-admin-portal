"use client"

import { useEffect, useState, useRef } from "react"
import CollapsibleSection from "./CollapsibleSection"
import { useAuth } from "../hooks/useAuth"
import { useKnowledgeBase } from "../hooks/useKnowledgeBase"
import type { Notebook, NotebookRow, NotebookStatus } from "../types/KnowledgeBase"
import * as XLSX from "xlsx"

export default function KnowledgeBasePanel() {
  const { user } = useAuth()
  const {
    role,
    userDept,
    selectedDept,
    setSelectedDept,
    notebooks,
    loading,
    fetchNotebooks,
    createNotebook,
    deleteNotebook,
    updateNotebookRow,
    approveRow,
    fetchNotebookRows,
  } = useKnowledgeBase(user)

  // --- UI State ---
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  
  // Create Form State
  const [newTitle, setNewTitle] = useState("")
  const [newDept, setNewDept] = useState("")
  const [newType, setNewType] = useState<"QnA" | "Article">("QnA")
  const [newSystemPrompt, setNewSystemPrompt] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isGlobal, setIsGlobal] = useState(false)

  // Edit Mode State
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null)
  const [activeRows, setActiveRows] = useState<NotebookRow[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(false)

  // --- Initial Load ---
  useEffect(() => {
    if (user) {
      fetchNotebooks()
    }
  }, [user, selectedDept])

  // --- Filter Logic ---
  // 1. Admin: Shows selectedDept OR Global (if All selected, shows everything)
  // 2. User: Shows ONLY their Dept OR Global
  const filteredNotebooks = notebooks.filter(nb => {
    const isNotebookGlobal = (nb as any).is_global === true
    
    if (role === "admin") {
      if (!selectedDept) return true // "All Departments" selected
      return nb.department === selectedDept || isNotebookGlobal
    } else {
      return nb.department === userDept || isNotebookGlobal
    }
  })

  // --- File Parsing (Excel/CSV) ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
    
    try {
      if (file.name.match(/\.(xlsx|xls)$/)) {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        setExtractedData(jsonData)
      } else {
        // Simple CSV Parser
        const text = await file.text()
        const lines = text.split('\n').filter(l => l.trim())
        const headers = lines[0].split(/,|\t/).map(h => h.trim().replace(/^"|"$/g, ''))
        const data = lines.slice(1).map(line => {
          const values = line.split(/,|\t/)
          const obj: any = {}
          headers.forEach((h, i) => {
             obj[h] = values[i]?.trim().replace(/^"|"$/g, '') || ''
          })
          return obj
        })
        setExtractedData(data)
      }
    } catch (error) {
      console.error('File parsing error:', error)
      alert('Failed to parse file. Please use a valid Excel or CSV file.')
      setImportFile(null)
      setExtractedData([])
    }
  }

  // --- Create Notebook Action ---
  const handleCreateSubmit = async () => {
    // Logic: If Admin, use selected dropdown value. If User, force their own department.
    const targetDept = role === 'admin' ? newDept : userDept

    // If Global is checked, department becomes "General" implicitly in logic or backend
    if (!newTitle.trim() || (!targetDept && !isGlobal) || extractedData.length === 0) {
      alert("Please complete all fields: Title, Department, and Source File.")
      return
    }

    setIsCreating(true)
    
    // Default system prompt if empty
    const finalPrompt = newSystemPrompt.trim() || 
      `You are a helpful assistant for ${newType === 'QnA' ? 'answering questions' : 'retrieving articles'} regarding ${newTitle}.`

    const success = await createNotebook({
      title: newTitle,
      department: targetDept || "General",
      type: newType,
      systemPrompt: finalPrompt,
      data: extractedData,
      isGlobal: isGlobal
    })

    setIsCreating(false)

    if (success) {
      setCreateModalOpen(false)
      // Reset Form
      setNewTitle(""); setNewDept(""); setNewType("QnA"); setNewSystemPrompt(""); 
      setImportFile(null); setExtractedData([]); setIsGlobal(false);
      fetchNotebooks()
    }
  }

  // --- Manage Data Actions ---
  const openEditModal = async (notebook: Notebook) => {
    setActiveNotebook(notebook)
    setEditModalOpen(true)
    setIsLoadingRows(true)
    const rows = await fetchNotebookRows(notebook.id)
    setActiveRows(rows)
    setIsLoadingRows(false)
  }

  const handleCellBlur = async (rowId: string | number, newValue: string, originalValue: string) => {
    if (newValue === originalValue || !activeNotebook) return

    // Optimistic Update
    setActiveRows(prev => prev.map(row => 
      String(row.id) === String(rowId) ? { ...row, answer: newValue } : row
    ))

    await updateNotebookRow(activeNotebook.id, String(rowId), { answer: newValue })
  }

  const handleStatusChange = async (rowId: string | number, newStatus: string) => {
    if (!activeNotebook) return

    // Optimistic Update
    setActiveRows(prev => prev.map(row => 
      String(row.id) === String(rowId) ? { ...row, status: newStatus as NotebookStatus } : row
    ))

    if (newStatus === "Approved") {
      await approveRow(activeNotebook.id, String(rowId))
    } else {
      await updateNotebookRow(activeNotebook.id, String(rowId), { status: newStatus as NotebookStatus })
    }
  }

  return (
    <>
      <CollapsibleSection title="Knowledge Base Management" icon="📚" defaultOpen={true}>
        
        {/* --- Header Controls --- */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {role === "admin" ? (
              <select
                className="border px-3 py-2 rounded text-sm bg-transparent outline-none focus:ring-1 focus:ring-blue-500"
                style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                <option value="education">Education</option>
                <option value="property">Property</option>
                <option value="property-mgmt">Property Management</option>
                <option value="fd-team">FD Team</option>
              </select>
            ) : (
               <div className="px-3 py-2 border rounded text-sm opacity-70 bg-gray-50 dark:bg-white/5">
                 Department: <strong>{userDept || "Loading..."}</strong>
               </div>
            )}
            <span className="text-xs opacity-50 px-2 border-l" style={{ borderColor: "var(--border)" }}>
              {filteredNotebooks.length} Notebooks
            </span>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-sm"
          >
            + New Notebook
          </button>
        </div>

        {/* --- Notebook Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="col-span-full text-center py-8 opacity-50">Loading knowledge bases...</p>
          ) : filteredNotebooks.length === 0 ? (
            <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg" style={{borderColor: "var(--border)"}}>
              <p className="opacity-50">No notebooks found.</p>
              {role === 'admin' && <p className="text-xs opacity-40 mt-1">Try selecting "All Departments"</p>}
            </div>
          ) : (
            filteredNotebooks.map((nb) => (
              <div 
                key={nb.id} 
                className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
              >
                {/* Global Badge */}
                {(nb as any).is_global && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-1 rounded-bl-lg font-bold shadow-sm z-10">
                    GLOBAL
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2 pr-8">
                    <h3 className="font-bold text-lg truncate" title={nb.title}>{nb.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border
                      ${nb.type === 'QnA' 
                        ? 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800 dark:text-purple-400' 
                        : 'bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800 dark:text-teal-400'}`}>
                      {nb.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-gray-700 opacity-70">
                      {nb.department}
                    </span>
                  </div>

                  <p className="text-xs opacity-50 line-clamp-2 mb-4 italic h-8">
                    "{nb.system_prompt || "No custom prompt."}"
                  </p>
                </div>

                <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => openEditModal(nb)}
                    className="flex-1 py-1.5 text-xs border rounded hover:bg-blue-500/5 text-blue-600 dark:text-blue-400 font-medium transition-colors"
                    style={{ borderColor: "currentColor" }}
                  >
                    Manage Data
                  </button>
                  
                  {/* Delete: Only Admin or Owner */}
                  {(role === 'admin' || nb.department === userDept) && (
                    <button
                      onClick={() => {
                         if(confirm(`Delete "${nb.title}"? This will delete all associated data and cannot be undone.`)) 
                           deleteNotebook(nb.id);
                      }}
                      className="px-3 py-1.5 text-xs border rounded hover:bg-red-500 hover:text-white text-red-500 transition-colors"
                      style={{ borderColor: "currentColor" }}
                      title="Delete Notebook"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* ======================= */}
      {/* CREATE NOTEBOOK MODAL   */}
      {/* ======================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
          >
            <div className="p-6 border-b bg-gray-50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-xl font-bold">Create Knowledge Notebook</h2>
              <p className="text-xs opacity-60 mt-1">Configure your AI agent's knowledge source.</p>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Notebook Title <span className="text-red-500">*</span></label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Sales Objection Handling 2024"
                  className="w-full p-2.5 rounded border bg-transparent focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  style={{ borderColor: "var(--border)" }}
                />
                {newTitle && (
                  <p className="text-[10px] opacity-40 mt-1 font-mono">
                    System ID: {newTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}_kb
                  </p>
                )}
              </div>

              {/* Department & Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Department</label>
                  {role === 'admin' ? (
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      disabled={isGlobal}
                      className="w-full p-2.5 rounded border bg-transparent outline-none disabled:opacity-50"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                    >
                      <option value="">Select Department...</option>
                      <option value="education">Education</option>
                      <option value="property">Property</option>
                      <option value="property-mgmt">Property Management</option>
                      <option value="fd-team">FD Team</option>
                    </select>
                  ) : (
                    <input 
                      value={userDept}
                      disabled
                      className="w-full p-2.5 rounded border bg-gray-100 dark:bg-white/10 opacity-70 cursor-not-allowed"
                      style={{ borderColor: "var(--border)" }}
                    />
                  )}
                  
                  {/* Global Checkbox */}
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="globalCheck"
                      checked={isGlobal}
                      onChange={(e) => {
                         setIsGlobal(e.target.checked);
                         if(e.target.checked && role === 'admin') setNewDept(""); 
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="globalCheck" className="text-xs font-medium cursor-pointer select-none">
                      Set as Global Notebook <span className="opacity-50 font-normal">(Visible to all)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Content Type <span className="text-red-500">*</span></label>
                  <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded border" style={{ borderColor: "var(--border)" }}>
                    {["QnA", "Article"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewType(t as any)}
                        className={`flex-1 py-1.5 text-xs rounded font-medium transition-all ${
                          newType === t ? 'bg-white dark:bg-gray-700 shadow-sm' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  System Prompt <span className="text-xs font-normal opacity-50">(Instructions for the AI Agent)</span>
                </label>
                <textarea
                  value={newSystemPrompt}
                  onChange={(e) => setNewSystemPrompt(e.target.value)}
                  rows={3}
                  placeholder="You are an expert assistant. Answer strictly based on the provided context..."
                  className="w-full p-2.5 rounded border bg-transparent resize-none outline-none focus:border-blue-500 transition-colors"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Import Source <span className="text-red-500">*</span></label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all group relative overflow-hidden
                    ${importFile ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  style={{ borderColor: importFile ? '#60a5fa' : 'var(--border)' }}
                >
                  <input
                    type="file"
                    id="kb-file-upload"
                    accept=".xlsx,.xls,.csv,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="kb-file-upload" className="cursor-pointer flex flex-col items-center justify-center z-10 relative">
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {importFile ? '📊' : '📂'}
                    </span>
                    <span className="text-sm font-medium text-blue-600 underline decoration-blue-500/30">
                      {importFile ? importFile.name : "Click to upload Excel or CSV"}
                    </span>
                    <span className="text-xs opacity-50 mt-1">
                      {extractedData.length > 0 
                        ? `${extractedData.length} rows ready to import` 
                        : "Required columns: Question, Answer (or Title, Content)"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:opacity-70 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating && <span className="animate-spin text-white">⏳</span>}
                {isCreating ? "Creating..." : "Create Notebook"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= */}
      {/* EDIT / MANAGE DATA MODAL*/}
      {/* ======================= */}
      {isEditModalOpen && activeNotebook && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl flex flex-col border overflow-hidden"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
          >
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  {activeNotebook.title}
                  {(activeNotebook as any).is_global && <span className="text-[10px] bg-green-500 text-white px-1.5 rounded">GLOBAL</span>}
                </h2>
                <div className="flex gap-2 text-xs opacity-60 mt-0.5 font-mono">
                  <span>ID: {activeNotebook.id.slice(0,8)}...</span>
                  <span>•</span>
                  <span>Table: {activeNotebook.table_name}_kb</span>
                </div>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-lg"
              >
                ×
              </button>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto relative">
              {isLoadingRows ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-sm opacity-60">Loading data entries...</div>
                </div>
              ) : activeRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <p>No data found in this notebook.</p>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: "var(--card)" }}>
                    <tr>
                      <th className="p-3 text-left w-24 border-b font-semibold opacity-70" style={{ borderColor: "var(--border)" }}>Tag</th>
                      <th className="p-3 text-left w-1/4 border-b font-semibold opacity-70" style={{ borderColor: "var(--border)" }}>
                        {activeNotebook.type === 'QnA' ? 'Question' : 'Article Title'}
                      </th>
                      <th className="p-3 text-left border-b font-semibold opacity-70" style={{ borderColor: "var(--border)" }}>
                        {activeNotebook.type === 'QnA' ? 'Answer (Editable)' : 'Content (Editable)'}
                      </th>
                      <th className="p-3 text-center w-36 border-b font-semibold opacity-70" style={{ borderColor: "var(--border)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {activeRows.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition-colors group">
                        
                        {/* 1. Tag Column */}
                        <td className="p-3 align-top">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider 
                            ${row.tag === 'LO' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' 
                                               : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                            {row.tag}
                          </span>
                        </td>

                        {/* 2. Question Column (Read Only) */}
                        <td className="p-3 align-top opacity-90 leading-relaxed font-medium select-text">
                          {row.question}
                        </td>

                        {/* 3. Answer Column (Editable) */}
                        <td className="p-0 align-top relative">
                           <textarea
                             className="w-full h-full min-h-[80px] p-3 bg-transparent outline-none resize-none focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-2 focus:ring-blue-500/50 transition-all text-inherit"
                             defaultValue={row.answer}
                             onBlur={(e) => handleCellBlur(row.id, e.target.value, row.answer)}
                             spellCheck={false}
                           />
                           <div className="absolute right-2 bottom-2 text-[10px] opacity-0 group-hover:opacity-40 pointer-events-none transition-opacity">
                             ✎ Click to edit
                           </div>
                        </td>

                        {/* 4. Status Column */}
                        <td className="p-3 align-top text-center">
                          <div className="relative inline-block w-full">
                            <select
                              value={row.status}
                              onChange={(e) => handleStatusChange(row.id, e.target.value)}
                              className={`w-full appearance-none px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-all border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/30
                                ${row.status === 'Approved' 
                                  ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' 
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30'
                                }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center opacity-50 text-[10px]">
                              ▼
                            </div>
                          </div>
                          
                          {/* Vector Status Indicator */}
                          <div className={`text-[9px] mt-1.5 flex items-center justify-center gap-1 transition-opacity
                            ${row.status === 'Approved' ? 'opacity-100' : 'opacity-0'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="opacity-60">Live in Vector DB</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 dark:bg-white/5 flex justify-between items-center shrink-0" style={{ borderColor: "var(--border)" }}>
               <div className="text-xs opacity-50">
                 Changes are saved automatically when you click outside the text box.
               </div>
               <button 
                 onClick={() => setEditModalOpen(false)}
                 className="px-5 py-2 bg-gray-800 text-white dark:bg-gray-200 dark:text-black rounded text-sm font-medium hover:opacity-80 transition-opacity shadow-sm"
               >
                 Done
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}