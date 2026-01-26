// types/KnowledgeBase.ts

export type NotebookType = "QnA" | "Article"

export type NotebookStatus = "Pending" | "Approved"

export type NotebookTag = "KB" | "LO"

export interface Notebook {
  id: string
  title: string
  department: string
  type: NotebookType
  system_prompt: string
  table_name: string
  is_global: boolean  // Added this property
  created_at: string
  updated_at?: string
}

export interface NotebookRow {
  id: number | string 
  question: string
  answer: string
  tag: NotebookTag
  status: NotebookStatus
  created_at?: string
}

export interface CreateNotebookParams {
  title: string
  department: string
  type: NotebookType
  systemPrompt: string
  data: any[]
  isGlobal?: boolean // Added this optional property
}

export interface VectorRecord {
  id: string
  content: string
  metadata: Record<string, any>
  embedding: number[]
  created_at?: string
}