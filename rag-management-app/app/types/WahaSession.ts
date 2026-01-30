export type WahaSession = {
  id: number
  Department: string
  WhatsApp: string
  Status: string
  Enabled: boolean
  modified_at: string
  created_at: string
  inbox_id: number
  email: string
  noteboks: Array<string>
  warmup: string
}
