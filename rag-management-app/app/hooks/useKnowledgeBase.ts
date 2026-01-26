"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Notebook, CreateNotebookParams, NotebookRow } from "@/app/types/KnowledgeBase"

export function useKnowledgeBase(user: any) {
  const [role, setRole] = useState<string>("user")
  const [userDept, setUserDept] = useState<string>("")
  const [selectedDept, setSelectedDept] = useState<string>("") 
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const init = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, department")
        .eq("id", user.id)
        .single()

      if (profile) {
        setRole(profile.role || "user")
        setUserDept(profile.department || "")
        // Admin defaults to empty (All), User defaults to their dept
        if (profile.role !== "admin") setSelectedDept(profile.department)
      }
      await fetchNotebooks()
    }
    init()
  }, [user])

  const fetchNotebooks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("notebooks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setNotebooks(data)
    }
    setLoading(false)
  }

  const createNotebook = async (params: CreateNotebookParams & { isGlobal: boolean }): Promise<boolean> => {
    try {
      const { title, department, type, systemPrompt, data, isGlobal } = params

      // 1. STRICT NAMING: Title Only (Sanitized)
      // "Sales Q&A" -> "sales_qna"
      const cleanBaseName = title.toLowerCase().trim()
        .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with _
        .replace(/_+/g, "_")        // Remove duplicate _
        .replace(/^_|_$/g, "")      // Remove leading/trailing _

      if (!cleanBaseName) {
        alert("Invalid title. Please use letters and numbers.")
        return false
      }

      // 2. CHECK DUPLICATES (Strict)
      const { data: existing } = await supabase
        .from("notebooks")
        .select("id")
        .eq("table_name", cleanBaseName)
        .maybeSingle()

      if (existing) {
        alert(`A notebook with the ID '${cleanBaseName}' already exists. Please choose a different title.`)
        return false
      }

      // 3. DETERMINE DEPARTMENT
      // If Global -> "General" (or keep dept but flag is true)
      // If Admin -> Can choose any department
      // If User -> FORCED to use their own profile department
      let finalDept = department
      if (role !== 'admin') {
        finalDept = userDept 
      }
      
      // 4. INSERT METADATA
      const { error: nbError } = await supabase
        .from("notebooks")
        .insert({
          title,
          department: finalDept,
          type,
          system_prompt: systemPrompt,
          table_name: cleanBaseName,
          is_global: isGlobal
        })
        .single()

      if (nbError) throw new Error(nbError.message)

      // 5. CREATE TABLES (RPC)
      const { error: rpcError } = await supabase.rpc("create_dynamic_notebook", {
        clean_name: cleanBaseName,
      })
      if (rpcError) throw new Error(`Table creation failed: ${rpcError.message}`)

      // 6. INSERT DATA (RPC)
      const formattedRows = data.map((row) => ({
        question: row["Question"] || row["question"] || row["Title"] || "Untitled",
        answer: row["Answer"] || row["answer"] || row["Content"] || "No content",
        tag: "KB",
        status: "Pending",
      }))

      const { error: insertError } = await supabase.rpc("insert_kb_data", {
        table_base_name: cleanBaseName,
        rows: formattedRows,
      })

      if (insertError) throw new Error(`Data insert failed: ${insertError.message}`)

      alert("Notebook created successfully!")
      fetchNotebooks() // Refresh list
      return true
    } catch (error: any) {
      console.error("Creation Error:", error)
      alert(error.message)
      return false
    }
  }

  const deleteNotebook = async (notebookId: string) => {
    const nb = notebooks.find(n => n.id === notebookId)
    if (!nb) return

    await supabase.rpc("drop_notebook_tables", { clean_name: nb.table_name })
    await supabase.from("notebooks").delete().eq("id", notebookId)
    setNotebooks(prev => prev.filter(n => n.id !== notebookId))
  }

  const fetchNotebookRows = async (notebookId: string): Promise<NotebookRow[]> => {
    const nb = notebooks.find(n => n.id === notebookId)
    if (!nb) return []
    
    const { data } = await supabase.rpc("fetch_kb_data", { table_base_name: nb.table_name })
    return data || []
  }

  const updateNotebookRow = async (notebookId: string, rowId: string, updates: Partial<NotebookRow>) => {
    const nb = notebooks.find(n => n.id === notebookId)
    if (!nb) return

    const { error } = await supabase.rpc("update_kb_row", {
      table_base_name: nb.table_name,
      row_id: Number(rowId),
      new_answer: updates.answer || null, // Pass null if not updating
      new_status: updates.status || null
    })

    if (!error && updates.status === "Approved") {
       // Trigger embedding logic here (call API)
       // ensure you insert into `${nb.table_name}_db`
    }
  }

  const approveRow = async (notebookId: string, rowId: string) => {
    return updateNotebookRow(notebookId, rowId, { status: "Approved" })
  }

  return {
    role,
    userDept,
    selectedDept,
    setSelectedDept,
    notebooks,
    loading,
    fetchNotebooks,
    createNotebook,
    deleteNotebook,
    fetchNotebookRows,
    updateNotebookRow,
    approveRow
  }
}