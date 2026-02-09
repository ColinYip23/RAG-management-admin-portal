"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { WahaSession } from "@/app/types/WahaSession"
import { useNotebookTagging } from "@/app/hooks/useNotebookTagging"

type Props = {
  session: WahaSession
  onClose: () => void
  onSessionUpdate: (updated: WahaSession) => void
}

export default function EditSessionPanel({
  session,
  onClose,
  onSessionUpdate,
}: Props) {
  const [updatingAgent, setUpdatingAgent] = useState(false)

  const [systemPrompt, setSystemPrompt] = useState(
    session.system_prompt || ""
  )
  const [savingPrompt, setSavingPrompt] = useState(false)

  const {
    notebooks,
    selected,
    toggle,
    save,
    saving: savingNotebooks,
  } = useNotebookTagging(session.WhatsApp, session.Department)

  return (
    <section className="border p-4 rounded space-y-6 dark:border-white-700">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">✏️ Edit Session</h2>
        <button className="text-sm underline" onClick={onClose}>
          Close
        </button>
      </div>

      {/* Session Info */}
      <div className="border p-3 rounded space-y-2">
        <p><b>Department:</b> {session.Department}</p>
        <p><b>WhatsApp:</b> {session.WhatsApp}</p>
        <p><b>Status:</b> {session.Status}</p>
      </div>

      {/* AI Agent */}
      <div className="border p-3 rounded space-y-2">
        <h3 className="font-semibold">🤖 AI Agent Chatbot</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={session.Enabled === true}
            disabled={updatingAgent}
            onChange={async (e) => {
              const Enabled = e.target.checked
              setUpdatingAgent(true)

              try {
                await supabase
                  .from("waha_sessions")
                  .update({ Enabled })
                  .eq("id", session.id)

                onSessionUpdate({ ...session, Enabled })
              } finally {
                setUpdatingAgent(false)
              }
            }}
          />
          <span>{session.Enabled ? "Enabled" : "Disabled"}</span>
        </label>
      </div>

      {/* System Prompt */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">🧠 System Prompt</h3>

        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={5}
          placeholder="Enter system prompt for this WhatsApp session..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />

        <div className="flex justify-end">
          <button
            disabled={savingPrompt}
            onClick={async () => {
              if (!systemPrompt.trim()) {
                alert("❌ System prompt cannot be empty")
                return
              }

              setSavingPrompt(true)

              try {
                const { error } = await supabase
                  .from("waha_sessions")
                  .update({
                    system_prompt: systemPrompt.trim(),
                    modified_at: new Date().toISOString(),
                  })
                  .eq("id", session.id)

                if (error) throw error

                onSessionUpdate({
                  ...session,
                  system_prompt: systemPrompt.trim(),
                })

                alert("✅ System prompt saved")
              } catch (err: any) {
                console.error(err)
                alert(`❌ ${err.message || "Failed to save system prompt"}`)
              } finally {
                setSavingPrompt(false)
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50 hover:bg-green-700"
          >
            {savingPrompt ? "Saving..." : "Save System Prompt"}
          </button>
        </div>
      </div>


      {/* Notebook Tagging */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">📚 Notebook Tagging</h3>

        {notebooks.length === 0 ? (
          <p className="text-sm opacity-60">No notebooks available</p>
        ) : (
          notebooks.map((nb) => (
            <label key={nb.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(nb.id)}
                onChange={() => toggle(nb.id)}
              />
              <span>{nb.title}</span>
            </label>
          ))
        )}

        <button
          disabled={savingNotebooks}
          onClick={async () => {
            await save()
            alert("Notebook tags saved ✅")
          }}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          {savingNotebooks ? "Saving…" : "Save Notebook Tags"}
        </button>
      </div>
    </section>
  )
}
